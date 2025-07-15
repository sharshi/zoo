import { Position, Size } from './types';
import { WorldGrid } from '../world/WorldGrid';
import { isPositionValid, getPositionsInArea } from './helpers';

/**
 * Collision detection and boundary checking utilities
 */

/**
 * Check if two rectangular areas overlap
 */
export function rectanglesOverlap(
  pos1: Position, 
  size1: Size, 
  pos2: Position, 
  size2: Size
): boolean {
  return !(
    pos1.x + size1.width <= pos2.x ||
    pos2.x + size2.width <= pos1.x ||
    pos1.y + size1.height <= pos2.y ||
    pos2.y + size2.height <= pos1.y
  );
}

/**
 * Check if a point is inside a rectangle
 */
export function pointInRectangle(point: Position, rectPos: Position, rectSize: Size): boolean {
  return point.x >= rectPos.x &&
         point.x < rectPos.x + rectSize.width &&
         point.y >= rectPos.y &&
         point.y < rectPos.y + rectSize.height;
}

/**
 * Check if a rectangular area is within world bounds
 */
export function isAreaWithinBounds(
  position: Position, 
  size: Size, 
  worldWidth: number, 
  worldHeight: number
): boolean {
  return position.x >= 0 &&
         position.y >= 0 &&
         position.x + size.width <= worldWidth &&
         position.y + size.height <= worldHeight;
}

/**
 * Check if placement is valid (within bounds and no collisions)
 */
export function isPlacementValid(
  grid: WorldGrid,
  position: Position,
  size: Size
): boolean {
  const dimensions = grid.getDimensions();
  
  // Check bounds
  if (!isAreaWithinBounds(position, size, dimensions.width, dimensions.height)) {
    return false;
  }
  
  // Check if area is available for building
  return grid.isAreaAvailable(position, size);
}

/**
 * Find valid placement positions around a target position
 */
export function findValidPlacementPositions(
  grid: WorldGrid,
  targetPosition: Position,
  size: Size,
  maxDistance: number = 5
): Position[] {
  const validPositions: Position[] = [];
  const dimensions = grid.getDimensions();
  
  for (let distance = 1; distance <= maxDistance; distance++) {
    // Check positions in a square pattern around the target
    for (let dx = -distance; dx <= distance; dx++) {
      for (let dy = -distance; dy <= distance; dy++) {
        // Only check positions on the perimeter of the current distance
        if (Math.abs(dx) !== distance && Math.abs(dy) !== distance) {
          continue;
        }
        
        const checkPos = {
          x: targetPosition.x + dx,
          y: targetPosition.y + dy
        };
        
        if (isPlacementValid(grid, checkPos, size)) {
          validPositions.push(checkPos);
        }
      }
    }
    
    // If we found valid positions at this distance, return them
    if (validPositions.length > 0) {
      break;
    }
  }
  
  return validPositions;
}

/**
 * Get the closest valid position to a target position
 */
export function getClosestValidPosition(
  grid: WorldGrid,
  targetPosition: Position,
  size: Size,
  maxDistance: number = 10
): Position | null {
  const validPositions = findValidPlacementPositions(grid, targetPosition, size, maxDistance);
  
  if (validPositions.length === 0) {
    return null;
  }
  
  // Find the closest position
  let closestPosition = validPositions[0];
  let closestDistance = Math.abs(closestPosition.x - targetPosition.x) + 
                       Math.abs(closestPosition.y - targetPosition.y);
  
  for (let i = 1; i < validPositions.length; i++) {
    const distance = Math.abs(validPositions[i].x - targetPosition.x) + 
                    Math.abs(validPositions[i].y - targetPosition.y);
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPosition = validPositions[i];
    }
  }
  
  return closestPosition;
}

/**
 * Check if a path between two positions is clear (all tiles are walkable)
 */
export function isPathClear(
  grid: WorldGrid,
  startPos: Position,
  endPos: Position
): boolean {
  // Simple line-of-sight check using Bresenham's line algorithm
  const positions = getLinePositions(startPos, endPos);
  
  for (const pos of positions) {
    if (!grid.isWalkable(pos)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get all positions along a line between two points (Bresenham's algorithm)
 */
export function getLinePositions(start: Position, end: Position): Position[] {
  const positions: Position[] = [];
  
  let x0 = Math.floor(start.x);
  let y0 = Math.floor(start.y);
  const x1 = Math.floor(end.x);
  const y1 = Math.floor(end.y);
  
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  
  while (true) {
    positions.push({ x: x0, y: y0 });
    
    if (x0 === x1 && y0 === y1) {
      break;
    }
    
    const e2 = 2 * err;
    
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
  
  return positions;
}

/**
 * Check if an entity can be placed without blocking essential paths
 */
export function wouldBlockEssentialPaths(
  grid: WorldGrid,
  position: Position,
  size: Size,
  essentialPaths: Position[][] = []
): boolean {
  // Create a temporary copy of the grid with the entity placed
  const tempGrid = new WorldGrid(grid.getDimensions().width, grid.getDimensions().height);
  
  // Copy current grid state
  for (let y = 0; y < grid.getDimensions().height; y++) {
    for (let x = 0; x < grid.getDimensions().width; x++) {
      const tile = grid.getTile({ x, y });
      if (tile) {
        tempGrid.setTile({ x, y }, tile);
      }
    }
  }
  
  // Temporarily place the entity
  const affectedPositions = getPositionsInArea(position, size);
  for (const pos of affectedPositions) {
    tempGrid.setTile(pos, { walkable: false, buildable: false });
  }
  
  // Check if essential paths are still clear
  for (const path of essentialPaths) {
    for (let i = 0; i < path.length - 1; i++) {
      if (!isPathClear(tempGrid, path[i], path[i + 1])) {
        return true; // Would block an essential path
      }
    }
  }
  
  return false;
}