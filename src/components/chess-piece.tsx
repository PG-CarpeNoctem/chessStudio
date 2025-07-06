import { cn } from '@/lib/utils';
import type { ChessPiece as PieceType } from '@/lib/types';
import Image from 'next/image';

interface PieceProps {
  piece: PieceType;
  className?: string;
}

const PIECE_IMAGE_MAP: Record<PieceType['type'], { hint: string }> = {
  p: { hint: 'pawn' },
  r: { hint: 'rook' },
  n: { hint: 'knight' },
  b: { hint: 'bishop' },
  q: { hint: 'queen' },
  k: { hint: 'king' },
};

export function ChessPieceDisplay({ piece, className }: PieceProps) {
  const pieceColor = piece.color === 'w' ? 'white' : 'black';
  const pieceInfo = PIECE_IMAGE_MAP[piece.type];
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
