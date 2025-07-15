import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Renderer } from '../src/rendering/Renderer';
import { WorldGrid, TileData } from '../src/utils/types';
import { GAME_CONFIG } from '../src/utils/constants';

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
  style: {}
} as unknown as HTMLCanvasElement;

describe('Renderer', () => {
  let renderer: Renderer;

  beforeEach(() => {
    vi.clearAllMocks();
    renderer = new Renderer(mockCanvas);
  });

  describe('initialization', () => {
    it('should initialize with canvas and context', () => {
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(renderer).toBeDefined();
    });

    it('should throw error if context is not available', () => {
      const badCanvas = {
        getContext: vi.fn(() => null)
      } as unknown as HTMLCanvasElement;

      expect(() => new Renderer(badCanvas)).toThrow('Failed to get 2D rendering context');
    });

    it('should initialize default layers', () => {
      // Test that layers are properly initialized by checking if we can add objects to them
      renderer.addToRenderQueue({
        position: { x: 0, y: 0 },
        size: { width: 32, height: 32 },
        color: '#ff0000',
        layer: 'terrain'
      });

      // Should not throw error
      expect(() => renderer.render()).not.toThrow();
    });
  });

  describe('layer management', () => {
    it('should add new layers', () => {
      renderer.addLayer('test-layer', 25, true);
      
      // Should be able to add objects to the new layer
      renderer.addToRenderQueue({
        position: { x: 0, y: 0 },
        size: { width: 32, height: 32 },
        color: '#00ff00',
        layer: 'test-layer'
      });

      expect(() => renderer.render()).not.toThrow();
    });

    it('should remove layers', () => {
      renderer.addLayer('temp-layer', 15);
      renderer.removeLayer('temp-layer');
      
      // Adding to removed layer should not cause issues
      renderer.addToRenderQueue({
        position: { x: 0, y: 0 },
        size: { width: 32, height: 32 },
        color: '#0000ff',
        layer: 'temp-layer'
      });

      expect(() => renderer.render()).not.toThrow();
    });

    it('should set layer visibility', () => {
      renderer.setLayerVisible('terrain', false);
      
      // Should still render without errors
      expect(() => renderer.render()).not.toThrow();
    });
  });

  describe('sprite loading', () => {
    it('should load sprites successfully', async () => {
      // Mock Image constructor
      const mockImage = {
        width: 64,
        height: 64,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: ''
      };

      global.Image = vi.fn(() => mockImage) as any;

      const loadPromise = renderer.loadSprite('test-sprite', 'test.png');
      
      // Simulate successful load
      if (mockImage.onload) {
        mockImage.onload();
      }

      await expect(loadPromise).resolves.toBeUndefined();
      
      const sprite = renderer.getSprite('test-sprite');
      expect(sprite).toBeDefined();
      expect(sprite?.width).toBe(64);
      expect(sprite?.height).toBe(64);
    });

    it('should handle sprite loading errors', async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: ''
      };

      global.Image = vi.fn(() => mockImage) as any;

      const loadPromise = renderer.loadSprite('bad-sprite', 'nonexistent.png');
      
      // Simulate load error
      if (mockImage.onerror) {
        mockImage.onerror();
      }

      await expect(loadPromise).rejects.toThrow('Failed to load sprite: nonexistent.png');
    });

    it('should load animated sprites with frames', async () => {
      const mockImage = {
        width: 192, // 3 frames of 64px each
        height: 64,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: ''
      };

      global.Image = vi.fn(() => mockImage) as any;

      const loadPromise = renderer.loadSprite('animated-sprite', 'animation.png', 3);
      
      if (mockImage.onload) {
        mockImage.onload();
      }

      await loadPromise;
      
      const sprite = renderer.getSprite('animated-sprite');
      expect(sprite?.frames).toBe(3);
      expect(sprite?.frameWidth).toBe(64);
      expect(sprite?.frameHeight).toBe(64);
    });
  });

  describe('render queue', () => {
    it('should add objects to render queue', () => {
      const renderObject = {
        position: { x: 100, y: 100 },
        size: { width: 32, height: 32 },
        color: '#ff0000',
        layer: 'entities'
      };

      renderer.addToRenderQueue(renderObject);
      
      // Should render without errors
      expect(() => renderer.render()).not.toThrow();
    });

    it('should clear render queue after rendering', () => {
      renderer.addToRenderQueue({
        position: { x: 0, y: 0 },
        size: { width: 32, height: 32 },
        color: '#00ff00',
        layer: 'terrain'
      });

      renderer.render();
      
      // Queue should be cleared, so second render should have no objects
      renderer.render();
      
      // Should still work without errors
      expect(() => renderer.render()).not.toThrow();
    });
  });

  describe('world grid rendering', () => {
    it('should render world grid tiles', () => {
      const worldGrid: WorldGrid = {
        width: 3,
        height: 3,
        tiles: []
      };

      // Create a small 3x3 grid
      for (let y = 0; y < 3; y++) {
        const row: TileData[] = [];
        for (let x = 0; x < 3; x++) {
          row.push({
            type: 'grass',
            occupiedBy: null,
            walkable: true,
            buildable: true
          });
        }
        worldGrid.tiles.push(row);
      }

      renderer.renderWorldGrid(worldGrid);
      renderer.render();

      // Should have called rendering methods
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should handle different tile types', () => {
      const worldGrid: WorldGrid = {
        width: 2,
        height: 2,
        tiles: [
          [
            { type: 'grass', occupiedBy: null, walkable: true, buildable: true },
            { type: 'path', occupiedBy: null, walkable: true, buildable: false }
          ],
          [
            { type: 'water', occupiedBy: null, walkable: false, buildable: false },
            { type: 'building', occupiedBy: null, walkable: false, buildable: false }
          ]
        ]
      };

      renderer.renderWorldGrid(worldGrid);
      renderer.render();

      expect(() => renderer.render()).not.toThrow();
    });
  });

  describe('rendering', () => {
    it('should render all layers in correct order', () => {
      // Add objects to different layers
      renderer.addToRenderQueue({
        position: { x: 0, y: 0 },
        size: { width: 32, height: 32 },
        color: '#ff0000',
        layer: 'background'
      });

      renderer.addToRenderQueue({
        position: { x: 32, y: 32 },
        size: { width: 32, height: 32 },
        color: '#00ff00',
        layer: 'entities'
      });

      renderer.render();

      // Should have applied camera transformations
      expect(mockContext.translate).toHaveBeenCalled();
      expect(mockContext.scale).toHaveBeenCalled();
      expect(mockContext.clearRect).toHaveBeenCalled();
    });

    it('should handle objects with transformations', () => {
      renderer.addToRenderQueue({
        position: { x: 100, y: 100 },
        size: { width: 32, height: 32 },
        color: '#0000ff',
        layer: 'entities',
        rotation: Math.PI / 4,
        alpha: 0.5
      });

      renderer.render();

      expect(mockContext.rotate).toHaveBeenCalledWith(Math.PI / 4);
    });
  });

  describe('update', () => {
    it('should update camera', () => {
      const camera = renderer.getCamera();
      const initialPosition = camera.getPosition();
      
      camera.setPosition(initialPosition.x + 100, initialPosition.y + 100);
      renderer.update(0.016);
      
      // Camera should have moved towards target
      const newPosition = camera.getPosition();
      expect(newPosition.x).not.toBe(initialPosition.x);
      expect(newPosition.y).not.toBe(initialPosition.y);
    });
  });

  describe('resize', () => {
    it('should handle canvas resize', () => {
      renderer.resize(1024, 768);
      
      const canvasSize = renderer.getCanvasSize();
      expect(canvasSize.width).toBe(1024);
      expect(canvasSize.height).toBe(768);
    });
  });
});