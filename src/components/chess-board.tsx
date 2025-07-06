
'use client';

import { ChessPieceDisplay } from './chess-piece';
import { cn } from '@/lib/utils';
import type { useChessGame } from '@/hooks/use-chess-game';
import type { ChessSquare, CustomColors } from '@/lib/types';
import React from 'react';

type ChessBoardProps = Pick<ReturnType<typeof useChessGame>, 
  'board' | 'onSquareClick' | 'onSquareRightClick' | 'selectedSquare' | 'possibleMoves' | 'lastMove' | 'kingInCheck' |
  'boardTheme' | 'showPossibleMoves' | 'showLastMoveHighlight' | 'boardOrientation' | 'pieceSet' |
  'hint' | 'customColors' | 'premove' | 'handlePieceDrop' | 'isAITurn' | 'turn' | 'showCoordinates'
>;

export function ChessBoard({
  board,
  onSquareClick,
  onSquareRightClick,
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
  customColors,
  premove,
  handlePieceDrop,
  isAITurn,
  turn,
  showCoordinates,
}: ChessBoardProps) {
  const ranks = boardOrientation === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = boardOrientation === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

  const boardStyle = boardTheme === 'custom' ? {
    '--custom-board-light': customColors.boardLight,
    '--custom-board-dark': customColors.boardDark,
    '--custom-check-1': customColors.check1,
    '--custom-check-2': customColors.check2,
    '--custom-previous-1': customColors.previous1,
    '--custom-previous-2': customColors.previous2,
    '--custom-selected-1': customColors.selected1,
    '--custom-selected-2': customColors.selected2,
  } as React.CSSProperties : {};
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onSquareRightClick();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, toSquare: ChessSquare) => {
    e.preventDefault();
    const fromSquare = e.dataTransfer.getData('fromSquare') as ChessSquare;
    if (fromSquare && fromSquare !== toSquare) {
      handlePieceDrop(fromSquare, toSquare);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, fromSquare: ChessSquare) => {
    e.dataTransfer.setData('fromSquare', fromSquare);
  };

  return (
    <div className="chess-board-container">
      {showCoordinates && (
        <>
          <div className="files-container" aria-hidden>
            {files.map(file => <span key={file}>{file}</span>)}
          </div>
          <div className="ranks-container" aria-hidden>
             {ranks.map(rank => <span key={rank}>{rank}</span>)}
          </div>
        </>
      )}
      <div className="chess-board" data-theme={boardTheme} style={boardStyle} onContextMenu={handleContextMenu}>
        {ranks.map((rank, i) =>
          files.map((file, j) => {
            const square = `${file}${rank}` as ChessSquare;
            const isLight = (i + j) % 2 !== 0;
            const piece = board.find(p => p.square === square);
            const isPossibleMove = possibleMoves.some(m => m.to === square);
            
            const isDraggable = !isAITurn && piece && piece.color === turn;

            return (
              <div
                key={square}
                onClick={() => onSquareClick(square)}
                onDrop={(e) => onDrop(e, square)}
                onDragOver={onDragOver}
                className={cn('board-square', {
                  light: isLight,
                  dark: !isLight,
                  'selected-square': square === selectedSquare,
                  'last-move-highlight': showLastMoveHighlight && lastMove && (square === lastMove.from || square === lastMove.to),
                  'in-check-square': kingInCheck && kingInCheck === square,
                  'hint-highlight': hint && (square === hint.from || square === hint.to),
                  'premove-highlight': premove && (square === premove.from || square === premove.to),
                })}
              >
                {piece && (
                  <div
                    draggable={isDraggable}
                    onDragStart={(e) => isDraggable && onDragStart(e, square)}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <ChessPieceDisplay piece={piece.piece} pieceSet={pieceSet} boardTheme={boardTheme} customColors={customColors} isDraggable={isDraggable} />
                  </div>
                )}
                {showPossibleMoves && isPossibleMove && <div className="possible-move-dot" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
