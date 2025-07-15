import { describe, it, expect, beforeEach } from 'vitest';
import { EntityManager } from '../src/entities/EntityManager';
import { Entity } from '../src/entities/Entity';
import { createPositionComponent } from '../src/components/PositionComponent';
import { createAnimalComponent } from '../src/components/AnimalComponent';
import { createEnclosureComponent } from '../src/components/EnclosureComponent';

describe('ECS Integration with Zoo Tycoon Components', () => {
  let entityManager: EntityManager;

  beforeEach(() => {
    entityManager = new EntityManager();
  });

  describe('animal entity management', () => {
    it('should create and manage animal entities', () => {
      // Create an animal entity
      const animal = entityManager.createEntity();
      
      // Add components
      const positionComponent = createPositionComponent(10, 15);
      const animalComponent = createAnimalComponent('lion', 50, 80);
      
      animal.addComponent(positionComponent);
      animal.addComponent(animalComponent);
      
      // Register components
      entityManager.registerEntityComponent(animal.id, 'position');
      entityManager.registerEntityComponent(animal.id, 'animal');
      
      // Verify the animal entity
      expect(animal.hasComponents('position', 'animal')).toBe(true);
      expect(animal.getComponent('position')?.position).toEqual({ x: 10, y: 15 });
      expect(animal.getComponent('animal')?.species).toBe('lion');
      expect(animal.getComponent('animal')?.hungerLevel).toBe(100);
      expect(animal.getComponent('animal')?.happinessLevel).toBe(100);
    });

    it('should query animals by position and type', () => {
      // Create multiple animals
      const lion = entityManager.createEntity();
      const tiger = entityManager.createEntity();
      const elephant = entityManager.createEntity();
      
      // Add components to lion
      lion.addComponent(createPositionComponent(5, 5));
      lion.addComponent(createAnimalComponent('lion', 50, 80));
      entityManager.registerEntityComponent(lion.id, 'position');
      entityManager.registerEntityComponent(lion.id, 'animal');
      
      // Add components to tiger
      tiger.addComponent(createPositionComponent(10, 10));
      tiger.addComponent(createAnimalComponent('tiger', 60, 85));
      entityManager.registerEntityComponent(tiger.id, 'position');
      entityManager.registerEntityComponent(tiger.id, 'animal');
      
      // Add only position to elephant (not an animal yet)
      elephant.addComponent(createPositionComponent(15, 15));
      entityManager.registerEntityComponent(elephant.id, 'position');
      
      // Query all animals (entities with both position and animal components)
      const animals = entityManager.getEntitiesWithComponents('position', 'animal');
      
      expect(animals).toHaveLength(2);
      expect(animals).toContain(lion);
      expect(animals).toContain(tiger);
      expect(animals).not.toContain(elephant);
      
      // Query all positioned entities
      const positionedEntities = entityManager.getEntitiesWithComponent('position');
      expect(positionedEntities).toHaveLength(3);
    });
  });

  describe('enclosure entity management', () => {
    it('should create and manage enclosure entities', () => {
      // Create an enclosure entity
      const enclosure = entityManager.createEntity();
      
      // Add components
      const positionComponent = createPositionComponent(0, 0);
      const enclosureComponent = createEnclosureComponent('lion', 4, 100, 500, { width: 3, height: 3 });
      
      enclosure.addComponent(positionComponent);
      enclosure.addComponent(enclosureComponent);
      
      // Register components
      entityManager.registerEntityComponent(enclosure.id, 'position');
      entityManager.registerEntityComponent(enclosure.id, 'enclosure');
      
      // Verify the enclosure entity
      expect(enclosure.hasComponents('position', 'enclosure')).toBe(true);
      expect(enclosure.getComponent('enclosure')?.animalType).toBe('lion');
      expect(enclosure.getComponent('enclosure')?.capacity).toBe(4);
      expect(enclosure.getComponent('enclosure')?.currentAnimals).toEqual([]);
    });

    it('should manage animals in enclosures', () => {
      // Create enclosure
      const enclosure = entityManager.createEntity();
      enclosure.addComponent(createPositionComponent(0, 0));
      enclosure.addComponent(createEnclosureComponent('lion', 2, 100, 500, { width: 3, height: 3 }));
      entityManager.registerEntityComponent(enclosure.id, 'position');
      entityManager.registerEntityComponent(enclosure.id, 'enclosure');
      
      // Create animals
      const lion1 = entityManager.createEntity();
      const lion2 = entityManager.createEntity();
      
      lion1.addComponent(createPositionComponent(1, 1));
      lion1.addComponent(createAnimalComponent('lion', 50, 80));
      entityManager.registerEntityComponent(lion1.id, 'position');
      entityManager.registerEntityComponent(lion1.id, 'animal');
      
      lion2.addComponent(createPositionComponent(2, 2));
      lion2.addComponent(createAnimalComponent('lion', 50, 80));
      entityManager.registerEntityComponent(lion2.id, 'position');
      entityManager.registerEntityComponent(lion2.id, 'animal');
      
      // Add animals to enclosure
      const enclosureComp = enclosure.getComponent('enclosure')!;
      enclosureComp.currentAnimals.push(lion1.id, lion2.id);
      
      // Verify relationships
      expect(enclosureComp.currentAnimals).toHaveLength(2);
      expect(enclosureComp.currentAnimals).toContain(lion1.id);
      expect(enclosureComp.currentAnimals).toContain(lion2.id);
      
      // Query all enclosures
      const enclosures = entityManager.getEntitiesWithComponent('enclosure');
      expect(enclosures).toHaveLength(1);
      expect(enclosures[0]).toBe(enclosure);
    });
  });

  describe('complex queries for game systems', () => {
    beforeEach(() => {
      // Set up a complex zoo scenario
      
      // Create lion enclosure with 2 lions
      const lionEnclosure = entityManager.createEntity();
      lionEnclosure.addComponent(createPositionComponent(0, 0));
      lionEnclosure.addComponent(createEnclosureComponent('lion', 4, 100, 500, { width: 3, height: 3 }));
      entityManager.registerEntityComponent(lionEnclosure.id, 'position');
      entityManager.registerEntityComponent(lionEnclosure.id, 'enclosure');
      
      const lion1 = entityManager.createEntity();
      lion1.addComponent(createPositionComponent(1, 1));
      lion1.addComponent(createAnimalComponent('lion', 50, 80));
      entityManager.registerEntityComponent(lion1.id, 'position');
      entityManager.registerEntityComponent(lion1.id, 'animal');
      
      const lion2 = entityManager.createEntity();
      lion2.addComponent(createPositionComponent(2, 2));
      lion2.addComponent(createAnimalComponent('lion', 50, 80));
      entityManager.registerEntityComponent(lion2.id, 'position');
      entityManager.registerEntityComponent(lion2.id, 'animal');
      
      // Create tiger enclosure with 1 tiger
      const tigerEnclosure = entityManager.createEntity();
      tigerEnclosure.addComponent(createPositionComponent(10, 10));
      tigerEnclosure.addComponent(createEnclosureComponent('tiger', 2, 120, 600, { width: 2, height: 2 }));
      entityManager.registerEntityComponent(tigerEnclosure.id, 'position');
      entityManager.registerEntityComponent(tigerEnclosure.id, 'enclosure');
      
      const tiger = entityManager.createEntity();
      tiger.addComponent(createPositionComponent(11, 11));
      tiger.addComponent(createAnimalComponent('tiger', 60, 85));
      entityManager.registerEntityComponent(tiger.id, 'position');
      entityManager.registerEntityComponent(tiger.id, 'animal');
      
      // Create some infrastructure (paths, decorations) - just positioned entities
      const path1 = entityManager.createEntity();
      path1.addComponent(createPositionComponent(5, 5));
      entityManager.registerEntityComponent(path1.id, 'position');
      
      const decoration = entityManager.createEntity();
      decoration.addComponent(createPositionComponent(7, 7));
      entityManager.registerEntityComponent(decoration.id, 'position');
    });

    it('should query all animals for feeding system', () => {
      const animals = entityManager.getEntitiesWithComponent('animal');
      
      expect(animals).toHaveLength(3); // 2 lions + 1 tiger
      
      // Simulate feeding system - reduce hunger for all animals
      animals.forEach(animal => {
        const animalComp = animal.getComponent('animal')!;
        animalComp.hungerLevel = Math.max(0, animalComp.hungerLevel - 10);
        animalComp.lastFedTime = Date.now();
      });
      
      // Verify all animals were processed
      animals.forEach(animal => {
        const animalComp = animal.getComponent('animal')!;
        expect(animalComp.hungerLevel).toBe(90);
      });
    });

    it('should query all enclosures for maintenance system', () => {
      const enclosures = entityManager.getEntitiesWithComponent('enclosure');
      
      expect(enclosures).toHaveLength(2); // lion and tiger enclosures
      
      // Simulate maintenance cost calculation
      let totalMaintenanceCost = 0;
      enclosures.forEach(enclosure => {
        const enclosureComp = enclosure.getComponent('enclosure')!;
        totalMaintenanceCost += enclosureComp.maintenanceCost;
      });
      
      expect(totalMaintenanceCost).toBe(220); // 100 + 120
    });

    it('should query positioned entities for rendering system', () => {
      const positionedEntities = entityManager.getEntitiesWithComponent('position');
      
      expect(positionedEntities).toHaveLength(7); // 2 enclosures + 3 animals + 2 infrastructure
      
      // Simulate rendering system - collect all positions
      const positions = positionedEntities.map(entity => {
        const posComp = entity.getComponent('position')!;
        return { entityId: entity.id, position: posComp.position };
      });
      
      expect(positions).toHaveLength(7);
      expect(positions.some(p => p.position.x === 0 && p.position.y === 0)).toBe(true); // lion enclosure
      expect(positions.some(p => p.position.x === 10 && p.position.y === 10)).toBe(true); // tiger enclosure
    });

    it('should use advanced queries for complex game logic', () => {
      // Find all entities that are positioned but not animals (infrastructure)
      const infrastructure = entityManager.queryEntities({
        all: ['position'],
        none: ['animal', 'enclosure']
      });
      
      expect(infrastructure).toHaveLength(2); // path and decoration
      
      // Find all animal-containing entities (animals and enclosures)
      const animalRelated = entityManager.queryEntities({
        any: ['animal', 'enclosure']
      });
      
      expect(animalRelated).toHaveLength(5); // 3 animals + 2 enclosures
    });
  });

  describe('entity lifecycle in game context', () => {
    it('should handle animal death and cleanup', () => {
      // Create animal
      const animal = entityManager.createEntity();
      animal.addComponent(createPositionComponent(5, 5));
      animal.addComponent(createAnimalComponent('lion', 50, 80));
      entityManager.registerEntityComponent(animal.id, 'position');
      entityManager.registerEntityComponent(animal.id, 'animal');
      
      expect(entityManager.getEntitiesWithComponent('animal')).toHaveLength(1);
      
      // Simulate animal death - remove entity
      entityManager.removeEntity(animal.id);
      
      expect(entityManager.getEntitiesWithComponent('animal')).toHaveLength(0);
      expect(entityManager.getEntityCountByComponent('animal')).toBe(0);
      expect(animal.getIsActive()).toBe(false);
    });

    it('should handle enclosure demolition and animal relocation', () => {
      // Create enclosure with animal
      const enclosure = entityManager.createEntity();
      enclosure.addComponent(createPositionComponent(0, 0));
      enclosure.addComponent(createEnclosureComponent('lion', 2, 100, 500, { width: 3, height: 3 }));
      entityManager.registerEntityComponent(enclosure.id, 'position');
      entityManager.registerEntityComponent(enclosure.id, 'enclosure');
      
      const animal = entityManager.createEntity();
      animal.addComponent(createPositionComponent(1, 1));
      animal.addComponent(createAnimalComponent('lion', 50, 80));
      entityManager.registerEntityComponent(animal.id, 'position');
      entityManager.registerEntityComponent(animal.id, 'animal');
      
      // Add animal to enclosure
      const enclosureComp = enclosure.getComponent('enclosure')!;
      enclosureComp.currentAnimals.push(animal.id);
      
      expect(entityManager.getEntitiesWithComponent('enclosure')).toHaveLength(1);
      expect(entityManager.getEntitiesWithComponent('animal')).toHaveLength(1);
      
      // Simulate enclosure demolition - remove enclosure but keep animal
      entityManager.removeEntity(enclosure.id);
      
      expect(entityManager.getEntitiesWithComponent('enclosure')).toHaveLength(0);
      expect(entityManager.getEntitiesWithComponent('animal')).toHaveLength(1);
      expect(animal.getIsActive()).toBe(true); // Animal should still be active
    });
  });
});