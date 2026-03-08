import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';
import { PowerUpType } from '../types';
import { THEME_COLORS, BEAR_PALETTE, PLAYER_SCALE } from '../constants';
import { TBGState } from '../services/tbgController';

interface PlayerProps {
  lane: number;
  isJumping: boolean;
  isSliding: boolean;
  activePowerUp: PowerUpType | null;
  slope: number;
  tbgState: TBGState;
}

// ---------------------------
// PROCEDURAL GENERATION HELPERS
// ---------------------------

interface VoxelPoint {
  x: number;
  y: number;
  z: number;
  color: string;
}

type Center = { x: number; y: number; z: number };

const generateVoxelPart = (
  width: number,
  height: number,
  depth: number,
  pivotX: number,
  pivotY: number,
  pivotZ: number,
  sdf: (x: number, y: number, z: number, c: Center) => number,
  colorResolver: (x: number, y: number, z: number, c: Center) => keyof typeof BEAR_PALETTE | 'default'
): VoxelPoint[] => {
  const points: VoxelPoint[] = [];
  const cx = width / 2;
  const cy = height / 2;
  const cz = depth / 2;
  const center = { x: cx, y: cy, z: cz };

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      for (let z = 0; z < depth; z++) {
        const dist = sdf(x, y, z, center);
        if (dist <= 0) {
           const colorKey = colorResolver(x, y, z, center);
           const hexColor = colorKey === 'default' ? BEAR_PALETTE.fur : (BEAR_PALETTE[colorKey] || BEAR_PALETTE.fur);
           points.push({
             x: x - pivotX,
             y: y - pivotY,
             z: z - pivotZ,
             color: hexColor
           });
        }
      }
    }
  }
  return points;
};

const ProceduralVoxelMesh: React.FC<{ points: VoxelPoint[] }> = ({ points }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { colorArray, matrices } = useMemo(() => {
    const colArr = new Float32Array(points.length * 3);
    const tempColor = new THREE.Color();
    const dummy = new THREE.Object3D();
    const matArr = new Float32Array(points.length * 16);
    points.forEach((p, i) => {
      tempColor.set(p.color);
      colArr[i * 3] = tempColor.r;
      colArr[i * 3 + 1] = tempColor.g;
      colArr[i * 3 + 2] = tempColor.b;
      dummy.position.set(p.x * PLAYER_SCALE, p.y * PLAYER_SCALE, p.z * PLAYER_SCALE);
      dummy.scale.setScalar(PLAYER_SCALE);
      dummy.updateMatrix();
      dummy.matrix.toArray(matArr, i * 16);
    });
    return { colorArray: colArr, matrices: matArr };
  }, [points]);
  useFrame(() => {
     if (meshRef.current && !meshRef.current.userData.init) {
        for(let i=0; i<points.length; i++) {
           const mat = new THREE.Matrix4().fromArray(matrices, i*16);
           meshRef.current.setMatrixAt(i, mat);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        meshRef.current.userData.init = true;
     }
  });
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, points.length]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} /> 
      <meshStandardMaterial vertexColors roughness={0.4} metalness={0.1} />
      <instancedBufferAttribute attach="instanceColor" args={[colorArray, 3]} />
    </instancedMesh>
  );
};

