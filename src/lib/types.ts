
import type { Square, Piece, Move } from 'chess.js';

export type ChessSquare = Square;
export type ChessPiece = Piece;
export type ChessMove = Move;
export type PlayerColor = 'w' | 'b';
export type PieceSet = 'classic' | 'alpha' | 'merida' | 'neo' | 'cburnett' | 'fantasy' | 'staunty';
export type BoardTheme = 'classic' | 'cyan' | 'ocean' | 'forest' | 'charcoal' | 'marble' | 'walnut' | 'custom';
export type GameMode = 'ai' | 'two-player';
export type TimeControl = {
  type: 'fischer' | 'bronstein' | 'delay' | 'unlimited';
  initial: number; // seconds
  increment: number; // seconds
};
export type CoordinatesDisplay = 'inside' | 'outside' | 'none';
export type AutoPromote = 'q' | 'r' | 'b' | 'n' | 'ask';
export type DirectMessagePrivacy = 'everyone' | 'friends' | 'nobody';
export type GameChatPrivacy = 'everyone' | 'request' | 'friends';

export type CustomColors = {
  boardLight: string;
  boardDark: string;
  pieceWhiteFill: string;
  pieceWhiteStroke: string;
  pieceBlackFill: string;
  pieceBlackStroke: string;
  check1: string;
  check2: string;
  previous1: string;
  previous2: string;
  selected1: string;
  selected2: string;
};

export type GameRecord = {
  pgn: string;
  date: string;
  white: string;
  black: string;
  result: string;
};

    