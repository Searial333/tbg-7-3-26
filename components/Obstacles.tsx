import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ObstacleData, CoinData, LetterData, ObstacleType } from '../types';
import { THEME_COLORS, THEME_CONFIGS, VOXEL_SIZE } from '../constants';

const VoxelBlock: React.FC<{ position: [number, number, number], color: string, scale?: [number, number, number] }> = ({ position, color, scale = [1,1,1] }) => (
  <mesh position={position} scale={scale} castShadow>
     <boxGeometry args={[VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE]} />
     <meshStandardMaterial color={color} roughness={0.9} />
  </mesh>
);

const Obstacle: React.FC<{ data: ObstacleData }> = ({ data }) => {
  const meshRef = useRef<THREE.Group>(null);
  const config = THEME_CONFIGS[data.theme];

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    
    if (data.type === ObstacleType.FIRE) {
       meshRef.current.scale.y = 1 + Math.sin(time * 15) * 0.2;
    }
  });

  return (
    <group position={data.position} rotation={[0, data.rotation, 0]} ref={meshRef}>
      
      {/* HURDLE: Stack of wood voxels */}
      {data.type === ObstacleType.HURDLE && (
        <group>
          {/* Left Post */}
          <VoxelBlock position={[-1.5, 1, 0]} color="#5d4037" scale={[0.5, 2, 0.5]} />
          {/* Right Post */}
          <VoxelBlock position={[1.5, 1, 0]} color="#5d4037" scale={[0.5, 2, 0.5]} />
          {/* Bar */}
          <VoxelBlock position={[0, 2, 0]} color="#8d6e63" scale={[2, 0.5, 0.5]} />
          <VoxelBlock position={[0, 2.5, 0]} color="#ff0000" scale={[0.5, 0.5, 0.5]} />
        </group>
      )}

      {/* WALL: Massive wall of stone voxels */}
      {data.type === ObstacleType.WALL && (
        <group position={[0, 1, 0]}>
           {/* Base */}
           <VoxelBlock position={[-2, 0, 0]} color={config.wall} />
           <VoxelBlock position={[0, 0, 0]} color={config.wall} />
           <VoxelBlock position={[2, 0, 0]} color={config.wall} />
           {/* Mid */}
           <VoxelBlock position={[-2, 2, 0]} color={config.wall} />
           <VoxelBlock position={[2, 2, 0]} color={config.wall} />
           {/* Top */}
           <VoxelBlock position={[-2, 4, 0]} color={config.wall} />
           <VoxelBlock position={[0, 4, 0]} color={config.wall} />
           <VoxelBlock position={[2, 4, 0]} color={config.wall} />
        </group>
      )}

      {/* LOG: Horizontal Voxels */}
      {data.type === ObstacleType.LOG && (
        <group position={[0, 0.5, 0]}>
           <VoxelBlock position={[0, 0, 0]} color={THEME_COLORS.TREE_TRUNK} scale={[3, 0.8, 0.8]} />
           <VoxelBlock position={[0.5, 0.5, 0]} color={THEME_COLORS.MOSS} scale={[0.5, 0.2, 0.5]} />
        </group>
      )}

      {/* FIRE: Orange/Red voxel stack */}
      {data.type === ObstacleType.FIRE && (
        <group position={[0, 0, 0]}>
           <VoxelBlock position={[0, 0, 0]} color="#212121" scale={[1.5, 0.2, 1.5]} />
           <VoxelBlock position={[0, 1, 0]} color="#ff5722" scale={[0.8, 1, 0.8]} />
           <VoxelBlock position={[0, 2, 0]} color="#ffeb3b" scale={[0.5, 0.8, 0.5]} />
        </group>
      )}

       {/* SPIKES: Pointy voxels? Pyramids fit voxel style too if strict grid */}
       {data.type === ObstacleType.SPIKES && (
         <group position={[0, -0.5, 0]}>
            <VoxelBlock position={[0, 0, 0]} color="#424242" scale={[3, 0.2, 1.5]} />
            {[...Array(5)].map((_, i) => (
               <mesh key={i} position={[(i-2)*0.6, 0.5, 0]}>
                  <coneGeometry args={[0.2, 1.5, 4]} />
                  <meshStandardMaterial color="#bdbdbd" flatShading />
               </mesh>
            ))}
         </group>
       )}
    </group>
  );
};

const Coin: React.FC<{ data: CoinData }> = ({ data }) => {
  const meshRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 2;
      meshRef.current.position.y = data.position[1] + 1.5 + Math.sin(state.clock.getElapsedTime() * 3) * 0.2;
    }
  });

  return (
    <group position={[data.position[0], 0, data.position[2]]} ref={meshRef}>
      {/* Voxel Coin = Spinning Cube */}
      <mesh rotation={[Math.PI/4, Math.PI/4, 0]}>
         <boxGeometry args={[0.8, 0.8, 0.8]} />
         <meshStandardMaterial color={THEME_COLORS.GOLD} emissive={THEME_COLORS.GOLD} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

const LetterItem: React.FC<{ data: LetterData }> = ({ data }) => {
    const meshRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if(meshRef.current) {
            meshRef.current.rotation.y += 0.02;
            meshRef.current.position.y = data.position[1] + 1.5 + Math.sin(state.clock.getElapsedTime()*2)*0.2;
        }
    });
    return (
        <group position={[data.position[0], 0, data.position[2]]} ref={meshRef}>
             <mesh>
                 <boxGeometry args={[1.5, 1.5, 1.5]} />
                 <meshStandardMaterial color={THEME_COLORS.LETTER} emissive={THEME_COLORS.LETTER} emissiveIntensity={1} />
             </mesh>
        </group>
    )
}

const Obstacles: React.FC<{ obstacles: ObstacleData[], coins: CoinData[], letters: LetterData[], playerDist: number }> = ({ obstacles, coins, letters }) => {
  return (
    <group>
      {obstacles.map(obs => <Obstacle key={obs.id} data={obs} />)}
      {coins.map(coin => <Coin key={coin.id} data={coin} />)}
      {letters.map(l => <LetterItem key={l.id} data={l} />)}
    </group>
  );
};

export default Obstacles;