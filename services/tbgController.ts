
export type Vec = { x: number; y: number };
export type Facing = 1 | -1;

export interface GameActions {
  timeNow(): number;
  rng(): number;
  emitParticles(kind: ParticleKind, at: [number, number, number], opts?: Partial<ParticleOpts>): void;
  spawnProjectile(kind: ProjectileKind, at: [number, number, number], vel: [number, number, number], opts?: Partial<ProjectileOpts>): void;
  addObject(type: string, pos: [number, number, number]): void;
  screenShake(durationMs: number, magnitude: number): void;
  sfx(name: SfxName): void;
}

export type SfxName =
  | 'hit_poof'
  | 'milk_squirt'
  | 'milk_charge_start'
  | 'milk_charge_loop'
  | 'milk_blast'
  | 'death_boom'
  | 'bandana_whoosh'
  | 'flies_buzz';

export type ParticleKind =
  | 'cotton_poof'
  | 'fabric_confetti'
  | 'thread_spark'
  | 'bandana_bits'
  | 'stink_line'
  | 'fly';

export interface ParticleOpts {
  count: number;
  spread: number;
  lifeMin: number;
  lifeMax: number;
  sizeMin: number;
  sizeMax: number;
  gravity: number;
  force?: Vec;
}

export type ProjectileKind = 'milk_squirt' | 'milk_stream_droplet';

export interface ProjectileOpts {
  damage: number;
  knockback: number;
  lifeMs: number;
  radius: number;
  gravity: number;
}

export const MilkSquirtDefaults: ProjectileOpts = {
  damage: 4,
  knockback: 180,
  lifeMs: 1200,
  radius: 1.2,
  gravity: 15,
};

export const MilkStreamDropletDefaults: ProjectileOpts = {
  damage: 2,
  knockback: 90,
  lifeMs: 800,
  radius: 0.8,
  gravity: 8,
};

export type TBGState =
  | 'idle'
  | 'run'
  | 'jump'
  | 'fall'
  | 'stunned'
  | 'death'
  | 'dead'
  | 'attack_squirt_windup'
  | 'attack_squirt_fire'
  | 'attack_squirt_recover'
  | 'attack_charge_loop'
  | 'attack_stream_fire'
  | 'attack_stream_recover';

export interface AnimEvent {
  t: number;
  ev: 'emit' | 'sfx' | 'spawn' | 'shake' | 'flag';
  data?: any;
}

export interface AnimClip {
  name: string;
  len: number;
  loop?: boolean;
  events?: AnimEvent[];
}

export const TBGClips: Record<TBGState, AnimClip> = {
  idle: { name: 'idle', len: 800, loop: true },
  run: { name: 'run', len: 500, loop: true },
  jump: { name: 'jump', len: 350 },
  fall: { name: 'fall', len: 350 },
  stunned: {
    name: 'stunned',
    len: 420,
    events: [
      { t: 40, ev: 'emit', data: { kind: 'cotton_poof', opts: { count: 10, spread: 2 } } },
      { t: 40, ev: 'sfx', data: 'hit_poof' },
    ],
  },
  death: {
    name: 'death',
    len: 1400,
    events: [
      { t: 0, ev: 'sfx', data: 'death_boom' },
      { t: 0, ev: 'emit', data: { kind: 'fabric_confetti', opts: { count: 26, spread: 5, lifeMin: 400, lifeMax: 1000 } } },
      { t: 20, ev: 'emit', data: { kind: 'thread_spark', opts: { count: 18, spread: 6, lifeMin: 500, lifeMax: 900 } } },
      { t: 40, ev: 'sfx', data: 'bandana_whoosh' },
      { t: 40, ev: 'emit', data: { kind: 'bandana_bits', opts: { count: 8, spread: 3, gravity: 5 } } },
      { t: 800, ev: 'spawn', data: { what: 'diaper_tombstone' } },
      { t: 820, ev: 'emit', data: { kind: 'stink_line', opts: { count: 3, lifeMin: 1000, lifeMax: 1800, gravity: -2 } } },
      { t: 820, ev: 'emit', data: { kind: 'fly', opts: { count: 5, lifeMin: 3000, lifeMax: 6000, gravity: 0 } } },
    ],
  },
  dead: { name: 'dead', len: 999999, loop: true },
  attack_squirt_windup: {
    name: 'attack_squirt_windup',
    len: 120,
    events: [{ t: 0, ev: 'sfx', data: 'milk_squirt' }],
  },
  attack_squirt_fire: {
    name: 'attack_squirt_fire',
    len: 80,
    events: [{ t: 10, ev: 'spawn', data: { what: 'milk_squirt' } }],
  },
  attack_squirt_recover: { name: 'attack_squirt_recover', len: 100 },
  attack_charge_loop: {
    name: 'attack_charge_loop',
    len: 600,
    loop: true,
    events: [
      { t: 0, ev: 'sfx', data: 'milk_charge_start' },
      { t: 120, ev: 'sfx', data: 'milk_charge_loop' },
    ],
  },
  attack_stream_fire: {
    name: 'attack_stream_fire',
    len: 420,
    events: [
      { t: 0, ev: 'shake', data: { d: 120, m: 4 } },
      { t: 0, ev: 'sfx', data: 'milk_blast' },
      { t: 0, ev: 'spawn', data: { what: 'milk_stream_burst', droplets: 5 } },
      { t: 120, ev: 'spawn', data: { what: 'milk_stream_burst', droplets: 6 } },
      { t: 240, ev: 'spawn', data: { what: 'milk_stream_burst', droplets: 6 } },
      { t: 360, ev: 'spawn', data: { what: 'milk_stream_burst', droplets: 5 } },
    ],
  },
  attack_stream_recover: { name: 'attack_stream_recover', len: 200 },
};

