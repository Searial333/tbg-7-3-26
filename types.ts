export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER'
}

export enum Lane {
  LEFT = -3.5,
  CENTER = 0,
  RIGHT = 3.5
}

export enum MapTheme {
  FOREST = 'FOREST',
  RUINS = 'RUINS',
  VOLCANO = 'VOLCANO',
  CITY = 'CITY',
  DESERT = 'DESERT',
  CAVE = 'CAVE'
}

export enum ObstacleType {
  HURDLE = 'HURDLE',
  LOG = 'LOG',
  FIRE = 'FIRE',
  WALL = 'WALL',
  SPIKES = 'SPIKES',
  PENDULUM = 'PENDULUM',
  COLLAPSING_PILLAR = 'COLLAPSING_PILLAR'
}

export enum PowerUpType {
  MAGNET = 'MAGNET',
  SHIELD = 'SHIELD'
}

export enum SegmentType {
  STRAIGHT = 'STRAIGHT',
  LEFT_TURN = 'LEFT_TURN',
  RIGHT_TURN = 'RIGHT_TURN'
}

export interface TrackSegmentData {
  id: string;
  type: SegmentType;
  position: [number, number, number]; // Start position
  rotation: number; // Entry rotation (radians)
  length: number; // Linear length or Arc length
  cumulativeDistance: number;
  theme: MapTheme;
  // Specifics for turns to help rendering/physics
  turnCenter?: [number, number, number]; 
  angleStart?: number;
  angleEnd?: number;
}

export interface ObstacleData {
  id: string;
  type: ObstacleType;
  position: [number, number, number];
  lane: Lane;
  rotation: number;
  theme: MapTheme;
  state?: any; 
}

export interface CoinData {
  id: string;
  position: [number, number, number];
  lane: Lane;
  rotation: number;
}

export interface LetterData {
  id: string;
  char: string;
  position: [number, number, number];
  lane: Lane;
  rotation: number;
}

export interface PowerUpData {
  id: string;
  type: PowerUpType;
  position: [number, number, number];
  lane: Lane;
}

export interface GameState {
  status: GameStatus;
  score: number;
  coins: number;
  distance: number;
  speed: number;
  currentLane: Lane;
  isJumping: boolean;
  isSliding: boolean;
  oracleMessage: string;
  chaserDistance: number;
  activePowerUp: PowerUpType | null;
  powerUpTime: number;
  heading: number;
  worldPosition: [number, number, number];
  currentTheme: MapTheme;
  collectedLetters: string[];
}