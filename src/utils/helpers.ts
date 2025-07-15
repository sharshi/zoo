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