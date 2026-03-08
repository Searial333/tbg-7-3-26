import { Lane, MapTheme } from './types';

export const INITIAL_SPEED = 0.45; 
export const MAX_SPEED = 1.2;     
export const SPEED_INCREMENT = 0.0001; 
export const LANE_VALUES = [Lane.LEFT, Lane.CENTER, Lane.RIGHT];
export const SEGMENT_LENGTH = 100;
export const TURN_RADIUS = 50; 
export const ARC_LENGTH = (Math.PI * TURN_RADIUS) / 2; 
export const TRACK_WIDTH = 12;
export const VOXEL_SIZE = 1.5; // Environment block size
export const PLAYER_SCALE = 0.12; // Player individual voxel size
export const TEDDY_WORD = "TEDDY";

export const THEME_CONFIGS: Record<MapTheme, any> = {
  [MapTheme.FOREST]: {
    path: '#795548', // Dirt
    curb: '#5d4037', // Dark Dirt
    grass: '#43a047', // Voxel Green
    wall: '#2e7d32', // Dark Green Bush
    sky: '#4fc3f7',
    fog: '#e8f5e9',
    water: '#039be5',
    glow: '#76ff03',
    scenery: 'VOXEL_TREES'
  },
  [MapTheme.RUINS]: {
    path: '#90a4ae', // Stone
    curb: '#607d8b',
    grass: '#546e7a',
    wall: '#37474f', // Dark Stone
    sky: '#cfd8dc',
    fog: '#b0bec5',
    water: '#006064', // Murky swamp water
    glow: '#00bcd4', // Ancient magic blue
    scenery: 'VOXEL_RUINS'
  },
  [MapTheme.VOLCANO]: {
    path: '#424242', // Basalt
    curb: '#212121', // Darker rock
    grass: '#3e2723', // Burnt earth
    wall: '#000000', // Obsidian
    sky: '#bf360c', // Fiery sky
    fog: '#3e2723', // Ash / Smoke
    water: '#ff3d00', // Lava
    glow: '#ffab00', // Heat glow
    scenery: 'VOXEL_SPIRES'
  },
  [MapTheme.CITY]: {
    path: '#212121', // Asphalt
    curb: '#00e5ff', // Neon curb
    grass: '#1a1a1a', // Void
    wall: '#311b92', // Cyber building
    sky: '#000000', // Night
    fog: '#1a1a1a', // Darkness
    water: '#6200ea', // Dark data stream
    glow: '#d500f9', // Neon purple
    scenery: 'VOXEL_TOWERS'
  },
  [MapTheme.DESERT]: {
    path: '#d7ccc8', // Sand path
    curb: '#a1887f', // Rock curb
    grass: '#ffcc80', // Sand dunes
    wall: '#8d6e63', // Sandstone cliff
    sky: '#fff3e0', // Hazy sun
    fog: '#ffe0b2', // Heat haze
    water: '#26a69a', // Oasis turquoise
    glow: '#ff6f00', // Sun glare
    scenery: 'VOXEL_ARCH'
  },
  [MapTheme.CAVE]: {
    path: '#311b92', // Deep crystal path
    curb: '#1a237e', // Dark crystal
    grass: '#000000', // Abyss
    wall: '#4a148c', // Cave wall
    sky: '#000000', // Pitch black
    fog: '#311b92', // Purple haze
    water: '#d500f9', // Glowing liquid
    glow: '#00e676', // Bioluminescence
    scenery: 'VOXEL_CRYSTALS'
  }
};

export const THEME_COLORS = {
  GOLD: '#ffeb3b', // Bright Voxel Gold
  GOLD_BRIGHT: '#fff9c4',
  MAGNET: '#2979ff',
  SHIELD: '#00e676',
  LETTER: '#d500f9',
  TREE_TRUNK: '#5d4037',
  MOSS: '#2e7d32',
};

export const BEAR_PALETTE = {
  fur: '#D28C43',
  furLight: '#EBC390',
  mask: '#5D4389',
  eye: '#1A1A1A',
  nose: '#1A1A1A',
  sash: '#5A3A22',
  diaper: '#F5F5F5',
  buckle: '#D4AF37',
  white: '#FFFFFF'
};