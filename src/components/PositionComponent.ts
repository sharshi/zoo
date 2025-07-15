import { Component, Position } from '../utils/types';

export interface PositionComponent extends Component {
  type: 'position';
  position: Position;
  previousPosition: Position;
}

export function createPositionComponent(x: number, y: number): PositionComponent {
  const position = { x, y };
  return {
    type: 'position',
    position,
    previousPosition: { ...position }
  };
}