import React, { useState, useEffect, useRef } from 'react';
import TitleScreen from './components/TitleScreen';
import LoginScreen from './components/LoginScreen';
import RegistrationScreen from './components/RegistrationScreen';
import HUD from './components/HUD';
import GameBoard from './components/GameBoard';
import GameOverScreen from './components/GameOverScreen';
import LevelUpScreen from './components/LevelUpScreen';
import DebugPanel from './components/DebugPanel';
import ChinaBackground, { ChinaBackgroundHandle } from './components/ChinaBackground';
import LeaderboardModal from './components/LeaderboardModal';
import CreditShop from './components/CreditShop';
import { GameState, PlayerStats, TetrominoType, UserData, LeaderboardEntry, GameAction, PenaltyAnimation } from './types';
import { BOARD_WIDTH, BOARD_HEIGHT, TETROMINOS, TETROMINO_KEYS, BONUS_TICKET_THRESHOLDS } from './constants';
import { submitGameResult, getLeaderboard, loadUserData, ensureUserExists, deductCredit } from './services/backend';
import { onAuthStateChanged, signOut, getStoredUid } from './services/authService';

// -- Gravity Function: Professional 10-level system --
const getGravityForLevel = (level: number): number => {
  // Level 1-10 with exponential but playable scaling
  // Returns drop interval in milliseconds
  const baseSpeed = 1000; // Level 1 speed
  const minSpeed = 150;   // Level 10 speed (still playable)

  // Exponential decay formula for smooth progression
  const speed = baseSpeed * Math.pow(minSpeed / baseSpeed, (level - 1) / 9);
  return Math.max(minSpeed, Math.round(speed));
};

// -- Ghost Penalty Function: Level-based penalties --
const getGhostPenalty = (level: number): number => {
  const penalties: { [key: number]: number } = {
    1: 3,
    2: 5,
    3: 0,  // Forbidden
    4: 0,  // Forbidden
    5: 0,  // Forbidden
    6: 0,  // Forbidden
    7: 10,
    8: 12,
    9: 15,
    10: 20
  };
  return penalties[level] || 0;
};

// -- Check if ghost is allowed for level --
const isGhostAllowedForLevel = (level: number): boolean => {
  return level <= 2 || level >= 7;
};

// -- Calculate Bonus Tickets based on score --
const calculateBonusTickets = (score: number): number => {
  if (score >= BONUS_TICKET_THRESHOLDS.TIER_3) return 5;
  if (score >= BONUS_TICKET_THRESHOLDS.TIER_2) return 2;
  if (score >= BONUS_TICKET_THRESHOLDS.TIER_1) return 1;
  return 0;
};

// -- Helper for shape rotation --
const rotateMatrix = (matrix: number[][]) => {
  const N = matrix.length;
  const M = matrix[0].length;
  const result = Array(M).fill(0).map(() => Array(N).fill(0));
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < M; c++) {
      result[c][N - 1 - r] = matrix[r][c];
    }
  }
  return result;
};

