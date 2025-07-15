import { Entity } from './Entity';
import { EntityId, Component } from '../utils/types';

export class EntityManager {
  private entities: Map<EntityId, Entity>;

  constructor() {
    this.entities = new Map();
  }

  /**
   * Create a new entity
   */
  createEntity(id?: EntityId): Entity {
    const entity = new Entity(id);
    this.entities.set(entity.id, entity);
    return entity;
  }

  /**
   * Get an entity by ID
   */
  getEntity(id: EntityId): Entity | undefined {
    return this.entities.get(id);
  }

  /**
   * Remove an entity
   */
  removeEntity(id: EntityId): boolean {
    return this.entities.delete(id);
  }

  /**
   * Get all entities
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get entities that have specific components
   */
  getEntitiesWithComponents(...componentTypes: string[]): Entity[] {
    return this.getAllEntities().filter(entity =>
      componentTypes.every(type => entity.hasComponent(type))
    );
  }

  /**
   * Get entities by component type
   */
  getEntitiesWithComponent<T extends Component>(componentType: string): Entity[] {
    return this.getAllEntities().filter(entity => entity.hasComponent(componentType));
  }

  /**
   * Clear all entities
   */
  clear(): void {
    this.entities.clear();
  }

  /**
   * Get entity count
   */
  getEntityCount(): number {
    return this.entities.size;
  }
}