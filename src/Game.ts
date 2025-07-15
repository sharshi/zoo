import { EntityManager } from './entities/EntityManager';
import { GameState, WorldGrid, PlayerStats, GameSettings, TileData } from './utils/types';
import { GAME_CONFIG, FINANCIAL_CONFIG } from './utils/constants';
import { Renderer } from './rendering/Renderer';
import { InputHandler } from './rendering/InputHandler';

export class Game {
  private entityManager: EntityManager;
  private gameState: GameState;
  private lastUpdateTime: number;
  private isRunning: boolean;
  private animationFrameId: number | null;
  private renderer: Renderer | null;
  private inputHandler: InputHandler | null;

  constructor() {
    this.entityManager = new EntityManager();
    this.gameState = this.initializeGameState();
    this.lastUpdateTime = 0;
    this.isRunning = false;
    this.animationFrameId = null;
    this.renderer = null;
    this.inputHandler = null;
  }

  /**
   * Initialize the game state with default values
   */
  private initializeGameState(): GameState {
    const worldGrid: WorldGrid = {
      width: GAME_CONFIG.WORLD_WIDTH,
      height: GAME_CONFIG.WORLD_HEIGHT,
      tiles: this.createEmptyGrid()
    };

    const playerStats: PlayerStats = {
      totalFunds: FINANCIAL_CONFIG.STARTING_FUNDS,
      zooReputation: 50,
      totalVisitors: 0,
      animalsOwned: 0,
      dayCount: 1
    };

    const gameSettings: GameSettings = {
      timeScale: 1.0,
      autoSave: true,
      soundEnabled: true,
      musicEnabled: true
    };

    return {
      currentTime: 0,
      timeScale: 1.0,
      isPaused: false,
      worldGrid,
      entities: new Map(),
      playerStats,
      gameSettings
    };
  }

  /**
   * Create an empty world grid
   */
  private createEmptyGrid() {
    const tiles: TileData[][] = [];
    for (let y = 0; y < GAME_CONFIG.WORLD_HEIGHT; y++) {
      const row: TileData[] = [];
      for (let x = 0; x < GAME_CONFIG.WORLD_WIDTH; x++) {
        row.push({
          type: 'grass' as const,
          occupiedBy: null,
          walkable: true,
          buildable: true
        });
      }
      tiles.push(row);
    }
    return tiles;
  }

  /**
   * Start the game loop
   */
  start(): void {
    this.isRunning = true;
    this.lastUpdateTime = performance.now();
    this.gameLoop();
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Main game loop
   */
  private gameLoop(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = currentTime;

    this.update(deltaTime);
    this.render();
    
    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    if (this.gameState.isPaused) return;

    const scaledDeltaTime = deltaTime * this.gameState.timeScale;
    this.gameState.currentTime += scaledDeltaTime;

    // Update input handler
    if (this.inputHandler) {
      this.inputHandler.update(deltaTime);
    }

    // Update renderer
    if (this.renderer) {
      this.renderer.update(deltaTime);
    }

    // Systems will be updated here once implemented
  }

  /**
   * Render the game
   */
  private render(): void {
    if (!this.renderer) return;

    // Render world grid
    this.renderer.renderWorldGrid(this.gameState.worldGrid);

    // Render all queued objects
    this.renderer.render();
  }

  /**
   * Get the entity manager
   */
  getEntityManager(): EntityManager {
    return this.entityManager;
  }

  /**
   * Get the current game state
   */
  getGameState(): GameState {
    return this.gameState;
  }

  /**
   * Pause/unpause the game
   */
  togglePause(): void {
    this.gameState.isPaused = !this.gameState.isPaused;
  }

  /**
   * Pause the game
   */
  pause(): void {
    this.gameState.isPaused = true;
  }

  /**
   * Resume the game
   */
  resume(): void {
    this.gameState.isPaused = false;
  }

  /**
   * Check if the game is paused
   */
  isPaused(): boolean {
    return this.gameState.isPaused;
  }

  /**
   * Set the time scale for the game
   * @param scale - Time scale multiplier (1.0 = normal speed, 2.0 = double speed, 0.5 = half speed)
   */
  setTimeScale(scale: number): void {
    if (scale < 0) {
      throw new Error('Time scale cannot be negative');
    }
    this.gameState.timeScale = scale;
    this.gameState.gameSettings.timeScale = scale;
  }

  /**
   * Get the current time scale
   */
  getTimeScale(): number {
    return this.gameState.timeScale;
  }

  /**
   * Get the current game time in seconds
   */
  getCurrentTime(): number {
    return this.gameState.currentTime;
  }

  /**
   * Reset the game time to zero
   */
  resetTime(): void {
    this.gameState.currentTime = 0;
  }

  /**
   * Check if the game is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Initialize the rendering system with a canvas element
   */
  initializeRenderer(canvas: HTMLCanvasElement): void {
    this.renderer = new Renderer(canvas);
    this.inputHandler = new InputHandler(this.renderer.getCamera(), canvas);
  }

  /**
   * Get the renderer instance
   */
  getRenderer(): Renderer | null {
    return this.renderer;
  }

  /**
   * Get the input handler instance
   */
  getInputHandler(): InputHandler | null {
    return this.inputHandler;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    if (this.inputHandler) {
      this.inputHandler.destroy();
    }
  }
}