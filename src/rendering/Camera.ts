import { Position } from '../utils/types';
import { GAME_CONFIG } from '../utils/constants';

export interface CameraConfig {
  minZoom: number;
  maxZoom: number;
  panSpeed: number;
  zoomSpeed: number;
  smoothing: number;
}

export class Camera {
  private position: Position;
  private targetPosition: Position;
  private zoom: number;
  private targetZoom: number;
  private config: CameraConfig;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number, config?: Partial<CameraConfig>) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    // Default camera configuration
    this.config = {
      minZoom: 0.25,
      maxZoom: 3.0,
      panSpeed: 500, // pixels per second
      zoomSpeed: 0.1,
      smoothing: 0.1,
      ...config
    };

    // Initialize camera at center of world
    const worldCenterX = (GAME_CONFIG.WORLD_WIDTH * GAME_CONFIG.TILE_SIZE) / 2;
    const worldCenterY = (GAME_CONFIG.WORLD_HEIGHT * GAME_CONFIG.TILE_SIZE) / 2;
    
    this.position = { x: worldCenterX, y: worldCenterY };
    this.targetPosition = { x: worldCenterX, y: worldCenterY };
    this.zoom = 1.0;
    this.targetZoom = 1.0;
  }

  /**
   * Update camera position and zoom with smooth interpolation
   */
  update(deltaTime: number): void {
    // Smooth camera movement
    const lerpFactor = Math.min(1, this.config.smoothing * deltaTime * 60); // 60fps reference
    
    this.position.x += (this.targetPosition.x - this.position.x) * lerpFactor;
    this.position.y += (this.targetPosition.y - this.position.y) * lerpFactor;
    this.zoom += (this.targetZoom - this.zoom) * lerpFactor;
  }

  /**
   * Pan the camera by a given offset
   */
  pan(deltaX: number, deltaY: number): void {
    this.targetPosition.x += deltaX / this.zoom;
    this.targetPosition.y += deltaY / this.zoom;
    this.clampPosition();
  }

  /**
   * Set camera position directly
   */
  setPosition(x: number, y: number): void {
    this.targetPosition.x = x;
    this.targetPosition.y = y;
    this.clampPosition();
  }

  /**
   * Zoom the camera by a factor, centered on a specific point
   */
  zoomAt(factor: number, centerX: number, centerY: number): void {
    const oldZoom = this.targetZoom;
    this.targetZoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, this.targetZoom * factor));
    
    if (this.targetZoom !== oldZoom) {
      // Adjust position to zoom towards the specified point
      const zoomRatio = this.targetZoom / oldZoom;
      const worldPoint = this.screenToWorld(centerX, centerY);
      
      this.targetPosition.x = worldPoint.x - (worldPoint.x - this.targetPosition.x) / zoomRatio;
      this.targetPosition.y = worldPoint.y - (worldPoint.y - this.targetPosition.y) / zoomRatio;
      this.clampPosition();
    }
  }

  /**
   * Set zoom level directly
   */
  setZoom(zoom: number): void {
    this.targetZoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, zoom));
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX: number, screenY: number): Position {
    return {
      x: (screenX - this.canvasWidth / 2) / this.zoom + this.position.x,
      y: (screenY - this.canvasHeight / 2) / this.zoom + this.position.y
    };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX: number, worldY: number): Position {
    return {
      x: (worldX - this.position.x) * this.zoom + this.canvasWidth / 2,
      y: (worldY - this.position.y) * this.zoom + this.canvasHeight / 2
    };
  }

  /**
   * Get the current view bounds in world coordinates
   */
  getViewBounds(): { left: number; right: number; top: number; bottom: number } {
    const halfWidth = this.canvasWidth / (2 * this.zoom);
    const halfHeight = this.canvasHeight / (2 * this.zoom);
    
    return {
      left: this.position.x - halfWidth,
      right: this.position.x + halfWidth,
      top: this.position.y - halfHeight,
      bottom: this.position.y + halfHeight
    };
  }

  /**
   * Check if a world position is visible in the current view
   */
  isVisible(worldX: number, worldY: number, margin: number = 0): boolean {
    const bounds = this.getViewBounds();
    return worldX >= bounds.left - margin &&
           worldX <= bounds.right + margin &&
           worldY >= bounds.top - margin &&
           worldY <= bounds.bottom + margin;
  }

  /**
   * Clamp camera position to world boundaries
   */
  private clampPosition(): void {
    const worldWidth = GAME_CONFIG.WORLD_WIDTH * GAME_CONFIG.TILE_SIZE;
    const worldHeight = GAME_CONFIG.WORLD_HEIGHT * GAME_CONFIG.TILE_SIZE;
    
    const halfViewWidth = this.canvasWidth / (2 * this.targetZoom);
    const halfViewHeight = this.canvasHeight / (2 * this.targetZoom);
    
    this.targetPosition.x = Math.max(halfViewWidth, Math.min(worldWidth - halfViewWidth, this.targetPosition.x));
    this.targetPosition.y = Math.max(halfViewHeight, Math.min(worldHeight - halfViewHeight, this.targetPosition.y));
  }

  /**
   * Update canvas size (call when canvas is resized)
   */
  updateCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.clampPosition();
  }

  // Getters
  getPosition(): Position {
    return { ...this.position };
  }

  getTargetPosition(): Position {
    return { ...this.targetPosition };
  }

  getZoom(): number {
    return this.zoom;
  }

  getTargetZoom(): number {
    return this.targetZoom;
  }

  getConfig(): CameraConfig {
    return { ...this.config };
  }
}