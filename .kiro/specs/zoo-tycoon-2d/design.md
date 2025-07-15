# Design Document

## Overview

The 2D Zoo Tycoon game will be built using a modular architecture with clear separation between game logic, rendering, and user interface. The game uses a tile-based grid system for world representation, entity-component-system (ECS) pattern for game objects, and a real-time simulation loop with configurable time scaling.

## Architecture

### Core Systems
- **Game Engine**: Main game loop, time management, and system coordination
- **World Manager**: Grid-based world representation and spatial queries
- **Entity Manager**: ECS-based entity creation, updates, and cleanup
- **Rendering System**: 2D sprite rendering with layered drawing
- **Input System**: Mouse and keyboard input handling with context-aware actions
- **UI System**: Game interface, menus, and HUD management
- **Save System**: Serialization and persistence of game state

### Technology Stack
- **Language**: TypeScript/JavaScript for cross-platform compatibility
- **Rendering**: HTML5 Canvas or WebGL for 2D graphics
- **Audio**: Web Audio API for sound effects and music
- **Storage**: LocalStorage/IndexedDB for save games

## Components and Interfaces

### Core Entities

#### Animal Component
```typescript
interface AnimalComponent {
  species: string;
  hungerLevel: number; // 0-100
  happinessLevel: number; // 0-100
  lastFedTime: number;
  maintenanceCost: number;
  visitorAppeal: number;
}
```

#### Enclosure Component
```typescript
interface EnclosureComponent {
  animalType: string;
  capacity: number;
  currentAnimals: EntityId[];
  maintenanceCost: number;
  constructionCost: number;
  size: { width: number; height: number };
}
```

#### Visitor Component
```typescript
interface VisitorComponent {
  satisfactionLevel: number; // 0-100
  currentTarget: EntityId | null;
  pathQueue: Position[];
  ticketPrice: number;
  timeInZoo: number;
  visitedEnclosures: EntityId[];
}
```

#### Financial Component
```typescript
interface FinancialComponent {
  currentFunds: number;
  dailyIncome: number;
  dailyExpenses: number;
  ticketPrice: number;
  reputationScore: number; // 0-100
}
```

### Systems

#### Simulation System
- Updates animal hunger and happiness over time
- Processes visitor movement and satisfaction
- Calculates financial transactions
- Manages time progression and day/night cycles

#### Pathfinding System
- A* algorithm for visitor navigation
- Grid-based movement with obstacle avoidance
- Dynamic path recalculation when zoo layout changes

#### Construction System
- Validates placement locations
- Handles grid snapping and collision detection
- Manages construction costs and prerequisites
- Updates pathfinding grid when structures are added/removed

#### Rendering System
- Layered sprite rendering (ground, buildings, animals, UI)
- Camera management with smooth panning and zooming
- Sprite animation for animals and visitors
- UI overlay rendering

## Data Models

### World Grid
```typescript
interface WorldGrid {
  width: number;
  height: number;
  tiles: TileData[][];
}

interface TileData {
  type: 'grass' | 'path' | 'water' | 'building';
  occupiedBy: EntityId | null;
  walkable: boolean;
  buildable: boolean;
}
```

### Game State
```typescript
interface GameState {
  currentTime: number;
  timeScale: number;
  isPaused: boolean;
  worldGrid: WorldGrid;
  entities: Map<EntityId, Entity>;
  playerStats: PlayerStats;
  gameSettings: GameSettings;
}

interface PlayerStats {
  totalFunds: number;
  zooReputation: number;
  totalVisitors: number;
  animalsOwned: number;
  dayCount: number;
}
```

### Save Data Structure
```typescript
interface SaveData {
  version: string;
  timestamp: number;
  gameState: GameState;
  playerProgress: {
    unlockedAnimals: string[];
    unlockedBuildings: string[];
    achievements: string[];
  };
}
```

## Error Handling

### Input Validation
- Validate all user inputs before processing
- Check financial constraints before allowing purchases
- Verify placement rules before construction
- Sanitize save/load data to prevent corruption

### Runtime Error Management
- Graceful degradation when systems fail
- Error logging for debugging purposes
- Fallback behaviors for critical systems
- User-friendly error messages for common issues

### Save System Reliability
- Atomic save operations to prevent corruption
- Backup save files for recovery
- Version compatibility checking
- Data validation on load operations

## Testing Strategy

### Unit Testing
- Individual component logic (animal hunger, financial calculations)
- Pathfinding algorithm correctness
- Save/load data integrity
- Input validation functions

### Integration Testing
- System interactions (construction affecting pathfinding)
- Entity lifecycle management
- Time progression and simulation accuracy
- UI state synchronization with game state

### Performance Testing
- Frame rate stability with large numbers of entities
- Memory usage optimization
- Save/load operation timing
- Pathfinding performance with complex layouts

### User Experience Testing
- Control responsiveness and intuitiveness
- Game balance and progression pacing
- Visual clarity and information presentation
- Accessibility considerations

## Implementation Phases

### Phase 1: Core Foundation
- Basic game loop and time management
- Grid-based world system
- Simple entity management
- Basic rendering pipeline

### Phase 2: Core Gameplay
- Animal and enclosure systems
- Basic visitor simulation
- Financial management
- Construction mechanics

### Phase 3: Advanced Features
- Pathfinding and AI improvements
- Save/load functionality
- UI polish and game balance
- Audio and visual effects

### Phase 4: Polish and Optimization
- Performance optimization
- Bug fixes and stability improvements
- Additional content and features
- User experience refinements