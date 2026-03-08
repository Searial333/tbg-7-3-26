import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
// Import THREE to provide type definitions for refs and other Three.js objects.
import * as THREE from 'three';
import { PowerUpData, PowerUpType } from '../types';
import { THEME_COLORS } from '../constants';

const PowerUp: React.FC<{ data: PowerUpData }> = ({ data }) => {
  // Fix: Reference THREE.Group correctly after importing the THREE namespace.
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.05;
    }
  });

  const color = data.type === PowerUpType.MAGNET ? THEME_COLORS.MAGNET : THEME_COLORS.SHIELD;

  return (
    <group position={data.position} ref={meshRef}>
      <Float speed={5} rotationIntensity={1} floatIntensity={1}>
        <mesh castShadow>
          <octahedronGeometry args={[0.6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
        <Sphere args={[0.8, 16, 16]}>
           <MeshDistortMaterial color={color} speed={5} distort={0.4} transparent opacity={0.3} />
        </Sphere>
        <pointLight color={color} intensity={2} distance={5} />
      </Float>
    </group>
  );
};

export default PowerUp;