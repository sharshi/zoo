import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../src/Game';

// Mock HTMLCanvasElement and CanvasRenderingContext2D
const mockContext = {
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  set fillStyle(value: string) {},
  set globalAlpha(value: number) {},
  set imageSmoothingEnabled(value: boolean) {},
  set textAlign(value: string) {},
  set textBaseline(value: string) {}
};

const mockCanvas = {
  width: 800,
  height: 600,
  getContext: vi.fn(() => mockContext),
  style: {},
  getBoundingClientRect: vi.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600
  })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
} as unknown as HTMLCanvasElement;

// Mock window and requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  writable: true
});

describe('Rendering Integration', () => {
  let game: Game;

  beforeEach(() => {
    vi.clearAllMocks();
    game = new Game();
  });

  afterEach(() => {
    game.destroy();
  });

  describe('renderer initialization', () => {
    it('should initialize renderer with canvas', () => {
      game.initializeRenderer(mockCanvas);
      
      const renderer = game.getRenderer();
      const inputHandler = game.getInputHandler();
      
      expect(renderer).toBeDefined();
      expect(inputHandler).toBeDefined();
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });

    it('should return null for renderer before initialization', () => {
      const renderer = game.getRenderer();
      const inputHandler = game.getInputHandler();
      
      expect(renderer).toBeNull();
      expect(inputHandler).toBeNull();
    });
  });

  describe('game loop with rendering', () => {
    it('should render during game loop', async () => {
      game.initializeRenderer(mockCanvas);
      
      // Start the game
      game.start();
      
      // Wait for at least one frame
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Stop the game
      game.stop();
      
      // Verify rendering methods were called
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should handle game loop without renderer', async () => {
      // Start game without initializing renderer
      game.start();
      
      // Wait for at least one frame
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Should not throw errors
      expect(() => game.stop()).not.toThrow();
    });
  });

  describe('camera integration', () => {
    it('should provide access to camera through renderer', () => {
      game.initializeRenderer(mockCanvas);
      
      const renderer = game.getRenderer();
      const camera = renderer?.getCamera();
      
      expect(camera).toBeDefined();
      expect(camera?.getZoom()).toBe(1.0);
    });

    it('should update camera during game updates', async () => {
      game.initializeRenderer(mockCanvas);
      
      const renderer = game.getRenderer();
      const camera = renderer?.getCamera();
      
      if (camera) {
        const initialPosition = camera.getPosition();
        camera.setPosition(initialPosition.x + 100, initialPosition.y + 100);
        
        // Start game to trigger updates
        game.start();
        
        // Wait for updates
        await new Promise(resolve => setTimeout(resolve, 50));
        
        game.stop();
        
        // Camera should have moved towards target
        const newPosition = camera.getPosition();
        expect(newPosition.x).not.toBe(initialPosition.x);
        expect(newPosition.y).not.toBe(initialPosition.y);
      }
    });
  });

  describe('world grid rendering', () => {
    it('should render world grid tiles', async () => {
      game.initializeRenderer(mockCanvas);
      
      // Start game to trigger rendering
      game.start();
      
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 20));
      
      game.stop();
      
      // Should have rendered the world grid
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });

  describe('input handling integration', () => {
    it('should handle input events', () => {
      game.initializeRenderer(mockCanvas);
      
      const inputHandler = game.getInputHandler();
      
      expect(inputHandler).toBeDefined();
      expect(mockCanvas.addEventListener).toHaveBeenCalled();
    });

    it('should clean up input handlers on destroy', () => {
      game.initializeRenderer(mockCanvas);
      
      game.destroy();
      
      // Should have cleaned up event listeners
      expect(mockCanvas.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('pause behavior with rendering', () => {
    it('should not update camera when paused', async () => {
      game.initializeRenderer(mockCanvas);
      
      const renderer = game.getRenderer();
      const camera = renderer?.getCamera();
      
      if (camera) {
        const initialPosition = camera.getPosition();
        camera.setPosition(initialPosition.x + 100, initialPosition.y + 100);
        
        // Pause the game
        game.pause();
        game.start();
        
        // Wait for potential updates
        await new Promise(resolve => setTimeout(resolve, 50));
        
        game.stop();
        
        // Camera should not have moved much since game was paused
        const newPosition = camera.getPosition();
        expect(Math.abs(newPosition.x - initialPosition.x)).toBeLessThan(10);
        expect(Math.abs(newPosition.y - initialPosition.y)).toBeLessThan(10);
      }
    });
  });
});