import React, { useMemo } from 'react';
import * as THREE from 'three';
import { THEME_CONFIGS, TURN_RADIUS, TRACK_WIDTH, VOXEL_SIZE, SEGMENT_LENGTH } from '../constants';
import { MapTheme, TrackSegmentData, SegmentType } from '../types';

const createVoxelMatrix = (position: THREE.Vector3, rotation: THREE.Euler, scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1)) => {
  const quaternion = new THREE.Quaternion().setFromEuler(rotation);
  return new THREE.Matrix4().compose(position, quaternion, scale);
};

const VoxelScenery: React.FC<{ theme: MapTheme; position: [number, number, number] }> = ({ theme, position }) => {
  const config = THEME_CONFIGS[theme];
  return (
    <group position={position}>
       <mesh position={[0, VOXEL_SIZE, 0]} castShadow>
          <boxGeometry args={[VOXEL_SIZE * 1.5, VOXEL_SIZE * 3, VOXEL_SIZE * 1.5]} />
          <meshStandardMaterial color={theme === MapTheme.FOREST ? "#3e2723" : config.curb} flatShading />
       </mesh>
       <mesh position={[0, VOXEL_SIZE * 4, 0]} castShadow>
          <sphereGeometry args={[VOXEL_SIZE * 2.5, 6, 6]} />
          <meshStandardMaterial color={config.wall} flatShading />
       </mesh>
    </group>
  );
};

