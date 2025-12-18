export enum GameState {
  WELCOME = 'WELCOME',
  LOGIN = 'LOGIN',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  REGISTRATION = 'REGISTRATION',
  TITLE = 'TITLE',
  PLAYING = 'PLAYING',
  LEVEL_UP = 'LEVEL_UP',
  GAME_OVER = 'GAME_OVER',
  RESET_PASSWORD = 'RESET_PASSWORD',
  CREDITS = 'CREDITS',
  CREDITS_SUCCESS = 'CREDITS_SUCCESS',
  CREDITS_CANCEL = 'CREDITS_CANCEL',
  DASHBOARD = 'DASHBOARD',
  ADMIN_CREDITS = 'ADMIN_CREDITS'
}

export interface UserData {
  name: string;
  email: string;
  city: string;
  tickets?: number;
  highscore?: number;
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