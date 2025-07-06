
'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Chess } from 'chess.js';
import type { ChessSquare, ChessPiece, ChessMove, PlayerColor, PieceSet, GameMode, TimeControl, BoardTheme } from '@/lib/types';
import { suggestMove } from '@/ai/flows/suggest-move';
import { useToast } from './use-toast';

type BoardState = { square: ChessSquare; piece: ChessPiece }[];

const pieceValues: { [key in ChessPiece['type']]: number } = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

const parseTimeControl = (timeControl: TimeControl) => {
    if (timeControl === 'unlimited') {
        return { initialTime: Infinity, increment: 0 };
    }
    const [minutes, increment] = timeControl.split('+').map(Number);
    return { initialTime: minutes * 60 * 1000, increment: (increment || 0) * 1000 };
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

export const useChessGame = () => {
  const gameRef = useRef(new Chess());
  const { toast } = useToast();
  
  // Game State
  const [board, setBoard] = useState<BoardState>([]);
  const [history, setHistory] = useState<readonly ChessMove[]>([]);
  const [turn, setTurn] = useState<PlayerColor>('w');
  const [pgn, setPgn] = useState('');
  const [gameOver, setGameOver] = useState<{ status: string; winner?: string } | null>(null);

  // UI and Interaction State
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<ChessMove[]>([]);
  const [isAITurn, setIsAITurn] = useState(false);
  const [skillLevel, setSkillLevel] = useState(4);
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [timeControl, setTimeControl] = useState<TimeControl>('10+0');
  const [time, setTime] = useState({ w: 600000, b: 600000 });
  const [timerOn, setTimerOn] = useState(false);
  const [hint, setHint] = useState<ChessMove | null>(null);
  const [capturedPieces, setCapturedPieces] = useState<{ w: ChessPiece[]; b: ChessPiece[] }>({ w: [], b: [] });
  const [materialAdvantage, setMaterialAdvantage] = useState<number>(0);
  const [premove, setPremove] = useState<{ from: ChessSquare, to: ChessSquare } | null>(null);

  // UI Settings
  const [boardTheme, setBoardTheme] = useState<BoardTheme>(() => getSetting('chess:boardTheme', 'cyan'));
  const [pieceSet, setPieceSet] = useState<PieceSet>(() => getSetting('chess:pieceSet', 'classic'));
  const [showPossibleMoves, setShowPossibleMoves] = useState(() => getSetting('chess:showPossibleMoves', true));
  const [showLastMoveHighlight, setShowLastMoveHighlight] = useState(() => getSetting('chess:showLastMoveHighlight', true));
  const [boardOrientation, setBoardOrientation] = useState<PlayerColor>('w');
  const [customBoardColors, setCustomBoardColors] = useState(() => getSetting('chess:customBoardColors', { light: '#ebebd0', dark: '#779556' }));
  const [customPieceColors, setCustomPieceColors] = useState(() => getSetting('chess:customPieceColors', { whiteFill: '#FFFFFF', whiteStroke: '#333333', blackFill: '#333333', blackStroke: '#FFFFFF' }));

  const updateGameState = useCallback(() => {
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
    setPgn(g.pgn());
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

    if (g.isGameOver()) {
      setTimerOn(false);
      let status = 'Game Over';
      let winner = '';
      if (g.isCheckmate()) {
        status = 'Checkmate';
        winner = g.turn() === 'w' ? 'Black' : 'White';
      } else if (g.isDraw()) {
        status = 'Draw';
      } else if (g.isStalemate()) {
        status = 'Stalemate';
      } else if (g.isThreefoldRepetition()) {
        status = 'Threefold Repetition';
      }
      setGameOver({ status, winner });
    } else {
        setGameOver(null);
    }
  }, []);

  const makeMove = useCallback((move: string | { from: ChessSquare, to: ChessSquare, promotion?: string }) => {
    try {
      const g = gameRef.current;
      const prevTurn = g.turn();
      const result = g.move(move);
      if (result) {
        if (timeControl !== 'unlimited') {
            const { increment } = parseTimeControl(timeControl);
            setTime(prev => ({ ...prev, [prevTurn]: prev[prevTurn] + increment }));
        }
        updateGameState();
        setHint(null);
        if (!timerOn && timeControl !== 'unlimited') setTimerOn(true);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }, [timeControl, timerOn, updateGameState]);

  const resetMoveSelection = () => {
    setSelectedSquare(null);
    setPossibleMoves([]);
  };

  const handlePieceDrop = useCallback((from: ChessSquare, to: ChessSquare) => {
    if (gameOver || isAITurn) return;

    if (gameMode === 'ai' && turn === 'b') {
        setPremove({ from, to });
        resetMoveSelection();
        return;
    }
    
    const move = { from, to, promotion: 'q' };
    makeMove(move);
    resetMoveSelection();
  }, [makeMove, gameMode, turn, gameOver, isAITurn]);

  const resetGame = useCallback(() => {
    gameRef.current = new Chess();
    const { initialTime } = parseTimeControl(timeControl);
    updateGameState();
    resetMoveSelection();
    setIsAITurn(false);
    setHint(null);
    setPremove(null);
    setTime({ w: initialTime, b: initialTime });
    setTimerOn(false);
  }, [updateGameState, timeControl]);

  useEffect(() => {
    if (gameMode === 'ai' && turn === 'b' && !gameOver) {
      const performAIMove = async () => {
        setIsAITurn(true);
        try {
          const { suggestedMove } = await suggestMove({
            boardStateFen: gameRef.current.fen(),
            skillLevel,
          });
          makeMove(suggestedMove);
          
          if (premove) {
              const premoveResult = gameRef.current.move(premove);
              if (premoveResult) {
                  updateGameState();
              }
              setPremove(null);
          }

        } catch (error) {
          console.error('AI move failed:', error);
          toast({
            variant: 'destructive',
            title: 'AI Error',
            description: 'The AI failed to make a move.',
          });
        } finally {
          setIsAITurn(false);
        }
      };
      const timeoutId = setTimeout(performAIMove, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [turn, gameMode, skillLevel, makeMove, toast, pgn, gameOver, premove, updateGameState]);

  const onSquareClick = useCallback((square: ChessSquare) => {
    if (gameOver || isAITurn) return;

    const g = gameRef.current;
    
    if (gameMode === 'ai' && g.turn() === 'b') {
        if(selectedSquare) {
            setPremove({from: selectedSquare, to: square});
            resetMoveSelection();
        } else {
            const piece = g.get(square);
            if (piece && piece.color === 'w') {
                setSelectedSquare(square);
            }
        }
        return;
    }

    if (selectedSquare) {
      const move = { from: selectedSquare, to: square, promotion: 'q' };
      const isMoveSuccessful = makeMove(move);
      
      if (!isMoveSuccessful) {
        const piece = g.get(square);
        if (piece && piece.color === g.turn()) {
          setSelectedSquare(square);
          setPossibleMoves(g.moves({ square, verbose: true }));
        } else {
          resetMoveSelection();
        }
      } else {
         resetMoveSelection();
      }
    } else {
      const piece = g.get(square);
      if (piece && piece.color === g.turn()) {
        setSelectedSquare(square);
        setPossibleMoves(g.moves({ square, verbose: true }));
      }
    }
  }, [selectedSquare, makeMove, gameMode, gameOver, isAITurn, turn]);
  
  const onSquareRightClick = useCallback(() => {
    resetMoveSelection();
    setPremove(null);
  }, []);

  const undoMove = useCallback(() => {
    if (gameRef.current.history().length === 0) return;
    
    gameRef.current.undo();
    if (gameMode === 'ai' && gameRef.current.history().length > 0) {
      gameRef.current.undo();
    }
    updateGameState();
    setHint(null);
    setPremove(null);
    resetMoveSelection();
  }, [updateGameState, gameMode]);

  const redoMove = useCallback(() => {
    toast({ title: "Coming Soon!", description: "Redo functionality is under development." });
  }, [toast]);

  // Settings synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        const updateState = (key: string, setter: (value: any) => void) => {
            if (e.key === key && e.newValue) {
                try {
                    setter(JSON.parse(e.newValue));
                } catch {
                    // Fallback for non-JSON values
                    setter(e.newValue);
                }
            }
        };
        updateState('chess:boardTheme', setBoardTheme);
        updateState('chess:pieceSet', setPieceSet);
        updateState('chess:customBoardColors', setCustomBoardColors);
        updateState('chess:customPieceColors', setCustomPieceColors);
        updateState('chess:showPossibleMoves', setShowPossibleMoves);
        updateState('chess:showLastMoveHighlight', setShowLastMoveHighlight);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    resetGame();
  }, [timeControl, gameMode, resetGame]);
  
  useEffect(() => {
    updateGameState();
  }, [updateGameState]);

  useEffect(() => {
    if (!timerOn || gameOver || timeControl === 'unlimited') {
      return;
    }

    const interval = setInterval(() => {
      const currentTurn = gameRef.current.turn();
      setTime(prevTime => {
        const newTimeForPlayer = prevTime[currentTurn] - 100;

        if (newTimeForPlayer <= 0) {
          clearInterval(interval);
          setGameOver({ status: 'Timeout', winner: currentTurn === 'w' ? 'Black' : 'White' });
          setTimerOn(false);
          return { ...prevTime, [currentTurn]: 0 };
        }
        return { ...prevTime, [currentTurn]: newTimeForPlayer };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [timerOn, gameOver, timeControl]);


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
  const canRedo = false;

  return {
    board, turn, onSquareClick, onSquareRightClick, selectedSquare, possibleMoves, resetGame, history, pgn, isAITurn, lastMove, kingInCheck, gameOver, skillLevel, setSkillLevel, boardTheme, setBoardTheme, showPossibleMoves, setShowPossibleMoves, showLastMoveHighlight, setShowLastMoveHighlight, boardOrientation, flipBoard, pieceSet, setPieceSet, undoMove, redoMove, canUndo, canRedo, gameMode, setGameMode, timeControl, setTimeControl, time, hint, getHint, capturedPieces, materialAdvantage, premove,
    customBoardColors, setCustomBoardColors, customPieceColors, setCustomPieceColors,
    handlePieceDrop
  };
};
