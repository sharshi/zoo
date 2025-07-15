// Core type definitions for the zoo tycoon game

export type EntityId = string;

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// Tile types for the world grid
export type TileType = 'grass' | 'path' | 'water' | 'building';

export interface TileData {
  type: TileType;
  occupiedBy: EntityId | null;
  walkable: boolean;
  buildable: boolean;
}

export interface WorldGrid {
  width: number;
  height: number;
  tiles: TileData[][];
}

// Player statistics
export interface PlayerStats {
  totalFunds: number;
  zooReputation: number;
  totalVisitors: number;
  animalsOwned: number;
  dayCount: number;
}

// Game settings
export interface GameSettings {
  timeScale: number;
  autoSave: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

// Main game state
export interface GameState {
  currentTime: number;
  timeScale: number;
  isPaused: boolean;
  worldGrid: WorldGrid;
  entities: Map<EntityId, Entity>;
  playerStats: PlayerStats;
  gameSettings: GameSettings;
}

// Save data structure
export interface SaveData {
  version: string;
  timestamp: number;
  gameState: GameState;
  playerProgress: {
    unlockedAnimals: string[];
    unlockedBuildings: string[];
    achievements: string[];
  };
}

// Forward declaration for Entity (will be defined in entities)
export interface Entity {
  id: EntityId;
  components: Map<string, Component>;
}

// Base component interface
export interface Component {
  type: string;
}