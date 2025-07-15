import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Game } from '../src/Game';

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
});

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRequestAnimationFrame = vi.fn();
const mockCancelAnimationFrame = vi.fn();
Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true
});
Object.defineProperty(global, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame,
  writable: true
});

describe('Game Time Management', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
  });

  afterEach(() => {
    if (game.getIsRunning()) {
      game.stop();
    }
  });

  describe('Game Loop', () => {
    it('should start the game loop with requestAnimationFrame', () => {
      mockRequestAnimationFrame.mockImplementation((callback) => {
        setTimeout(callback, 16); // Simulate 60fps
        return 1;
      });

      game.start();

      expect(game.getIsRunning()).toBe(true);
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('should stop the game loop and cancel animation frame', () => {
      mockRequestAnimationFrame.mockReturnValue(123);
      
      game.start();
      game.stop();

      expect(game.getIsRunning()).toBe(false);
      expect(mockCancelAnimationFrame).toHaveBeenCalledWith(123);
    });

    it('should update game time based on delta time', async () => {
      let frameCallback: (() => void) | null = null;
      mockRequestAnimationFrame.mockImplementation((callback) => {
        frameCallback = callback;
        return 1;
      });

      // Start at time 0
      mockPerformanceNow.mockReturnValue(0);
      game.start();

      // Simulate 1 second passing
      mockPerformanceNow.mockReturnValue(1000);
      if (frameCallback) {
        frameCallback();
      }

      expect(game.getCurrentTime()).toBeCloseTo(1.0, 2);
    });
  });

  describe('Pause/Resume Functionality', () => {
    it('should initialize with game not paused', () => {
      expect(game.isPaused()).toBe(false);
    });

    it('should toggle pause state', () => {
      game.togglePause();
      expect(game.isPaused()).toBe(true);

      game.togglePause();
      expect(game.isPaused()).toBe(false);
    });

    it('should pause the game', () => {
      game.pause();
      expect(game.isPaused()).toBe(true);
    });

    it('should resume the game', () => {
      game.pause();
      game.resume();
      expect(game.isPaused()).toBe(false);
    });

    it('should not update game time when paused', async () => {
      let frameCallback: (() => void) | null = null;
      mockRequestAnimationFrame.mockImplementation((callback) => {
        frameCallback = callback;
        return 1;
      });

      mockPerformanceNow.mockReturnValue(0);
      game.start();
      game.pause();

      const initialTime = game.getCurrentTime();

      // Simulate time passing while paused
      mockPerformanceNow.mockReturnValue(1000);
      if (frameCallback) {
        frameCallback();
      }

      expect(game.getCurrentTime()).toBe(initialTime);
    });
  });

  describe('Time Scale Functionality', () => {
    it('should initialize with time scale of 1.0', () => {
      expect(game.getTimeScale()).toBe(1.0);
    });

    it('should set time scale correctly', () => {
      game.setTimeScale(2.0);
      expect(game.getTimeScale()).toBe(2.0);

      game.setTimeScale(0.5);
      expect(game.getTimeScale()).toBe(0.5);
    });

    it('should throw error for negative time scale', () => {
      expect(() => game.setTimeScale(-1.0)).toThrow('Time scale cannot be negative');
    });

    it('should allow zero time scale (pause-like behavior)', () => {
      expect(() => game.setTimeScale(0)).not.toThrow();
      expect(game.getTimeScale()).toBe(0);
    });

    it('should apply time scale to game time updates', async () => {
      let frameCallback: (() => void) | null = null;
      mockRequestAnimationFrame.mockImplementation((callback) => {
        frameCallback = callback;
        return 1;
      });

      game.setTimeScale(2.0);
      
      mockPerformanceNow.mockReturnValue(0);
      game.start();

      // Simulate 1 second of real time passing
      mockPerformanceNow.mockReturnValue(1000);
      if (frameCallback) {
        frameCallback();
      }

      // Game time should be 2 seconds due to 2x time scale
      expect(game.getCurrentTime()).toBeCloseTo(2.0, 2);
    });

    it('should handle fractional time scales', async () => {
      let frameCallback: (() => void) | null = null;
      mockRequestAnimationFrame.mockImplementation((callback) => {
        frameCallback = callback;
        return 1;
      });

      game.setTimeScale(0.5);
      
      mockPerformanceNow.mockReturnValue(0);
      game.start();

      // Simulate 1 second of real time passing
      mockPerformanceNow.mockReturnValue(1000);
      if (frameCallback) {
        frameCallback();
      }

      // Game time should be 0.5 seconds due to 0.5x time scale
      expect(game.getCurrentTime()).toBeCloseTo(0.5, 2);
    });
  });

  describe('Time Management Utilities', () => {
    it('should reset game time to zero', () => {
      // Manually set some time
      game['gameState'].currentTime = 100;
      
      game.resetTime();
      expect(game.getCurrentTime()).toBe(0);
    });

    it('should return current game time', () => {
      // Manually set time for testing
      game['gameState'].currentTime = 42.5;
      
      expect(game.getCurrentTime()).toBe(42.5);
    });

    it('should track running state correctly', () => {
      expect(game.getIsRunning()).toBe(false);
      
      game.start();
      expect(game.getIsRunning()).toBe(true);
      
      game.stop();
      expect(game.getIsRunning()).toBe(false);
    });
  });

  describe('Game State Integration', () => {
    it('should sync time scale with game settings', () => {
      game.setTimeScale(3.0);
      
      const gameState = game.getGameState();
      expect(gameState.timeScale).toBe(3.0);
      expect(gameState.gameSettings.timeScale).toBe(3.0);
    });

    it('should maintain pause state in game state', () => {
      game.pause();
      
      const gameState = game.getGameState();
      expect(gameState.isPaused).toBe(true);
    });

    it('should update current time in game state', async () => {
      let frameCallback: (() => void) | null = null;
      mockRequestAnimationFrame.mockImplementation((callback) => {
        frameCallback = callback;
        return 1;
      });

      mockPerformanceNow.mockReturnValue(0);
      game.start();

      mockPerformanceNow.mockReturnValue(500); // 0.5 seconds
      if (frameCallback) {
        frameCallback();
      }

      const gameState = game.getGameState();
      expect(gameState.currentTime).toBeCloseTo(0.5, 2);
    });
  });
});