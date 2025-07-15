import { Camera } from './Camera';
import { Position, Size, WorldGrid, TileData } from '../utils/types';
import { GAME_CONFIG } from '../utils/constants';

export interface RenderLayer {
  name: string;
  zIndex: number;
  visible: boolean;
}

export interface Sprite {
  image: HTMLImageElement;
  width: number;
  height: number;
  frames?: number;
  frameWidth?: number;
  frameHeight?: number;
}

export interface RenderObject {
  position: Position;
  size: Size;
  sprite?: Sprite;
  color?: string;
  layer: string;
  rotation?: number;
  alpha?: number;
  frame?: number;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private camera: Camera;
  private layers: Map<string, RenderLayer>;
  private renderQueue: Map<string, RenderObject[]>;
  private sprites: Map<string, Sprite>;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.context = context;
    
    this.camera = new Camera(canvas.width, canvas.height);
    this.layers = new Map();
    this.renderQueue = new Map();
    this.sprites = new Map();

    // Initialize default layers
    this.initializeLayers();
    
    // Set up canvas properties
    this.setupCanvas();
  }

  /**
   * Initialize default rendering layers
   */
  private initializeLayers(): void {
    const defaultLayers = [
      { name: 'background', zIndex: 0, visible: true },
      { name: 'terrain', zIndex: 10, visible: true },
      { name: 'buildings', zIndex: 20, visible: true },
      { name: 'entities', zIndex: 30, visible: true },
      { name: 'effects', zIndex: 40, visible: true },
      { name: 'ui', zIndex: 50, visible: true }
    ];

    defaultLayers.forEach(layer => {
      this.layers.set(layer.name, layer);
      this.renderQueue.set(layer.name, []);
    });
  }

  /**
   * Set up canvas properties for crisp pixel rendering
   */
  private setupCanvas(): void {
    this.context.imageSmoothingEnabled = false;
    this.context.textAlign = 'left';
    this.context.textBaseline = 'top';
  }

  /**
   * Add or update a rendering layer
   */
  addLayer(name: string, zIndex: number, visible: boolean = true): void {
    this.layers.set(name, { name, zIndex, visible });
    if (!this.renderQueue.has(name)) {
      this.renderQueue.set(name, []);
    }
  }

  /**
   * Remove a rendering layer
   */
  removeLayer(name: string): void {
    this.layers.delete(name);
    this.renderQueue.delete(name);
  }

  /**
   * Set layer visibility
   */
  setLayerVisible(name: string, visible: boolean): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.visible = visible;
    }
  }

  /**
   * Load a sprite from an image source
   */
  async loadSprite(name: string, src: string, frames?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const sprite: Sprite = {
          image,
          width: image.width,
          height: image.height
        };

        if (frames && frames > 1) {
          sprite.frames = frames;
          sprite.frameWidth = image.width / frames;
          sprite.frameHeight = image.height;
        }

        this.sprites.set(name, sprite);
        resolve();
      };
      image.onerror = () => reject(new Error(`Failed to load sprite: ${src}`));
      image.src = src;
    });
  }

  /**
   * Get a loaded sprite
   */
  getSprite(name: string): Sprite | undefined {
    return this.sprites.get(name);
  }

  /**
   * Add an object to the render queue
   */
  addToRenderQueue(object: RenderObject): void {
    const layerQueue = this.renderQueue.get(object.layer);
    if (layerQueue) {
      layerQueue.push(object);
    }
  }

  /**
   * Clear all render queues
   */
  clearRenderQueue(): void {
    this.renderQueue.forEach(queue => queue.length = 0);
  }

  /**
   * Render the world grid
   */
  renderWorldGrid(worldGrid: WorldGrid): void {
    const bounds = this.camera.getViewBounds();
    const tileSize = GAME_CONFIG.TILE_SIZE;
    
    // Calculate visible tile range
    const startX = Math.max(0, Math.floor(bounds.left / tileSize));
    const endX = Math.min(worldGrid.width - 1, Math.ceil(bounds.right / tileSize));
    const startY = Math.max(0, Math.floor(bounds.top / tileSize));
    const endY = Math.min(worldGrid.height - 1, Math.ceil(bounds.bottom / tileSize));

    // Render visible tiles
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tile = worldGrid.tiles[y][x];
        this.renderTile(tile, x, y);
      }
    }
  }

  /**
   * Render a single tile
   */
  private renderTile(tile: TileData, gridX: number, gridY: number): void {
    const worldX = gridX * GAME_CONFIG.TILE_SIZE;
    const worldY = gridY * GAME_CONFIG.TILE_SIZE;
    
    // Check if tile is visible
    if (!this.camera.isVisible(worldX, worldY, GAME_CONFIG.TILE_SIZE)) {
      return;
    }

    const color = this.getTileColor(tile.type);
    
    this.addToRenderQueue({
      position: { x: worldX, y: worldY },
      size: { width: GAME_CONFIG.TILE_SIZE, height: GAME_CONFIG.TILE_SIZE },
      color,
      layer: 'terrain'
    });
  }

  /**
   * Get color for tile type
   */
  private getTileColor(type: string): string {
    switch (type) {
      case 'grass': return '#4a7c59';
      case 'path': return '#8b7355';
      case 'water': return '#4a90e2';
      case 'building': return '#666666';
      default: return '#4a7c59';
    }
  }

  /**
   * Main render method
   */
  render(): void {
    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Save context state
    this.context.save();
    
    // Apply camera transformation
    this.applyCameraTransform();
    
    // Render layers in order
    const sortedLayers = Array.from(this.layers.values())
      .filter(layer => layer.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of sortedLayers) {
      this.renderLayer(layer.name);
    }
    
    // Restore context state
    this.context.restore();
    
    // Clear render queue for next frame
    this.clearRenderQueue();
  }

  /**
   * Apply camera transformation to the rendering context
   */
  private applyCameraTransform(): void {
    const cameraPos = this.camera.getPosition();
    const zoom = this.camera.getZoom();
    
    // Translate to center of canvas
    this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
    
    // Apply zoom
    this.context.scale(zoom, zoom);
    
    // Translate by camera position (negative to move world opposite to camera)
    this.context.translate(-cameraPos.x, -cameraPos.y);
  }

  /**
   * Render a specific layer
   */
  private renderLayer(layerName: string): void {
    const objects = this.renderQueue.get(layerName);
    if (!objects) return;

    for (const obj of objects) {
      this.renderObject(obj);
    }
  }

  /**
   * Render a single object
   */
  private renderObject(obj: RenderObject): void {
    this.context.save();
    
    // Apply object transformations
    this.context.translate(obj.position.x + obj.size.width / 2, obj.position.y + obj.size.height / 2);
    
    if (obj.rotation) {
      this.context.rotate(obj.rotation);
    }
    
    if (obj.alpha !== undefined) {
      this.context.globalAlpha = obj.alpha;
    }
    
    // Render sprite or colored rectangle
    if (obj.sprite) {
      this.renderSprite(obj.sprite, -obj.size.width / 2, -obj.size.height / 2, obj.size.width, obj.size.height, obj.frame);
    } else if (obj.color) {
      this.context.fillStyle = obj.color;
      this.context.fillRect(-obj.size.width / 2, -obj.size.height / 2, obj.size.width, obj.size.height);
    }
    
    this.context.restore();
  }

  /**
   * Render a sprite with optional animation frame
   */
  private renderSprite(sprite: Sprite, x: number, y: number, width: number, height: number, frame?: number): void {
    if (sprite.frames && sprite.frameWidth && sprite.frameHeight && frame !== undefined) {
      // Animated sprite
      const frameX = (frame % sprite.frames) * sprite.frameWidth;
      this.context.drawImage(
        sprite.image,
        frameX, 0, sprite.frameWidth, sprite.frameHeight,
        x, y, width, height
      );
    } else {
      // Static sprite
      this.context.drawImage(sprite.image, x, y, width, height);
    }
  }

  /**
   * Update camera and other time-based rendering properties
   */
  update(deltaTime: number): void {
    this.camera.update(deltaTime);
  }

  /**
   * Resize the canvas and update camera
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.camera.updateCanvasSize(width, height);
    this.setupCanvas();
  }

  /**
   * Get the camera instance
   */
  getCamera(): Camera {
    return this.camera;
  }

  /**
   * Get canvas dimensions
   */
  getCanvasSize(): Size {
    return { width: this.canvas.width, height: this.canvas.height };
  }
}