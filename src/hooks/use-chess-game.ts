
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import type { ChessSquare, ChessPiece, ChessMove, PlayerColor, PieceSet, GameMode, TimeControl } from '@/lib/types';
import { suggestMove } from '@/ai/flows/suggest-move';
import { useToast } from './use-toast';

type BoardState = { square: ChessSquare; piece: ChessPiece }[];
type BoardTheme = 'classic' | 'cyan' | 'ocean' | 'forest' | 'charcoal';

const pieceValues: { [key in ChessPiece['type']]: number } = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

function getBoardState(g: Chess): BoardState {
    const boardState: BoardState = [];
    g.board().forEach(row => {
      row.forEach(square => {
        if (square) {
          boardState.push({ square: square.square, piece: { type: square.type, color: square.color } });
        }
      });
    });
    return boardState;
}

const parseTimeControl = (timeControl: TimeControl) => {
    if (timeControl === 'unlimited') {
        return { initialTime: Infinity, increment: 0 };
    }
    const [minutes, increment] = timeControl.split('+').map(Number);
    return { initialTime: minutes * 60 * 1000, increment: increment * 1000 };
};


export const useChessGame = () => {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<ChessMove[]>([]);
  const [isAITurn, setIsAITurn] = useState(false);
  const [skillLevel, setSkillLevel] = useState(4); // Stockfish level 1-20
  const [gameOver, setGameOver] = useState<{ status: string; winner?: string } | null>(null);
  const [redoStack, setRedoStack] = useState<ChessMove[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [timeControl, setTimeControl] = useState<TimeControl>('10+0');
  const [time, setTime] = useState({ w: 600000, b: 600000 });
  const [timerOn, setTimerOn] = useState(false);
  const [hint, setHint] = useState<ChessMove | null>(null);
  const [capturedPieces, setCapturedPieces] = useState<{ w: ChessPiece[]; b: ChessPiece[] }>({ w: [], b: [] });
  const [materialAdvantage, setMaterialAdvantage] = useState<number>(0);

  // UI Settings
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('classic');
  const [showPossibleMoves, setShowPossibleMoves] = useState(true);
  const [showLastMoveHighlight, setShowLastMoveHighlight] = useState(true);
  const [boardOrientation, setBoardOrientation] = useState<PlayerColor>('w');
  const [pieceSet, setPieceSet] = useState<PieceSet>('classic');

  const { toast } = useToast();

  const board = useMemo(() => getBoardState(game), [game]);

  const updateGameState = useCallback((g: Chess) => {
    // Calculate captured pieces and material advantage
    const initialPieceSet: { [key in ChessPiece['type']]: number } = {
      p: 8, n: 2, b: 2, r: 2, q: 1, k: 1,
    };

    const currentPieceCounts: { [c in PlayerColor]: { [pt in ChessPiece['type']]: number } } = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    };
    
    getBoardState(g).forEach(p => {
        currentPieceCounts[p.piece.color][p.piece.type]++;
    });

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
                      captured.b.push({ type, color: 'w' }); // Black captures white pieces
                  } else {
                      captured.w.push({ type, color: 'b' }); // White captures black pieces
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
  }, [setCapturedPieces, setMaterialAdvantage, setTimerOn, setGameOver]);

  const makeMove = useCallback((move: string | { from: ChessSquare, to: ChessSquare, promotion?: string }) => {
    const gameCopy = new Chess(game.fen());
    try {
      const result = gameCopy.move(move);
      if (result) {
        if (timeControl !== 'unlimited') {
            const { increment } = parseTimeControl(timeControl);
            const prevTurn = game.turn();
            setTime(prev => ({ ...prev, [prevTurn]: prev[prevTurn] + increment }));
        }

        setGame(gameCopy);
        updateGameState(gameCopy);
        setRedoStack([]);
        setHint(null);
        if (!timerOn && timeControl !== 'unlimited') setTimerOn(true);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }, [game, updateGameState, timeControl, timerOn, setTime, setGame, setRedoStack, setHint, setTimerOn]);


  useEffect(() => {
    if (gameMode === 'ai' && game.turn() === 'b' && !game.isGameOver()) {
      const performAIMove = async () => {
        setIsAITurn(true);
        try {
          const { suggestedMove } = await suggestMove({
            boardStateFen: game.fen(),
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
  }, [game, gameMode, skillLevel, makeMove, toast]);

  const onSquareClick = useCallback((square: ChessSquare) => {
    if (gameOver || isAITurn) return;
    
    if (gameMode === 'ai' && game.turn() === 'b') return;

    if (selectedSquare) {
      const move = { from: selectedSquare, to: square, promotion: 'q' };
      const isMoveSuccessful = makeMove(move);
      
      if (!isMoveSuccessful) {
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          setPossibleMoves(game.moves({ square, verbose: true }));
        } else {
          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      } else {
         setSelectedSquare(null);
         setPossibleMoves([]);
      }
    } else {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        setPossibleMoves(game.moves({ square, verbose: true }));
      }
    }
  }, [selectedSquare, game, makeMove, gameMode, gameOver, isAITurn]);

  const resetGame = useCallback(() => {
    const newGame = new Chess();
    const { initialTime } = parseTimeControl(timeControl);
    setGame(newGame);
    updateGameState(newGame);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setIsAITurn(false);
    setRedoStack([]);
    setHint(null);
    setTime({ w: initialTime, b: initialTime });
    setTimerOn(false);
  }, [updateGameState, timeControl]);

  const undoMove = useCallback(() => {
    if (game.history().length === 0) return;
    
    const gameCopy = new Chess(game.fen());
    const undoneMove = gameCopy.undo();
    if (undoneMove) {
      setRedoStack((prev) => [undoneMove, ...prev]);

      if (gameMode === 'ai' && game.history().length > 1) {
        const undoneMove2 = gameCopy.undo();
        if (undoneMove2) {
            setRedoStack((prev) => [undoneMove2, ...prev]);
        }
      }

      setGame(gameCopy);
      updateGameState(gameCopy);
      setHint(null);
    }
  }, [game, updateGameState, gameMode]);

  const redoMove = useCallback(() => {
    if (redoStack.length > 0) {
      const gameCopy = new Chess(game.fen());
      const move_to_redo = redoStack[0];
      gameCopy.move(move_to_redo);

      if (gameMode === 'ai' && redoStack.length > 1) {
        const move_to_redo2 = redoStack[1];
        gameCopy.move(move_to_redo2);
        setRedoStack((prev) => prev.slice(2));
      } else {
        setRedoStack((prev) => prev.slice(1));
      }

      setGame(gameCopy);
      updateGameState(gameCopy);
      setHint(null);
    }
  }, [redoStack, game, updateGameState, gameMode]);

  useEffect(() => {
    resetGame();
  }, [timeControl, gameMode, resetGame]);

  useEffect(() => {
    if (!timerOn || gameOver || timeControl === 'unlimited') {
      return;
    }

    const interval = setInterval(() => {
      const currentTurn = game.turn();
      setTime(prev => {
        const newTimeForPlayer = prev[currentTurn] - 1000;
        if (newTimeForPlayer <= 0) {
          clearInterval(interval);
          setGameOver({ status: 'Timeout', winner: currentTurn === 'w' ? 'Black' : 'White' });
          return { ...prev, [currentTurn]: 0 };
        }
        return { ...prev, [currentTurn]: newTimeForPlayer };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerOn, gameOver, game, timeControl, setGameOver]);


  const getHint = useCallback(async () => {
    if (game.isGameOver() || isAITurn) return;

    toast({
      title: 'Thinking...',
      description: 'The AI is analyzing the board for a hint.',
    });
    
    try {
      const { suggestedMove, explanation } = await suggestMove({
        boardStateFen: game.fen(),
        skillLevel: 20,
      });

      let moveDetails = game.moves({ verbose: true }).find(m => m.san === suggestedMove || (m.from + m.to === suggestedMove) || (m.from + m.to + (m.promotion || '') === suggestedMove));
      
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
  }, [game, toast, isAITurn]);


  const flipBoard = useCallback(() => {
    setBoardOrientation(prev => (prev === 'w' ? 'b' : 'w'));
  }, []);

  const lastMove = useMemo(() => {
    const history = game.history({ verbose: true });
    return history.length > 0 ? history[history.length - 1] : null;
  }, [game]);

  const kingInCheck = useMemo(() => {
    if (!game.inCheck()) return null;
    const kingPos = board.find(p => p.piece.type === 'k' && p.piece.color === game.turn());
    return kingPos?.square;
  }, [game, board]);

  return {
    board,
    turn: game.turn(),
    onSquareClick,
    selectedSquare,
    possibleMoves,
    resetGame,
    history: game.history({ verbose: true }),
    pgn: game.pgn(),
    isAITurn,
    lastMove,
    kingInCheck,
    gameOver,
    skillLevel,
    setSkillLevel,
    boardTheme,
    setBoardTheme,
    showPossibleMoves,
    setShowPossibleMoves,
    showLastMoveHighlight,
    setShowLastMoveHighlight,
    boardOrientation,
    flipBoard,
    pieceSet,
    setPieceSet,
    undoMove,
    redoMove,
    canUndo: game.history().length > 0,
    canRedo: redoStack.length > 0,
    gameMode,
    setGameMode,
    timeControl,
    setTimeControl,
    time,
    hint,
    getHint,
    capturedPieces,
    materialAdvantage,
  };
};
