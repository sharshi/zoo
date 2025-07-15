import { Position, Size, TileData, TileType, EntityId } from '../utils/types';
import { GAME_CONFIG } from '../utils/constants';
import { isPositionValid } from '../utils/helpers';

/**
 * WorldGrid manages the tile-based grid system for the zoo world
 */
export class WorldGrid {
  private tiles: TileData[][];
  private width: number;
  private height: number;

  constructor(width: number = GAME_CONFIG.WORLD_WIDTH, height: number = GAME_CONFIG.WORLD_HEIGHT) {
    this.width = width;
    this.height = height;
    this.tiles = this.initializeGrid();
  }

  /**
   * Initialize the grid with default grass tiles
   */
  private initializeGrid(): TileData[][] {
    const grid: TileData[][] = [];
    
    for (let y = 0; y < this.height; y++) {
      grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        grid[y][x] = {
          type: 'grass',
          occupiedBy: null,
          walkable: true,
          buildable: true
        };
      }
    }
    
    return grid;
  }

  /**
   * Get tile data at specific grid coordinates
   */
  getTile(position: Position): TileData | null {
    if (!this.isValidGridPosition(position)) {
      return null;
    }
    return this.tiles[position.y][position.x];
  }

  /**
   * Set tile data at specific grid coordinates
   */
  setTile(position: Position, tileData: Partial<TileData>): boolean {
    if (!this.isValidGridPosition(position)) {
      return false;
    }
    
    const currentTile = this.tiles[position.y][position.x];
    this.tiles[position.y][position.x] = { ...currentTile, ...tileData };
    return true;
  }

  /**
   * Check if a grid position is within bounds
   */
  isValidGridPosition(position: Position): boolean {
    return isPositionValid(position, this.width, this.height);
  }

  /**
   * Check if a tile is walkable
   */
  isWalkable(position: Position): boolean {
    const tile = this.getTile(position);
    return tile ? tile.walkable : false;
  }

  /**
   * Check if a tile is buildable
   */
  isBuildable(position: Position): boolean {
    const tile = this.getTile(position);
    return tile ? tile.buildable && tile.occupiedBy === null : false;
  }

  /**
   * Check if an area is available for construction
   */
  isAreaAvailable(position: Position, size: Size): boolean {
    for (let y = position.y; y < position.y + size.height; y++) {
      for (let x = position.x; x < position.x + size.width; x++) {
        const checkPos = { x, y };
        if (!this.isValidGridPosition(checkPos) || !this.isBuildable(checkPos)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Occupy an area with an entity
   */
  occupyArea(position: Position, size: Size, entityId: EntityId): boolean {
    if (!this.isAreaAvailable(position, size)) {
      return false;
    }

    for (let y = position.y; y < position.y + size.height; y++) {
      for (let x = position.x; x < position.x + size.width; x++) {
        const tile = this.getTile({ x, y });
        if (tile) {
          tile.occupiedBy = entityId;
        }
      }
    }
    return true;
  }

  /**
   * Free an area from entity occupation
   */
  freeArea(position: Position, size: Size): void {
    for (let y = position.y; y < position.y + size.height; y++) {
      for (let x = position.x; x < position.x + size.width; x++) {
        const checkPos = { x, y };
        if (this.isValidGridPosition(checkPos)) {
          const tile = this.getTile(checkPos);
          if (tile) {
            tile.occupiedBy = null;
          }
        }
      }
    }
  }

  /**
   * Get all tiles in a rectangular area
   */
  getTilesInArea(position: Position, size: Size): TileData[] {
    const tiles: TileData[] = [];
    
    for (let y = position.y; y < position.y + size.height; y++) {
      for (let x = position.x; x < position.x + size.width; x++) {
        const tile = this.getTile({ x, y });
        if (tile) {
          tiles.push(tile);
        }
      }
    }
    
    return tiles;
  }

  /**
   * Get neighboring tiles (4-directional)
   */
  getNeighbors(position: Position): TileData[] {
    const neighbors: TileData[] = [];
    const directions = [
      { x: 0, y: -1 }, // North
      { x: 1, y: 0 },  // East
      { x: 0, y: 1 },  // South
      { x: -1, y: 0 }  // West
    ];

    for (const dir of directions) {
      const neighborPos = {
        x: position.x + dir.x,
        y: position.y + dir.y
      };
      
      const tile = this.getTile(neighborPos);
      if (tile) {
        neighbors.push(tile);
      }
    }

    return neighbors;
  }

  /**
   * Get neighboring positions (4-directional)
   */
  getNeighborPositions(position: Position): Position[] {
    const neighbors: Position[] = [];
    const directions = [
      { x: 0, y: -1 }, // North
      { x: 1, y: 0 },  // East
      { x: 0, y: 1 },  // South
      { x: -1, y: 0 }  // West
    ];

    for (const dir of directions) {
      const neighborPos = {
        x: position.x + dir.x,
        y: position.y + dir.y
      };
      
      if (this.isValidGridPosition(neighborPos)) {
        neighbors.push(neighborPos);
      }
    }

    return neighbors;
  }

  /**
   * Find all tiles of a specific type
   */
  findTilesByType(tileType: TileType): Position[] {
    const positions: Position[] = [];
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.tiles[y][x].type === tileType) {
          positions.push({ x, y });
        }
      }
    }
    
    return positions;
  }

  /**
   * Find all tiles occupied by a specific entity
   */
  findTilesByEntity(entityId: EntityId): Position[] {
    const positions: Position[] = [];
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.tiles[y][x].occupiedBy === entityId) {
          positions.push({ x, y });
        }
      }
    }
    
    return positions;
  }

  /**
   * Get grid dimensions
   */
  getDimensions(): Size {
    return { width: this.width, height: this.height };
  }

  /**
   * Convert grid to serializable format
   */
  serialize(): { width: number; height: number; tiles: TileData[][] } {
    return {
      width: this.width,
      height: this.height,
      tiles: this.tiles
    };
  }

  /**
   * Load grid from serialized data
   */
  static deserialize(data: { width: number; height: number; tiles: TileData[][] }): WorldGrid {
    const grid = new WorldGrid(data.width, data.height);
    grid.tiles = data.tiles;
    return grid;
  }
}