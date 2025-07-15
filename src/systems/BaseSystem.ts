import { EntityManager } from '../entities/EntityManager';
import { GameState } from '../utils/types';

export abstract class BaseSystem {
  protected entityManager: EntityManager;
  protected gameState: GameState;

  constructor(entityManager: EntityManager, gameState: GameState) {
    this.entityManager = entityManager;
    this.gameState = gameState;
  }

  /**
   * Update the system
   * @param deltaTime Time elapsed since last update in seconds
   */
  abstract update(deltaTime: number): void;

  /**
   * Initialize the system (called once at startup)
   */
  initialize(): void {
    // Default implementation - can be overridden
  }

  /**
   * Cleanup the system (called when shutting down)
   */
  cleanup(): void {
    // Default implementation - can be overridden
  }
}