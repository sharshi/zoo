import { EntityId, Component } from '../utils/types';
import { generateEntityId } from '../utils/helpers';

export class Entity {
  public readonly id: EntityId;
  private components: Map<string, Component>;

  constructor(id?: EntityId) {
    this.id = id || generateEntityId();
    this.components = new Map();
  }

  /**
   * Add a component to this entity
   */
  addComponent<T extends Component>(component: T): void {
    this.components.set(component.type, component);
  }

  /**
   * Get a component by type
   */
  getComponent<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  /**
   * Check if entity has a component
   */
  hasComponent(type: string): boolean {
    return this.components.has(type);
  }

  /**
   * Remove a component from this entity
   */
  removeComponent(type: string): boolean {
    return this.components.delete(type);
  }

  /**
   * Get all components
   */
  getAllComponents(): Component[] {
    return Array.from(this.components.values());
  }

  /**
   * Get all component types
   */
  getComponentTypes(): string[] {
    return Array.from(this.components.keys());
  }
}