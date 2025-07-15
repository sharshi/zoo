import { describe, it, expect, beforeEach } from 'vitest';
import { EntityManager, ComponentQuery } from '../src/entities/EntityManager';
import { Entity } from '../src/entities/Entity';
import { Component } from '../src/utils/types';

// Test components for testing
interface TestComponent extends Component {
  type: 'test';
  value: number;
}

interface AnotherTestComponent extends Component {
  type: 'another';
  name: string;
}

interface ThirdTestComponent extends Component {
  type: 'third';
  flag: boolean;
}

function createTestComponent(value: number): TestComponent {
  return { type: 'test', value };
}

function createAnotherTestComponent(name: string): AnotherTestComponent {
  return { type: 'another', name };
}

function createThirdTestComponent(flag: boolean): ThirdTestComponent {
  return { type: 'third', flag };
}

describe('EntityManager', () => {
  let entityManager: EntityManager;

  beforeEach(() => {
    entityManager = new EntityManager();
  });

  describe('entity creation and management', () => {
    it('should create entity with unique ID', () => {
      const entity1 = entityManager.createEntity();
      const entity2 = entityManager.createEntity();
      
      expect(entity1.id).toBeDefined();
      expect(entity2.id).toBeDefined();
      expect(entity1.id).not.toBe(entity2.id);
      expect(entityManager.getEntityCount()).toBe(2);
    });

    it('should create entity with custom ID', () => {
      const customId = 'custom-entity-id';
      const entity = entityManager.createEntity(customId);
      
      expect(entity.id).toBe(customId);
      expect(entityManager.getEntity(customId)).toBe(entity);
    });

    it('should get entity by ID', () => {
      const entity = entityManager.createEntity();
      
      const retrieved = entityManager.getEntity(entity.id);
      
      expect(retrieved).toBe(entity);
    });

    it('should return undefined for non-existent entity', () => {
      const retrieved = entityManager.getEntity('non-existent');
      
      expect(retrieved).toBeUndefined();
    });

    it('should remove entity successfully', () => {
      const entity = entityManager.createEntity();
      const entityId = entity.id;
      
      const result = entityManager.removeEntity(entityId);
      
      expect(result).toBe(true);
      expect(entityManager.getEntity(entityId)).toBeUndefined();
      expect(entityManager.getEntityCount()).toBe(0);
      expect(entity.getIsActive()).toBe(false); // Entity should be deactivated
    });

    it('should return false when removing non-existent entity', () => {
      const result = entityManager.removeEntity('non-existent');
      
      expect(result).toBe(false);
    });

    it('should get all entities', () => {
      const entity1 = entityManager.createEntity();
      const entity2 = entityManager.createEntity();
      
      const allEntities = entityManager.getAllEntities();
      
      expect(allEntities).toHaveLength(2);
      expect(allEntities).toContain(entity1);
      expect(allEntities).toContain(entity2);
    });

    it('should exclude inactive entities by default', () => {
      const entity1 = entityManager.createEntity();
      const entity2 = entityManager.createEntity();
      entity2.deactivate();
      
      const activeEntities = entityManager.getAllEntities();
      const allEntities = entityManager.getAllEntities(true);
      
      expect(activeEntities).toHaveLength(1);
      expect(activeEntities).toContain(entity1);
      expect(allEntities).toHaveLength(2);
    });

    it('should clear all entities', () => {
      const entity1 = entityManager.createEntity();
      const entity2 = entityManager.createEntity();
      
      entityManager.clear();
      
      expect(entityManager.getEntityCount()).toBe(0);
      expect(entityManager.getAllEntities()).toEqual([]);
      expect(entity1.getIsActive()).toBe(false);
      expect(entity2.getIsActive()).toBe(false);
    });
  });

  describe('component management through EntityManager', () => {
    it('should add component to entity', () => {
      const entity = entityManager.createEntity();
      const component = createTestComponent(42);
      
      const result = entityManager.addComponentToEntity(entity.id, component);
      
      expect(result).toBe(true);
      expect(entity.hasComponent('test')).toBe(true);
      expect(entityManager.getEntityCountByComponent('test')).toBe(1);
    });

    it('should return false when adding component to non-existent entity', () => {
      const component = createTestComponent(42);
      
      const result = entityManager.addComponentToEntity('non-existent', component);
      
      expect(result).toBe(false);
    });

    it('should remove component from entity', () => {
      const entity = entityManager.createEntity();
      const component = createTestComponent(42);
      entity.addComponent(component);
      entityManager.registerEntityComponent(entity.id, 'test');
      
      const result = entityManager.removeComponentFromEntity(entity.id, 'test');
      
      expect(result).toBe(true);
      expect(entity.hasComponent('test')).toBe(false);
      expect(entityManager.getEntityCountByComponent('test')).toBe(0);
    });

    it('should return false when removing component from non-existent entity', () => {
      const result = entityManager.removeComponentFromEntity('non-existent', 'test');
      
      expect(result).toBe(false);
    });
  });

  describe('component registry', () => {
    it('should register entity component', () => {
      const entity = entityManager.createEntity();
      
      entityManager.registerEntityComponent(entity.id, 'test');
      
      expect(entityManager.getEntityCountByComponent('test')).toBe(1);
      expect(entityManager.getRegisteredComponentTypes()).toContain('test');
    });

    it('should unregister entity component', () => {
      const entity = entityManager.createEntity();
      entityManager.registerEntityComponent(entity.id, 'test');
      
      entityManager.unregisterEntityComponent(entity.id, 'test');
      
      expect(entityManager.getEntityCountByComponent('test')).toBe(0);
      expect(entityManager.getRegisteredComponentTypes()).not.toContain('test');
    });

    it('should handle multiple entities with same component type', () => {
      const entity1 = entityManager.createEntity();
      const entity2 = entityManager.createEntity();
      
      entityManager.registerEntityComponent(entity1.id, 'test');
      entityManager.registerEntityComponent(entity2.id, 'test');
      
      expect(entityManager.getEntityCountByComponent('test')).toBe(2);
      
      entityManager.unregisterEntityComponent(entity1.id, 'test');
      
      expect(entityManager.getEntityCountByComponent('test')).toBe(1);
      expect(entityManager.getRegisteredComponentTypes()).toContain('test');
    });

    it('should rebuild component registry', () => {
      const entity1 = entityManager.createEntity();
      const entity2 = entityManager.createEntity();
      
      entity1.addComponent(createTestComponent(42));
      entity2.addComponent(createAnotherTestComponent('test'));
      
      // Registry should be empty initially
      expect(entityManager.getEntityCountByComponent('test')).toBe(0);
      expect(entityManager.getEntityCountByComponent('another')).toBe(0);
      
      entityManager.rebuildComponentRegistry();
      
      expect(entityManager.getEntityCountByComponent('test')).toBe(1);
      expect(entityManager.getEntityCountByComponent('another')).toBe(1);
    });
  });

  describe('entity queries', () => {
    let entity1: Entity;
    let entity2: Entity;
    let entity3: Entity;

    beforeEach(() => {
      entity1 = entityManager.createEntity();
      entity2 = entityManager.createEntity();
      entity3 = entityManager.createEntity();
      
      // Entity1: test, another
      entity1.addComponent(createTestComponent(42));
      entity1.addComponent(createAnotherTestComponent('entity1'));
      entityManager.registerEntityComponent(entity1.id, 'test');
      entityManager.registerEntityComponent(entity1.id, 'another');
      
      // Entity2: test, third
      entity2.addComponent(createTestComponent(100));
      entity2.addComponent(createThirdTestComponent(true));
      entityManager.registerEntityComponent(entity2.id, 'test');
      entityManager.registerEntityComponent(entity2.id, 'third');
      
      // Entity3: another
      entity3.addComponent(createAnotherTestComponent('entity3'));
      entityManager.registerEntityComponent(entity3.id, 'another');
    });

    it('should get entities with single component', () => {
      const entitiesWithTest = entityManager.getEntitiesWithComponent('test');
      const entitiesWithAnother = entityManager.getEntitiesWithComponent('another');
      const entitiesWithThird = entityManager.getEntitiesWithComponent('third');
      
      expect(entitiesWithTest).toHaveLength(2);
      expect(entitiesWithTest).toContain(entity1);
      expect(entitiesWithTest).toContain(entity2);
      
      expect(entitiesWithAnother).toHaveLength(2);
      expect(entitiesWithAnother).toContain(entity1);
      expect(entitiesWithAnother).toContain(entity3);
      
      expect(entitiesWithThird).toHaveLength(1);
      expect(entitiesWithThird).toContain(entity2);
    });

    it('should get entities with multiple components', () => {
      const entitiesWithTestAndAnother = entityManager.getEntitiesWithComponents('test', 'another');
      const entitiesWithTestAndThird = entityManager.getEntitiesWithComponents('test', 'third');
      const entitiesWithAll = entityManager.getEntitiesWithComponents('test', 'another', 'third');
      
      expect(entitiesWithTestAndAnother).toHaveLength(1);
      expect(entitiesWithTestAndAnother).toContain(entity1);
      
      expect(entitiesWithTestAndThird).toHaveLength(1);
      expect(entitiesWithTestAndThird).toContain(entity2);
      
      expect(entitiesWithAll).toHaveLength(0);
    });

    it('should return empty array for non-existent component', () => {
      const entities = entityManager.getEntitiesWithComponent('nonexistent');
      
      expect(entities).toEqual([]);
    });

    it('should handle advanced queries with all constraint', () => {
      const query: ComponentQuery = {
        all: ['test', 'another']
      };
      
      const result = entityManager.queryEntities(query);
      
      expect(result).toHaveLength(1);
      expect(result).toContain(entity1);
    });

    it('should handle advanced queries with any constraint', () => {
      const query: ComponentQuery = {
        any: ['another', 'third']
      };
      
      const result = entityManager.queryEntities(query);
      
      expect(result).toHaveLength(3); // All entities have either 'another' or 'third'
    });

    it('should handle advanced queries with none constraint', () => {
      const query: ComponentQuery = {
        none: ['third']
      };
      
      const result = entityManager.queryEntities(query);
      
      expect(result).toHaveLength(2);
      expect(result).toContain(entity1);
      expect(result).toContain(entity3);
      expect(result).not.toContain(entity2);
    });

    it('should handle complex queries with multiple constraints', () => {
      const query: ComponentQuery = {
        all: ['test'],
        none: ['third']
      };
      
      const result = entityManager.queryEntities(query);
      
      expect(result).toHaveLength(1);
      expect(result).toContain(entity1);
    });

    it('should return all entities for empty query', () => {
      const query: ComponentQuery = {};
      
      const result = entityManager.queryEntities(query);
      
      expect(result).toHaveLength(3);
    });
  });

  describe('consistency validation', () => {
    it('should validate consistent state', () => {
      const entity = entityManager.createEntity();
      entity.addComponent(createTestComponent(42));
      entityManager.registerEntityComponent(entity.id, 'test');
      
      const validation = entityManager.validateConsistency();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should detect entity in registry but not in manager', () => {
      entityManager.registerEntityComponent('non-existent', 'test');
      
      const validation = entityManager.validateConsistency();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain('non-existent entity');
    });

    it('should detect entity with component not in registry', () => {
      const entity = entityManager.createEntity();
      entity.addComponent(createTestComponent(42));
      // Don't register the component
      
      const validation = entityManager.validateConsistency();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain('not registered');
    });

    it('should detect entity registered for component it doesn\'t have', () => {
      const entity = entityManager.createEntity();
      entityManager.registerEntityComponent(entity.id, 'test');
      // Entity doesn't actually have the component
      
      const validation = entityManager.validateConsistency();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain('doesn\'t have it');
    });
  });

  describe('entity removal with registry cleanup', () => {
    it('should clean up component registry when removing entity', () => {
      const entity = entityManager.createEntity();
      entity.addComponent(createTestComponent(42));
      entity.addComponent(createAnotherTestComponent('test'));
      entityManager.registerEntityComponent(entity.id, 'test');
      entityManager.registerEntityComponent(entity.id, 'another');
      
      expect(entityManager.getEntityCountByComponent('test')).toBe(1);
      expect(entityManager.getEntityCountByComponent('another')).toBe(1);
      
      entityManager.removeEntity(entity.id);
      
      expect(entityManager.getEntityCountByComponent('test')).toBe(0);
      expect(entityManager.getEntityCountByComponent('another')).toBe(0);
      expect(entityManager.getRegisteredComponentTypes()).not.toContain('test');
      expect(entityManager.getRegisteredComponentTypes()).not.toContain('another');
    });

    it('should not affect other entities when removing one', () => {
      const entity1 = entityManager.createEntity();
      const entity2 = entityManager.createEntity();
      
      entity1.addComponent(createTestComponent(42));
      entity2.addComponent(createTestComponent(100));
      entityManager.registerEntityComponent(entity1.id, 'test');
      entityManager.registerEntityComponent(entity2.id, 'test');
      
      expect(entityManager.getEntityCountByComponent('test')).toBe(2);
      
      entityManager.removeEntity(entity1.id);
      
      expect(entityManager.getEntityCountByComponent('test')).toBe(1);
      expect(entityManager.getRegisteredComponentTypes()).toContain('test');
      expect(entityManager.getEntitiesWithComponent('test')).toContain(entity2);
    });
  });
});