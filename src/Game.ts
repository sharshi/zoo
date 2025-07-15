import { EntityManager } from './entities/EntityManager';
import { GameState, WorldGrid, PlayerStats, GameSettings, TileData } from './utils/types';
import { GAME_CONFIG, FINANCIAL_CONFIG } from './utils/constants';

export class Game {
  private entityManager: EntityManager;
  private gameState: GameState;
  private lastUpdateTime: number;
  private isRunning: boolean;
  private animationFrameId: number | null;

  constructor() {
    this.entityManager = new EntityManager();
    this.gameState = this.initializeGameState();
    this.lastUpdateTime = 0;
    this.isRunning = false;
    this.animationFrameId = null;
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
    
    // Schedule next frame
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    if (this.gameState.isPaused) return;

    const scaledDeltaTime = deltaTime * this.gameState.timeScale;
    this.gameState.currentTime += scaledDeltaTime;

    // Systems will be updated here once implemented
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
}