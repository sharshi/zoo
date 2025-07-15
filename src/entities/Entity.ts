import { EntityId, Component } from '../utils/types';
import { generateEntityId } from '../utils/helpers';

export class Entity {
  public readonly id: EntityId;
  private components: Map<string, Component>;
  private isActive: boolean;

  constructor(id?: EntityId) {
    this.id = id || generateEntityId();
    this.components = new Map();
    this.isActive = true;
  }

  /**
   * Add a component to this entity
   */
  addComponent<T extends Component>(component: T): this {
    if (!this.isActive) {
      throw new Error(`Cannot add component to inactive entity ${this.id}`);
    }
    this.components.set(component.type, component);
    return this;
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
   * Check if entity has all specified components
   */
  hasComponents(...types: string[]): boolean {
    return types.every(type => this.hasComponent(type));
  }

  /**
   * Remove a component from this entity
   */
  removeComponent(type: string): boolean {
    if (!this.isActive) {
      return false;
    }
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

  /**
   * Get the number of components
   */
  getComponentCount(): number {
    return this.components.size;
  }

  /**
   * Check if entity is active
   */
  getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Deactivate this entity (prevents further modifications)
   */
  deactivate(): void {
    this.isActive = false;
  }

  /**
   * Reactivate this entity
   */
  reactivate(): void {
    this.isActive = true;
  }

  /**
   * Clear all components
   */
  clearComponents(): void {
    if (!this.isActive) {
      return;
    }
    this.components.clear();
  }

  /**
   * Serialize entity for saving
   */
  serialize(): { id: EntityId; components: Record<string, any>; isActive: boolean } {
    const componentData: Record<string, any> = {};
    
    for (const [type, component] of this.components) {
      // If component has serialize method, use it; otherwise use the component directly
      componentData[type] = (component as any).serialize ? (component as any).serialize() : component;
    }

    return {
      id: this.id,
      components: componentData,
      isActive: this.isActive
    };
  }
}