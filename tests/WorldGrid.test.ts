import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGrid } from '../src/world/WorldGrid';
import { Position, Size, TileData } from '../src/utils/types';

describe('WorldGrid', () => {
  let grid: WorldGrid;
  const testWidth = 10;
  const testHeight = 10;

  beforeEach(() => {
    grid = new WorldGrid(testWidth, testHeight);
  });

  describe('initialization', () => {
    it('should create a grid with correct dimensions', () => {
      const dimensions = grid.getDimensions();
      expect(dimensions.width).toBe(testWidth);
      expect(dimensions.height).toBe(testHeight);
    });

    it('should initialize all tiles as grass', () => {
      for (let y = 0; y < testHeight; y++) {
        for (let x = 0; x < testWidth; x++) {
          const tile = grid.getTile({ x, y });
          expect(tile).not.toBeNull();
          expect(tile!.type).toBe('grass');
          expect(tile!.walkable).toBe(true);
          expect(tile!.buildable).toBe(true);
          expect(tile!.occupiedBy).toBeNull();
        }
      }
    });
  });

  describe('tile operations', () => {
    it('should get tile at valid position', () => {
      const tile = grid.getTile({ x: 5, y: 5 });
      expect(tile).not.toBeNull();
      expect(tile!.type).toBe('grass');
    });

    it('should return null for invalid position', () => {
      expect(grid.getTile({ x: -1, y: 5 })).toBeNull();
      expect(grid.getTile({ x: 5, y: -1 })).toBeNull();
      expect(grid.getTile({ x: testWidth, y: 5 })).toBeNull();
      expect(grid.getTile({ x: 5, y: testHeight })).toBeNull();
    });

    it('should set tile data correctly', () => {
      const position = { x: 3, y: 3 };
      const success = grid.setTile(position, { 
        type: 'path', 
        walkable: true, 
        buildable: false 
      });
      
      expect(success).toBe(true);
      
      const tile = grid.getTile(position);
      expect(tile!.type).toBe('path');
      expect(tile!.walkable).toBe(true);
      expect(tile!.buildable).toBe(false);
    });

    it('should fail to set tile at invalid position', () => {
      const success = grid.setTile({ x: -1, y: 5 }, { type: 'path' });
      expect(success).toBe(false);
    });
  });

  describe('position validation', () => {
    it('should validate correct positions', () => {
      expect(grid.isValidGridPosition({ x: 0, y: 0 })).toBe(true);
      expect(grid.isValidGridPosition({ x: testWidth - 1, y: testHeight - 1 })).toBe(true);
      expect(grid.isValidGridPosition({ x: 5, y: 5 })).toBe(true);
    });

    it('should reject invalid positions', () => {
      expect(grid.isValidGridPosition({ x: -1, y: 0 })).toBe(false);
      expect(grid.isValidGridPosition({ x: 0, y: -1 })).toBe(false);
      expect(grid.isValidGridPosition({ x: testWidth, y: 0 })).toBe(false);
      expect(grid.isValidGridPosition({ x: 0, y: testHeight })).toBe(false);
    });
  });

  describe('walkability and buildability', () => {
    it('should check walkability correctly', () => {
      const position = { x: 2, y: 2 };
      expect(grid.isWalkable(position)).toBe(true);
      
      grid.setTile(position, { walkable: false });
      expect(grid.isWalkable(position)).toBe(false);
    });

    it('should check buildability correctly', () => {
      const position = { x: 2, y: 2 };
      expect(grid.isBuildable(position)).toBe(true);
      
      grid.setTile(position, { buildable: false });
      expect(grid.isBuildable(position)).toBe(false);
      
      // Reset buildable but occupy the tile
      grid.setTile(position, { buildable: true, occupiedBy: 'test-entity' });
      expect(grid.isBuildable(position)).toBe(false);
    });
  });

  describe('area operations', () => {
    const testSize: Size = { width: 3, height: 2 };
    const testPosition: Position = { x: 2, y: 2 };

    it('should check area availability correctly', () => {
      expect(grid.isAreaAvailable(testPosition, testSize)).toBe(true);
      
      // Make one tile unbuildable
      grid.setTile({ x: 3, y: 2 }, { buildable: false });
      expect(grid.isAreaAvailable(testPosition, testSize)).toBe(false);
    });

    it('should occupy area correctly', () => {
      const entityId = 'test-entity-123';
      const success = grid.occupyArea(testPosition, testSize, entityId);
      
      expect(success).toBe(true);
      
      // Check all tiles in the area are occupied
      for (let y = testPosition.y; y < testPosition.y + testSize.height; y++) {
        for (let x = testPosition.x; x < testPosition.x + testSize.width; x++) {
          const tile = grid.getTile({ x, y });
          expect(tile!.occupiedBy).toBe(entityId);
        }
      }
    });

    it('should fail to occupy unavailable area', () => {
      // Make area unavailable
      grid.setTile({ x: 3, y: 2 }, { buildable: false });
      
      const success = grid.occupyArea(testPosition, testSize, 'test-entity');
      expect(success).toBe(false);
    });

    it('should free area correctly', () => {
      const entityId = 'test-entity-123';
      grid.occupyArea(testPosition, testSize, entityId);
      
      grid.freeArea(testPosition, testSize);
      
      // Check all tiles in the area are freed
      for (let y = testPosition.y; y < testPosition.y + testSize.height; y++) {
        for (let x = testPosition.x; x < testPosition.x + testSize.width; x++) {
          const tile = grid.getTile({ x, y });
          expect(tile!.occupiedBy).toBeNull();
        }
      }
    });

    it('should get tiles in area correctly', () => {
      const tiles = grid.getTilesInArea(testPosition, testSize);
      expect(tiles).toHaveLength(testSize.width * testSize.height);
      
      // All tiles should be grass initially
      tiles.forEach(tile => {
        expect(tile.type).toBe('grass');
      });
    });
  });

  describe('neighbor operations', () => {
    it('should get neighbors correctly for center position', () => {
      const position = { x: 5, y: 5 };
      const neighbors = grid.getNeighbors(position);
      expect(neighbors).toHaveLength(4);
    });

    it('should get fewer neighbors for edge positions', () => {
      const cornerPosition = { x: 0, y: 0 };
      const neighbors = grid.getNeighbors(cornerPosition);
      expect(neighbors).toHaveLength(2);
    });

    it('should get neighbor positions correctly', () => {
      const position = { x: 5, y: 5 };
      const neighborPositions = grid.getNeighborPositions(position);
      
      expect(neighborPositions).toHaveLength(4);
      expect(neighborPositions).toContainEqual({ x: 5, y: 4 }); // North
      expect(neighborPositions).toContainEqual({ x: 6, y: 5 }); // East
      expect(neighborPositions).toContainEqual({ x: 5, y: 6 }); // South
      expect(neighborPositions).toContainEqual({ x: 4, y: 5 }); // West
    });
  });

  describe('search operations', () => {
    beforeEach(() => {
      // Set up some test tiles
      grid.setTile({ x: 1, y: 1 }, { type: 'path' });
      grid.setTile({ x: 2, y: 2 }, { type: 'path' });
      grid.setTile({ x: 3, y: 3 }, { type: 'water' });
    });

    it('should find tiles by type', () => {
      const pathTiles = grid.findTilesByType('path');
      expect(pathTiles).toHaveLength(2);
      expect(pathTiles).toContainEqual({ x: 1, y: 1 });
      expect(pathTiles).toContainEqual({ x: 2, y: 2 });
      
      const waterTiles = grid.findTilesByType('water');
      expect(waterTiles).toHaveLength(1);
      expect(waterTiles).toContainEqual({ x: 3, y: 3 });
    });

    it('should find tiles by entity', () => {
      const entityId = 'test-entity-456';
      grid.occupyArea({ x: 4, y: 4 }, { width: 2, height: 2 }, entityId);
      
      const entityTiles = grid.findTilesByEntity(entityId);
      expect(entityTiles).toHaveLength(4);
      expect(entityTiles).toContainEqual({ x: 4, y: 4 });
      expect(entityTiles).toContainEqual({ x: 5, y: 4 });
      expect(entityTiles).toContainEqual({ x: 4, y: 5 });
      expect(entityTiles).toContainEqual({ x: 5, y: 5 });
    });
  });

  describe('serialization', () => {
    it('should serialize and deserialize correctly', () => {
      // Modify the grid
      grid.setTile({ x: 1, y: 1 }, { type: 'path' });
      grid.occupyArea({ x: 3, y: 3 }, { width: 2, height: 1 }, 'test-entity');
      
      // Serialize
      const serialized = grid.serialize();
      expect(serialized.width).toBe(testWidth);
      expect(serialized.height).toBe(testHeight);
      
      // Deserialize
      const newGrid = WorldGrid.deserialize(serialized);
      
      // Check dimensions
      const dimensions = newGrid.getDimensions();
      expect(dimensions.width).toBe(testWidth);
      expect(dimensions.height).toBe(testHeight);
      
      // Check specific tiles
      const pathTile = newGrid.getTile({ x: 1, y: 1 });
      expect(pathTile!.type).toBe('path');
      
      const occupiedTile = newGrid.getTile({ x: 3, y: 3 });
      expect(occupiedTile!.occupiedBy).toBe('test-entity');
    });
  });
});