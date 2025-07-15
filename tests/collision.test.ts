import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGrid } from '../src/world/WorldGrid';
import { Position, Size } from '../src/utils/types';
import {
  rectanglesOverlap,
  pointInRectangle,
  isAreaWithinBounds,
  isPlacementValid,
  findValidPlacementPositions,
  getClosestValidPosition,
  isPathClear,
  getLinePositions,
  wouldBlockEssentialPaths
} from '../src/utils/collision';

describe('Collision Detection', () => {
  let grid: WorldGrid;
  const gridWidth = 10;
  const gridHeight = 10;

  beforeEach(() => {
    grid = new WorldGrid(gridWidth, gridHeight);
  });

  describe('rectanglesOverlap', () => {
    it('should detect overlapping rectangles', () => {
      const pos1: Position = { x: 2, y: 2 };
      const size1: Size = { width: 3, height: 3 };
      const pos2: Position = { x: 4, y: 4 };
      const size2: Size = { width: 2, height: 2 };

      expect(rectanglesOverlap(pos1, size1, pos2, size2)).toBe(true);
    });

    it('should detect non-overlapping rectangles', () => {
      const pos1: Position = { x: 1, y: 1 };
      const size1: Size = { width: 2, height: 2 };
      const pos2: Position = { x: 4, y: 4 };
      const size2: Size = { width: 2, height: 2 };

      expect(rectanglesOverlap(pos1, size1, pos2, size2)).toBe(false);
    });

    it('should handle adjacent rectangles', () => {
      const pos1: Position = { x: 1, y: 1 };
      const size1: Size = { width: 2, height: 2 };
      const pos2: Position = { x: 3, y: 1 };
      const size2: Size = { width: 2, height: 2 };

      expect(rectanglesOverlap(pos1, size1, pos2, size2)).toBe(false);
    });
  });

  describe('pointInRectangle', () => {
    it('should detect point inside rectangle', () => {
      const point: Position = { x: 3, y: 3 };
      const rectPos: Position = { x: 2, y: 2 };
      const rectSize: Size = { width: 3, height: 3 };

      expect(pointInRectangle(point, rectPos, rectSize)).toBe(true);
    });

    it('should detect point outside rectangle', () => {
      const point: Position = { x: 6, y: 6 };
      const rectPos: Position = { x: 2, y: 2 };
      const rectSize: Size = { width: 3, height: 3 };

      expect(pointInRectangle(point, rectPos, rectSize)).toBe(false);
    });

    it('should handle point on rectangle edge', () => {
      const point: Position = { x: 2, y: 2 };
      const rectPos: Position = { x: 2, y: 2 };
      const rectSize: Size = { width: 3, height: 3 };

      expect(pointInRectangle(point, rectPos, rectSize)).toBe(true);
    });
  });

  describe('isAreaWithinBounds', () => {
    it('should validate area within bounds', () => {
      const position: Position = { x: 2, y: 2 };
      const size: Size = { width: 3, height: 3 };

      expect(isAreaWithinBounds(position, size, gridWidth, gridHeight)).toBe(true);
    });

    it('should reject area extending beyond bounds', () => {
      const position: Position = { x: 8, y: 8 };
      const size: Size = { width: 3, height: 3 };

      expect(isAreaWithinBounds(position, size, gridWidth, gridHeight)).toBe(false);
    });

    it('should reject area starting outside bounds', () => {
      const position: Position = { x: -1, y: 2 };
      const size: Size = { width: 2, height: 2 };

      expect(isAreaWithinBounds(position, size, gridWidth, gridHeight)).toBe(false);
    });
  });

  describe('isPlacementValid', () => {
    it('should validate placement in empty area', () => {
      const position: Position = { x: 3, y: 3 };
      const size: Size = { width: 2, height: 2 };

      expect(isPlacementValid(grid, position, size)).toBe(true);
    });

    it('should reject placement outside bounds', () => {
      const position: Position = { x: 9, y: 9 };
      const size: Size = { width: 2, height: 2 };

      expect(isPlacementValid(grid, position, size)).toBe(false);
    });

    it('should reject placement in occupied area', () => {
      const position: Position = { x: 3, y: 3 };
      const size: Size = { width: 2, height: 2 };

      // Occupy part of the area
      grid.occupyArea({ x: 3, y: 3 }, { width: 1, height: 1 }, 'existing-entity');

      expect(isPlacementValid(grid, position, size)).toBe(false);
    });

    it('should reject placement in unbuildable area', () => {
      const position: Position = { x: 3, y: 3 };
      const size: Size = { width: 2, height: 2 };

      // Make part of the area unbuildable
      grid.setTile({ x: 3, y: 3 }, { buildable: false });

      expect(isPlacementValid(grid, position, size)).toBe(false);
    });
  });

  describe('findValidPlacementPositions', () => {
    it('should find valid positions around target', () => {
      const targetPosition: Position = { x: 5, y: 5 };
      const size: Size = { width: 1, height: 1 };

      const validPositions = findValidPlacementPositions(grid, targetPosition, size, 2);

      expect(validPositions.length).toBeGreaterThan(0);
      
      // All returned positions should be valid
      validPositions.forEach(pos => {
        expect(isPlacementValid(grid, pos, size)).toBe(true);
      });
    });

    it('should return empty array when no valid positions exist', () => {
      const targetPosition: Position = { x: 5, y: 5 };
      const size: Size = { width: 1, height: 1 };

      // Block all tiles in the grid to ensure no valid positions
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          grid.setTile({ x, y }, { buildable: false });
        }
      }

      const validPositions = findValidPlacementPositions(grid, targetPosition, size, 2);
      expect(validPositions).toHaveLength(0);
    });
  });

  describe('getClosestValidPosition', () => {
    it('should return closest valid position', () => {
      const targetPosition: Position = { x: 5, y: 5 };
      const size: Size = { width: 1, height: 1 };

      // Block the target position
      grid.setTile(targetPosition, { buildable: false });

      const closestPosition = getClosestValidPosition(grid, targetPosition, size);

      expect(closestPosition).not.toBeNull();
      expect(isPlacementValid(grid, closestPosition!, size)).toBe(true);
    });

    it('should return null when no valid position exists', () => {
      const targetPosition: Position = { x: 5, y: 5 };
      const size: Size = { width: 1, height: 1 };

      // Block all positions within range
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          grid.setTile({ x, y }, { buildable: false });
        }
      }

      const closestPosition = getClosestValidPosition(grid, targetPosition, size, 3);
      expect(closestPosition).toBeNull();
    });
  });

  describe('getLinePositions', () => {
    it('should generate positions along horizontal line', () => {
      const start: Position = { x: 2, y: 3 };
      const end: Position = { x: 5, y: 3 };

      const positions = getLinePositions(start, end);

      expect(positions).toContainEqual({ x: 2, y: 3 });
      expect(positions).toContainEqual({ x: 3, y: 3 });
      expect(positions).toContainEqual({ x: 4, y: 3 });
      expect(positions).toContainEqual({ x: 5, y: 3 });
    });

    it('should generate positions along vertical line', () => {
      const start: Position = { x: 3, y: 2 };
      const end: Position = { x: 3, y: 5 };

      const positions = getLinePositions(start, end);

      expect(positions).toContainEqual({ x: 3, y: 2 });
      expect(positions).toContainEqual({ x: 3, y: 3 });
      expect(positions).toContainEqual({ x: 3, y: 4 });
      expect(positions).toContainEqual({ x: 3, y: 5 });
    });

    it('should generate positions along diagonal line', () => {
      const start: Position = { x: 2, y: 2 };
      const end: Position = { x: 4, y: 4 };

      const positions = getLinePositions(start, end);

      expect(positions).toContainEqual({ x: 2, y: 2 });
      expect(positions).toContainEqual({ x: 4, y: 4 });
      expect(positions.length).toBeGreaterThan(2);
    });
  });

  describe('isPathClear', () => {
    it('should return true for clear path', () => {
      const start: Position = { x: 1, y: 1 };
      const end: Position = { x: 3, y: 1 };

      expect(isPathClear(grid, start, end)).toBe(true);
    });

    it('should return false for blocked path', () => {
      const start: Position = { x: 1, y: 1 };
      const end: Position = { x: 3, y: 1 };

      // Block the middle tile
      grid.setTile({ x: 2, y: 1 }, { walkable: false });

      expect(isPathClear(grid, start, end)).toBe(false);
    });
  });

  describe('wouldBlockEssentialPaths', () => {
    it('should return false when placement does not block paths', () => {
      const position: Position = { x: 1, y: 1 };
      const size: Size = { width: 1, height: 1 };
      const essentialPaths = [
        [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 4, y: 0 }]
      ];

      const wouldBlock = wouldBlockEssentialPaths(grid, position, size, essentialPaths);
      expect(wouldBlock).toBe(false);
    });

    it('should return true when placement would block essential path', () => {
      const position: Position = { x: 2, y: 0 };
      const size: Size = { width: 1, height: 1 };
      const essentialPaths = [
        [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 4, y: 0 }]
      ];

      const wouldBlock = wouldBlockEssentialPaths(grid, position, size, essentialPaths);
      expect(wouldBlock).toBe(true);
    });
  });
});