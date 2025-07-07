
'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Chess } from 'chess.js';
import type { ChessSquare, ChessPiece, ChessMove, PlayerColor, PieceSet, GameMode, TimeControl, BoardTheme, CustomColors, CoordinatesDisplay, AutoPromote, GameRecord } from '@/lib/types';
import { suggestMove } from '@/ai/flows/suggest-move';
import { useToast } from './use-toast';

type BoardState = { square: ChessSquare; piece: ChessPiece }[];

const pieceValues: { [key in ChessPiece['type']]: number } = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

const getSetting = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    const value = localStorage.getItem(key);
    try {
        return value ? JSON.parse(value) : defaultValue;
    } catch {
        return defaultValue;
    }
};

const setJsonSetting = (key: string, value: any) => {
  if (typeof window === 'undefined') return;
  try {
    const stringifiedValue = JSON.stringify(value);
    localStorage.setItem(key, stringifiedValue);
    // Dispatches a storage event to notify other tabs/windows
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: stringifiedValue }));
    // Dispatches a custom event for same-tab listeners
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: { key, value }}));
  } catch (e) {
    console.error("Failed to save setting to localStorage", e);
  }
};

const defaultCustomColors: CustomColors = {
  boardLight: '#f0d9b5',
  boardDark: '#b58863',
  pieceWhiteFill: '#ffffff',
  pieceWhiteStroke: '#333333',
  pieceBlackFill: '#333333',
  pieceBlackStroke: '#ffffff',
  check1: '#ef7676',
  check2: '#d44949',
  previous1: '#fff078',
  previous2: '#d4c24a',
  selected1: '#91e086',
  selected2: '#75b56b',
};

