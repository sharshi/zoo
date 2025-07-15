import { Component, EntityId, Position } from '../utils/types';

export interface VisitorComponent extends Component {
  type: 'visitor';
  satisfactionLevel: number; // 0-100
  currentTarget: EntityId | null;
  pathQueue: Position[];
  ticketPrice: number;
  timeInZoo: number;
  visitedEnclosures: EntityId[];
}

export function createVisitorComponent(ticketPrice: number): VisitorComponent {
  return {
    type: 'visitor',
    satisfactionLevel: 50, // Start neutral
    currentTarget: null,
    pathQueue: [],
    ticketPrice,
    timeInZoo: 0,
    visitedEnclosures: []
  };
}