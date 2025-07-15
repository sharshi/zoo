import { Camera } from './Camera';
import { Position } from '../utils/types';

export interface InputConfig {
  panSpeed: number;
  zoomSpeed: number;
  keyPanSpeed: number;
}

export class InputHandler {
  private camera: Camera;
  private canvas: HTMLCanvasElement;
  private config: InputConfig;
  
  // Mouse state
  private mousePosition: Position;
  private isMouseDown: boolean;
  private isDragging: boolean;
  private dragStartPosition: Position;
  private lastMousePosition: Position;
  
  // Keyboard state
  private keysPressed: Set<string>;
  
  // Event listeners
  private boundEventListeners: Map<string, EventListener>;

  constructor(camera: Camera, canvas: HTMLCanvasElement, config?: Partial<InputConfig>) {
    this.camera = camera;
    this.canvas = canvas;
    
    this.config = {
      panSpeed: 1.0,
      zoomSpeed: 0.1,
      keyPanSpeed: 300, // pixels per second
      ...config
    };

    // Initialize state
    this.mousePosition = { x: 0, y: 0 };
    this.isMouseDown = false;
    this.isDragging = false;
    this.dragStartPosition = { x: 0, y: 0 };
    this.lastMousePosition = { x: 0, y: 0 };
    this.keysPressed = new Set();
    this.boundEventListeners = new Map();

    this.setupEventListeners();
  }

  /**
   * Set up all event listeners
   */
  private setupEventListeners(): void {
    // Mouse events
    this.addEventListeners([
      { element: this.canvas, event: 'mousedown', handler: this.onMouseDown.bind(this) },
      { element: this.canvas, event: 'mousemove', handler: this.onMouseMove.bind(this) },
      { element: this.canvas, event: 'mouseup', handler: this.onMouseUp.bind(this) },
      { element: this.canvas, event: 'wheel', handler: this.onWheel.bind(this) },
      { element: this.canvas, event: 'contextmenu', handler: this.onContextMenu.bind(this) },
      
      // Keyboard events
      { element: window, event: 'keydown', handler: this.onKeyDown.bind(this) },
      { element: window, event: 'keyup', handler: this.onKeyUp.bind(this) },
      
      // Focus events
      { element: window, event: 'blur', handler: this.onWindowBlur.bind(this) }
    ]);
  }

  /**
   * Add multiple event listeners and store references for cleanup
   */
  private addEventListeners(listeners: Array<{ element: EventTarget; event: string; handler: EventListener }>): void {
    listeners.forEach(({ element, event, handler }) => {
      element.addEventListener(event, handler);
      this.boundEventListeners.set(`${element.constructor.name}-${event}`, handler);
    });
  }

  /**
   * Handle mouse down events
   */
  private onMouseDown(event: MouseEvent): void {
    if (event.button === 1 || event.button === 2) { // Middle or right mouse button
      event.preventDefault();
      this.isMouseDown = true;
      this.dragStartPosition = this.getMousePosition(event);
      this.lastMousePosition = { ...this.dragStartPosition };
      this.canvas.style.cursor = 'grabbing';
    }
  }

  /**
   * Handle mouse move events
   */
  private onMouseMove(event: MouseEvent): void {
    this.mousePosition = this.getMousePosition(event);

    if (this.isMouseDown) {
      if (!this.isDragging) {
        // Start dragging if mouse moved enough
        const distance = this.getDistance(this.mousePosition, this.dragStartPosition);
        if (distance > 3) {
          this.isDragging = true;
        }
      }

      if (this.isDragging) {
        // Pan camera based on mouse movement
        const deltaX = (this.lastMousePosition.x - this.mousePosition.x) * this.config.panSpeed;
        const deltaY = (this.lastMousePosition.y - this.mousePosition.y) * this.config.panSpeed;
        
        this.camera.pan(deltaX, deltaY);
        this.lastMousePosition = { ...this.mousePosition };
      }
    }
  }

