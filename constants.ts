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

// Bonus Ticket Thresholds (Config)
// Score thresholds for earning bonus tickets
export const BONUS_TICKET_THRESHOLDS = {
  TIER_1: 5000,    // 1 Ticket
  TIER_2: 10000,   // 2 Tickets
  TIER_3: 15000,   // 3 Tickets
  TIER_4: 20000,   // 4 Tickets
  TIER_5: 25000,   // 5 Tickets
  TIER_6: 30000,   // 6 Tickets
  TIER_7: 35000,   // 7 Tickets
  TIER_8: 40000,   // 8 Tickets
  TIER_9: 45000,   // 9 Tickets
  TIER_10: 50000,  // 10 Tickets
  TIER_11: 60000,  // 11 Tickets (60000-80000)
  TIER_MAX: 80000  // 15 Tickets (80000+)
};

// Bonus Credit Threshold - earn 1 free credit at this score
export const BONUS_CREDIT_THRESHOLD = 20000;

// High Score Record Bonus - credits awarded for breaking the all-time high score
export const HIGH_SCORE_RECORD_BONUS = 3;

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