export const useChessGame = () => {
  const gameRef = useRef(new Chess());
  const { toast } = useToast();
  
  const moveSoundRef = useRef<HTMLAudioElement | null>(null);
  const captureSoundRef = useRef<HTMLAudioElement | null>(null);
  const checkSoundRef = useRef<HTMLAudioElement | null>(null);
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null);

  const [board, setBoard] = useState<BoardState>([]);
  const [history, setHistory] = useState<readonly ChessMove[]>([]);
  const [redoStack, setRedoStack] = useState<ChessMove[][]>([]);
  const [turn, setTurn] = useState<PlayerColor>('w');
  const [pgn, setPgn] = useState('');
  const [gameOver, setGameOver] = useState<{ status: string; winner?: string } | null>(null);

  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<ChessMove[]>([]);
  const [isAITurn, setIsAITurn] = useState(false);
  const [skillLevel, _setSkillLevel] = useState(4);
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  
  const [timeControl, _setTimeControl] = useState<TimeControl>({ type: 'fischer', initial: 600, increment: 0 });
  const [time, setTime] = useState({ w: Infinity, b: Infinity });
  const [timerOn, setTimerOn] = useState(false);
  const timerDelayRef = useRef<NodeJS.Timeout | null>(null);
  
  const [hint, setHint] = useState<ChessMove | null>(null);
  const [premove, setPremove] = useState<{ from: ChessSquare, to: ChessSquare } | null>(null);
  const [pendingMove, setPendingMove] = useState<({ from: ChessSquare, to: ChessSquare, promotion?: 'q' | 'r' | 'b' | 'n' } & { san: string }) | null>(null);
  const [promotionMove, setPromotionMove] = useState<{ from: ChessSquare; to: ChessSquare } | null>(null);

  // Settings states with defaults
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('cyan');
  const [pieceSet, setPieceSet] = useState<PieceSet>('classic');
  const [showPossibleMoves, setShowPossibleMoves] = useState(true);
  const [showLastMoveHighlight, setShowLastMoveHighlight] = useState(true);
  const [boardOrientation, setBoardOrientation] = useState<PlayerColor>('w');
  const [customColors, setCustomColors] = useState<CustomColors>(defaultCustomColors);
  const [showCoordinates, setShowCoordinates] = useState<CoordinatesDisplay>('outside');
  const [enablePremove, setEnablePremove] = useState<boolean>(true);
  const [autoPromoteTo, setAutoPromoteTo] = useState<AutoPromote>('q');
  const [confirmMoveEnabled, setConfirmMoveEnabled] = useState<boolean>(false);
  const [enableSounds, setEnableSounds] = useState<boolean>(true);
  const [showCapturedPieces, setShowCapturedPieces] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const setSkillLevel = useCallback((value: number) => {
    _setSkillLevel(value);
    if (typeof window !== 'undefined') {
      setJsonSetting('chess:skillLevel', value);
    }
  }, []);

  const setTimeControl = useCallback((value: TimeControl) => {
    _setTimeControl(value);
    if (typeof window !== 'undefined') {
      setJsonSetting('chess:timeControl', value);
    }
  }, []);

  // Load all settings from localStorage once the component is mounted
  useEffect(() => {
    if (!isMounted) return;

    const loadSettings = () => {
      setBoardTheme(getSetting<BoardTheme>('chess:boardTheme', 'cyan'));
      setPieceSet(getSetting<PieceSet>('chess:pieceSet', 'classic'));
      setShowPossibleMoves(getSetting<boolean>('chess:showPossibleMoves', true));
      setShowLastMoveHighlight(getSetting<boolean>('chess:showLastMoveHighlight', true));
      setCustomColors(getSetting<CustomColors>('chess:customColors', defaultCustomColors));
      setShowCoordinates(getSetting<CoordinatesDisplay>('chess:showCoordinates', 'outside'));
      setEnablePremove(getSetting<boolean>('chess:enablePremove', true));
      setAutoPromoteTo(getSetting<AutoPromote>('chess:autoPromoteTo', 'q'));
      setConfirmMoveEnabled(getSetting<boolean>('chess:confirmMove', false));
      setEnableSounds(getSetting<boolean>('chess:enableSounds', true));
      setShowCapturedPieces(getSetting<boolean>('chess:showCapturedPieces', true));
      _setTimeControl(getSetting<TimeControl>('chess:timeControl', { type: 'fischer', initial: 600, increment: 0 }));
      _setSkillLevel(getSetting<number>('chess:skillLevel', 4));
    };

    loadSettings();

    const handleSettingsChanged = (event: Event) => {
        const key = (event as CustomEvent).detail?.key || (event as StorageEvent).key;
        if (key && key.startsWith('chess:')) {
            loadSettings();
        }
    };
    
    window.addEventListener('storage', handleSettingsChanged);
    window.addEventListener('settingsChanged', handleSettingsChanged);

    return () => {
        window.removeEventListener('storage', handleSettingsChanged);
        window.removeEventListener('settingsChanged', handleSettingsChanged);
    };
  }, [isMounted]);

  useEffect(() => {
    if (enableSounds && typeof window !== 'undefined') {
      moveSoundRef.current = new Audio('/sounds/move-self.mp3');
      captureSoundRef.current = new Audio('/sounds/capture.mp3');
      checkSoundRef.current = new Audio('/sounds/check.mp3');
      gameOverSoundRef.current = new Audio('/sounds/game-over.mp3');

      const sounds = [moveSoundRef.current, captureSoundRef.current, checkSoundRef.current, gameOverSoundRef.current];
      sounds.forEach(sound => {
          if (sound) {
            sound.load();
            sound.onerror = () => console.warn(`Could not load sound file.`);
          }
      });
    } else {
      // Clear refs if sounds are disabled
      moveSoundRef.current = null;
      captureSoundRef.current = null;
      checkSoundRef.current = null;
      gameOverSoundRef.current = null;
    }
  }, [enableSounds]);

  const playSound = useCallback((sound: 'move' | 'capture' | 'check' | 'gameOver') => {
      if (!enableSounds) return;
      let audio;
      switch(sound) {
        case 'move': audio = moveSoundRef.current; break;
        case 'capture': audio = captureSoundRef.current; break;
        case 'check': audio = checkSoundRef.current; break;
        case 'gameOver': audio = gameOverSoundRef.current; break;
      }
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.warn(`Could not play sound '${sound}':`, e.message));
      }
  }, [enableSounds]);

  const updateGameState = useCallback((isGameOverMove: boolean = false) => {
    const g = gameRef.current;
    
    const newBoardState: BoardState = [];
    g.board().forEach(row => {
      row.forEach(square => {
        if (square) {
          newBoardState.push({ square: square.square, piece: { type: square.type, color: square.color } });
        }
      });
    });
    setBoard(newBoardState);
    setHistory(g.history({verbose: true}));
    
    setTurn(g.turn());

    if (g.isGameOver() || isGameOverMove) {
      if (!gameOver) playSound('gameOver');
      setTimerOn(false);
      let status = 'Game Over';
      let winner = '';
      if (g.isCheckmate()) {
        status = 'Checkmate';
        winner = g.turn() === 'w' ? 'Black' : 'White';
        g.setHeader('Result', winner === 'White' ? '1-0' : '0-1');
      } else if (g.isDraw()) {
        status = 'Draw';
        g.setHeader('Result', '1/2-1/2');
      } else if (g.isStalemate()) {
        status = 'Stalemate';
        g.setHeader('Result', '1/2-1/2');
      } else if (g.isThreefoldRepetition()) {
        status = 'Threefold Repetition';
        g.setHeader('Result', '1/2-1/2');
      } else if (isGameOverMove && !gameOver) { // Timeout case, but also covers resign/draw
        const gStatus = (gameOver as any)?.status || 'Timeout';
        status = gStatus;
        winner = g.turn() === 'w' ? 'Black' : 'White';
        if (status === 'Resignation') {
            winner = g.turn() === 'w' ? 'Black' : 'White'; // The resigner loses
        } else if (status.includes('Draw')) {
            winner = 'None';
        }
        g.setHeader('Result', winner === 'White' ? '1-0' : (winner === 'Black' ? '0-1' : '1/2-1/2'));
      }

      const finalPgn = g.pgn();
      setGameOver(prev => prev || { status, winner });
      setPgn(finalPgn);

      // Save game to history
      const gameRecord: GameRecord = {
          pgn: finalPgn,
          date: new Date().toISOString(),
          white: g.header()['White'] || 'White',
          black: g.header()['Black'] || 'Black',
          result: g.header()['Result'] || '*',
      };
      
      try {
          const pastGamesRaw = localStorage.getItem('pgchess_history');
          const pastGames: GameRecord[] = pastGamesRaw ? JSON.parse(pastGamesRaw) : [];
          pastGames.unshift(gameRecord); // Add to the beginning
          localStorage.setItem('pgchess_history', JSON.stringify(pastGames.slice(0, 50))); // Keep last 50 games
      } catch (e) {
          console.error("Failed to save game history", e);
      }

    } else {
        setGameOver(null);
        setPgn(g.pgn());
    }
  }, [playSound, gameOver]);

  const makeMove = useCallback((move: string | { from: ChessSquare, to: ChessSquare, promotion?: string }) => {
    const g = gameRef.current;
    
    const result = g.move(move);

    if (result === null) {
      console.error("Invalid move attempted: ", move);
      return false;
    }
    
    setRedoStack([]); // Clear redo stack on new move
    const prevTurn = g.turn() === 'w' ? 'b' : 'w'; // Turn has already changed
    const isFirstMove = g.history().length === 1;
    
    if (result.flags.includes('c')) playSound('capture');
    else playSound('move');
    if (g.inCheck()) playSound('check');

    if (timeControl.type === 'fischer' || timeControl.type === 'bronstein') {
        setTime(prev => ({ ...prev, [prevTurn]: prev[prevTurn] + (timeControl.increment * 1000) }));
    }

    updateGameState();
    setHint(null);
    
    // Timer logic on successful move
    if (isFirstMove && timeControl.type !== 'unlimited' && !g.isGameOver()) {
        const initialMs = timeControl.initial * 1000;
        setTime({ w: initialMs, b: initialMs });
        setTimerOn(true);
    }

    if (timerDelayRef.current) clearTimeout(timerDelayRef.current);
    if (timeControl.type === 'delay' && !g.isGameOver()) {
        setTimerOn(false); // Stop timer during delay
        timerDelayRef.current = setTimeout(() => {
            setTimerOn(true);
        }, timeControl.increment * 1000);
    }
    return true;
  }, [timeControl, updateGameState, playSound]);

  const resetMoveSelection = () => {
    setSelectedSquare(null);
    setPossibleMoves([]);
  };

  const attemptMove = useCallback((move: { from: ChessSquare, to: ChessSquare, promotion?: 'q' | 'r' | 'b' | 'n' }) => {
      const g = gameRef.current;
      const moveDetails = g.moves({ square: move.from, verbose: true }).find(m => m.to === move.to);
      
      if (!moveDetails) {
          resetMoveSelection();
          return;
      }

      const isPromotion = moveDetails.flags.includes('p');

      if (isPromotion && autoPromoteTo === 'ask') {
          setPromotionMove({ from: move.from, to: move.to });
          resetMoveSelection();
          return;
      }

      const moveWithPromotion = { ...move, promotion: move.promotion || (isPromotion ? (autoPromoteTo !== 'ask' ? autoPromoteTo : 'q') : undefined) };
      
      const gameCopyForSan = new Chess(g.fen());
      const moveResult = gameCopyForSan.move(moveWithPromotion);
      if (!moveResult) return;

      if (confirmMoveEnabled) {
          setPendingMove({ ...moveWithPromotion, san: moveResult.san });
      } else {
          makeMove(moveWithPromotion);
      }
      resetMoveSelection();
  }, [confirmMoveEnabled, makeMove, autoPromoteTo]);

  const confirmMove = useCallback(() => {
    if (pendingMove) {
        makeMove(pendingMove);
        setPendingMove(null);
    }
  }, [pendingMove, makeMove]);

  const cancelMove = useCallback(() => {
      setPendingMove(null);
  }, []);

  const cancelPromotion = useCallback(() => {
    setPromotionMove(null);
  }, []);

  const handlePromotion = useCallback((piece: 'q' | 'r' | 'b' | 'n') => {
      if (promotionMove) {
          const move = { ...promotionMove, promotion: piece };
          if (confirmMoveEnabled) {
              const gameCopyForSan = new Chess(gameRef.current.fen());
              const moveResult = gameCopyForSan.move(move);
              if (moveResult) setPendingMove({ ...move, san: moveResult.san });
          } else {
              makeMove(move);
          }
      }
      setPromotionMove(null);
  }, [promotionMove, makeMove, confirmMoveEnabled]);

  const handlePieceDrop = useCallback((from: ChessSquare, to: ChessSquare) => {
    const g = gameRef.current;
    if (gameOver) return;

    if (g.turn() !== boardOrientation && gameMode === 'ai') {
      if (enablePremove) {
        const piece = g.get(from);
        if (piece && piece.color === boardOrientation) {
          setPremove({ from, to });
          resetMoveSelection();
        }
      }
      return;
    }
    
    attemptMove({ from, to });
  }, [gameOver, gameMode, enablePremove, attemptMove, boardOrientation]);

  const resetGame = useCallback(() => {
    const g = new Chess();
    if (isMounted) {
      const username = localStorage.getItem('username') || 'Player';
      g.setHeader('White', username);
    } else {
      g.setHeader('White', 'Player');
    }

    g.setHeader('Black', gameMode === 'ai' ? 'AI Opponent' : 'Player 2');
    g.setHeader('Date', new Date().toISOString().split('T')[0]);
    gameRef.current = g;

    setTime({ w: timeControl.initial * 1000, b: timeControl.initial * 1000 });
    if(timeControl.type === 'unlimited') {
      setTime({w: Infinity, b: Infinity});
    }
    setTimerOn(false);

    if (timerDelayRef.current) clearTimeout(timerDelayRef.current);
    
    updateGameState();
    resetMoveSelection();
    setIsAITurn(false);
    setHint(null);
    setPremove(null);
    setPendingMove(null);
    setPromotionMove(null);
    setRedoStack([]);
  }, [updateGameState, gameMode, isMounted, timeControl]);

  useEffect(() => {
    if (isMounted) {
      resetGame();
    }
  }, [isMounted, gameMode, timeControl, resetGame]); 
  
  useEffect(() => {
    if(isMounted) {
        updateGameState();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  useEffect(() => {
    if (!timerOn || gameOver || timeControl.type === 'unlimited' || !isMounted || history.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      const currentTurn = gameRef.current.turn();
      setTime(prevTime => {
        const newTimeForPlayer = prevTime[currentTurn] - 100;

        if (newTimeForPlayer <= 0) {
          clearInterval(interval);
          setGameOver({ status: 'Timeout', winner: currentTurn === 'w' ? 'Black' : 'White' });
          updateGameState(true); // pass true to indicate timeout
          return { ...prevTime, [currentTurn]: 0 };
        }
        return { ...prevTime, [currentTurn]: newTimeForPlayer };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [timerOn, gameOver, timeControl.type, updateGameState, isMounted, history]);


  const getHint = useCallback(async () => {
    if (gameRef.current.isGameOver() || isAITurn) return;

    toast({
      title: 'Thinking...',
      description: 'The AI is analyzing the board for a hint.',
    });
    
    try {
      const { suggestedMove, explanation } = await suggestMove({
        boardStateFen: gameRef.current.fen(),
        legalMoves: gameRef.current.moves(),
        skillLevel: 20,
      });

      const gameCopy = new Chess(gameRef.current.fen());
      const moveDetails = gameCopy.move(suggestedMove);

      if (moveDetails) {
        setHint(moveDetails);
        toast({
          title: 'Hint: ' + moveDetails.san,
          description: explanation,
        });
      } else {
        throw new Error("AI suggested an invalid move: " + suggestedMove);
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Hint Failed',
        description: 'Could not get a hint at this time.',
      });
    }
  }, [toast, isAITurn]);

  const flipBoard = useCallback(() => {
    setBoardOrientation(prev => (prev === 'w' ? 'b' : 'w'));
  }, []);
  
  const onSquareClick = useCallback((square: ChessSquare) => {
    if (gameOver || promotionMove) return;

    const g = gameRef.current;
    const pieceOnSquare = g.get(square);
    
    if (g.turn() !== boardOrientation && gameMode === 'ai') {
      if (enablePremove && selectedSquare) {
          setPremove({ from: selectedSquare, to: square });
          resetMoveSelection();
      } else if (enablePremove && pieceOnSquare && pieceOnSquare.color === boardOrientation) {
          setSelectedSquare(square);
      }
      return;
    }
    
    if (g.turn() !== pieceOnSquare?.color && !selectedSquare) return;

    if (selectedSquare) {
      if (square === selectedSquare) {
        resetMoveSelection();
        return;
      }
      
      const moveDetails = g.moves({ square: selectedSquare, verbose: true }).find(m => m.to === square);

      if (moveDetails) {
        attemptMove({ from: selectedSquare, to: square });
      } else if (pieceOnSquare && pieceOnSquare.color === g.turn()) {
        setSelectedSquare(square);
        setPossibleMoves(g.moves({ square, verbose: true }));
      } else {
        resetMoveSelection();
      }
    } else {
      if (pieceOnSquare && pieceOnSquare.color === g.turn()) {
        setSelectedSquare(square);
        setPossibleMoves(g.moves({ square, verbose: true }));
      }
    }
  }, [
    gameOver, promotionMove, gameMode, boardOrientation, enablePremove, selectedSquare, attemptMove
  ]);

  const undoMove = useCallback(() => {
    const g = gameRef.current;
    if (g.history().length === 0) return;
  
    const movesToUndo: ChessMove[] = [];
  
    // Always undo at least one move
    const lastMove = g.undo();
    if (lastMove) {
      movesToUndo.unshift(lastMove);
    }
  
    // In AI mode, if the move undone was the AI's, undo the player's move too.
    if (
      gameMode === 'ai' &&
      lastMove &&
      lastMove.color !== boardOrientation &&
      g.history().length > 0
    ) {
      const playerMove = g.undo();
      if (playerMove) {
        movesToUndo.unshift(playerMove);
      }
    }
  
    if (movesToUndo.length > 0) {
      setRedoStack((prev) => [movesToUndo, ...prev]);
    }
  
    updateGameState();
    setHint(null);
    setPremove(null);
    resetMoveSelection();
  }, [gameMode, boardOrientation, updateGameState]);
  
  const redoMove = useCallback(() => {
    if (redoStack.length === 0) return;
  
    const newRedoStack = [...redoStack];
    const movesToRedo = newRedoStack.shift();
  
    if (movesToRedo) {
      movesToRedo.forEach((move) => {
        gameRef.current.move(move.san);
      });
    }
  
    setRedoStack(newRedoStack);
    updateGameState();
  }, [redoStack, updateGameState]);

  useEffect(() => {
    if (gameMode === 'ai' && turn !== boardOrientation && !gameOver) {
      const performAIMoveWithRetries = async (retries = 3) => {
        if (retries === 0) {
           toast({
                variant: 'destructive',
                title: 'AI Error',
                description: 'The AI failed to make a move. Please try again.',
            });
            setIsAITurn(false);
            return;
        }

        setIsAITurn(true);
        try {
            const legalMoves = gameRef.current.moves({verbose: true}).map(m => m.san);
            if (legalMoves.length === 0) {
              setIsAITurn(false);
              return;
            }

            const { suggestedMove } = await suggestMove({
              boardStateFen: gameRef.current.fen(),
              legalMoves: legalMoves,
              skillLevel,
            });
            
            const moveSuccessful = makeMove(suggestedMove);
            
            if (moveSuccessful) {
              if (premove) {
                const validPremove = gameRef.current.moves({ verbose: true }).some(m => m.from === premove.from && m.to === premove.to);
                if (validPremove) {
                  makeMove(premove);
                }
                setPremove(null);
              }
              setIsAITurn(false);
            } else {
              console.warn(`AI suggested an invalid move: ${suggestedMove}. Retrying...`);
              performAIMoveWithRetries(retries - 1);
            }
          } catch (error: any) {
            console.error(`AI move attempt failed:`, error);
            performAIMoveWithRetries(retries - 1);
          }
      };

      const timeoutId = setTimeout(performAIMoveWithRetries, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [turn, boardOrientation, gameMode, skillLevel, makeMove, toast, pgn, gameOver, premove]);
  
  const onSquareRightClick = useCallback(() => {
    resetMoveSelection();
    setPremove(null);
  }, []);

  const lastMove = history.length > 0 ? history[history.length - 1] : null;

  const kingInCheck = useMemo(() => {
    const g = gameRef.current;
    if (!g.isGameOver() && g.inCheck()) {
        const kingSquare = g.board().flat().find(p => p?.type === 'k' && p.color === g.turn())?.square;
        return kingSquare;
    }
    return null;
  }, [pgn, turn]);

  const canUndo = history.length > 0;
  const canRedo = redoStack.length > 0;
  
  const capturedPieces = useMemo(() => {
    const captured: { w: ChessPiece[], b: ChessPiece[] } = { w: [], b: [] };
    if (!history) return captured;
    
    for (const move of history) {
        if (move.captured) {
            const piece = { type: move.captured, color: move.color === 'w' ? 'b' : 'w' };
            captured[piece.color].push(piece);
        }
    }

    const pieceOrderValue = { q: 1, r: 2, b: 3, n: 4, p: 5 };
    captured.w.sort((a, b) => pieceOrderValue[a.type] - pieceOrderValue[b.type]);
    captured.b.sort((a, b) => pieceOrderValue[a.type] - pieceOrderValue[b.type]);

    return captured;
  }, [history]);
  
  const resignGame = useCallback(() => {
      if (gameOver) return;
      const winner = gameRef.current.turn() === 'w' ? 'Black' : 'White';
      setGameOver({ status: 'Resignation', winner });
      updateGameState(true);
  }, [gameOver, updateGameState]);

  const offerDraw = useCallback(() => {
      if (gameOver) return;
      // In a real multiplayer game, this would send an offer.
      // Against AI, we can have it accept immediately.
      setGameOver({ status: 'Draw by Agreement', winner: 'None' });
      updateGameState(true);
  }, [gameOver, updateGameState]);


  return {
    board, turn, onSquareClick, onSquareRightClick, selectedSquare, possibleMoves, resetGame, history, pgn, isAITurn, lastMove, kingInCheck, gameOver, skillLevel, setSkillLevel, boardTheme, pieceSet, showPossibleMoves, showLastMoveHighlight, boardOrientation, flipBoard, undoMove, redoMove, canUndo, canRedo, gameMode, setGameMode, timeControl, setTimeControl, time, hint, getHint, premove,
    customColors, showCoordinates, handlePieceDrop, 
    pendingMove, confirmMove, cancelMove,
    promotionMove, cancelPromotion, handlePromotion,
    showCapturedPieces, capturedPieces,
    isMounted, // Expose isMounted for conditional rendering in parent
    resignGame, offerDraw,
  };
};
