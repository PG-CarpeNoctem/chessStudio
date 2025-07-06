
'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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


export const useChessGame = () => {
  const gameRef = useRef(new Chess());
  
  // State derived from the game instance
  const [board, setBoard] = useState<BoardState>([]);
  const [history, setHistory] = useState<readonly ChessMove[]>([]);
  const [turn, setTurn] = useState<PlayerColor>('w');
  const [pgn, setPgn] = useState('');
  const [gameOver, setGameOver] = useState<{ status: string; winner?: string } | null>(null);

  // UI and interaction state
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<ChessMove[]>([]);
  const [isAITurn, setIsAITurn] = useState(false);
  const [skillLevel, setSkillLevel] = useState(4); // Stockfish level 1-20
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [timeControl, setTimeControl] = useState<TimeControl>('10+0');
  const [time, setTime] = useState({ w: 600000, b: 600000 });
  const [timerOn, setTimerOn] = useState(false);
  const [hint, setHint] = useState<ChessMove | null>(null);
  const [capturedPieces, setCapturedPieces] = useState<{ w: ChessPiece[]; b: ChessPiece[] }>({ w: [], b: [] });
  const [materialAdvantage, setMaterialAdvantage] = useState<number>(0);

  // UI Settings
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('cyan');
  const [showPossibleMoves, setShowPossibleMoves] = useState(true);
  const [showLastMoveHighlight, setShowLastMoveHighlight] = useState(true);
  const [boardOrientation, setBoardOrientation] = useState<PlayerColor>('w');
  const [pieceSet, setPieceSet] = useState<PieceSet>('classic');
  const [customBoardColors, setCustomBoardColors] = useState({ light: '#ebebd0', dark: '#779556' });
  const [customPieceColors, setCustomPieceColors] = useState({ whiteFill: '#FFFFFF', whiteStroke: '#333333', blackFill: '#333333', blackStroke: '#FFFFFF' });


  const { toast } = useToast();

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
      const prevTurn = gameRef.current.turn();
      const result = gameRef.current.move(move);
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


  const resetGame = useCallback(() => {
    gameRef.current = new Chess();
    const { initialTime } = parseTimeControl(timeControl);
    updateGameState();
    setSelectedSquare(null);
    setPossibleMoves([]);
    setIsAITurn(false);
    setHint(null);
    setTime({ w: initialTime, b: initialTime });
    setTimerOn(false);
  }, [updateGameState, timeControl]);

  useEffect(() => {
    if (gameMode === 'ai' && gameRef.current.turn() === 'b' && !gameRef.current.isGameOver()) {
      const performAIMove = async () => {
        setIsAITurn(true);
        try {
          const { suggestedMove } = await suggestMove({
            boardStateFen: gameRef.current.fen(),
            skillLevel,
          });
          makeMove(suggestedMove);
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
  }, [turn, gameMode, skillLevel, makeMove, toast, pgn]);

  const onSquareClick = useCallback((square: ChessSquare) => {
    if (gameOver || isAITurn) return;
    
    const g = gameRef.current;
    if (gameMode === 'ai' && g.turn() === 'b') return;

    if (selectedSquare) {
      const move = { from: selectedSquare, to: square, promotion: 'q' };
      const isMoveSuccessful = makeMove(move);
      
      if (!isMoveSuccessful) {
        const piece = g.get(square);
        if (piece && piece.color === g.turn()) {
          setSelectedSquare(square);
          setPossibleMoves(g.moves({ square, verbose: true }));
        } else {
          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      } else {
         setSelectedSquare(null);
         setPossibleMoves([]);
      }
    } else {
      const piece = g.get(square);
      if (piece && piece.color === g.turn()) {
        setSelectedSquare(square);
        setPossibleMoves(g.moves({ square, verbose: true }));
      }
    }
  }, [selectedSquare, makeMove, gameMode, gameOver, isAITurn]);

  const undoMove = useCallback(() => {
    if (gameRef.current.history().length === 0) return;
    
    gameRef.current.undo();
    if (gameMode === 'ai' && gameRef.current.history().length > 0) {
      gameRef.current.undo();
    }
    updateGameState();
    setHint(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
  }, [updateGameState, gameMode]);

  const redoMove = useCallback(() => {
    toast({ title: "Coming Soon!", description: "Redo functionality is under development." });
  }, [toast]);

  useEffect(() => {
    resetGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeControl, gameMode]);
  
  // Initial game setup on mount
  useEffect(() => {
    updateGameState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Robust timer effect
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
        throw new Error("AI suggested an invalid or unparseable move: " + suggestedMove);
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Hint Failed',
        description: 'Could not get a hint at this time.',
      });
    }
  }, [toast, isAITurn, pgn]);


  const flipBoard = useCallback(() => {
    setBoardOrientation(prev => (prev === 'w' ? 'b' : 'w'));
  }, []);

  const lastMove = useMemo(() => {
    const hist = gameRef.current.history({verbose: true});
    return hist.length > 0 ? hist[hist.length - 1] : null;
  }, [pgn]);

  const kingInCheck = useMemo(() => {
    const g = gameRef.current;
    if (!g.inCheck()) return null;
    const kSquare = g.board().flat().find(p => p?.type === 'k' && p.color === g.turn())?.square;
    return kSquare;
  }, [turn, pgn]);

  const canUndo = history.length > 0;
  const canRedo = false; // Redo is complex and has been disabled to prevent bugs.

  return {
    board, turn, onSquareClick, selectedSquare, possibleMoves, resetGame, history, pgn, isAITurn, lastMove, kingInCheck, gameOver, skillLevel, setSkillLevel, boardTheme, setBoardTheme, showPossibleMoves, setShowPossibleMoves, showLastMoveHighlight, setShowLastMoveHighlight, boardOrientation, flipBoard, pieceSet, setPieceSet, undoMove, redoMove, canUndo, canRedo, gameMode, setGameMode, timeControl, setTimeControl, time, hint, getHint, capturedPieces, materialAdvantage,
    customBoardColors, setCustomBoardColors, customPieceColors, setCustomPieceColors
  };
};
