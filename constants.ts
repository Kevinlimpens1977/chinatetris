import { Tetromino, TetrominoType } from './types';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

// Digital Game / Oriental Palette
export const COLORS = {
  I: '#00e5ff', // Cyan (Modern China Neon)
  J: '#1e40af', // Deep Blue
  L: '#d97706', // Amber / Gold
  O: '#fbbf24', // Bright Gold
  S: '#10b981', // Jade Green
  T: '#9f1239', // Rose / Deep Red
  Z: '#ef4444', // Bright Red
};

// Glows for the neon effect
export const GLOWS = {
  I: '#a5f3fc',
  J: '#60a5fa',
  L: '#fde047',
  O: '#fef08a',
  S: '#86efac',
  T: '#fecdd3',
  Z: '#fca5a5',
};

// Bonus Ticket Thresholds (Config) - TEMPORARY TEST VALUES
export const BONUS_TICKET_THRESHOLDS = {
  TIER_1: 400,   // 1 Bonus Ticket
  TIER_2: 500,   // 2 Bonus Tickets
  TIER_3: 700    // 5 Bonus Tickets
};

// Token Packages for Stripe Purchase
export const TOKEN_PACKAGES = [
  { id: 'pack_1', tokens: 1, priceEuroCents: 500, label: '1 Token', description: '€5,00' },
  { id: 'pack_3', tokens: 3, priceEuroCents: 1200, label: '3 Tokens', description: '€12,00 (bespaar 20%)' },
  { id: 'pack_5', tokens: 5, priceEuroCents: 1500, label: '5 Tokens', description: '€15,00 (bespaar 40%)' }
] as const;

export type TokenPackage = typeof TOKEN_PACKAGES[number];

export const TETROMINOS: Record<TetrominoType, Tetromino> = {
  I: {
    type: 'I',
    shape: [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
    color: COLORS.I,
    glowColor: GLOWS.I,
  },
  J: {
    type: 'J',
    shape: [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    color: COLORS.J,
    glowColor: GLOWS.J,
  },
  L: {
    type: 'L',
    shape: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    color: COLORS.L,
    glowColor: GLOWS.L,
  },
  O: {
    type: 'O',
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: COLORS.O,
    glowColor: GLOWS.O,
  },
  S: {
    type: 'S',
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: COLORS.S,
    glowColor: GLOWS.S,
  },
  T: {
    type: 'T',
    shape: [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: COLORS.T,
    glowColor: GLOWS.T,
  },
  Z: {
    type: 'Z',
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: COLORS.Z,
    glowColor: GLOWS.Z,
  },
};

export const TETROMINO_KEYS = Object.keys(TETROMINOS) as TetrominoType[];