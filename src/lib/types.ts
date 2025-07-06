import type { Square, Piece, Move } from 'chess.js';

export type ChessSquare = Square;
export type ChessPiece = Piece;
export type ChessMove = Move;
export type PlayerColor = 'w' | 'b';
export type PieceSet = 'classic' | 'alpha' | 'merida' | 'neo';
export type BoardTheme = 'classic' | 'cyan' | 'ocean' | 'forest' | 'charcoal' | 'custom';
export type GameMode = 'ai' | 'two-player';
export type TimeControl = string;
