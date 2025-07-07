
'use client';

import type { ChessPiece, PieceSet } from '@/lib/types';
import { ChessPieceDisplay } from './chess-piece';
import { cn } from '@/lib/utils';

interface CapturedPiecesProps {
    capturedBy: 'w' | 'b';
    allCaptured: { w: ChessPiece[], b: ChessPiece[] };
    pieceSet: PieceSet;
    className?: string;
}

const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export function CapturedPieces({ capturedBy, allCaptured, pieceSet, className }: CapturedPiecesProps) {
    const piecesToShow = capturedBy === 'w' ? allCaptured.b : allCaptured.w;
    
    const opponentColor = capturedBy === 'w' ? 'w' : 'b';
    const opponentCaptured = allCaptured[opponentColor];

    const piecesValue = piecesToShow.reduce((sum, p) => sum + pieceValues[p.type], 0);
    const opponentValue = opponentCaptured.reduce((sum, p) => sum + pieceValues[p.type], 0);
    const advantage = piecesValue - opponentValue;

    return (
        <div className={cn("flex items-center gap-2 h-4", className)}>
            <div className="flex items-center gap-0.5">
                {piecesToShow.map((piece, index) => (
                    <div key={index} className="w-4 h-4 text-white/70">
                        <ChessPieceDisplay piece={piece} pieceSet={pieceSet} className="captured-piece" />
                    </div>
                ))}
            </div>
            {advantage > 0 && (
                <span className="text-xs font-semibold text-muted-foreground self-end">+ {advantage}</span>
            )}
        </div>
    );
}
