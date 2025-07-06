
import type { Square, Piece, Move } from 'chess.js';

export type ChessSquare = Square;
export type ChessPiece = Piece;
export type ChessMove = Move;
export type PlayerColor = 'w' | 'b';
export type PieceSet = 'classic' | 'alpha' | 'merida';
export type GameMode = 'ai' | 'two-player';
export type TimeControl = '1+0' | '3+0' | '5+3' | '10+0' | '15+10' | 'unlimited';
