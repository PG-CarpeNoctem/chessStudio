'use client';

import { ChessPieceDisplay } from './chess-piece';
import { cn } from '@/lib/utils';
import type { useChessGame } from '@/hooks/use-chess-game';
import type { ChessSquare, BoardTheme } from '@/lib/types';
import React from 'react';

type ChessBoardProps = ReturnType<typeof useChessGame>;

export function ChessBoard({
  board,
  onSquareClick,
  selectedSquare,
  possibleMoves,
  lastMove,
  kingInCheck,
  boardTheme,
  showPossibleMoves,
  showLastMoveHighlight,
  boardOrientation,
  pieceSet,
  hint,
  customBoardColors,
  customPieceColors,
}: ChessBoardProps) {
  const ranks = boardOrientation === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = boardOrientation === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

  const boardStyle = boardTheme === 'custom' ? {
    '--custom-light-square': customBoardColors.light,
    '--custom-dark-square': customBoardColors.dark,
  } as React.CSSProperties : {};

  return (
    <div className="chess-board" data-theme={boardTheme} style={boardStyle}>
      {ranks.map((rank, i) =>
        files.map((file, j) => {
          const square = `${file}${rank}` as ChessSquare;
          const isLight = (i + j) % 2 !== 0;
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
                'last-move-highlight': showLastMoveHighlight && lastMove && (square === lastMove.from || square === lastMove.to),
                'in-check-square': kingInCheck && kingInCheck === square,
                'hint-highlight': hint && (square === hint.from || square === hint.to),
              })}
            >
              {piece && <ChessPieceDisplay piece={piece.piece} pieceSet={pieceSet} boardTheme={boardTheme} customPieceColors={customPieceColors} />}
              {showPossibleMoves && isPossibleMove && <div className="possible-move-dot" />}
            </div>
          );
        })
      )}
    </div>
  );
}