export const AttackConfig = {
  squirt: { cooldownMs: 300, speed: 60, arcUp: 10 },
  charge: { thresholdMs: 600, maxHoldMs: 2000, streamConeDeg: 12, dropletsPerBurst: 5, dropletSpeed: 80 },
  stunned: { durationMs: 420 },
  respawnDelayMs: 2500,
};

export class TBGController {
  state: TBGState = 'idle';
  clip: AnimClip = TBGClips.idle;
  clipStart = 0;
  private lastAttackAt = -9999;
  private heldSince = 0;
  private alive = true;
  private _lastEventIndex = -1;

  constructor(private actions: GameActions) {}

  setState(s: TBGState) {
    if (this.state === s) return;
    this.state = s;
    this.clip = TBGClips[s];
    this.clipStart = this.actions.timeNow();
    this._lastEventIndex = -1;
  }

  update(now: number, input: { attackHeld: boolean, attackPressed: boolean, attackReleased: boolean, isMoving: boolean, isJumping: boolean, isSliding: boolean }) {
    if (!this.alive) {
      this.driveClip(now);
      return;
    }

    // High priority states
    if (this.state === 'stunned' || this.state === 'death' || this.state === 'dead') {
      this.driveClip(now);
      return;
    }

    // Attack logic
    if (input.attackPressed) {
      this.heldSince = now;
      this.setState('attack_squirt_windup');
    }

    if (input.attackHeld && !['attack_stream_fire', 'attack_stream_recover'].includes(this.state)) {
      const held = now - this.heldSince;
      if (held > AttackConfig.charge.thresholdMs) {
        if (this.state !== 'attack_charge_loop') this.setState('attack_charge_loop');
      }
    }

    if (input.attackReleased) {
      const held = now - this.heldSince;
      if (held >= AttackConfig.charge.thresholdMs) {
        this.fireStream(now);
      } else {
        this.fireSquirt(now);
      }
    }

    // Default Movement states if not attacking
    if (!this.state.startsWith('attack')) {
      if (input.isJumping) this.setState('jump');
      else if (input.isSliding) this.setState('fall'); // Visual approximation for "low"
      else if (input.isMoving) this.setState('run');
      else this.setState('idle');
    }

    this.driveClip(now);
  }

  private fireSquirt(now: number) {
    if (now - this.lastAttackAt < AttackConfig.squirt.cooldownMs) return;
    this.setState('attack_squirt_fire');
    this.lastAttackAt = now;
  }

  private fireStream(now: number) {
    this.setState('attack_stream_fire');
    this.lastAttackAt = now;
  }

  private driveClip(now: number) {
    const t = now - this.clipStart;
    if (t > this.clip.len && !this.clip.loop) {
      switch (this.state) {
        case 'stunned':
        case 'attack_squirt_windup':
        case 'attack_squirt_fire':
        case 'attack_squirt_recover':
        case 'attack_stream_recover':
          this.setState('run');
          break;
        case 'attack_stream_fire':
          this.setState('attack_stream_recover');
          break;
        case 'death':
          this.setState('dead');
          break;
      }
      return;
    }

    const evs = this.clip.events || [];
    for (let i = this._lastEventIndex + 1; i < evs.length; i++) {
      if (t >= evs[i].t) {
        this.fireEvent(evs[i]);
        this._lastEventIndex = i;
      } else break;
    }

    if (this.clip.loop && t > this.clip.len) {
      this.clipStart = now;
      this._lastEventIndex = -1;
    }
  }

  private fireEvent(e: AnimEvent) {
    switch (e.ev) {
      case 'emit':
        this.actions.emitParticles(e.data.kind, [0, 0, 0], e.data.opts); // Pos relative to player in component
        break;
      case 'sfx':
        this.actions.sfx(e.data);
        break;
      case 'shake':
        this.actions.screenShake(e.data.d, e.data.m);
        break;
      case 'spawn':
        const d = e.data;
        if (d.what === 'milk_squirt') {
          this.actions.spawnProjectile('milk_squirt', [0, 2, -1], [0, AttackConfig.squirt.arcUp, -AttackConfig.squirt.speed], MilkSquirtDefaults);
        } else if (d.what === 'milk_stream_burst') {
          const count = d.droplets || AttackConfig.charge.dropletsPerBurst;
          for (let i = 0; i < count; i++) {
            const angleDeg = (this.actions.rng() - 0.5) * 2 * AttackConfig.charge.streamConeDeg;
            const rad = (angleDeg * Math.PI) / 180;
            const spd = AttackConfig.charge.dropletSpeed * (0.8 + this.actions.rng() * 0.4);
            const vx = Math.sin(rad) * spd;
            const vz = -Math.cos(rad) * spd;
            this.actions.spawnProjectile('milk_stream_droplet', [0, 2, -1], [vx, -5, vz], MilkStreamDropletDefaults);
          }
        } else if (d.what === 'diaper_tombstone') {
          this.actions.addObject('diaper_tombstone', [0, 0, 0]);
        }
        break;
    }
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    this.setState('death');
  }

  stun() {
    if (!this.alive || this.state === 'stunned') return;
    this.setState('stunned');
  }
}
