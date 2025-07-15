import { describe, it, expect, beforeEach } from 'vitest';
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

function createTestComponent(value: number): TestComponent {
  return { type: 'test', value };
}

function createAnotherTestComponent(name: string): AnotherTestComponent {
  return { type: 'another', name };
}

describe('Entity', () => {
  let entity: Entity;

  beforeEach(() => {
    entity = new Entity();
  });

  describe('constructor', () => {
    it('should create entity with unique ID', () => {
      const entity1 = new Entity();
      const entity2 = new Entity();
      
      expect(entity1.id).toBeDefined();
      expect(entity2.id).toBeDefined();
      expect(entity1.id).not.toBe(entity2.id);
    });

    it('should create entity with provided ID', () => {
      const customId = 'custom-entity-id';
      const entity = new Entity(customId);
      
      expect(entity.id).toBe(customId);
    });

    it('should start as active', () => {
      expect(entity.getIsActive()).toBe(true);
    });

    it('should start with no components', () => {
      expect(entity.getComponentCount()).toBe(0);
      expect(entity.getAllComponents()).toEqual([]);
      expect(entity.getComponentTypes()).toEqual([]);
    });
  });

  describe('component management', () => {
    it('should add component successfully', () => {
      const component = createTestComponent(42);
      
      const result = entity.addComponent(component);
      
      expect(result).toBe(entity); // Should return this for chaining
      expect(entity.hasComponent('test')).toBe(true);
      expect(entity.getComponent<TestComponent>('test')).toBe(component);
      expect(entity.getComponentCount()).toBe(1);
    });

    it('should allow method chaining when adding components', () => {
      const testComponent = createTestComponent(42);
      const anotherComponent = createAnotherTestComponent('test');
      
      const result = entity
        .addComponent(testComponent)
        .addComponent(anotherComponent);
      
      expect(result).toBe(entity);
      expect(entity.getComponentCount()).toBe(2);
      expect(entity.hasComponent('test')).toBe(true);
      expect(entity.hasComponent('another')).toBe(true);
    });

    it('should replace component of same type', () => {
      const component1 = createTestComponent(42);
      const component2 = createTestComponent(100);
      
      entity.addComponent(component1);
      entity.addComponent(component2);
      
      expect(entity.getComponentCount()).toBe(1);
      expect(entity.getComponent<TestComponent>('test')?.value).toBe(100);
    });

    it('should get component by type', () => {
      const component = createTestComponent(42);
      entity.addComponent(component);
      
      const retrieved = entity.getComponent<TestComponent>('test');
      
      expect(retrieved).toBe(component);
      expect(retrieved?.value).toBe(42);
    });

    it('should return undefined for non-existent component', () => {
      const retrieved = entity.getComponent<TestComponent>('nonexistent');
      
      expect(retrieved).toBeUndefined();
    });

    it('should check if entity has component', () => {
      expect(entity.hasComponent('test')).toBe(false);
      
      entity.addComponent(createTestComponent(42));
      
      expect(entity.hasComponent('test')).toBe(true);
      expect(entity.hasComponent('nonexistent')).toBe(false);
    });

    it('should check if entity has multiple components', () => {
      expect(entity.hasComponents('test', 'another')).toBe(false);
      
      entity.addComponent(createTestComponent(42));
      expect(entity.hasComponents('test', 'another')).toBe(false);
      
      entity.addComponent(createAnotherTestComponent('test'));
      expect(entity.hasComponents('test', 'another')).toBe(true);
      expect(entity.hasComponents('test', 'nonexistent')).toBe(false);
    });

    it('should remove component successfully', () => {
      const component = createTestComponent(42);
      entity.addComponent(component);
      
      const result = entity.removeComponent('test');
      
      expect(result).toBe(true);
      expect(entity.hasComponent('test')).toBe(false);
      expect(entity.getComponentCount()).toBe(0);
    });

    it('should return false when removing non-existent component', () => {
      const result = entity.removeComponent('nonexistent');
      
      expect(result).toBe(false);
    });

    it('should get all components', () => {
      const testComponent = createTestComponent(42);
      const anotherComponent = createAnotherTestComponent('test');
      
      entity.addComponent(testComponent);
      entity.addComponent(anotherComponent);
      
      const allComponents = entity.getAllComponents();
      
      expect(allComponents).toHaveLength(2);
      expect(allComponents).toContain(testComponent);
      expect(allComponents).toContain(anotherComponent);
    });

    it('should get all component types', () => {
      entity.addComponent(createTestComponent(42));
      entity.addComponent(createAnotherTestComponent('test'));
      
      const types = entity.getComponentTypes();
      
      expect(types).toHaveLength(2);
      expect(types).toContain('test');
      expect(types).toContain('another');
    });

    it('should clear all components', () => {
      entity.addComponent(createTestComponent(42));
      entity.addComponent(createAnotherTestComponent('test'));
      
      entity.clearComponents();
      
      expect(entity.getComponentCount()).toBe(0);
      expect(entity.getAllComponents()).toEqual([]);
      expect(entity.getComponentTypes()).toEqual([]);
    });
  });

  describe('entity lifecycle', () => {
    it('should deactivate entity', () => {
      entity.deactivate();
      
      expect(entity.getIsActive()).toBe(false);
    });

    it('should reactivate entity', () => {
      entity.deactivate();
      entity.reactivate();
      
      expect(entity.getIsActive()).toBe(true);
    });

    it('should prevent adding components to inactive entity', () => {
      entity.deactivate();
      
      expect(() => {
        entity.addComponent(createTestComponent(42));
      }).toThrow('Cannot add component to inactive entity');
    });

    it('should prevent removing components from inactive entity', () => {
      entity.addComponent(createTestComponent(42));
      entity.deactivate();
      
      const result = entity.removeComponent('test');
      
      expect(result).toBe(false);
      expect(entity.hasComponent('test')).toBe(true); // Component should still be there
    });

    it('should prevent clearing components from inactive entity', () => {
      entity.addComponent(createTestComponent(42));
      entity.deactivate();
      
      entity.clearComponents();
      
      expect(entity.getComponentCount()).toBe(1); // Component should still be there
    });
  });

  describe('serialization', () => {
    it('should serialize entity with components', () => {
      const testComponent = createTestComponent(42);
      const anotherComponent = createAnotherTestComponent('test');
      
      entity.addComponent(testComponent);
      entity.addComponent(anotherComponent);
      
      const serialized = entity.serialize();
      
      expect(serialized.id).toBe(entity.id);
      expect(serialized.isActive).toBe(true);
      expect(serialized.components).toHaveProperty('test');
      expect(serialized.components).toHaveProperty('another');
      expect(serialized.components.test).toEqual(testComponent);
      expect(serialized.components.another).toEqual(anotherComponent);
    });

    it('should serialize inactive entity', () => {
      entity.addComponent(createTestComponent(42));
      entity.deactivate();
      
      const serialized = entity.serialize();
      
      expect(serialized.isActive).toBe(false);
    });

    it('should serialize entity with no components', () => {
      const serialized = entity.serialize();
      
      expect(serialized.id).toBe(entity.id);
      expect(serialized.isActive).toBe(true);
      expect(serialized.components).toEqual({});
    });
  });
});