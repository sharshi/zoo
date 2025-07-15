import { Component, EntityId, Size } from '../utils/types';

export interface EnclosureComponent extends Component {
  type: 'enclosure';
  animalType: string;
  capacity: number;
  currentAnimals: EntityId[];
  maintenanceCost: number;
  constructionCost: number;
  size: Size;
}

export function createEnclosureComponent(
  animalType: string,
  capacity: number,
  maintenanceCost: number,
  constructionCost: number,
  size: Size
): EnclosureComponent {
  return {
    type: 'enclosure',
    animalType,
    capacity,
    currentAnimals: [],
    maintenanceCost,
    constructionCost,
    size
  };
}