  /**
   * Handle mouse up events
   */
  private onMouseUp(event: MouseEvent): void {
    if (event.button === 1 || event.button === 2) {
      this.isMouseDown = false;
      this.isDragging = false;
      this.canvas.style.cursor = 'default';
    }
  }

  /**
   * Handle mouse wheel events for zooming
   */
  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    
    const zoomFactor = event.deltaY > 0 ? (1 - this.config.zoomSpeed) : (1 + this.config.zoomSpeed);
    const mousePos = this.getMousePosition(event);
    
    this.camera.zoomAt(zoomFactor, mousePos.x, mousePos.y);
  }

  /**
   * Prevent context menu on right click
   */
  private onContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }

  /**
   * Handle key down events
   */
  private onKeyDown(event: KeyboardEvent): void {
    this.keysPressed.add(event.code);
  }

  /**
   * Handle key up events
   */
  private onKeyUp(event: KeyboardEvent): void {
    this.keysPressed.delete(event.code);
  }

  /**
   * Handle window blur to clear key states
   */
  private onWindowBlur(): void {
    this.keysPressed.clear();
    this.isMouseDown = false;
    this.isDragging = false;
    this.canvas.style.cursor = 'default';
  }

  /**
   * Update input handling (call this in game loop)
   */
  update(deltaTime: number): void {
    this.handleKeyboardInput(deltaTime);
  }

  /**
   * Handle continuous keyboard input for camera panning
   */
  private handleKeyboardInput(deltaTime: number): void {
    const panDistance = this.config.keyPanSpeed * deltaTime;
    let deltaX = 0;
    let deltaY = 0;

    // WASD or Arrow keys for panning
    if (this.keysPressed.has('KeyW') || this.keysPressed.has('ArrowUp')) {
      deltaY -= panDistance;
    }
    if (this.keysPressed.has('KeyS') || this.keysPressed.has('ArrowDown')) {
      deltaY += panDistance;
    }
    if (this.keysPressed.has('KeyA') || this.keysPressed.has('ArrowLeft')) {
      deltaX -= panDistance;
    }
    if (this.keysPressed.has('KeyD') || this.keysPressed.has('ArrowRight')) {
      deltaX += panDistance;
    }

    if (deltaX !== 0 || deltaY !== 0) {
      this.camera.pan(deltaX, deltaY);
    }

    // Zoom with + and - keys
    if (this.keysPressed.has('Equal') || this.keysPressed.has('NumpadAdd')) {
      this.camera.zoomAt(1 + this.config.zoomSpeed, this.canvas.width / 2, this.canvas.height / 2);
    }
    if (this.keysPressed.has('Minus') || this.keysPressed.has('NumpadSubtract')) {
      this.camera.zoomAt(1 - this.config.zoomSpeed, this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  /**
   * Get mouse position relative to canvas
   */
  private getMousePosition(event: MouseEvent): Position {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  /**
   * Calculate distance between two points
   */
  private getDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get current mouse position
   */
  getMousePosition(): Position {
    return { ...this.mousePosition };
  }

  /**
   * Get mouse position in world coordinates
   */
  getWorldMousePosition(): Position {
    return this.camera.screenToWorld(this.mousePosition.x, this.mousePosition.y);
  }

  /**
   * Check if a key is currently pressed
   */
  isKeyPressed(keyCode: string): boolean {
    return this.keysPressed.has(keyCode);
  }

  /**
   * Check if mouse is currently dragging
   */
  getIsDragging(): boolean {
    return this.isDragging;
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    this.boundEventListeners.forEach((handler, key) => {
      const [elementType, eventType] = key.split('-');
      const element = elementType === 'Window' ? window : this.canvas;
      element.removeEventListener(eventType, handler);
    });
    this.boundEventListeners.clear();
    this.keysPressed.clear();
  }
}