const Player: React.FC<PlayerProps> = ({ isJumping, isSliding, activePowerUp, tbgState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const bottleRef = useRef<THREE.Group>(null);
  const ribbonsRef = useRef<THREE.Group>(null);

  const { headData, bodyData, armData, legData, ribbonData, bottleData } = useMemo(() => {
    const headData = generateVoxelPart(28, 28, 28, 14, 0, 14, 
      (x, y, z, c) => {
         const dx = x - c.x; const dy = y - (c.y + 2); const dz = z - (c.z - 2);
         const sphere = Math.sqrt(dx*dx + dy*dy*1.1 + dz*dz) - 10.5;
         const cheeks = Math.sqrt(Math.pow(Math.abs(dx)-7, 2) + Math.pow(dy+5, 2)*0.8 + Math.pow(dz-4, 2)) - 5.5;
         const earL = Math.sqrt(Math.pow(x-(c.x-8.5), 2) + Math.pow(y-(c.y+10), 2) + Math.pow(z-(c.z-2), 2)) - 3.8;
         const earR = Math.sqrt(Math.pow(x-(c.x+8.5), 2) + Math.pow(y-(c.y+10), 2) + Math.pow(z-(c.z-2), 2)) - 3.8;
         const snout = Math.sqrt(dx*dx + Math.pow(dy+3, 2)*1.2 + Math.pow(dz-8, 2)) - 5.0;
         const k = 0.4;
         return -Math.log(Math.exp(-sphere/k) + Math.exp(-cheeks/k) + Math.exp(-earL/k) + Math.exp(-earR/k) + Math.exp(-snout/k)) * k;
      }, 
      (x, y, z, c) => {
         const dx = x - c.x; const dy = y - c.y; const dz = z - c.z;
         if (dz > 11.5 && Math.abs(dx) < 2.0 && Math.abs(dy + 2) < 1.5) return 'nose';
         if (dz > 8.5 && Math.abs(dx) < 4.5 && dy < 1 && dy > -6) return 'furLight';
         if (dz > 7.5 && dy > 0 && dy < 5) {
             const distFromX = Math.abs(dx);
             if (Math.abs(distFromX - 4.5) < 2.2) {
                 if (Math.abs(dx) > 3.5 && Math.abs(dx) < 5.5 && dy > 1.5 && dy < 3.5) return 'eye';
                 return 'white';
             }
         }
         if (dy > 0 && dy < 7.5) if (dz > 4.5 || (Math.abs(dx) > 8 && dz > -5)) return 'mask';
         if (dy > 9 && dz > 0 && Math.abs(Math.abs(dx) - 8.5) < 2.0) return 'eye';
         return 'fur';
      }
    );
    const bodyData = generateVoxelPart(22, 22, 22, 11, 6, 11,
      (x, y, z, c) => {
        const dx = x - c.x; const dy = y - c.y; const dz = z - c.z;
        const sphere = Math.sqrt(dx*dx + Math.pow(dy-2, 2)*0.8 + dz*dz) - 9.0;
        return sphere;
      },
      (x, y, z, c) => (y - c.y < -2) ? 'diaper' : 'fur'
    );
    const armData = generateVoxelPart(12, 12, 12, 6, 10, 6, 
        (x,y,z,c) => Math.sqrt(Math.pow(x-c.x,2) + Math.pow(y-c.y,2) + Math.pow(z-c.z,2)) - 4.5,
        () => 'fur'
    );
    const legData = generateVoxelPart(12, 12, 12, 6, 10, 6,
        (x,y,z,c) => Math.sqrt(Math.pow(x-c.x,2) + Math.pow(y-c.y,2) + Math.pow(z-c.z,2)) - 4.5,
        (x,y,z,c) => (y < c.y - 2 && z > c.z + 1) ? 'furLight' : 'fur'
    );
    const ribbonData = generateVoxelPart(6, 4, 12, 3, 2, 0,
       (x,y,z,c) => Math.max(Math.abs(x-c.x)-2, Math.abs(y-c.y)-0.5, Math.abs(z-c.z)-5.5),
       () => 'mask'
    );
    const bottleData = generateVoxelPart(8, 14, 8, 4, 7, 4,
       (x,y,z,c) => {
         const dx = x-c.x; const dy = y-c.y; const dz = z-c.z;
         const body = Math.max(Math.abs(dx)-2.5, Math.abs(dy)-4, Math.abs(dz)-2.5);
         const nipple = Math.sqrt(dx*dx + Math.pow(dy-6, 2) + dz*dz) - 1.8;
         return Math.min(body, nipple);
       },
       (x,y,z,c) => (y-c.y > 4) ? 'white' : 'white'
    );
    return { headData, bodyData, armData, legData, ribbonData, bottleData };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current || !headGroupRef.current) return;
    const time = state.clock.getElapsedTime();

    // Reset rotations
    groupRef.current.rotation.set(0, 0, 0);
    groupRef.current.scale.set(1, 1, 1);
    
    // States
    const isAttacking = tbgState.startsWith('attack');
    const isStunned = tbgState === 'stunned';
    const isDead = tbgState === 'death' || tbgState === 'dead';

    if (isDead) {
      groupRef.current.rotation.x = -Math.PI / 2;
      groupRef.current.position.y = 0.5;
      return;
    }

    if (isStunned) {
      groupRef.current.rotation.y = Math.sin(time * 30) * 0.2;
      groupRef.current.scale.setScalar(0.9);
    }

    // Animation frequencies
    const runFreq = 20;
    const runWaddle = Math.sin(time * runFreq);

    // Body & Head
    if (bodyRef.current) {
      bodyRef.current.rotation.z = isAttacking ? 0 : runWaddle * 0.15;
      bodyRef.current.position.y = 0.8 + Math.abs(runWaddle) * 0.1;
    }
    if (headGroupRef.current) {
      headGroupRef.current.rotation.y = isAttacking ? 0 : runWaddle * 0.1;
    }

    // Arms
    if (leftArmRef.current && rightArmRef.current) {
      if (isAttacking) {
        rightArmRef.current.rotation.x = -Math.PI / 2;
        leftArmRef.current.rotation.x = 0;
      } else {
        leftArmRef.current.rotation.x = runWaddle * 1.2;
        rightArmRef.current.rotation.x = -runWaddle * 1.2;
      }
    }

    // Bottle
    if (bottleRef.current) {
      bottleRef.current.visible = isAttacking;
    }
  });

  return (
    <group ref={groupRef}>
       <group ref={headGroupRef}>
          <ProceduralVoxelMesh points={headData} />
          <group ref={ribbonsRef} position={[0, 1.2, -1.2]}>
             <ProceduralVoxelMesh points={ribbonData} />
          </group>
       </group>
       <group ref={bodyRef}>
          <ProceduralVoxelMesh points={bodyData} />
       </group>
       <group ref={leftArmRef} position={[1.6, 1.8, 0]}>
          <ProceduralVoxelMesh points={armData} />
       </group>
       <group ref={rightArmRef} position={[-1.6, 1.8, 0]}>
          <ProceduralVoxelMesh points={armData} />
          <group ref={bottleRef} position={[0, -1, 1]} rotation={[Math.PI/2, 0, 0]}>
             <ProceduralVoxelMesh points={bottleData} />
          </group>
       </group>
       <group ref={leftLegRef} position={[0.9, 0.4, 0]}>
          <ProceduralVoxelMesh points={legData} />
       </group>
       <group ref={rightLegRef} position={[-0.9, 0.4, 0]}>
          <ProceduralVoxelMesh points={legData} />
       </group>
      {activePowerUp === PowerUpType.SHIELD && (
         <mesh scale={1.2}>
            <sphereGeometry args={[2.5, 32, 32]} />
            <meshStandardMaterial color={THEME_COLORS.SHIELD} transparent opacity={0.2} wireframe />
         </mesh>
      )}
      <Trail width={4} length={12} color={BEAR_PALETTE.mask} attenuation={(t) => t * t}>
         <mesh visible={false} />
      </Trail>
    </group>
  );
};

export default Player;