'use client';

import { useMemo } from 'react';
import { ChessPieceDisplay } from './chess-piece';
import { cn } from '@/lib/utils';
import type { useChessGame } from '@/hooks/use-chess-game';
import type { ChessSquare } from '@/lib/types';

type ChessBoardProps = ReturnType<typeof useChessGame>;

export function ChessBoard({
  board,
  onSquareClick,
  selectedSquare,
  possibleMoves,
  lastMove,
  kingInCheck,
}: ChessBoardProps) {
  const boardLayout = useMemo(() => {
    const squares = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const row = 8 - i;
        const col = String.fromCharCode(97 + j);
        const square = `${col}${row}` as ChessSquare;
        squares.push(square);
      }
    }
    return squares;
  }, []);

  return (
    <div className="chess-board">
      {boardLayout.map((square, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const isLight = (row + col) % 2 !== 0;
        const piece = board.find(p => p.square === square);
        const isPossibleMove = possibleMoves.some(m => m.to === square);

        return (
          <div
            key={square}
            onClick={() => onSquareClick(square)}
            className={cn('board-square', {
              light: isLight,
              dark: !isLight,
              'selected-square': square === selectedSquare,
              'last-move-highlight': lastMove && (square === lastMove.from || square === lastMove.to),
              'in-check-square': kingInCheck && kingInCheck === square,
            })}
          >
            {piece && <ChessPieceDisplay piece={piece.piece} />}
            {isPossibleMove && <div className="possible-move-dot" />}
          </div>
        );
      })}
    </div>
  );
}
