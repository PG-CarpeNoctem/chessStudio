import { cn } from '@/lib/utils';
import type { ChessPiece as PieceType } from '@/lib/types';

interface PieceProps extends React.SVGProps<SVGSVGElement> {
  piece: PieceType;
}

export function ChessPieceDisplay({ piece, className }: { piece: PieceType }) {
  const pieceColor = piece.color === 'w' ? 'white' : 'black';
  const SpecificPiece = PIECE_MAP[piece.type];

  return (
    <div className={cn('chess-piece', className)}>
      <SpecificPiece
        className={cn(
          'w-full h-full',
          pieceColor === 'white' ? 'text-white' : 'text-gray-900',
        )}
        fill="currentColor"
      />
    </div>
  );
}

const Pawn = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 45 45" {...props}>
    <g fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.5 11.63V6" />
      <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1.5-3-3-3s-3 3-3 3c-1.5 3 3 10.5 3 10.5" fill="currentColor" />
      <path d="M22.5 25v10.5" />
      <path d="M11.5 38.5h22" fill="none" />
    </g>
  </svg>
);

const Rook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 45 45" {...props}>
    <g fill="currentColor" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" />
      <path d="M34 14l-3 3H14l-3-3" />
      <path d="M31 17v12.5H14V17" />
      <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
      <path d="M14 17h17" fill="none" strokeLinejoin="miter" />
    </g>
  </svg>
);

const Knight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 45 45" {...props}>
    <g fill="currentColor" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10c10.5 1 16.5 8 16 29H15c-2 0-9-11.5-8-21 1-10 10-10 15-8z" />
      <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003-1.66-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-1.994 2.1-2.5 3-1 .5 1.5-1 2.5-1 2.5s3.4-1.5 4-2c1.333-1 3 .5 3 .5" fill="none" />
    </g>
  </svg>
);

const Bishop = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 45 45" {...props}>
    <g fill="currentColor" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 36h27v3H9z" />
      <path d="M15 33h15l-2.5-3h-10z" />
      <path d="M17.5 30l-2.5-3h15l-2.5 3z" />
      <path d="M15 27h15l-7.5-18z" />
      <circle cx="22.5" cy="12.5" r="2.5" />
    </g>
  </svg>
);

const Queen = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 45 45" {...props}>
    <g fill="currentColor" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM33 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
      <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15L19 11v14L12 14l-3 12z" />
      <path d="M9 26v5h27v-5" />
      <path d="M11 31v5h23v-5" />
      <path d="M12 36h21v3H12z" />
    </g>
  </svg>
);

const King = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 45 45" {...props}>
    <g fill="currentColor" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.5 11.63V6M20 8h5" />
      <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1.5-3-3-3s-3 3-3 3c-1.5 3 3 10.5 3 10.5" />
      <path d="M12 38.5h21M12 38.5s1-4.5 10.5-4.5 10.5 4.5 10.5 4.5" />
      <path d="M22.5 25v10.5" />
    </g>
  </svg>
);

const PIECE_MAP = {
  p: Pawn,
  r: Rook,
  n: Knight,
  b: Bishop,
  q: Queen,
  k: King,
};
