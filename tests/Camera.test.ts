import { describe, it, expect, beforeEach } from 'vitest';
import { Camera } from '../src/rendering/Camera';
import { GAME_CONFIG } from '../src/utils/constants';

describe('Camera', () => {
  let camera: Camera;
  const canvasWidth = 800;
  const canvasHeight = 600;

  beforeEach(() => {
    camera = new Camera(canvasWidth, canvasHeight);
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const position = camera.getPosition();
      const zoom = camera.getZoom();
      
      // Should start at center of world
      const expectedX = (GAME_CONFIG.WORLD_WIDTH * GAME_CONFIG.TILE_SIZE) / 2;
      const expectedY = (GAME_CONFIG.WORLD_HEIGHT * GAME_CONFIG.TILE_SIZE) / 2;
      
      expect(position.x).toBe(expectedX);
      expect(position.y).toBe(expectedY);
      expect(zoom).toBe(1.0);
    });

    it('should accept custom configuration', () => {
      const customCamera = new Camera(canvasWidth, canvasHeight, {
        minZoom: 0.5,
        maxZoom: 5.0,
        panSpeed: 1000
      });
      
      const config = customCamera.getConfig();
      expect(config.minZoom).toBe(0.5);
      expect(config.maxZoom).toBe(5.0);
      expect(config.panSpeed).toBe(1000);
    });
  });

  describe('panning', () => {
    it('should pan the camera by given offset', () => {
      const initialPosition = camera.getPosition();
      camera.pan(100, 50);
      
      const newPosition = camera.getTargetPosition();
      expect(newPosition.x).toBe(initialPosition.x + 100);
      expect(newPosition.y).toBe(initialPosition.y + 50);
    });

    it('should set position directly', () => {
      camera.setPosition(1000, 500);
      
      const position = camera.getTargetPosition();
      expect(position.x).toBe(1000);
      expect(position.y).toBe(500);
    });

    it('should clamp position to world boundaries', () => {
      // Try to move camera outside world bounds
      camera.setPosition(-1000, -1000);
      
      const position = camera.getTargetPosition();
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.y).toBeGreaterThanOrEqual(0);
    });
  });

  describe('zooming', () => {
    it('should zoom by factor', () => {
      const initialZoom = camera.getZoom();
      camera.zoomAt(2.0, canvasWidth / 2, canvasHeight / 2);
      
      const newZoom = camera.getTargetZoom();
      expect(newZoom).toBe(initialZoom * 2.0);
    });

    it('should set zoom level directly', () => {
      camera.setZoom(1.5);
      
      const zoom = camera.getTargetZoom();
      expect(zoom).toBe(1.5);
    });

    it('should clamp zoom to min/max values', () => {
      const config = camera.getConfig();
      
      // Test minimum zoom
      camera.setZoom(0.1);
      expect(camera.getTargetZoom()).toBe(config.minZoom);
      
      // Test maximum zoom
      camera.setZoom(10.0);
      expect(camera.getTargetZoom()).toBe(config.maxZoom);
    });
  });

  describe('coordinate conversion', () => {
    it('should convert screen to world coordinates', () => {
      const screenX = canvasWidth / 2;
      const screenY = canvasHeight / 2;
      
      const worldPos = camera.screenToWorld(screenX, screenY);
      const cameraPos = camera.getPosition();
      
      // Center of screen should map to camera position
      expect(worldPos.x).toBeCloseTo(cameraPos.x);
      expect(worldPos.y).toBeCloseTo(cameraPos.y);
    });

    it('should convert world to screen coordinates', () => {
      const cameraPos = camera.getPosition();
      
      const screenPos = camera.worldToScreen(cameraPos.x, cameraPos.y);
      
      // Camera position should map to center of screen
      expect(screenPos.x).toBeCloseTo(canvasWidth / 2);
      expect(screenPos.y).toBeCloseTo(canvasHeight / 2);
    });

    it('should handle coordinate conversion with zoom', () => {
      camera.setZoom(2.0);
      camera.update(1.0); // Update to apply zoom
      
      const screenX = canvasWidth / 2;
      const screenY = canvasHeight / 2;
      
      const worldPos = camera.screenToWorld(screenX, screenY);
      const screenPos = camera.worldToScreen(worldPos.x, worldPos.y);
      
      expect(screenPos.x).toBeCloseTo(screenX);
      expect(screenPos.y).toBeCloseTo(screenY);
    });
  });

  describe('view bounds', () => {
    it('should calculate correct view bounds', () => {
      const bounds = camera.getViewBounds();
      const position = camera.getPosition();
      const zoom = camera.getZoom();
      
      const halfWidth = canvasWidth / (2 * zoom);
      const halfHeight = canvasHeight / (2 * zoom);
      
      expect(bounds.left).toBeCloseTo(position.x - halfWidth);
      expect(bounds.right).toBeCloseTo(position.x + halfWidth);
      expect(bounds.top).toBeCloseTo(position.y - halfHeight);
      expect(bounds.bottom).toBeCloseTo(position.y + halfHeight);
    });

    it('should check visibility correctly', () => {
      const position = camera.getPosition();
      
      // Point at camera center should be visible
      expect(camera.isVisible(position.x, position.y)).toBe(true);
      
      // Point far outside view should not be visible
      expect(camera.isVisible(position.x + 10000, position.y + 10000)).toBe(false);
    });
  });

  describe('update', () => {
    it('should smoothly interpolate to target position', () => {
      const initialPosition = camera.getPosition();
      camera.setPosition(initialPosition.x + 100, initialPosition.y + 100);
      
      // Update should move camera towards target
      camera.update(0.016); // ~60fps
      
      const newPosition = camera.getPosition();
      expect(newPosition.x).toBeGreaterThan(initialPosition.x);
      expect(newPosition.y).toBeGreaterThan(initialPosition.y);
      expect(newPosition.x).toBeLessThan(initialPosition.x + 100);
      expect(newPosition.y).toBeLessThan(initialPosition.y + 100);
    });

    it('should smoothly interpolate zoom', () => {
      const initialZoom = camera.getZoom();
      camera.setZoom(2.0);
      
      camera.update(0.016);
      
      const newZoom = camera.getZoom();
      expect(newZoom).toBeGreaterThan(initialZoom);
      expect(newZoom).toBeLessThan(2.0);
    });
  });

  describe('canvas resize', () => {
    it('should update canvas size and recalculate bounds', () => {
      const newWidth = 1024;
      const newHeight = 768;
      
      camera.updateCanvasSize(newWidth, newHeight);
      
      // View bounds should reflect new canvas size
      const bounds = camera.getViewBounds();
      const zoom = camera.getZoom();
      
      const expectedHalfWidth = newWidth / (2 * zoom);
      const expectedHalfHeight = newHeight / (2 * zoom);
      
      expect(bounds.right - bounds.left).toBeCloseTo(expectedHalfWidth * 2);
      expect(bounds.bottom - bounds.top).toBeCloseTo(expectedHalfHeight * 2);
    });
  });
});