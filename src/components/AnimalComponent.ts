import { Component } from '../utils/types';

export interface AnimalComponent extends Component {
  type: 'animal';
  species: string;
  hungerLevel: number; // 0-100
  happinessLevel: number; // 0-100
  lastFedTime: number;
  maintenanceCost: number;
  visitorAppeal: number;
}

export function createAnimalComponent(
  species: string,
  maintenanceCost: number,
  visitorAppeal: number
): AnimalComponent {
  return {
    type: 'animal',
    species,
    hungerLevel: 100,
    happinessLevel: 100,
    lastFedTime: Date.now(),
    maintenanceCost,
    visitorAppeal
  };
}