const VoxelSegment: React.FC<{ segment: TrackSegmentData }> = ({ segment }) => {
  const config = THEME_CONFIGS[segment.theme];

  const { roadMatrices, curbMatrices, wallMatrices, sceneryPositions } = useMemo(() => {
    const roadMat: THREE.Matrix4[] = [];
    const curbMat: THREE.Matrix4[] = [];
    const wallMat: THREE.Matrix4[] = [];
    const sceneryPos: { pos: [number, number, number] }[] = [];

    let curve: THREE.Curve<THREE.Vector3>;
    if (segment.type === SegmentType.STRAIGHT) {
      curve = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -segment.length));
    } else {
      const points = [];
      const steps = 16;
      const r = TURN_RADIUS;
      const isLeft = segment.type === SegmentType.LEFT_TURN;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = isLeft ? (-r + r * Math.cos(t * Math.PI / 2)) : (r - r * Math.cos(t * Math.PI / 2));
        const z = -r * Math.sin(t * Math.PI / 2);
        points.push(new THREE.Vector3(x, 0, z));
      }
      curve = new THREE.CatmullRomCurve3(points);
    }

    const length = curve.getLength();
    // Overlap: Add extra blocks at the end to hide seams
    const overlapSteps = 2;
    const steps = Math.ceil(length / VOXEL_SIZE) + overlapSteps;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / (steps - overlapSteps);
      const point = curve.getPointAt(Math.min(1, t));
      
      // If we are in the overlap zone, manually project the tangent
      if (t > 1) {
          const tangent = curve.getTangentAt(1);
          point.add(tangent.multiplyScalar(VOXEL_SIZE * (i - (steps - overlapSteps))));
      }

      const tangent = curve.getTangentAt(Math.min(1, t)).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
      
      const lookTarget = point.clone().add(tangent);
      const dummyObj = new THREE.Object3D();
      dummyObj.position.copy(point);
      dummyObj.lookAt(lookTarget);
      const baseRotation = dummyObj.rotation;

      const roadWidthBlocks = Math.ceil(TRACK_WIDTH / VOXEL_SIZE);
      const startX = -(roadWidthBlocks * VOXEL_SIZE) / 2;
      
      for (let w = 0; w < roadWidthBlocks; w++) {
        const xOffset = startX + w * VOXEL_SIZE + VOXEL_SIZE/2;
        const pos = point.clone().add(right.clone().multiplyScalar(xOffset));
        // Deep road blocks to hide clipping
        roadMat.push(createVoxelMatrix(pos, baseRotation, new THREE.Vector3(1, 4, 1)));
      }

      const curbOffsetLeft = startX - VOXEL_SIZE;
      const curbOffsetRight = startX + roadWidthBlocks * VOXEL_SIZE + VOXEL_SIZE;

      [curbOffsetLeft, curbOffsetRight].forEach(offset => {
        const pos = point.clone().add(right.clone().multiplyScalar(offset));
        pos.y = VOXEL_SIZE * 0.5;
        curbMat.push(createVoxelMatrix(pos, baseRotation, new THREE.Vector3(1, 2, 1)));
      });

      const hBase = 3 + Math.floor(Math.abs(Math.sin(i * 0.3)) * 4);
      for(let h=0; h<hBase; h++) {
          [curbOffsetLeft - VOXEL_SIZE, curbOffsetRight + VOXEL_SIZE].forEach(offset => {
              const pos = point.clone().add(right.clone().multiplyScalar(offset));
              pos.y = VOXEL_SIZE * 0.5 + h * VOXEL_SIZE;
              wallMat.push(createVoxelMatrix(pos, baseRotation));
          });
      }

      if (i % 12 === 0 && i < steps - overlapSteps) {
         if (Math.random() > 0.5) {
             const scPos = point.clone().add(right.clone().multiplyScalar(curbOffsetLeft - VOXEL_SIZE * 6));
             sceneryPos.push({ pos: [scPos.x, 0, scPos.z] });
         }
      }
    }

    return { 
       roadMatrices: new Float32Array(roadMat.flatMap(m => m.elements)),
       curbMatrices: new Float32Array(curbMat.flatMap(m => m.elements)),
       wallMatrices: new Float32Array(wallMat.flatMap(m => m.elements)),
       sceneryPositions: sceneryPos
    };
  }, [segment]);

  return (
    <group position={segment.position} rotation={[0, segment.rotation, 0]}>
      <instancedMesh args={[undefined, undefined, roadMatrices.length / 16]} receiveShadow>
        <boxGeometry args={[VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE]} />
        <meshStandardMaterial color={config.path} roughness={0.9} />
        <instancedBufferAttribute attach="instanceMatrix" count={roadMatrices.length / 16} array={roadMatrices} itemSize={16} usage={THREE.StaticDrawUsage} />
      </instancedMesh>

      <instancedMesh args={[undefined, undefined, curbMatrices.length / 16]} castShadow receiveShadow>
        <boxGeometry args={[VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE]} />
        <meshStandardMaterial color={config.curb} roughness={0.9} />
        <instancedBufferAttribute attach="instanceMatrix" count={curbMatrices.length / 16} array={curbMatrices} itemSize={16} usage={THREE.StaticDrawUsage} />
      </instancedMesh>

      <instancedMesh args={[undefined, undefined, wallMatrices.length / 16]} castShadow receiveShadow>
        <boxGeometry args={[VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE]} />
        <meshStandardMaterial color={config.wall} roughness={1.0} />
        <instancedBufferAttribute attach="instanceMatrix" count={wallMatrices.length / 16} array={wallMatrices} itemSize={16} usage={THREE.StaticDrawUsage} />
      </instancedMesh>

      {sceneryPositions.map((s, i) => (
        <VoxelScenery key={i} theme={segment.theme} position={s.pos} />
      ))}
    </group>
  );
};

const Environment: React.FC<{ segments: TrackSegmentData[] }> = ({ segments }) => {
  const activeTheme = segments[0]?.theme || MapTheme.FOREST;
  const config = THEME_CONFIGS[activeTheme];

  return (
    <group>
      <ambientLight intensity={0.7} color={config.sky} />
      <directionalLight 
        position={[80, 100, 50]} 
        intensity={1.4} 
        color="#fff" 
        castShadow 
        shadow-bias={-0.0005}
        shadow-mapSize={[2048, 2048]} 
      />
      <hemisphereLight groundColor={config.wall} color={config.sky} intensity={0.4} />
      
      {segments.map((s) => (
        <VoxelSegment key={s.id} segment={s} />
      ))}
      
      <fog attach="fog" args={[config.fog, 20, 180]} />
    </group>
  );
};

export default Environment;