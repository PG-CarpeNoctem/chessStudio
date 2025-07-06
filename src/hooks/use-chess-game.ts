'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import type { ChessSquare, ChessPiece, ChessMove, PlayerColor, PieceSet } from '@/lib/types';
import { suggestMove } from '@/ai/flows/suggest-move';
import { useToast } from './use-toast';

type BoardState = { square: ChessSquare; piece: ChessPiece }[];
type BoardTheme = 'classic' | 'cyan' | 'ocean' | 'forest' | 'charcoal';

export const useChessGame = (playerColor: PlayerColor = 'w') => {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState<BoardState>(getBoardState(game));
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<ChessMove[]>([]);
  const [isAITurn, setIsAITurn] = useState(false);
  const [skillLevel, setSkillLevel] = useState(4); // Stockfish level 1-20
  const [gameOver, setGameOver] = useState<{ status: string; winner?: string } | null>(null);

  // UI Settings
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('classic');
  const [showPossibleMoves, setShowPossibleMoves] = useState(true);
  const [showLastMoveHighlight, setShowLastMoveHighlight] = useState(true);
  const [boardOrientation, setBoardOrientation] = useState<PlayerColor>('w');
  const [pieceSet, setPieceSet] = useState<PieceSet>('classic');

  const { toast } = useToast();

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

  const updateGameState = useCallback((g: Chess) => {
    setBoard(getBoardState(g));
    if (g.isGameOver()) {
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
    const gameCopy = new Chess(game.fen());
    try {
      const result = gameCopy.move(move);
      if (result) {
        setGame(gameCopy);
        updateGameState(gameCopy);
        return true;
      }
    } catch (e) {
      // Invalid move
      return false;
    }
    return false;
  }, [game, updateGameState]);


  useEffect(() => {
    if (game.turn() !== playerColor && !game.isGameOver()) {
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
      // Add a small delay for better UX
      const timeoutId = setTimeout(performAIMove, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [game, playerColor, skillLevel, makeMove, toast]);

  const onSquareClick = useCallback((square: ChessSquare) => {
    if (game.isGameOver()) return;
    if (game.turn() !== playerColor) return;

    if (selectedSquare) {
      const move = { from: selectedSquare, to: square, promotion: 'q' }; // Auto-promote to Queen
      const isMoveSuccessful = makeMove(move);
      
      if (!isMoveSuccessful) {
        // If the move failed, maybe the user wants to select another of their pieces
        const piece = game.get(square);
        if (piece && piece.color === playerColor) {
          setSelectedSquare(square);
          setPossibleMoves(game.moves({ square, verbose: true }));
        } else {
          // or deselect
          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      } else {
         setSelectedSquare(null);
         setPossibleMoves([]);
      }

    } else {
      const piece = game.get(square);
      if (piece && piece.color === playerColor) {
        setSelectedSquare(square);
        setPossibleMoves(game.moves({ square, verbose: true }));
      }
    }
  }, [selectedSquare, game, playerColor, makeMove]);

  const resetGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    updateGameState(newGame);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setIsAITurn(false);
  }, [updateGameState]);

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
  };
};
