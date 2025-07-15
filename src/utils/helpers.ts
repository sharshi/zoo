// Utility helper functions

import { Position, EntityId } from './types';

/**
 * Generate a unique entity ID
 */
export function generateEntityId(): EntityId {
  return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate distance between two positions
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a position is within bounds
 */
export function isPositionValid(pos: Position, width: number, height: number): boolean {
  return pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Convert world coordinates to grid coordinates
 */
export function worldToGrid(worldPos: Position, tileSize: number): Position {
  return {
    x: Math.floor(worldPos.x / tileSize),
    y: Math.floor(worldPos.y / tileSize)
  };
}

/**
 * Convert grid coordinates to world coordinates
 */
export function gridToWorld(gridPos: Position, tileSize: number): Position {
  return {
    x: gridPos.x * tileSize,
    y: gridPos.y * tileSize
  };
}

/**
 * Convert grid coordinates to world coordinates (center of tile)
 */
export function gridToWorldCenter(gridPos: Position, tileSize: number): Position {
  return {
    x: gridPos.x * tileSize + tileSize / 2,
    y: gridPos.y * tileSize + tileSize / 2
  };
}

/**
 * Snap world coordinates to grid
 */
export function snapToGrid(worldPos: Position, tileSize: number): Position {
  const gridPos = worldToGrid(worldPos, tileSize);
  return gridToWorld(gridPos, tileSize);
}

/**
 * Check if two positions are equal
 */
export function positionsEqual(pos1: Position, pos2: Position): boolean {
  return pos1.x === pos2.x && pos1.y === pos2.y;
}

/**
 * Calculate Manhattan distance between two grid positions
 */
export function manhattanDistance(pos1: Position, pos2: Position): number {
  return Math.abs(pos2.x - pos1.x) + Math.abs(pos2.y - pos1.y);
}

/**
 * Get all positions in a rectangular area
 */
export function getPositionsInArea(position: Position, size: { width: number; height: number }): Position[] {
  const positions: Position[] = [];
  
  for (let y = position.y; y < position.y + size.height; y++) {
    for (let x = position.x; x < position.x + size.width; x++) {
      positions.push({ x, y });
    }
  }
  
  return positions;
}

/**
 * Check if a position is within a rectangular area
 */
export function isPositionInArea(position: Position, areaStart: Position, areaSize: { width: number; height: number }): boolean {
  return position.x >= areaStart.x && 
         position.x < areaStart.x + areaSize.width &&
         position.y >= areaStart.y && 
         position.y < areaStart.y + areaSize.height;
}