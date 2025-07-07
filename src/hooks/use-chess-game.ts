'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Chess } from 'chess.js';
import type { ChessSquare, ChessPiece, ChessMove, PlayerColor, PieceSet, GameMode, TimeControl, BoardTheme, CustomColors, CoordinatesDisplay, AutoPromote, GameRecord } from '@/lib/types';
import { suggestMove } from '@/ai/flows/suggest-move';
import { adjustDifficulty } from '@/ai/flows/adjust-difficulty';
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
  const [skillLevel, setSkillLevel] = useState(4);
  const [aiPersonality, setAiPersonality] = useState('Balanced');
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  
  const [timeControl, _setTimeControl] = useState<TimeControl>({ type: 'fischer', initial: 600, increment: 0 });
  const [time, setTime] = useState({ w: Infinity, b: Infinity });
  const [timerOn, setTimerOn] = useState(false);
  const timerDelayRef = useRef<NodeJS.Timeout | null>(null);
  
  const [hint, setHint] = useState<ChessMove | null>(null);
  const [capturedPieces, setCapturedPieces] = useState<{ w: ChessPiece[]; b: ChessPiece[] }>({ w: [], b: [] });
  const [materialAdvantage, setMaterialAdvantage] = useState<number>(0);
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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
      _setTimeControl(getSetting<TimeControl>('chess:timeControl', { type: 'fischer', initial: 600, increment: 0 }));
    };

    loadSettings();

    const handleSettingsChanged = (event: Event) => {
        if (event instanceof StorageEvent || (event as CustomEvent).detail?.key.startsWith('chess:')) {
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

      // Preload sounds
      moveSoundRef.current.load();
      captureSoundRef.current.load();
      checkSoundRef.current.load();
      gameOverSoundRef.current.load();
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
    
    const initialPieceSet: { [key in ChessPiece['type']]: number } = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
    const currentPieceCounts: { [c in PlayerColor]: { [pt in ChessPiece['type']]: number } } = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    };
    newBoardState.forEach(p => { currentPieceCounts[p.piece.color][p.piece.type]++; });

    const captured: { w: ChessPiece[]; b: ChessPiece[] } = { w: [], b: [] };
    let whiteMaterialOnBoard = 0;
    let blackMaterialOnBoard = 0;
    
    for (const color of ['w', 'b'] as PlayerColor[]) {
      for (const p_type in initialPieceSet) {
          const type = p_type as ChessPiece['type'];
          const initialCount = initialPieceSet[type];
          const currentCount = currentPieceCounts[color][type];
          const capturedCount = initialCount - currentCount;

          if (capturedCount > 0) {
              for (let i = 0; i < capturedCount; i++) {
                  if (color === 'w') {
                      captured.b.push({ type, color: 'w' });
                  } else {
                      captured.w.push({ type, color: 'b' });
                  }
              }
          }
          if (color === 'w') {
            whiteMaterialOnBoard += currentCount * pieceValues[type];
          } else {
            blackMaterialOnBoard += currentCount * pieceValues[type];
          }
      }
    }
    
    const sortPieces = (a: ChessPiece, b: ChessPiece) => pieceValues[b.type] - pieceValues[a.type];
    captured.w.sort(sortPieces);
    captured.b.sort(sortPieces);
    setCapturedPieces(captured);
    setMaterialAdvantage(whiteMaterialOnBoard - blackMaterialOnBoard);

    if (g.isGameOver() || isGameOverMove) {
      playSound('gameOver');
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
      } else if (isGameOverMove) { // Timeout case
        status = 'Timeout';
        winner = g.turn() === 'w' ? 'Black' : 'White';
        g.setHeader('Result', winner === 'White' ? '1-0' : '0-1');
      }

      const finalPgn = g.pgn();
      setGameOver({ status, winner });
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
  }, [playSound]);

  const makeMove = useCallback((move: string | { from: ChessSquare, to: ChessSquare, promotion?: string }) => {
    const g = gameRef.current;
    
    // Use a copy to test the move without altering the main game state yet
    const gameCopy = new Chess(g.fen());
    const result = gameCopy.move(move);

    if (result === null) {
      console.error("Invalid move attempted: ", move);
      // It's an illegal move, don't change the state.
      // This can happen if AI suggests a bad move.
      return false;
    }

    // If the move is valid, apply it to the main game instance
    g.move(move);
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
    if ((isFirstMove || history.length === 0) && timeControl.type !== 'unlimited' && !g.isGameOver()) {
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
  }, [timeControl, updateGameState, playSound, history]);

  const resetMoveSelection = () => {
    setSelectedSquare(null);
    setPossibleMoves([]);
  };

  const attemptMove = useCallback((move: { from: ChessSquare, to: ChessSquare, promotion?: 'q' | 'r' | 'b' | 'n' }) => {
      const gameCopy = new Chess(gameRef.current.fen());
      const possibleMovesList = gameCopy.moves({ square: move.from, verbose: true });
      const moveDetails = possibleMovesList.find(m => m.to === move.to);
      
      if (!moveDetails) {
          // If the move is not possible, just reset selection
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
      const gameCopyForSan = new Chess(gameRef.current.fen());
      const moveResult = gameCopyForSan.move(moveWithPromotion);

      if (moveResult && confirmMoveEnabled) {
          setPendingMove({ ...moveWithPromotion, san: moveResult.san });
      } else if (moveResult) {
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
    const username = (typeof window !== 'undefined' ? localStorage.getItem('username') : null) || 'Player';
    g.setHeader('White', username);
    g.setHeader('Black', gameMode === 'ai' ? 'AI Opponent' : 'Player 2');
    g.setHeader('Date', new Date().toISOString().split('T')[0]);
    gameRef.current = g;

    setTime({ w: Infinity, b: Infinity });
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
  }, [updateGameState, gameMode]);

  useEffect(() => {
    if (gameMode === 'ai' && turn !== boardOrientation && !gameOver) {
      const performAIMove = async () => {
        setIsAITurn(true);
        try {
          const aiPromise = suggestMove({
            boardStateFen: gameRef.current.fen(),
            skillLevel,
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI response timed out after 5 seconds.')), 5000)
          );
          
          const { suggestedMove } = await Promise.race([aiPromise, timeoutPromise]);
          
          const moveSuccessful = makeMove(suggestedMove);
          if (!moveSuccessful) {
            throw new Error(`AI suggested an invalid move: ${suggestedMove}`);
          }
          
          if (premove) {
              const validMoves = gameRef.current.moves({verbose: true});
              const isValidPremove = validMoves.some(m => m.from === premove.from && m.to === premove.to);

              if (isValidPremove) {
                  makeMove(premove);
              }
              setPremove(null);
          }

        } catch (error: any) {
          console.error('AI move failed:', error);
          toast({
            variant: 'destructive',
            title: 'AI Error',
            description: error.message || 'The AI failed to make a move.',
          });
        } finally {
          setIsAITurn(false);
        }
      };
      const timeoutId = setTimeout(performAIMove, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [turn, boardOrientation, gameMode, skillLevel, makeMove, toast, pgn, gameOver, premove]);

  const onSquareClick = useCallback((square: ChessSquare) => {
    if (gameOver || promotionMove) return;

    const g = gameRef.current;
    const pieceOnSquare = g.get(square);
    
    // It is NOT the player's turn: Handle premoves
    if (gameMode === 'ai' && g.turn() !== boardOrientation) {
      if (enablePremove) {
        if (selectedSquare) {
          // A piece is already selected, so this click is the destination for the premove
          const piece = g.get(selectedSquare);
          if (piece && piece.color === boardOrientation) {
            setPremove({ from: selectedSquare, to: square });
          }
          resetMoveSelection();
        } else {
          // No piece selected, so this click selects a piece for premoving
          if (pieceOnSquare && pieceOnSquare.color === boardOrientation) {
            setSelectedSquare(square);
          }
        }
      }
      return;
    }
    
    // It IS the player's turn (or two-player mode)
    if (g.turn() !== boardOrientation && gameMode === 'ai') {
        return; // Not the player's turn in AI mode
    }

    if (selectedSquare) {
      if (square === selectedSquare) {
        resetMoveSelection();
        return;
      }
      
      const isPossible = possibleMoves.find(m => m.to === square);
      if (isPossible) {
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
    boardOrientation,
    enablePremove,
    gameOver,
    gameMode,
    possibleMoves,
    promotionMove,
    selectedSquare,
    attemptMove,
  ]);
  
  const onSquareRightClick = useCallback(() => {
    resetMoveSelection();
    setPremove(null);
  }, []);

  const undoMove = useCallback(() => {
    if (gameRef.current.history().length === 0) return;

    const movesToUndo: ChessMove[] = [];
    const undoneMove1 = gameRef.current.undo();
    if (undoneMove1) {
      movesToUndo.unshift(undoneMove1);
    }

    // In AI mode, if the first undone move was the AI's, undo the player's move too.
    if (
      gameMode === 'ai' &&
      undoneMove1 &&
      undoneMove1.color !== boardOrientation &&
      gameRef.current.history().length > 0
    ) {
      const undoneMove2 = gameRef.current.undo();
      if (undoneMove2) {
        movesToUndo.unshift(undoneMove2);
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
    if (isMounted) {
      resetGame();
    }
  }, [isMounted, gameMode, timeControl]); 
  
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

  const handleAdjustDifficulty = useCallback(async (level: 'Beginner' | 'Intermediate' | 'Advanced') => {
    try {
        const result = await adjustDifficulty({ difficultyLevel: level });
        setSkillLevel(result.stockfishLevel);
        setAiPersonality(result.personality);
        toast({
            title: `Difficulty set to ${level}`,
            description: `AI Skill Level: ${result.stockfishLevel}. ${result.description}`,
        })
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to adjust AI difficulty.',
        })
    }
  }, [toast]);

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

  return {
    board, turn, onSquareClick, onSquareRightClick, selectedSquare, possibleMoves, resetGame, history, pgn, isAITurn, lastMove, kingInCheck, gameOver, skillLevel, handleAdjustDifficulty, aiPersonality, boardTheme, pieceSet, showPossibleMoves, showLastMoveHighlight, boardOrientation, flipBoard, undoMove, redoMove, canUndo, canRedo, gameMode, setGameMode, timeControl, setTimeControl, time, hint, getHint, capturedPieces, materialAdvantage, premove,
    customColors, showCoordinates, handlePieceDrop, 
    pendingMove, confirmMove, cancelMove,
    promotionMove, cancelPromotion, handlePromotion,
    isMounted, // Expose isMounted for conditional rendering in parent
  };
};
