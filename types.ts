export enum GameState {
  LOGIN = 'LOGIN',
  REGISTRATION = 'REGISTRATION',
  TITLE = 'TITLE',
  CREDIT_SHOP = 'CREDIT_SHOP',
  PLAYING = 'PLAYING',
  LEVEL_UP = 'LEVEL_UP',
  GAME_OVER = 'GAME_OVER',
  ADMIN = 'ADMIN'
}

export interface UserData {
  uid: string;
  name: string;
  email: string;
  city: string;
  credits: number;
  tickets?: number;
  highscore?: number;
  ticketNames?: string[];
}


export interface HighScore {
  name: string;
  score: number;
}

export interface LeaderboardEntry {
  name: string;
  city: string;
  highscore: number;
  bonusTickets?: number;
}

export interface TicketLeaderboardEntry {
  uid: string;
  name: string;
  tickets: number;
}

export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface Tetromino {
  shape: number[][];
  color: string;
  glowColor: string;
  type: TetrominoType;
}

export interface PlayerStats {
  score: number;
  lines: number;
  level: number;
  bonusTickets: number;
}

export type ActionType = 'ROTATE' | 'DROP' | 'MOVE' | 'LOCK' | 'NONE';

export interface GameAction {
  type: ActionType;
  id: number;
  payload?: {
    x?: number;
    y?: number;
    tetromino?: TetrominoType;
    rotation?: number;
  };
}

export interface PenaltyAnimation {
  id: number;
  penalty: number;
  timestamp: number;
}