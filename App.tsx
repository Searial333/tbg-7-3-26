import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, ContactShadows, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { 
  GameStatus, Lane, GameState, ObstacleData, CoinData, LetterData,
  ObstacleType, PowerUpType, SegmentType, TrackSegmentData, MapTheme 
} from './types';
import { 
  INITIAL_SPEED, MAX_SPEED, SPEED_INCREMENT, LANE_VALUES, 
  THEME_COLORS, SEGMENT_LENGTH, THEME_CONFIGS, TEDDY_WORD,
  TURN_RADIUS, ARC_LENGTH, TRACK_WIDTH
} from './constants';
import Player from './components/Player';
import Chaser from './components/Chaser';
import Environment from './components/Environment';
import Obstacles from './components/Obstacles';
import HUD from './components/HUD';
import Particles from './components/Particles';
import { TBGController, TBGState, ProjectileOpts } from './services/tbgController';

export const SURFACE_Y_OFFSET = 0;

interface ProjectileInstance {
  id: string;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  opts: ProjectileOpts;
  createdAt: number;
}

const Projectile: React.FC<{ data: ProjectileInstance }> = ({ data }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    data.pos.add(data.vel.clone().multiplyScalar(delta));
    data.vel.y -= data.opts.gravity * delta;
    meshRef.current.position.copy(data.pos);
  });
  return (
    <mesh ref={meshRef} position={data.pos} castShadow>
      <sphereGeometry args={[data.opts.radius]} />
      <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
    </mesh>
  );
};

