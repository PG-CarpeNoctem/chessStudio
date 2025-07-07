'use client';

import { ChessPieceDisplay } from './chess-piece';
import { cn } from '@/lib/utils';
import type { useChessGame } from '@/hooks/use-chess-game';
import type { ChessSquare, CustomColors, CoordinatesDisplay } from '@/lib/types';
import React from 'react';

type ChessBoardProps = Pick<ReturnType<typeof useChessGame>, 
  'board' | 'onSquareClick' | 'onSquareRightClick' | 'selectedSquare' | 'possibleMoves' | 'lastMove' | 'kingInCheck' |
  'boardTheme' | 'showPossibleMoves' | 'showLastMoveHighlight' | 'boardOrientation' | 'pieceSet' |
  'hint' | 'customColors' | 'premove' | 'handlePieceDrop' | 'showCoordinates' | 'turn' | 'gameOver'
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
  turn,
  gameOver,
  showCoordinates,
}: ChessBoardProps) {
  const ranks = boardOrientation === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = boardOrientation === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

  const boardStyle = boardTheme === 'custom' && customColors ? {
    '--custom-board-light': customColors.boardLight,
    '--custom-board-dark': customColors.boardDark,
    '--custom-check-1': customColors.check1,
    '--custom-check-2': customColors.check2,
    '--custom-previous-1': customColors.previous1,
    '--custom-previous-2': customColors.previous2,
    '--custom-selected-1': customColors.selected1,
    '--custom-selected-2': customColors.selected2,
  } as React.CSSProperties : {};
  
  const pieceStyle = boardTheme === 'custom' && customColors ? {
      '--custom-piece-white-fill': customColors.pieceWhiteFill,
      '--custom-piece-white-stroke': customColors.pieceWhiteStroke,
      '--custom-piece-black-fill': customColors.pieceBlackFill,
      '--custom-piece-black-stroke': customColors.pieceBlackStroke,
  } : {};

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSquareRightClick) {
        onSquareRightClick();
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, toSquare: ChessSquare) => {
    e.preventDefault();
    const fromSquare = e.dataTransfer.getData('fromSquare') as ChessSquare;
    if (fromSquare && fromSquare !== toSquare && handlePieceDrop) {
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
    <div className="chess-board-container" style={pieceStyle}>
      {showCoordinates === 'outside' && (
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
            const pieceOnSquare = board.find(p => p.square === square);
            const isPossibleMove = possibleMoves.some(m => m.to === square);
            
            // Player is always white. Allow dragging own pieces anytime for premoves, unless game is over.
            const isDraggable = !gameOver && pieceOnSquare?.piece.color === 'w';

            return (
              <div
                key={square}
                onClick={() => onSquareClick && onSquareClick(square)}
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
                {showCoordinates === 'inside' && file === files[0] && <span className="coordinate rank-coord">{rank}</span>}
                {showCoordinates === 'inside' && rank === ranks[ranks.length-1] && <span className="coordinate file-coord">{file}</span>}
                {pieceOnSquare && (
                  <div
                    draggable={isDraggable}
                    onDragStart={(e) => isDraggable && onDragStart(e, square)}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <ChessPieceDisplay piece={pieceOnSquare.piece} pieceSet={pieceSet} isDraggable={isDraggable} />
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
