import { Component } from '../utils/types';

export interface RenderComponent extends Component {
  type: 'render';
  sprite: string;
  layer: number; // For z-ordering
  visible: boolean;
  scale: number;
  rotation: number;
}

export function createRenderComponent(
  sprite: string,
  layer: number = 0,
  scale: number = 1,
  rotation: number = 0
): RenderComponent {
  return {
    type: 'render',
    sprite,
    layer,
    visible: true,
    scale,
    rotation
  };
}