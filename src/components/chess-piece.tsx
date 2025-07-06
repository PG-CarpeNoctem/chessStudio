import { cn } from '@/lib/utils';
import type { ChessPiece as PieceType, PieceSet } from '@/lib/types';

// SVG paths for chess pieces (cburnett style) - Corrected Paths
const PIECE_PATHS: Record<PieceType['type'], string> = {
  p: 'M22.5,33.5 L22.5,33.5 C20.57,33.5 19,31.93 19,30 C19,28.07 20.57,26.5 22.5,26.5 C24.43,26.5 26,28.07 26,30 C26,31.93 24.43,33.5 22.5,33.5 M15,36.5 C15,36.5 18,39 22.5,39 C27,39 30,36.5 30,36.5 M19.5,25.5 L25.5,25.5 L25.5,16.5 L19.5,16.5 z M17,15.5 L28,15.5 L28,13.5 L17,13.5 z',
  r: 'M9,39 L36,39 L36,36 L9,36 z M12.5,32.5 L32.5,32.5 L32.5,14 L12.5,14 z M12,14 L12,9 L17,9 L17,14 L20,14 L20,9 L25,9 L25,14 L28,14 L28,9 L33,9 L33,14 z',
  n: 'M22,10 C22.74,10 24.48,10.94 25.96,12.41 C26.47,12.92 27.5,14.28 27.5,15.5 C27.5,16.31 27.02,17.23 26.5,18 C25.86,18.96 25.21,19.98 25.21,21 C25.21,22.12 25.98,23.01 27.5,23.01 C28.52,23.01 29.5,22.5 29.5,22.5 C30.5,25 29.5,28 29.5,28 L15.5,28 C15.5,28 14.5,25 15.5,22.5 C15.5,22.5 16.48,23.01 17.5,23.01 C19.02,23.01 19.79,22.12 19.79,21 C19.79,19.98 19.14,18.96 18.5,18 C17.98,17.23 17.5,16.31 17.5,15.5 C17.5,14.28 18.53,12.92 19.04,12.41 C20.52,10.94 22.26,10 23,10 L22,10 z M12,38 L33,38 L33,36 L12,36 z',
  b: 'M22.5,10 C24.71,10 26.5,11.79 26.5,14 C26.5,16.21 24.71,18 22.5,18 C20.29,18 18.5,16.21 18.5,14 C18.5,11.79 20.29,10 22.5,10 z M22.5,15 C23.5,15 23.5,16.5 22.5,16.5 C21.5,16.5 21.5,15 22.5,15 z M22.5,20 C28,20 31.5,29.5 31.5,29.5 L13.5,29.5 C13.5,29.5 17,20 22.5,20 z M20,28 L25,28 M15,38 L30,38 L30,36 L15,36 z',
  q: 'M11.5,14 C13.2,14 14.5,12.5 14.5,11.5 C14.5,10.5 13.2,9 11.5,9 C9.8,9 8.5,10.5 8.5,11.5 C8.5,12.5 9.8,14 11.5,14 z M22.5,14 C24.2,14 25.5,12.5 25.5,11.5 C25.5,10.5 24.2,9 22.5,9 C20.8,9 19.5,10.5 19.5,11.5 C19.5,12.5 20.8,14 22.5,14 z M33.5,14 C35.2,14 36.5,12.5 36.5,11.5 C36.5,10.5 35.2,9 33.5,9 C31.8,9 30.5,10.5 30.5,11.5 C30.5,12.5 31.8,14 33.5,14 z M9,26 C15,14 22.5,14 30,14 C36,26 9,26 z M9,28 C19.5,28 25.5,28 36,28 z M11.5,39.5 L33.5,39.5 L33.5,36.5 L11.5,36.5 z',
  k: 'M22.5,11.63 C24.1,11.63 25.32,12.86 25.32,14.33 C25.32,15.81 24.1,17.03 22.62,17.03 C21.15,17.03 19.93,15.81 19.93,14.33 C19.93,12.86 21.15,11.63 22.62,11.63 z M22.5,2.5 L22.5,9.5 M20,4.5 L25,4.5 M22.5,9.5 C20.24,9.5 18.5,11.24 18.5,13.5 C18.5,15.76 20.24,17.5 22.5,17.5 C24.76,17.5 26.5,15.76 26.5,13.5 C26.5,11.24 24.76,9.5 22.5,9.5 z M12.5,37 C15,25 22.5,25 30,25 C32.5,37 12.5,37 z M11.5,39.5 L33.5,39.5 L33.5,42.5 L11.5,42.5 z'
};

const PieceSvg = ({ type, color }: { type: PieceType['type']; color: PieceType['color'] }) => (
  <svg viewBox="0 0 45 45" className="w-full h-full">
    <g
      fill={color === 'b' ? '#3C3C3C' : '#FFFFFF'}
      stroke={color === 'b' ? '#000000' : '#2F2F2F'}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.4))',
        // The pawn SVGs are drawn pointing "up" the board.
        // For black pawns, we rotate them 180 degrees so they face the opponent.
        ...((type === 'p' && color === 'b') && { transform: 'rotate(180deg)', transformOrigin: 'center' }),
      }}
    >
      <path d={PIECE_PATHS[type]} />
    </g>
  </svg>
);

interface PieceProps {
  piece: PieceType;
  pieceSet: PieceSet; // Kept for future extension with different piece styles
  className?: string;
}

export function ChessPieceDisplay({ piece, pieceSet, className }: PieceProps) {
  // The pieceSet prop is kept for future enhancements, but for now, all sets use the same SVG style.
  return (
    <div className={cn('chess-piece', className)}>
      <PieceSvg type={piece.type} color={piece.color} />
    </div>
  );
}
