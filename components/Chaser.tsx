import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface ChaserProps {
  intensity: number; // 0 to 1, where 1 is dangerously close
  playerLane: number;
}

const Chaser: React.FC<ChaserProps> = ({ intensity, playerLane }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Adaptive Position Logic:
    const targetZ = 3 + (1 - intensity) * 12;
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, delta * 4);
    
    // Intelligent Lane Matching:
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, playerLane, delta * 2.5);
    
    // Hovering effect
    groupRef.current.position.y = 1.8 + Math.sin(state.clock.getElapsedTime() * 3) * 0.4;

    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 5) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 2, 20]}>
      {/* The Shadow Stalker */}
      <Float speed={4} rotationIntensity={1} floatIntensity={1}>
        <mesh ref={headRef as any}>
          <octahedronGeometry args={[1.8, 1]} />
          <meshStandardMaterial 
            color="#050505" 
            emissive="#ff1111" 
            emissiveIntensity={intensity * 5} 
            flatShading 
            roughness={0}
          />
        </mesh>
        
        {/* Sinister Red Eyes */}
        <mesh position={[-0.6, 0.4, -1.4]}>
          <sphereGeometry args={[0.25]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        <mesh position={[0.6, 0.4, -1.4]}>
          <sphereGeometry args={[0.25]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>

        <pointLight color="#ff0000" intensity={intensity * 15} distance={15} />
      </Float>

      {/* Trailing Dark Vapors */}
      {[...Array(8)].map((_, i) => (
        <group key={i} position={[Math.sin(i)*2, Math.cos(i)*2, 1]}>
          <mesh>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshBasicMaterial color="#000" transparent opacity={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default Chaser;