const getShapeMatrix = (type: TetrominoType, rotation: number) => {
  let mat = TETROMINOS[type].shape;
  for (let i = 0; i < rotation; i++) {
    mat = rotateMatrix(mat);
  }
  return mat;
};

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>(GameState.LOGIN);
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Game State
  const [grid, setGrid] = useState<(string | number)[][]>(
    Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0))
  );
  const [activePiece, setActivePiece] = useState<{
    pos: { x: number; y: number };
    tetromino: TetrominoType;
    rotation: number;
  } | null>(null);

  const [nextPiece, setNextPiece] = useState<TetrominoType | null>(null);

  // Animation State for Line Clearing
  const [clearingLines, setClearingLines] = useState<number[]>([]);

  const [stats, setStats] = useState<PlayerStats>({
    score: 0,
    lines: 0,
    level: 1,
    bonusTickets: 0
  });

  // Ghost piece control - default OFF, allowed for levels 1-2 and 7-10
  const [ghostEnabled, setGhostEnabled] = useState(false);

  // Penalty animations (floating red numbers)
  const [penaltyAnimations, setPenaltyAnimations] = useState<PenaltyAnimation[]>([]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isNewHigh, setIsNewHigh] = useState(false);

  // Visual Feedback State
  const [lastAction, setLastAction] = useState<GameAction>({ type: 'NONE', id: 0 });

  // Refs
  const gameStateRef = useRef(gameState);
  const isPausedRef = useRef(isPaused);
  const activePieceRef = useRef(activePiece);
  const nextPieceRef = useRef(nextPiece);
  const gridRef = useRef(grid);
  const statsRef = useRef(stats);
  const clearingLinesRef = useRef(clearingLines); // Ref to block inputs during animation
  const lastTimeRef = useRef<number>(0);
  const dropCounterRef = useRef<number>(0);
  const dropIntervalRef = useRef<number>(1000);
  const ghostEnabledRef = useRef(ghostEnabled);

  const backgroundRef = useRef<ChinaBackgroundHandle>(null);

  // Touch Handling Refs
  const touchRef = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startTime: 0,
    isMoving: false
  });

  // Sync refs
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { activePieceRef.current = activePiece; }, [activePiece]);
  useEffect(() => { nextPieceRef.current = nextPiece; }, [nextPiece]);
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { clearingLinesRef.current = clearingLines; }, [clearingLines]);
  useEffect(() => { ghostEnabledRef.current = ghostEnabled; }, [ghostEnabled]);

  // --- Firebase Auth State Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        console.log("🔐 User logged in:", firebaseUser.email);

        // Ensure user document exists in Firestore
        await ensureUserExists(
          firebaseUser.uid,
          firebaseUser.email || '',
          firebaseUser.displayName || 'Speler'
        );

        // Set user immediately with basic info
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Speler',
          email: firebaseUser.email || '',
          city: 'Nederland',
          credits: 0,
          tickets: 0,
          highscore: 0,
          ticketNames: []
        });

        // Show title screen immediately
        setGameState(GameState.TITLE);
        setIsAuthLoading(false);

        // Load user data and leaderboard in background (non-blocking)
        Promise.all([
          loadUserData(firebaseUser.uid),
          getLeaderboard()
        ]).then(([userData, lb]) => {
          if (userData) {
            setUser(prev => prev ? {
              ...prev,
              credits: userData.credits || 0,
              tickets: userData.tickets || 0,
              highscore: userData.highscore || 0,
              ticketNames: userData.ticketNames || []
            } : null);
          }
          setLeaderboard(lb);
        }).catch(err => {
          console.error("Background data load error:", err);
        });

      } else {
        console.log("🔓 No user logged in");
        // Clear all user state on logout
        setUser(null);
        setLeaderboard([]);
        setGameState(GameState.LOGIN);
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- Handle Stripe payment success/cancelled URL params ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');

    if (paymentStatus === 'success') {
      console.log('💳 Payment successful! Refreshing user data...');
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);

      // Refresh user data to get updated credits
      const uid = user?.uid || getStoredUid();
      if (uid) {
        loadUserData(uid).then(userData => {
          if (userData) {
            setUser(prev => prev ? {
              ...prev,
              credits: userData.credits || 0
            } : null);
          }
        });
      }
    } else if (paymentStatus === 'cancelled') {
      console.log('💳 Payment cancelled - returning to title screen');
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      // Return to title screen
      setGameState(GameState.TITLE);
    }
  }, [user?.uid]);


  // --- Logic ---

  const triggerVisualAction = (
    type: 'ROTATE' | 'DROP' | 'MOVE' | 'LOCK',
    payload?: {
      x?: number;
      y?: number;
      tetromino?: TetrominoType;
      rotation?: number;
    }
  ) => {
    setLastAction({ type, id: Date.now(), payload });
  };

  const checkCollision = (
    pos: { x: number; y: number },
    matrix: number[][],
    board: (string | number)[][]
  ) => {
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        if (matrix[y][x] !== 0) {
          const boardX = pos.x + x;
          const boardY = pos.y + y;
          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) return true;
          if (boardY >= 0 && board[boardY][boardX] !== 0) return true;
        }
      }
    }
    return false;
  };

  const lockPiece = () => {
    const piece = activePieceRef.current;
    if (!piece) return;

    const matrix = getShapeMatrix(piece.tetromino, piece.rotation);
    // Create a working copy of the grid
    const tempGrid = gridRef.current.map(row => [...row]);

    let gameOver = false;
    matrix.forEach((row, dy) => {
      row.forEach((val, dx) => {
        if (val !== 0) {
          const y = piece.pos.y + dy;
          const x = piece.pos.x + dx;
          if (y < 0) {
            gameOver = true;
          } else {
            tempGrid[y][x] = piece.tetromino;
          }
        }
      });
    });

    if (gameOver) {
      handleGameOver();
      return;
    }

    triggerVisualAction('LOCK', {
      x: piece.pos.x,
      y: piece.pos.y,
      tetromino: piece.tetromino,
      rotation: piece.rotation
    });

    // === GHOST PENALTY SYSTEM ===
    // Apply penalty if ghost is enabled
    if (ghostEnabledRef.current) {
      const currentLevel = statsRef.current.level;
      const penalty = getGhostPenalty(currentLevel);

      if (penalty > 0) {
        // Apply penalty to score
        const currentStats = statsRef.current;
        const newScore = Math.max(0, currentStats.score - penalty);

        setStats({
          ...currentStats,
          score: newScore,
          bonusTickets: calculateBonusTickets(newScore)
        });

        // Trigger floating penalty animation
        const penaltyAnim: PenaltyAnimation = {
          id: Date.now(),
          penalty: penalty,
          timestamp: Date.now()
        };
        setPenaltyAnimations(prev => [...prev, penaltyAnim]);

        // Remove animation after 2 seconds
        setTimeout(() => {
          setPenaltyAnimations(prev => prev.filter(p => p.id !== penaltyAnim.id));
        }, 2000);

        console.log(`👻 Ghost Penalty: -${penalty} points (Level ${currentLevel})`);
      }
    }

    // 1. Identify Full Lines
    const linesToClear: number[] = [];
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (tempGrid[y].every(cell => cell !== 0)) {
        linesToClear.push(y);
      }
    }

    // Update grid immediately with the locked piece so it draws before explosion
    setGrid(tempGrid);
    setActivePiece(null); // Remove active piece immediately

    // 2. If lines need clearing, trigger animation phase
    if (linesToClear.length > 0) {
      const isTetris = linesToClear.length >= 4;
      const animationDelay = isTetris ? 1000 : 500;

      setClearingLines(linesToClear);

      // Wait for explosion animation before processing score and shift
      setTimeout(() => {
        processClearedLines(tempGrid, linesToClear);
      }, animationDelay);
    } else {
      spawnPiece();
    }
  };

  const processClearedLines = (currentGrid: (string | number)[][], linesToClear: number[]) => {
    // Remove lines
    const newGrid = currentGrid.filter((_, index) => !linesToClear.includes(index));
    // Add new empty lines at top
    while (newGrid.length < BOARD_HEIGHT) {
      newGrid.unshift(Array(BOARD_WIDTH).fill(0));
    }

    setGrid(newGrid);
    setClearingLines([]); // End animation state

    // Calculate Score
    const linesCleared = linesToClear.length;
    const linePoints = [0, 100, 300, 500, 800]; // Tetris is index 4 -> 800
    const currentStats = statsRef.current;
    const levelMultiplier = currentStats.level;
    const points = linePoints[linesCleared] * levelMultiplier;

    const newLines = currentStats.lines + linesCleared;
    const newLevel = Math.min(10, Math.floor(newLines / 10) + 1); // Cap at level 10

    const leveledUp = newLevel > currentStats.level;

    const nextScore = currentStats.score + points;
    const nextTickets = calculateBonusTickets(nextScore);

    console.log(`[processClearedLines] Score: ${nextScore}, Tickets: ${nextTickets}`);

    // Update stats (score persists across levels)
    setStats({
      ...currentStats,
      score: nextScore,
      lines: newLines,
      level: newLevel,
      bonusTickets: nextTickets
    });

    // Update gravity for new level
    dropIntervalRef.current = getGravityForLevel(newLevel);

    // Update ghost allowed state based on level (but keep it OFF - user must enable)
    // Ghost is allowed for levels 1-2 and 7-10, forbidden for 3-6
    if (!isGhostAllowedForLevel(newLevel)) {
      setGhostEnabled(false); // Force disable for forbidden levels
    }
    // Note: We don't auto-enable ghost for allowed levels - user must choose

    if (leveledUp) {
      // Level up! Show level-up screen and reset board
      setGrid(Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)));
      setActivePiece(null);
      setGameState(GameState.LEVEL_UP);
      // Don't spawn piece yet - wait for user to click continue
    } else {
      // Normal progression - spawn next piece
      spawnPiece();
    }
  };

  const getRandomType = () => TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];

  const spawnPiece = () => {
    // If we are in game over state (can happen during async timeout), stop.
    if (gameStateRef.current === GameState.GAME_OVER) return;

    const typeToSpawn = nextPieceRef.current || getRandomType();
    const newNextType = getRandomType();
    setNextPiece(newNextType);

    const piece = {
      pos: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: -2 },
      tetromino: typeToSpawn,
      rotation: 0
    };

    const matrix = getShapeMatrix(typeToSpawn, 0);
    if (checkCollision(piece.pos, matrix, gridRef.current)) {
      handleGameOver();
      return;
    }

    setActivePiece(piece);
    dropCounterRef.current = 0;
  };

  const handleGameOver = async () => {
    // IMMEDIATELY capture final score before ANY state changes
    const finalScore = statsRef.current.score;

    // DEBUG: Log captured score at the very start
    console.log(`🎮 handleGameOver - Captured final score: ${finalScore}`);

    setGameState(GameState.GAME_OVER);
    setIsPaused(false);
    setClearingLines([]);

    // Safety: If score is 0, this was likely an immediate collision on game start
    // Don't persist a 0-score game
    if (finalScore === 0) {
      console.warn("⚠️ Score is 0 - skipping persistence (likely immediate collision)");
      return;
    }

    // Calculate bonus tickets based on captured score
    let tickets = 0;
    if (finalScore >= BONUS_TICKET_THRESHOLDS.TIER_3) tickets = 5;
    else if (finalScore >= BONUS_TICKET_THRESHOLDS.TIER_2) tickets = 2;
    else if (finalScore >= BONUS_TICKET_THRESHOLDS.TIER_1) tickets = 1;

    console.log(`🎮 Game Over! Score: ${finalScore}, Bonus Tickets Earned: ${tickets}`);

    // Update local stats first so UI can show it
    setStats(prev => ({ ...prev, bonusTickets: tickets }));

    // Only persist if user is authenticated
    // Use getStoredUid() as fallback in case auth.currentUser is null at game end
    const effectiveUid = user?.uid || getStoredUid();
    if (!effectiveUid) {
      console.error("[AUTH] No UID available at game end - neither user.uid nor stored UID");
      return;
    }

    // [AUTH UID] Log the authenticated UID once per game end
    console.log('[AUTH UID] effectiveUid=', effectiveUid, 'user.uid=', user?.uid, 'storedUid=', getStoredUid());

    // Update user state optimistically for UI
    setUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tickets: (prev.tickets || 0) + tickets,
        highscore: Math.max(prev.highscore || 0, finalScore)
      };
    });

    // [GAME OVER → submitScore] Pass uid explicitly from stored value
    console.log('[GAME OVER → submitScore]', { uid: effectiveUid, finalScore, bonusTickets: tickets });

    // Submit game result to Firestore (displayName derived from auth internally)
    const result = await submitGameResult(
      finalScore,
      tickets,
      effectiveUid
    );

    // Update user with issued ticket IDs
    if (result.ticketsIssued.length > 0) {
      setUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          ticketNames: [...(prev.ticketNames || []), ...result.ticketsIssued]
        };
      });
    }

    // === DEDUCT ONE CREDIT AFTER GAME ENDS (BEFORE REFRESH) ===
    console.log('[GAME OVER] Deducting 1 credit from user', effectiveUid);
    const creditDeducted = await deductCredit(effectiveUid);
    if (creditDeducted) {
      console.log('[GAME OVER] Credit deducted successfully');
    } else {
      console.error('[GAME OVER] Failed to deduct credit');
    }

    // Refresh Leaderboard from Firestore
    const newLeaderboard = await getLeaderboard();
    console.log('[Dashboard] Refreshed leaderboard:', newLeaderboard.length, 'entries');
    setLeaderboard(newLeaderboard);

    // Refresh user data from Firestore to ensure dashboard shows Firestore truth
    // This now includes the deducted credit
    const refreshedUserData = await loadUserData(effectiveUid);
    if (refreshedUserData) {
      console.log('[Dashboard] Refreshed user data from Firestore:', refreshedUserData);
      setUser(prev => prev ? {
        ...prev,
        highscore: refreshedUserData.highscore,
        tickets: refreshedUserData.tickets,
        ticketNames: refreshedUserData.ticketNames,
        credits: refreshedUserData.credits
      } : null);
    }

    // Check if new high (simple check against top scores)
    const madeTop = newLeaderboard.some(entry => entry.highscore <= finalScore);
    setIsNewHigh(madeTop);
  };

  const movePiece = (dir: { x: number; y: number }) => {
    // Prevent movement during line clear animation
    if (clearingLinesRef.current.length > 0) return false;
    if (!activePieceRef.current || gameStateRef.current !== GameState.PLAYING || isPausedRef.current) return false;

    const piece = activePieceRef.current;
    const matrix = getShapeMatrix(piece.tetromino, piece.rotation);

    if (!checkCollision({ x: piece.pos.x + dir.x, y: piece.pos.y + dir.y }, matrix, gridRef.current)) {
      setActivePiece({ ...piece, pos: { x: piece.pos.x + dir.x, y: piece.pos.y + dir.y } });
      triggerVisualAction('MOVE');
      return true;
    }
    return false;
  };

  const rotatePiece = () => {
    if (clearingLinesRef.current.length > 0) return;
    if (!activePieceRef.current || gameStateRef.current !== GameState.PLAYING || isPausedRef.current) return;

    const piece = activePieceRef.current;
    const newRotation = (piece.rotation + 1) % 4;
    const matrix = getShapeMatrix(piece.tetromino, newRotation);

    const kicks = [0, -1, 1, -2, 2];
    for (let kick of kicks) {
      if (!checkCollision({ x: piece.pos.x + kick, y: piece.pos.y }, matrix, gridRef.current)) {
        setActivePiece({ ...piece, pos: { x: piece.pos.x + kick, y: piece.pos.y }, rotation: newRotation });
        triggerVisualAction('ROTATE');
        return;
      }
    }
  };

  const drop = () => {
    if (isPausedRef.current) return;
    // Don't drop if we are animating lines
    if (clearingLinesRef.current.length > 0) return;

    if (!movePiece({ x: 0, y: 1 })) {
      lockPiece();
    } else {
      dropCounterRef.current = 0;
    }
  };

  const fastDrop = () => {
    if (isPausedRef.current || clearingLinesRef.current.length > 0) return;
    drop();
    triggerVisualAction('DROP');
  };

  // --- Touch Controls ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameStateRef.current !== GameState.PLAYING || isPausedRef.current) return;
    const touch = e.touches[0];
    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      startTime: Date.now(),
      isMoving: true
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current.isMoving || gameStateRef.current !== GameState.PLAYING || isPausedRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchRef.current.lastX;
    const deltaY = touch.clientY - touchRef.current.lastY;

    // Horizontal Move (Threshold 20px)
    if (Math.abs(deltaX) > 20) {
      if (deltaX > 0) movePiece({ x: 1, y: 0 });
      else movePiece({ x: -1, y: 0 });
      touchRef.current.lastX = touch.clientX;
    }

    // Soft Drop (Threshold 30px)
    if (deltaY > 30) {
      drop();
      touchRef.current.lastY = touch.clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current.isMoving) return;
    touchRef.current.isMoving = false;

    const duration = Date.now() - touchRef.current.startTime;
    const totalDeltaX = Math.abs(e.changedTouches[0].clientX - touchRef.current.startX);
    const totalDeltaY = Math.abs(e.changedTouches[0].clientY - touchRef.current.startY);

    // Tap to Rotate (Short duration, minimal movement)
    if (duration < 300 && totalDeltaX < 10 && totalDeltaY < 10) {
      rotatePiece();
    }
  };

  // --- Game Loop ---
  useEffect(() => {
    const loop = (time: number) => {
      if (gameStateRef.current === GameState.PLAYING && !isPausedRef.current && clearingLinesRef.current.length === 0) {
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;
        dropCounterRef.current += deltaTime;
        if (dropCounterRef.current > dropIntervalRef.current) {
          drop();
          dropCounterRef.current = 0;
        }
      } else {
        lastTimeRef.current = time;
      }
      requestAnimationFrame(loop);
    };
    const reqId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqId);
  }, []);

  // --- Input ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      // F12: Toggle Debug Panel visibility
      if (e.key === 'F12') {
        e.preventDefault();
        setShowDebugPanel(prev => !prev);
        return;
      }

      // === DEBUG MODE: Keyboard Shortcuts ===
      // Only in PLAYING state
      if (gameStateRef.current === GameState.PLAYING) {
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;

        // Ctrl/Cmd + L: Skip to next level (add 10 lines)
        if (isCtrlOrCmd && e.key === 'l') {
          e.preventDefault();
          const currentStats = statsRef.current;
          const linesToAdd = 10 - (currentStats.lines % 10); // Lines needed to reach next level
          const newLines = currentStats.lines + linesToAdd;
          const newLevel = Math.min(10, Math.floor(newLines / 10) + 1);

          console.log(`🎮 DEBUG: Skipping to Level ${newLevel}`);

          setStats({
            ...currentStats,
            lines: newLines,
            level: newLevel
          });

          dropIntervalRef.current = getGravityForLevel(newLevel);
          setGhostEnabled(newLevel <= 2);

          // Show level-up screen
          setGrid(Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)));
          setActivePiece(null);
          setGameState(GameState.LEVEL_UP);
          return;
        }

        // Ctrl/Cmd + 1-9,0: Jump to specific level
        if (isCtrlOrCmd && /^[0-9]$/.test(e.key)) {
          e.preventDefault();
          const targetLevel = e.key === '0' ? 10 : parseInt(e.key);
          const linesNeeded = (targetLevel - 1) * 10;

          console.log(`🎮 DEBUG: Jumping to Level ${targetLevel}`);

          setStats({
            ...statsRef.current,
            lines: linesNeeded,
            level: targetLevel
          });

          dropIntervalRef.current = getGravityForLevel(targetLevel);
          setGhostEnabled(targetLevel <= 2);

          // Show level-up screen
          setGrid(Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)));
          setActivePiece(null);
          setGameState(GameState.LEVEL_UP);
          return;
        }

        // Ctrl/Cmd + G: Toggle ghost (for testing)
        if (isCtrlOrCmd && e.key === 'g') {
          e.preventDefault();
          setGhostEnabled(!ghostEnabled);
          console.log(`🎮 DEBUG: Ghost ${!ghostEnabled ? 'enabled' : 'disabled'}`);
          return;
        }


      }

      if (gameStateRef.current !== GameState.PLAYING || isPausedRef.current) return;

      if (e.key === 'ArrowLeft') movePiece({ x: -1, y: 0 });
      if (e.key === 'ArrowRight') movePiece({ x: 1, y: 0 });
      if (e.key === 'ArrowDown') fastDrop();
      if (e.key === 'ArrowUp') rotatePiece();
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ghostEnabled]); // Add ghostEnabled to dependencies

  // Automatic Background Interaction (Dragon Flyby)
  useEffect(() => {
    const interval = setInterval(() => {
      if (backgroundRef.current) {
        backgroundRef.current.triggerDragon();
      }
    }, 60000); // Every 60 seconds (more frequent than plow)
    return () => clearInterval(interval);
  }, []);

  // --- Flow ---
  const handleStartClick = async () => {
    startGame();
  };


  const startGame = async () => {

    // Play retro credit sound here if feasible
    // const audio = new Audio('/sounds/coin.mp3'); audio.play();

    setGrid(Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)));
    setStats({ score: 0, lines: 0, level: 1, bonusTickets: 0 });
    statsRef.current = { score: 0, lines: 0, level: 1, bonusTickets: 0 };

    dropIntervalRef.current = getGravityForLevel(1); // Use gravity function
    setGhostEnabled(false); // Ghost starts OFF - user must enable manually
    setGameState(GameState.PLAYING);
    setIsPaused(false);
    setShowLeaderboard(false);
    setClearingLines([]);

    const firstPieceType = getRandomType();
    const nextPieceType = getRandomType();

    setNextPiece(nextPieceType);
    nextPieceRef.current = nextPieceType;

    const piece = {
      pos: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: -2 },
      tetromino: firstPieceType,
      rotation: 0
    };

    const matrix = getShapeMatrix(firstPieceType, 0);
    if (checkCollision(piece.pos, matrix, Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)))) {
      handleGameOver();
      return;
    }

    setActivePiece(piece);
    dropCounterRef.current = 0;
  };

  const handleExitClick = () => {
    setIsPaused(true);
    setShowLeaderboard(true);
  };

  const handleResume = () => {
    setIsPaused(false);
    setShowLeaderboard(false);
  };

  const handleQuitGame = () => {
    setGameState(GameState.TITLE);
    setIsPaused(false);
    setShowLeaderboard(false);
  };

  const handleLevelUpContinue = () => {
    // Resume game after level-up, spawn new piece
    setGameState(GameState.PLAYING);
    spawnPiece();
  };


  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-transparent overflow-hidden touch-none overscroll-none select-none">

      {/* Background Ambience */}
      <ChinaBackground ref={backgroundRef} />

      {/* Credit and Dashboard screens are removed */}

      {/* Close Button - Top-left on mobile, top-right on desktop */}
      {gameState === GameState.PLAYING && (
        <button
          onClick={handleExitClick}
          className="fixed top-2 left-2 md:top-3 md:right-3 md:left-auto z-[9999] group hover:scale-110 transition-transform"
          title="Verlaten / Pauze"
        >
          <div className="relative w-10 h-10 md:w-16 md:h-16">
            <div className="absolute inset-0 text-3xl md:text-5xl drop-shadow-md">🐉</div>
            <div className="absolute bottom-0 right-0 bg-red-600 text-white rounded-full w-4 h-4 md:w-6 md:h-6 flex items-center justify-center text-[8px] md:text-xs font-bold border border-white shadow-lg animate-pulse-fast">
              ✕
            </div>
          </div>
        </button>
      )}

      {/* Auth Loading Screen */}
      {isAuthLoading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🐲</div>
            <h2 className="text-yellow-400 text-xl font-bold uppercase tracking-widest animate-pulse">
              Laden...
            </h2>
          </div>
        </div>
      )}

      {/* Login Screen */}
      {!isAuthLoading && gameState === GameState.LOGIN && (
        <LoginScreen
          onLoginSuccess={() => {
            // Auth state listener will handle the redirect
          }}
          onGoToRegister={() => setGameState(GameState.REGISTRATION)}
        />
      )}

      {/* Registration Screen */}
      {!isAuthLoading && gameState === GameState.REGISTRATION && (
        <RegistrationScreen
          onRegisterSuccess={() => {
            // Auth state listener will handle the redirect
          }}
          onGoToLogin={() => setGameState(GameState.LOGIN)}
        />
      )}

      {/* Leaderboard / Pause Modal */}
      {user && (
        <LeaderboardModal
          isOpen={showLeaderboard}
          user={user}
          currentScore={stats.score}
          leaderboard={leaderboard}
          onResume={handleResume}
          onQuit={handleQuitGame}
        />
      )}

      {!isAuthLoading && gameState === GameState.TITLE && (
        <TitleScreen
          onStart={handleStartClick}
          onLogout={signOut}
          onOpenCreditShop={() => setGameState(GameState.CREDIT_SHOP)}
          leaderboard={leaderboard}
          user={user}
        />
      )}

      {/* Credit Shop */}
      {gameState === GameState.CREDIT_SHOP && (
        <CreditShop
          user={user}
          onClose={() => setGameState(GameState.TITLE)}
          onPurchaseSuccess={async () => {
            // Refresh user data after successful purchase
            if (user?.uid) {
              const userData = await loadUserData(user.uid);
              if (userData) {
                setUser(prev => prev ? { ...prev, credits: userData.credits } : null);
              }
            }
            setGameState(GameState.TITLE);
          }}
        />
      )}


      {gameState === GameState.LEVEL_UP && (
        <LevelUpScreen
          level={stats.level}
          onContinue={handleLevelUpContinue}
        />
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER) && (
        <div className="flex flex-col w-full h-full max-w-[1200px] mx-auto px-2 md:px-4 py-1 md:py-2 overflow-hidden animate-fade-in-up">

          {/* Main Game Container - CSS Grid for desktop, flex for mobile */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_auto] items-center justify-center gap-2 md:gap-4 w-full touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >

            {/* GameBoard Section - Primary focus, takes available space */}
            <div className="flex flex-col items-center justify-center min-h-0 h-full w-full order-1 gap-1 md:gap-2">

              {/* Compact Header - Same width as GameBoard */}
              <div className="flex-none relative group overflow-hidden rounded-lg md:rounded-xl p-[1px] w-full max-w-[95vw] md:max-w-none shadow-[0_0_10px_rgba(239,68,68,0.15)]">
                <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#ef4444_20%,#ffffff_25%,#ef4444_30%,#b91c1c_50%,#ef4444_70%,#ffffff_75%,#ef4444_80%,#b91c1c_100%)] animate-spin-slow opacity-50"></div>
                <div className="relative w-full h-full bg-black/60 backdrop-blur-xl rounded-[calc(0.5rem-1px)] md:rounded-[calc(0.75rem-2px)] p-1.5 md:p-2 flex items-center">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col">
                      <div className="text-[9px] md:text-xs uppercase tracking-widest text-gray-400">
                        Speler: <span className="text-white font-bold">{user?.name}</span>
                      </div>
                      <div className="text-[9px] md:text-xs uppercase tracking-widest text-gray-400">
                        Top: <span className="text-yellow-400 font-bold">{leaderboard[0]?.highscore?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* GameBoard - Maximized viewport usage */}
              <div className="flex-1 w-full flex items-center justify-center min-h-0 max-h-[85vh]">
                <GameBoard
                  grid={grid}
                  activePiece={activePiece}
                  lastAction={lastAction}
                  clearingLines={clearingLines}
                  ghostEnabled={ghostEnabled}
                  penaltyAnimations={penaltyAnimations}
                  level={stats.level}
                />
              </div>
            </div>

            {/* HUD - Right side on desktop, below on mobile */}
            <div className="flex-none w-full md:w-auto h-auto md:h-full flex items-center justify-center md:items-start order-2 md:self-start md:pt-8">
              <HUD
                stats={stats}
                nextPiece={nextPiece}
                ghostEnabled={ghostEnabled}
                onToggleGhost={() => {
                  if (isGhostAllowedForLevel(stats.level)) {
                    setGhostEnabled(!ghostEnabled);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {gameState === GameState.GAME_OVER && user && (
        <GameOverScreen
          stats={stats}
          user={user}
          onRestart={startGame}
          onStop={() => setGameState(GameState.TITLE)}
          isNewHigh={isNewHigh}
          leaderboard={leaderboard}
        />
      )}

      {/* Debug Panel - Only visible during gameplay, toggle with F12 */}
      {gameState === GameState.PLAYING && (
        <DebugPanel currentLevel={stats.level} visible={showDebugPanel} />
      )}
    </div>
  );
};

export default App;