const CameraController: React.FC<{ targetPos: THREE.Vector3; heading: number; shake: number; speed: number; lane: number }> = ({ targetPos, heading, shake, speed, lane }) => {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  useFrame((state, delta) => {
    const speedRatio = (speed - INITIAL_SPEED) / (MAX_SPEED - INITIAL_SPEED || 1);
    const dist = 12 + speedRatio * 5;
    const height = 6 + speedRatio * 3;
    const offset = new THREE.Vector3(0, height, dist).applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);
    const laneOffsetVector = new THREE.Vector3(lane * 0.3, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);
    const shakeVec = new THREE.Vector3((Math.random()-0.5)*shake, (Math.random()-0.5)*shake, (Math.random()-0.5)*shake);
    const idealPos = targetPos.clone().add(offset).add(laneOffsetVector).add(shakeVec);
    currentPos.current.lerp(idealPos, delta * 6);
    camera.position.copy(currentPos.current);
    const forward = new THREE.Vector3(0, 0, -20).applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);
    const idealLook = targetPos.clone().add(forward);
    currentLookAt.current.lerp(idealLook, delta * 8);
    camera.lookAt(currentLookAt.current);
  });
  return null;
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: GameStatus.IDLE, score: 0, coins: 0, distance: 0, speed: INITIAL_SPEED,
    currentLane: Lane.CENTER, isJumping: false, isSliding: false, oracleMessage: "Run for your life...",
    chaserDistance: 0.05, activePowerUp: null, powerUpTime: 0, heading: 0,
    worldPosition: [0, 0, 0], currentTheme: MapTheme.FOREST, collectedLetters: []
  });

  const [segments, setSegments] = useState<TrackSegmentData[]>([]);
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [letters, setLetters] = useState<LetterData[]>([]);
  const [projectiles, setProjectiles] = useState<ProjectileInstance[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [tbgVisualState, setTbgVisualState] = useState<TBGState>('idle');
  const [tombstonePos, setTombstonePos] = useState<[number, number, number] | null>(null);
  
  const lastSpawnDistRef = useRef(0);
  const gameLoopRef = useRef<number>(0);
  const segmentProgressRef = useRef(0);
  const tbgRef = useRef<TBGController | null>(null);
  const inputRef = useRef({ attackHeld: false, attackPressed: false, attackReleased: false });

  const spawnNextSegment = useCallback((prevSegment: TrackSegmentData | null, forcedTheme?: MapTheme): TrackSegmentData => {
    const id = Math.random().toString();
    const theme = forcedTheme || prevSegment?.theme || MapTheme.FOREST;
    if (!prevSegment) return { id, type: SegmentType.STRAIGHT, position: [0, 0, 0], rotation: 0, length: SEGMENT_LENGTH, cumulativeDistance: 0, theme };
    let type = SegmentType.STRAIGHT;
    const typeRoll = Math.random();
    if (prevSegment.type === SegmentType.STRAIGHT && typeRoll > 0.85) type = typeRoll > 0.925 ? SegmentType.LEFT_TURN : SegmentType.RIGHT_TURN;
    const prevPos = new THREE.Vector3(...prevSegment.position);
    let startPos = new THREE.Vector3();
    let startRot = prevSegment.rotation;
    if (prevSegment.type === SegmentType.STRAIGHT) {
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), prevSegment.rotation);
      startPos = prevPos.clone().add(forward.multiplyScalar(prevSegment.length));
    } else {
      const r = TURN_RADIUS;
      const isLeft = prevSegment.type === SegmentType.LEFT_TURN;
      const localEnd = new THREE.Vector3(isLeft ? -r : r, 0, -r).applyAxisAngle(new THREE.Vector3(0, 1, 0), prevSegment.rotation);
      startPos = prevPos.clone().add(localEnd);
      startRot += isLeft ? Math.PI / 2 : -Math.PI / 2;
    }
    const length = type === SegmentType.STRAIGHT ? SEGMENT_LENGTH : ARC_LENGTH;
    const newSeg: TrackSegmentData = { id, type, position: [startPos.x, startPos.y, startPos.z], rotation: startRot, length, cumulativeDistance: prevSegment.cumulativeDistance + prevSegment.length, theme };
    if (type !== SegmentType.STRAIGHT) {
      const isLeft = type === SegmentType.LEFT_TURN;
      const center = startPos.clone().add(new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), startRot).multiplyScalar(isLeft ? -TURN_RADIUS : TURN_RADIUS));
      newSeg.turnCenter = [center.x, center.y, center.z];
    }
    return newSeg;
  }, []);

  useEffect(() => {
    const actions = {
      timeNow: () => performance.now(),
      rng: () => Math.random(),
      emitParticles: (kind: string) => console.log('Emit', kind),
      spawnProjectile: (kind: string, relPos: [number, number, number], relVel: [number, number, number], opts: ProjectileOpts) => {
        setGameState(s => {
          const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), s.heading);
          const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), s.heading);
          const up = new THREE.Vector3(0, 1, 0);
          const worldPos = new THREE.Vector3(...s.worldPosition).add(right.clone().multiplyScalar(s.currentLane)).add(up.multiplyScalar(relPos[1])).add(forward.clone().multiplyScalar(relPos[2]));
          const worldVel = right.multiplyScalar(relVel[0]).add(up.multiplyScalar(relVel[1])).add(forward.multiplyScalar(relVel[2]));
          setProjectiles(p => [...p, { id: Math.random().toString(), pos: worldPos, vel: worldVel, opts, createdAt: performance.now() }]);
          return s;
        });
      },
      addObject: (type: string, pos: [number, number, number]) => {
        if (type === 'diaper_tombstone') {
          setGameState(s => {
            const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), s.heading);
            const worldPos = new THREE.Vector3(...s.worldPosition).add(right.multiplyScalar(s.currentLane));
            setTombstonePos([worldPos.x, 0, worldPos.z]);
            return s;
          });
        }
      },
      screenShake: (d: number, m: number) => { setShakeIntensity(m); setTimeout(() => setShakeIntensity(0), d); },
      sfx: (name: string) => console.log('SFX', name)
    };
    tbgRef.current = new TBGController(actions);
  }, []);

  const startGame = (theme: MapTheme) => {
    setGameState({ status: GameStatus.PLAYING, score: 0, coins: 0, distance: 0, speed: INITIAL_SPEED, currentLane: Lane.CENTER, isJumping: false, isSliding: false, oracleMessage: `Run!`, chaserDistance: 0.05, activePowerUp: null, powerUpTime: 0, heading: 0, worldPosition: [0, 0, 0], currentTheme: theme, collectedLetters: [] });
    setObstacles([]); setCoins([]); setLetters([]); setProjectiles([]); setTombstonePos(null);
    if (tbgRef.current) tbgRef.current.setState('idle');
    lastSpawnDistRef.current = 0; segmentProgressRef.current = 0;
    let current = spawnNextSegment(null, theme);
    const initial = [current];
    for (let i = 0; i < 15; i++) { current = spawnNextSegment(current, theme); initial.push(current); }
    setSegments(initial);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.status !== GameStatus.PLAYING) return;
      if (['a', 'ArrowLeft'].includes(e.key)) setGameState(s => ({ ...s, currentLane: s.currentLane === Lane.LEFT ? Lane.LEFT : (s.currentLane === Lane.CENTER ? Lane.LEFT : Lane.CENTER) }));
      if (['d', 'ArrowRight'].includes(e.key)) setGameState(s => ({ ...s, currentLane: s.currentLane === Lane.RIGHT ? Lane.RIGHT : (s.currentLane === Lane.CENTER ? Lane.RIGHT : Lane.CENTER) }));
      if (['w', 'ArrowUp', ' '].includes(e.key) && !gameState.isJumping) { setGameState(s => ({ ...s, isJumping: true })); setTimeout(() => setGameState(s => ({ ...s, isJumping: false })), 600); }
      if (['s', 'ArrowDown'].includes(e.key) && !gameState.isSliding) { setGameState(s => ({ ...s, isSliding: true })); setTimeout(() => setGameState(s => ({ ...s, isSliding: false })), 700); }
      if (['x', 'f', 'Enter'].includes(e.key.toLowerCase())) { inputRef.current.attackPressed = true; inputRef.current.attackHeld = true; }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['x', 'f', 'Enter'].includes(e.key.toLowerCase())) { inputRef.current.attackHeld = false; inputRef.current.attackReleased = true; }
    };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [gameState.status, gameState.isJumping, gameState.isSliding]);

  useEffect(() => {
    if (gameState.status !== GameStatus.PLAYING) return;
    const update = () => {
      setGameState(prev => {
        if (tbgRef.current) {
          tbgRef.current.update(performance.now(), { ...inputRef.current, isMoving: true, isJumping: prev.isJumping, isSliding: prev.isSliding });
          inputRef.current.attackPressed = false; inputRef.current.attackReleased = false;
          setTbgVisualState(tbgRef.current.state);
        }
        const newDist = prev.distance + prev.speed;
        segmentProgressRef.current += prev.speed;
        const currentSeg = segments[0];
        if (!currentSeg) return prev;
        if (segmentProgressRef.current >= currentSeg.length) {
          segmentProgressRef.current -= currentSeg.length;
          setSegments(old => [...old.slice(1), spawnNextSegment(old[old.length - 1], prev.currentTheme)]);
        }
        let worldPos = new THREE.Vector3(); let heading = 0;
        if (currentSeg.type === SegmentType.STRAIGHT) {
           heading = currentSeg.rotation;
           worldPos = new THREE.Vector3(...currentSeg.position).add(new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), heading).multiplyScalar(segmentProgressRef.current));
        } else {
           const isLeft = currentSeg.type === SegmentType.LEFT_TURN;
           const center = new THREE.Vector3(...(currentSeg.turnCenter || [0,0,0]));
           const t = segmentProgressRef.current / currentSeg.length;
           const angleChange = (isLeft ? Math.PI/2 : -Math.PI/2) * t;
           heading = currentSeg.rotation + angleChange;
           const startVec = new THREE.Vector3(...currentSeg.position).sub(center);
           worldPos = center.clone().add(startVec.applyAxisAngle(new THREE.Vector3(0,1,0), angleChange));
        }
        if (newDist > lastSpawnDistRef.current + 120) {
           lastSpawnDistRef.current = newDist;
           const targetSeg = segments[segments.length - 6];
           if (targetSeg && targetSeg.type === SegmentType.STRAIGHT) {
             const lane = LANE_VALUES[Math.floor(Math.random()*3)];
             const forward = new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0), targetSeg.rotation);
             const right = new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0), targetSeg.rotation);
             const objPos = new THREE.Vector3(...targetSeg.position).add(forward.multiplyScalar(20 + Math.random()*60)).add(right.multiplyScalar(lane));
             setObstacles(o => [...o.filter(x => x.state !== 'dead'), { id: Math.random().toString(), type: ObstacleType.HURDLE, lane, position: [objPos.x, objPos.y, objPos.z], rotation: targetSeg.rotation, theme: prev.currentTheme }]);
           }
        }
        return { ...prev, distance: newDist, score: newDist, speed: Math.min(prev.speed + SPEED_INCREMENT, MAX_SPEED), worldPosition: [worldPos.x, worldPos.y, worldPos.z], heading, chaserDistance: Math.min(1, prev.chaserDistance + 0.0005) };
      });
      // Collision & Lifetime
      const p = new THREE.Vector3(...gameState.worldPosition).add(new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0), gameState.heading).multiplyScalar(gameState.currentLane));
      setObstacles(prev => prev.filter(obs => {
        const oPos = new THREE.Vector3(...obs.position);
        if (oPos.distanceTo(p) < 2.5) {
          if (tbgRef.current) tbgRef.current.stun();
          setGameState(s => ({ ...s, chaserDistance: Math.min(1, s.chaserDistance + 0.15) }));
          return false;
        }
        return true;
      }));
      setProjectiles(prev => prev.filter(proj => {
        if (performance.now() - proj.createdAt > proj.opts.lifeMs) return false;
        setObstacles(o => o.filter(obs => {
          if (new THREE.Vector3(...obs.position).distanceTo(proj.pos) < proj.opts.radius + 2) return false;
          return true;
        }));
        return true;
      }));
      if (gameState.chaserDistance >= 1) {
        if (tbgRef.current) tbgRef.current.die();
        setTimeout(() => setGameState(s => ({...s, status: GameStatus.GAMEOVER})), 1500);
      }
      gameLoopRef.current = requestAnimationFrame(update);
    };
    gameLoopRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameState.status, gameState.worldPosition]);

  const pVis = new THREE.Vector3(...gameState.worldPosition).add(new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0), gameState.heading).multiplyScalar(gameState.currentLane));

  return (
    <div className="w-full h-screen relative bg-zinc-950 select-none overflow-hidden">
      <Canvas shadows gl={{ antialias: true }} dpr={[1, 1.5]}>
        <PerspectiveCamera makeDefault position={[0, 8, 15]} fov={60} />
        <CameraController targetPos={pVis} heading={gameState.heading} shake={shakeIntensity} speed={gameState.speed} lane={gameState.currentLane} />
        <Sky sunPosition={[100, 50, 100]} turbidity={0.1} rayleigh={0.5} />
        <Environment segments={segments} />
        {gameState.status !== GameStatus.IDLE && (
          <>
            <group position={[pVis.x, pVis.y, pVis.z]} rotation={[0, gameState.heading, 0]}>
              <Player lane={0} isJumping={gameState.isJumping} isSliding={gameState.isSliding} activePowerUp={gameState.activePowerUp} slope={0} tbgState={tbgVisualState} />
              {gameState.isSliding && <Particles count={25} position={[0,0,0]} type="dust" />}
              <ContactShadows position={[0, -0.05, 0]} opacity={0.7} scale={10} blur={2.5} far={8} color="#000000" />
            </group>
            {projectiles.map(p => <Projectile key={p.id} data={p} />)}
            {tombstonePos && (
              <group position={tombstonePos}>
                <mesh position={[0, 1, 0]}>
                   <boxGeometry args={[2, 2, 1]} />
                   <meshStandardMaterial color="#f1f1e6" />
                </mesh>
                <mesh position={[0, 2.5, 0]}>
                   <sphereGeometry args={[0.3]} />
                   <meshStandardMaterial color="#222" />
                </mesh>
              </group>
            )}
            <Chaser intensity={gameState.chaserDistance} playerLane={pVis.x} />
            <Obstacles obstacles={obstacles} coins={coins} letters={letters} playerDist={gameState.distance} />
          </>
        )}
      </Canvas>
      {gameState.status === GameStatus.PLAYING && <HUD {...gameState} powerUpTime={0} />}
      {gameState.status === GameStatus.IDLE && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50">
           <h1 className="text-8xl font-medieval text-white mb-8">NINJA TEDDY</h1>
           <p className="text-white/50 mb-8 uppercase tracking-[0.5em]">Press X to Milk Squirt</p>
           <div className="flex gap-4">{Object.keys(MapTheme).map(t => <button key={t} onClick={() => startGame(t as MapTheme)} className="px-6 py-3 bg-zinc-800 hover:bg-orange-600 text-white rounded font-bold transition-all border border-zinc-700">{t}</button>)}</div>
        </div>
      )}
      {gameState.status === GameStatus.GAMEOVER && <div className="absolute inset-0 flex items-center justify-center bg-black/98 z-50 text-center"><h2 className="text-8xl font-medieval text-orange-700 mb-6 uppercase">CAUGHT</h2><button onClick={() => setGameState(s => ({...s, status: GameStatus.IDLE}))} className="bg-orange-700 hover:bg-orange-600 text-white font-black py-8 px-24 rounded-full text-5xl">RETRY</button></div>}
    </div>
  );
};

export default App;