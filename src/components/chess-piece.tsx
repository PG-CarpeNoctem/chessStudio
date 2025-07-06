import { cn } from '@/lib/utils';
import type { ChessPiece as PieceType, PieceSet } from '@/lib/types';
import Image from 'next/image';

interface PieceProps {
  piece: PieceType;
  pieceSet: PieceSet;
  className?: string;
}

const PIECE_IMAGE_HINTS: Record<PieceSet, Record<PieceType['type'], { hint: string }>> = {
  classic: {
    p: { hint: 'pawn' },
    r: { hint: 'rook' },
    n: { hint: 'knight' },
    b: { hint: 'bishop' },
    q: { hint: 'queen' },
    k: { hint: 'king' },
  },
  alpha: {
    p: { hint: 'alpha pawn' },
    r: { hint: 'alpha rook' },
    n: { hint: 'alpha knight' },
    b: { hint: 'alpha bishop' },
    q: { hint: 'alpha queen' },
    k: { hint: 'alpha king' },
  },
  merida: {
    p: { hint: 'merida pawn' },
    r: { hint: 'merida rook' },
    n: { hint: 'merida knight' },
    b: { hint: 'merida bishop' },
    q: { hint: 'merida queen' },
    k: { hint: 'merida king' },
  },
};


export function ChessPieceDisplay({ piece, pieceSet, className }: PieceProps) {
  const pieceColor = piece.color === 'w' ? 'white' : 'black';
  const pieceInfo = PIECE_IMAGE_HINTS[pieceSet]?.[piece.type] || PIECE_IMAGE_HINTS.classic[piece.type];
  const hint = `${pieceColor} ${pieceInfo.hint}`;
  
  // Using a generic placeholder for all pieces. 
  // The data-ai-hint will be used to source specific images later.
  const src = 'https://placehold.co/80x80.png';

  return (
    <div className={cn('chess-piece', className)}>
      <Image
        src={src}
        alt={`${pieceColor} ${pieceInfo.hint}`}
        width={80}
        height={80}
        className="w-full h-full"
        data-ai-hint={hint}
        // Add a subtle drop-shadow to the pieces
        style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.4))' }}
      />
    </div>
  );
}
