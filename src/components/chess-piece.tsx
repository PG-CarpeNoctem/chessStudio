
import { cn } from '@/lib/utils';
import type { ChessPiece as PieceType, PieceSet } from '@/lib/types';

const PIECE_SETS: Record<PieceSet, Record<PieceType['type'], string>> = {
  classic: {
    p: 'M22.5,33.5 L22.5,33.5 C20.57,33.5 19,31.93 19,30 C19,28.07 20.57,26.5 22.5,26.5 C24.43,26.5 26,28.07 26,30 C26,31.93 24.43,33.5 22.5,33.5 M15,36.5 C15,36.5 18,39 22.5,39 C27,39 30,36.5 30,36.5 M19.5,25.5 L25.5,25.5 L25.5,16.5 L19.5,16.5 z M17,15.5 L28,15.5 L28,13.5 L17,13.5 z',
    r: 'M9,39 L36,39 L36,36 L9,36 z M12.5,32.5 L32.5,32.5 L32.5,14 L12.5,14 z M12,14 L12,9 L17,9 L17,14 L20,14 L20,9 L25,9 L25,14 L28,14 L28,9 L33,9 L33,14 z',
    n: 'M22,10 C22.74,10 24.48,10.94 25.96,12.41 C26.47,12.92 27.5,14.28 27.5,15.5 C27.5,16.31 27.02,17.23 26.5,18 C25.86,18.96 25.21,19.98 25.21,21 C25.21,22.12 25.98,23.01 27.5,23.01 C28.52,23.01 29.5,22.5 29.5,22.5 C30.5,25 29.5,28 29.5,28 L15.5,28 C15.5,28 14.5,25 15.5,22.5 C15.5,22.5 16.48,23.01 17.5,23.01 C19.02,23.01 19.79,22.12 19.79,21 C19.79,19.98 19.14,18.96 18.5,18 C17.98,17.23 17.5,16.31 17.5,15.5 C17.5,14.28 18.53,12.92 19.04,12.41 C20.52,10.94 22.26,10 23,10 L22,10 z M12,38 L33,38 L33,36 L12,36 z',
    b: 'M22.5,10 C24.71,10 26.5,11.79 26.5,14 C26.5,16.21 24.71,18 22.5,18 C20.29,18 18.5,16.21 18.5,14 C18.5,11.79 20.29,10 22.5,10 z M22.5,15 C23.5,15 23.5,16.5 22.5,16.5 C21.5,16.5 21.5,15 22.5,15 z M22.5,20 C28,20 31.5,29.5 31.5,29.5 L13.5,29.5 C13.5,29.5 17,20 22.5,20 z M20,28 L25,28 M15,38 L30,38 L30,36 L15,36 z',
    q: 'M11.5,14 C13.2,14 14.5,12.5 14.5,11.5 C14.5,10.5 13.2,9 11.5,9 C9.8,9 8.5,10.5 8.5,11.5 C8.5,12.5 9.8,14 11.5,14 z M22.5,14 C24.2,14 25.5,12.5 25.5,11.5 C25.5,10.5 24.2,9 22.5,9 C20.8,9 19.5,10.5 19.5,11.5 C19.5,12.5 20.8,14 22.5,14 z M33.5,14 C35.2,14 36.5,12.5 36.5,11.5 C36.5,10.5 35.2,9 33.5,9 C31.8,9 30.5,10.5 30.5,11.5 C30.5,12.5 31.8,14 33.5,14 z M9,26 C15,14 22.5,14 30,14 C36,26 9,26 M9,28 C19.5,28 25.5,28 36,28 M11.5,39.5 L33.5,39.5 L33.5,36.5 L11.5,36.5 z',
    k: 'M22.5,11.63 C24.1,11.63 25.32,12.86 25.32,14.33 C25.32,15.81 24.1,17.03 22.62,17.03 C21.15,17.03 19.93,15.81 19.93,14.33 C19.93,12.86 21.15,11.63 22.62,11.63 z M22.5,2.5 L22.5,9.5 M20,4.5 L25,4.5 M22.5,9.5 C20.24,9.5 18.5,11.24 18.5,13.5 C18.5,15.76 20.24,17.5 22.5,17.5 C24.76,17.5 26.5,15.76 26.5,13.5 C26.5,11.24 24.76,9.5 22.5,9.5 z M12.5,37 C15,25 22.5,25 30,25 C32.5,37 12.5,37 z M11.5,39.5 L33.5,39.5 L33.5,42.5 L11.5,42.5 z'
  },
  alpha: {
    p: 'm 22.5,36 c -2.76142,0 -5,-2.23858 -5,-5 0,-2.76142 2.23858,-5 5,-5 2.76142,0 5,2.23858 5,5 0,2.76142 -2.23858,5 -5,5 z m -6.5,-12 h 13 l -2,-3 h -9 z m 2,-3 h 9 l -1.5,-3 h -6 z m 1.5,-3 h 6 l -1,-2 h -4 z',
    r: 'm 13.5,36 3,0 0,-8 12,0 0,8 3,0 0,-10 -18,0 z m 2,-10 0,-6 2,0 0,-2 3,0 0,2 2,0 0,-2 3,0 0,2 2,0 0,6 -14,0 z',
    n: 'm 16,36 13,0 0,-2 -13,0 z m 2,-2 9,0 0,-2 -9,0 z m -1,-2 11,0 0,-2 -11,0 z m 2,-2 7,0 0,-2 -7,0 z m -1,-2 9,0 -1,-2 1,-2 -1,-2 -1,2 -1,2 -1,-2 -1,2 -1,-2 -1,2 -1,-2 -1,2 z m 3,-6 3,0 -1,-2 -1,0 z',
    b: 'm 22.5,36 c -2.76142,0 -5,-2.23858 -5,-5 0,-2.76142 2.23858,-5 5,-5 2.76142,0 5,2.23858 5,5 0,2.76142 -2.23858,5 -5,5 z m 0,-13 c -3.86599,0 -7,3.13401 -7,7 0,3.86599 3.13401,7 7,7 3.86599,0 7,-3.13401 7,-7 0,-3.86599 -3.13401,-7 -7,-7 z m 0,-2 c 1.10457,0 2,-0.89543 2,-2 0,-1.10457 -0.89543,-2 -2,-2 -1.10457,0 -2,0.89543 -2,2 0,1.10457 0.89543,2 2,2 z',
    q: 'm 11.5,36 c -1.38071,0 -2.5,-1.11929 -2.5,-2.5 0,-1.38071 1.11929,-2.5 2.5,-2.5 1.38071,0 2.5,1.11929 2.5,2.5 0,1.38071 -1.11929,2.5 -2.5,2.5 z m 22,0 c -1.38071,0 -2.5,-1.11929 -2.5,-2.5 0,-1.38071 1.11929,-2.5 2.5,-2.5 1.38071,0 2.5,1.11929 2.5,2.5 0,1.38071 -1.11929,2.5 -2.5,2.5 z m -11,-2 c -2.20914,0 -4,-1.79086 -4,-4 0,-2.20914 1.79086,-4 4,-4 2.20914,0 4,1.79086 4,4 0,2.20914 -1.79086,4 -4,4 z m -13,-15 26,0 -3,-3 -20,0 z m 3,-3 20,0 -3,-3 -14,0 z m 3,-3 14,0 -3,-3 -8,0 z m 3,-3 8,0 -3,-3 -2,0 z',
    k: 'm 22.5,36 -8.5,0 0,-2 8.5,0 z m 0,0 8.5,0 0,-2 -8.5,0 z m -7.5,-2 -1,-2 7.5,0 0,-5 1,0 0,5 7.5,0 -1,2 z m 1,-4 13,0 0,-2 -13,0 z m 2,-2 9,0 0,-2 -9,0 z m 1,-2 7,0 0,-2 -7,0 z m 1,-2 5,0 0,-2 -5,0 z m -5,-7 1,0 0,-2 -1,0 z m 14,0 1,0 0,-2 -1,0 z m -13,0 0,-1 12,0 0,1 z m 1,1 0,-1 10,0 0,1 z m 1,-2 8,0 0,-1 -8,0 z m 1,-1 6,0 0,-1 -6,0 z m 1,-1 4,0 0,-1 -4,0 z'
  },
  merida: {
    p: 'm 22.5,35 c -2.76142,0 -5,-2.23858 -5,-5 0,-2.76142 2.23858,-5 5,-5 2.76142,0 5,2.23858 5,5 0,2.76142 -2.23858,5 -5,5 z m -4.5,-11 9,0 c 0,0 -1,-2 -1,-2 l -7,0 c 0,0 -1,2 -1,2 z m 1.5,-2 6,0 c 0,0 -1,-2 -1,-2 l -4,0 c 0,0 -1,2 -1,2 z',
    r: 'm 13,35 19,0 0,-2 -19,0 z m 2,-2 15,0 0,-13 -15,0 z m 2,-13 0,-4 2,0 0,-2 3,0 0,2 2,0 0,-2 3,0 0,2 2,0 0,4 z',
    n: 'm 16,35 2,0 -1,-2 -2,0 -1,2 z m 13,0 2,0 -1,-2 -2,0 -1,2 z m -12,-2 10,0 1,-2 -12,0 z m 1,2 0,0 z m 2,-4 1,0 0,-2 -1,0 z m 5,0 1,0 0,-2 -1,0 z m -6,-6 -3,0 c 0,0 1,-3 3,-3 l 1,0 c 0,0 1,3 1,3 z m 12,0 -3,0 c 0,0 1,-3 3,-3 l 1,0 c 0,0 1,3 1,3 z m -8,-1 4,0 c 0,0 1,-2 1,-3 0,-1 -1,-2 -1,-2 l -4,0 c 0,0 -1,1 -1,2 0,1 1,3 1,3 z m 0,-5 4,0 0,-2 -4,0 z',
    b: 'm 22.5,35 c -2.76142,0 -5,-2.23858 -5,-5 0,-2.76142 2.23858,-5 5,-5 2.76142,0 5,2.23858 5,5 0,2.76142 -2.23858,5 -5,5 z m 0,-13 c -3.86599,0 -7,3.13401 -7,7 0,3.86599 3.13401,7 7,7 3.86599,0 7,-3.13401 7,-7 0,-3.86599 -3.13401,-7 -7,-7 z m 0,-2 c 2,0 2,-2 2,-2 0,0 -2,-1 -2,-1 -2,0 -2,1 -2,1 0,0 0,2 2,2 z m -1,0 2,0',
    q: 'M 9,35 14,35 14,31 9,31 z M 36,35 31,35 31,31 36,31 z M 22.5,31.5 C 20.0147,31.5 18,29.4853 18,27 C 18,24.5147 20.0147,22.5 22.5,22.5 C 24.9853,22.5 27,24.5147 27,27 C 27,29.4853 24.9853,31.5 22.5,31.5 z M 12,25 C 15.5,19 19,15 22.5,15 C 26,15 29.5,19 33,25 L 12,25 z M 22.5,15 C 21.5,14 23.5,14 22.5,15 z M 19.5,14.5 C 19.5,13.5 20.5,12.5 22.5,12.5 C 24.5,12.5 25.5,13.5 25.5,14.5 L 19.5,14.5 z',
    k: 'm 22.5,35 c -3.31371,0 -6,-2.68629 -6,-6 0,-3.31371 2.68629,-6 6,-6 3.31371,0 6,2.68629 6,6 0,3.31371 -2.68629,6 -6,6 z m 0,-14 c -3.86599,0 -7,3.13401 -7,7 0,3.86599 3.13401,7 7,7 3.86599,0 7,-3.13401 7,-7 0,-3.86599 -3.13401,-7 -7,-7 z m 0,-2 c 1,0 1,-1 1,-1 0,0 1,-1 1,-1 l -4,0 c 0,0 1,1 1,1 0,0 0,1 1,1 z m -1,0 2,0 m -1,7 0,4'
  },
  neo: {
    p: 'M22.5 34c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm-4-10h8l-1-3h-6l-1 3zm1-3h6l-1-2h-4l-1 2z',
    r: 'M14 34h17v-2H14v2zm2-2h13V15H16v17zm-1-17h15v-3h-2v-3h-2v3h-2v-3h-3v3h-2v-3h-2v3H15v3z',
    n: 'M18 34h9v-2h-9v2zm-1-2h11v-2H17v2zm-1-2h13l-1-2-1 2h-1l-1-2-1 2h-1l-1-2-1 2h-1l-1-2-1 2h-1l-1-2-1 2zm-2-13c0-2.8 2.2-5 5-5s5 2.2 5 5c0 1-0.4 1.9-1 2.6L25 18l-1.5 1.5L22 18l-1.5 1.5L19 18l-1.5 1.5L16 18l-1-1.4c-0.6-0.7-1-1.6-1-2.6z',
    b: 'M22.5 34c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7zm0-9c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2zm0-5c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z',
    q: 'M12 34h3v-3h-3v3zm18 0h3v-3h-3v3zm-9 0h3v-3h-3v3zm-9-5h21l-2-4h-17l-2 4zm2-4h17l-2-4h-13l-2 4zM16 9h13l-3 4h-7l-3-4z',
    k: 'M22.5 34c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm0-10c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2zM21 7h3v-4h-3v4zm-3 2h9v-2h-9v2z'
  },
  cburnett: {
    p: 'M22.5,36c-2.76,0-5-2.24-5-5s2.24-5,5-5,5,2.24,5,5-2.24,5-5,5Zm-4-10,8,0-1-3-6,0-1,3Zm1-3,6,0-1-2-4,0-1,2Z',
    r: 'M14,36h17v-2H14v2Zm2-2h13V15H16v19Zm-1-19h15v-3h-2v-3h-2v3h-2v-3h-3v3h-2v-3h-2v3H15v3Z',
    n: 'm 18,36 h 9 v -2 h -9 v 2 z m -1,-2 h 11 v -2 h -11 v 2 z m -1,-2 h 13 l -1,-2 -1,2 h -1 l -1,-2 -1,2 h -1 l -1,-2 -1,2 h -1 l -1,-2 -1,2 h -1 l -1,-2 -1,2 z m -2,-13 c 0,-2.8 2.2,-5 5,-5 5,0 5,2.2 5,5 0,1 -0.4,1.9 -1,2.6 l -1,1.4 -1.5,-1.5 -1.5,1.5 -1.5,-1.5 -1.5,1.5 -1.5,-1.5 -1.5,1.5 -1,-1.4 C 15.4,18.9 15,18 15,17 c 0,-2.8 2.2,-5 5,-5 z',
    b: 'm 22.5,36 c -3.9,0 -7,-3.1 -7,-7 0,-3.9 3.1,-7 7,-7 3.9,0 7,3.1 7,7 0,3.9 -3.1,7 -7,7 z m 0,-9 c -1.1,0 -2,0.9 -2,2 0,1.1 0.9,2 2,2 1.1,0 2,-0.9 2,-2 0,-1.1 -0.9,-2 -2,-2 z m 0,-5 c -2.8,0 -5,-2.2 -5,-5 0,-2.8 2.2,-5 5,-5 2.8,0 5,2.2 5,5 0,2.8 -2.2,5 -5,5 z',
    q: 'm 12,36 h 3 v -3 h -3 v 3 z m 18,0 h 3 v -3 h -3 v 3 z m -9,0 h 3 v -3 h -3 v 3 z m -9,-5 h 21 l -2,-4 H 13 Z m 2,-4 h 17 l -2,-4 H 15 Z m 1,-6 h 13 l -3,-4 h -7 z',
    k: 'm 22.5,36 c -4.4,0 -8,-3.6 -8,-8 0,-4.4 3.6,-8 8,-8 4.4,0 8,3.6 8,8 0,4.4 -3.6,8 -8,8 z m 0,-10 c -1.1,0 -2,0.9 -2,2 0,1.1 0.9,2 2,2 1.1,0 2,-0.9 2,-2 0,-1.1 -0.9,-2 -2,-2 z m -1.5,-5.5 3,0 -1.5,-3 z m -1.5,2 6,0 v -2 h -6 z'
  },
  fantasy: {
    p: 'M 22.5,35.5 A 5.5,5.5 0 0 1 17,30 5.5,5.5 0 0 1 22.5,24.5 5.5,5.5 0 0 1 28,30 5.5,5.5 0 0 1 22.5,35.5 Z M 22.5,26.5 A 3.5,3.5 0 0 0 19,30 3.5,3.5 0 0 0 22.5,33.5 3.5,3.5 0 0 0 26,30 3.5,3.5 0 0 0 22.5,26.5 Z M 18,24.5, 27,24.5, 22.5,20 Z',
    r: 'M 14.5,35.5 14.5,15.5 30.5,15.5 30.5,35.5 Z M 17.5,12.5 17.5,9.5 27.5,9.5 27.5,12.5 Z M 14.5,15.5 30.5,15.5 M 14.5,35.5 30.5,35.5',
    n: 'm 16.5,35.5, 5,-11, 5,11 z m 2.5,-13, 1,-3, 1,3, -2,0 z m -3,13, 11,0, 1,-2, -13,0 z m 0.5,-3, 10,0, -1,-2, -8,0 z m 2,-14, 1.5,-2, 1.5,2, -3,0 z m 3,0, 2,-3, 2,3, -4,0 z',
    b: 'm 17.5,35.5, 10,0, -5,-8 z m 2.5,-10, -3,-5, 11,0, -3,5 z m 0.5,-7, 2,0, -1,-2, -1,-2 z',
    q: 'm 14.5,35.5, 16,0, -8,-12 z m -3,-3, 22,0, -11,-16 z m 3,3, -1,2, -1,-2 z m 17,0, 1,2, 1,-2 z m -12,-18, 5,0, -2.5,-4 z',
    k: 'm 22.5,35.5, -6,-10, 12,0 z m 0,-12, -6,-10, 12,0 z m -1.5,-12, 3,0, -1.5,-3 z'
  },
  staunty: {
    p: 'M22.5 36c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm-3-8h6l-3-3-3 3z',
    r: 'M14 36h17v-4h-17v4zm1-6h15v-14H15v14zm-1-14h17v-4h-17v4z',
    n: 'm17.5 36-3.5-12-3 4 3-10 3 10-3-4zm10 0-3.5-12-3 4 3-10 3 10-3-4zm-5-12 1-3 1 3h-2zm-3-3-1-3 1-3 4 4-2-1-2 3zm8 0-1-3 1-3 4 4-2-1-2 3z',
    b: 'm22.5 36-6-6h12l-6 6zm-4-8 4-6 4 6h-8zm4-8-2-3h4l-2 3z',
    q: 'M14 36l8.5-10 8.5 10H14zM14 24l8.5-10 8.5 10H14z',
    k: 'm22.5 36-8-12h16l-8 12zm0-14-8-12h16l-8 12z'
  }
};

const PieceSvg = ({ type, color, pieceSet }: { type: PieceType['type']; color: PieceType['color'], pieceSet: PieceSet }) => {
    const path = PIECE_SETS[pieceSet]?.[type] || PIECE_SETS['classic'][type];

    const fill = color === 'b' 
        ? 'var(--custom-piece-black-fill, #3C3C3C)' 
        : 'var(--custom-piece-white-fill, #FFFFFF)';
    const stroke = color === 'b' 
        ? 'var(--custom-piece-black-stroke, #000000)' 
        : 'var(--custom-piece-white-stroke, #2F2F2F)';

    return (
        <svg viewBox="0 0 45 45" className="w-full h-full">
            <g
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
                filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.4))',
            }}
            >
            <path d={path} />
            </g>
        </svg>
    )
};

interface PieceProps {
  piece: PieceType;
  pieceSet: PieceSet;
  className?: string;
  isDraggable?: boolean;
}

export function ChessPieceDisplay({ piece, pieceSet, className, isDraggable }: PieceProps) {
  return (
    <div className={cn('chess-piece', className)} draggable={isDraggable}>
      <PieceSvg type={piece.type} color={piece.color} pieceSet={pieceSet} />
    </div>
  );
}
