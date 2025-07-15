import { Entity } from './Entity';
import { EntityId, Component } from '../utils/types';

export type ComponentQuery = {
  all?: string[];
  any?: string[];
  none?: string[];
};

export class EntityManager {
  private entities: Map<EntityId, Entity>;
  private componentRegistry: Map<string, Set<EntityId>>;

  constructor() {
    this.entities = new Map();
    this.componentRegistry = new Map();
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
   * Remove an entity and clean up component registry
   */
  removeEntity(id: EntityId): boolean {
    const entity = this.entities.get(id);
    if (!entity) {
      return false;
    }

    // Remove from component registry
    for (const componentType of entity.getComponentTypes()) {
      this.unregisterEntityComponent(id, componentType);
    }

    // Deactivate entity before removal
    entity.deactivate();
    
    return this.entities.delete(id);
  }

  /**
   * Get all entities (only active ones by default)
   */
  getAllEntities(includeInactive = false): Entity[] {
    const entities = Array.from(this.entities.values());
    return includeInactive ? entities : entities.filter(entity => entity.getIsActive());
  }

  /**
   * Get entities that have all specified components
   */
  getEntitiesWithComponents(...componentTypes: string[]): Entity[] {
    if (componentTypes.length === 0) {
      return this.getAllEntities();
    }

    // Use component registry for efficient lookup
    const firstComponentType = componentTypes[0];
    const candidateIds = this.componentRegistry.get(firstComponentType);
    
    if (!candidateIds || candidateIds.size === 0) {
      return [];
    }

    const result: Entity[] = [];
    for (const entityId of candidateIds) {
      const entity = this.entities.get(entityId);
      if (entity && entity.getIsActive() && entity.hasComponents(...componentTypes)) {
        result.push(entity);
      }
    }

    return result;
  }

  /**
   * Get entities by component type
   */
  getEntitiesWithComponent<T extends Component>(componentType: string): Entity[] {
    return this.getEntitiesWithComponents(componentType);
  }

  /**
   * Advanced entity query system
   */
  queryEntities(query: ComponentQuery): Entity[] {
    let candidates = this.getAllEntities();

    // Filter by 'all' components (must have all)
    if (query.all && query.all.length > 0) {
      candidates = candidates.filter(entity => entity.hasComponents(...query.all!));
    }

    // Filter by 'any' components (must have at least one)
    if (query.any && query.any.length > 0) {
      candidates = candidates.filter(entity => 
        query.any!.some(type => entity.hasComponent(type))
      );
    }

    // Filter by 'none' components (must not have any)
    if (query.none && query.none.length > 0) {
      candidates = candidates.filter(entity => 
        !query.none!.some(type => entity.hasComponent(type))
      );
    }

    return candidates;
  }

  /**
   * Register an entity's component in the registry
   */
  registerEntityComponent(entityId: EntityId, componentType: string): void {
    if (!this.componentRegistry.has(componentType)) {
      this.componentRegistry.set(componentType, new Set());
    }
    this.componentRegistry.get(componentType)!.add(entityId);
  }

  /**
   * Unregister an entity's component from the registry
   */
  unregisterEntityComponent(entityId: EntityId, componentType: string): void {
    const entitySet = this.componentRegistry.get(componentType);
    if (entitySet) {
      entitySet.delete(entityId);
      if (entitySet.size === 0) {
        this.componentRegistry.delete(componentType);
      }
    }
  }

  /**
   * Add a component to an entity and update registry
   */
  addComponentToEntity<T extends Component>(entityId: EntityId, component: T): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) {
      return false;
    }

    try {
      entity.addComponent(component);
      this.registerEntityComponent(entityId, component.type);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove a component from an entity and update registry
   */
  removeComponentFromEntity(entityId: EntityId, componentType: string): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) {
      return false;
    }

    const success = entity.removeComponent(componentType);
    if (success) {
      this.unregisterEntityComponent(entityId, componentType);
    }
    return success;
  }

  /**
   * Get all registered component types
   */
  getRegisteredComponentTypes(): string[] {
    return Array.from(this.componentRegistry.keys());
  }

  /**
   * Get entity count by component type
   */
  getEntityCountByComponent(componentType: string): number {
    const entitySet = this.componentRegistry.get(componentType);
    return entitySet ? entitySet.size : 0;
  }

  /**
   * Clear all entities and registry
   */
  clear(): void {
    // Deactivate all entities first
    for (const entity of this.entities.values()) {
      entity.deactivate();
    }
    
    this.entities.clear();
    this.componentRegistry.clear();
  }

  /**
   * Get entity count (active only by default)
   */
  getEntityCount(includeInactive = false): number {
    if (includeInactive) {
      return this.entities.size;
    }
    return this.getAllEntities().length;
  }

  /**
   * Validate entity-component consistency
   */
  validateConsistency(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check that all entities in component registry exist
    for (const [componentType, entityIds] of this.componentRegistry) {
      for (const entityId of entityIds) {
        const entity = this.entities.get(entityId);
        if (!entity) {
          errors.push(`Component registry contains non-existent entity ${entityId} for component ${componentType}`);
        } else if (!entity.hasComponent(componentType)) {
          errors.push(`Entity ${entityId} is registered for component ${componentType} but doesn't have it`);
        }
      }
    }

    // Check that all entity components are registered
    for (const entity of this.entities.values()) {
      for (const componentType of entity.getComponentTypes()) {
        const registeredEntities = this.componentRegistry.get(componentType);
        if (!registeredEntities || !registeredEntities.has(entity.id)) {
          errors.push(`Entity ${entity.id} has component ${componentType} but is not registered`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Rebuild component registry from current entities
   */
  rebuildComponentRegistry(): void {
    this.componentRegistry.clear();
    
    for (const entity of this.entities.values()) {
      for (const componentType of entity.getComponentTypes()) {
        this.registerEntityComponent(entity.id, componentType);
      }
    }
  }
}