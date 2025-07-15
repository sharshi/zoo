// Game constants

export const GAME_CONFIG = {
  WORLD_WIDTH: 100,
  WORLD_HEIGHT: 100,
  TILE_SIZE: 32,
  TARGET_FPS: 60,
  SAVE_VERSION: '1.0.0',
  AUTO_SAVE_INTERVAL: 300000, // 5 minutes in milliseconds
} as const;

export const ANIMAL_CONFIG = {
  MAX_HUNGER: 100,
  MAX_HAPPINESS: 100,
  HUNGER_DECAY_RATE: 0.1, // per second
  HAPPINESS_DECAY_RATE: 0.05, // per second
} as const;

export const FINANCIAL_CONFIG = {
  STARTING_FUNDS: 10000,
  DEFAULT_TICKET_PRICE: 15,
  MIN_TICKET_PRICE: 5,
  MAX_TICKET_PRICE: 50,
} as const;

export const VISITOR_CONFIG = {
  MAX_SATISFACTION: 100,
  SPAWN_RATE_BASE: 0.1, // visitors per second at 100% reputation
  MAX_TIME_IN_ZOO: 1800, // 30 minutes in seconds
} as const;