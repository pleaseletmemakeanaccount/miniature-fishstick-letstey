import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { WorldAudio } from './audio';
import { CROPS, ITEMS, LIMBS, PYLONS, type Biome, type BlockKind, type ItemId, type Limb, type PlayerPosition, type SaveData } from '../data/model';
import { biomeAt, fromWorld, hash, HALF_LENGTH, RADIUS, toWorld, VoxelWorld, WORLD_CEILING, WORLD_FLOOR, wrapU } from '../world/world';
import { BIOMES, BOSSES, OUTER_PLUG, OUTER_SOCKET, surfaceDistance } from '../world/biomes';
import { caveBiomeAt, CAVE_TOP, stratumOf } from '../world/caves';
import { buildCreatureModel, CREATURES, type CreatureDefinition } from '../creatures/creatures';
import { makeGlow, WorldEnvironment } from './environment';

export interface WorldSnapshot {
  position: PlayerPosition;
  elapsed: number;
  biome: Biome;
  target: string | null;
  nearPylon: string | null;
  interaction: string | null;
  stamina: number;
  flying: boolean;
  locked: boolean;
  bossHealth: number | null;
  reflectReady: boolean;
  boss: { name: string; subtitle: string; health: number; hint: string; reflectReady: boolean } | null;
  circuit: number;
  blocks: number;
  chunks: number;
  pendingChunks: number;
  swimming: boolean;
  submerged: boolean;
  oxygen: number;
  depth: number;
  temperature: number;
  hazard: string | null;
  waypoint: { name: string; distance: number; bearing: number; arrived: boolean } | null;
  toolDurability: { value: number; max: number } | null;
  cave: { id: string; name: string; subtitle: string; color: string; stratum: number; danger: string; resources: string } | null;
  depthBelow: number;
}

export interface EngineCallbacks {
  getSave: () => SaveData;
  onSnapshot: (snapshot: WorldSnapshot) => void;
  onMine: (kind: BlockKind) => void;
  onPlace: (kind: BlockKind) => boolean;
  onUse: (item: ItemId) => void;
  onDamage: (limb: Limb, amount: number, cause: string) => void;
  onMessage: (message: string) => void;
  onInteract: (interaction: string) => void;
  onKill: (name: string) => void;
  onCreatureKill: (id: string, name: string, drop: string, count: number) => void;
  onBossDefeated: () => void;
  onBossKill: (id: string, reward: string) => void;
  onCircuit: (progress: number) => void;
  onUnlock: () => void;
  onDiscover: (biome: Biome) => void;
  onDiscoverCave: (id: string, name: string) => void;
  onToolWear: (tool: string, amount: number) => void;
  onPlant: (crop: string, u: number, z: number, h: number) => boolean;
  onHarvest: (id: number) => void;
}

interface Actor { group: THREE.Group; u: number; z: number; h?: number; type: string; label: string }
interface Enemy { group: THREE.Group; u: number; z: number; homeU: number; homeZ: number; hp: number; cooldown: number; name: string; phase: number }
interface Creature { def: CreatureDefinition; group: THREE.Group; u: number; z: number; h: number; homeU: number; homeZ: number; hp: number; cooldown: number; phase: number; flee: number; born: number; wanderU: number; wanderZ: number }
interface Projectile { mesh: THREE.Mesh; velocity: THREE.Vector3; reflected: boolean; age: number }
interface FallingVoxel { mesh: THREE.Mesh; x: number; h: number; z: number; velocity: number; kind: BlockKind }
interface StormDebris { mesh: THREE.Mesh; velocity: THREE.Vector3; age: number; kind: BlockKind }
interface CropVisual { group: THREE.Group; stem: THREE.Mesh; cap: THREE.Mesh }
interface BlockHit { x: number; y: number; z: number; kind: BlockKind; previous: { x: number; y: number; z: number } }

export class ErnasEngine {
  readonly renderer: THREE.WebGLRenderer;
  readonly world: VoxelWorld;
  readonly audio = new WorldAudio();
  selectedItem: ItemId = 'pickaxe';
  enabled = true;
  position: PlayerPosition;
  elapsed: number;
  stamina = 100;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(73, 1, .06, 2600);
  private atmosphere: WorldEnvironment;
  private callbacks: EngineCallbacks;
  private animation = 0;
  private lastTime = 0;
  private renderTime = 0;
  private reportTime = 0;
  private keys = new Set<string>();
  private velocityH = 0;
  private grounded = true;
  private freeFlight = false;
  private fallPeak = 0;
  private swing = 0;
  private lastAction = -5;
  private heldMine = false;
  private drag: { x: number; y: number; moved: boolean; touch: boolean } | null = null;
  private resizeObserver: ResizeObserver;
  private direction = new THREE.Vector3();
  private temp = new THREE.Vector3();
  private yawQuaternion = new THREE.Quaternion();
  private radialQuaternion = new THREE.Quaternion();
  private euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private localAxis = new THREE.Vector3(0, 0, 1);
  private highlight: THREE.LineSegments;
  private blockHit: BlockHit | null = null;
  private actors: Actor[] = [];
  private enemies: Enemy[] = [];
  private companion: THREE.Group | null = null;
  private companionPosition = { u: 15, z: 23 };
  private boss: THREE.Group;
  private bossOrbit: THREE.Group;
  private bossHealth = 100;
  private bossClock = 0;
  private bossAwake = false;
  private activeBoss: { id: string; name: string; subtitle: string; hint: string; reward: string; group: THREE.Group; core: THREE.Mesh; u: number; z: number; h: number; baseH: number; hp: number; maxHp: number; fire: number; teleport: number; hitFlash: number } | null = null;
  private bossProjectiles: { mesh: THREE.Mesh; velocity: THREE.Vector3; reflected: boolean; age: number; harm: number }[] = [];
  private projectiles: Projectile[] = [];
  private fallingVoxels: FallingVoxel[] = [];
  private hand = new THREE.Group();
  private handShaft: THREE.Mesh;
  private heldBlock: THREE.Mesh;
  private toolHead: THREE.Mesh;
  private wings: THREE.Mesh[] = [];
  private flame: THREE.Group;
  private fireLight: THREE.PointLight;
  private basicCube = new THREE.BoxGeometry(1, 1, 1);
  private creatureMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
  private materialCache = new Map<string, THREE.MeshLambertMaterial>();
  private previousQuality = '';
  private wasLocked = false;
  private disposed = false;
  private contextLost = false;
  private radiationClock = 0;
  private radiation = 0;
  private magma = 0;
  private cropVisuals = new Map<number, CropVisual>();
  private cropGroup = new THREE.Group();
  private creatures: Creature[] = [];
  private spawnClock = 0;
  private exposure = 0;
  private oxygen = 100;
  private swimming = false;
  private submerged = false;
  private depth = 0;
  private hazard: string | null = null;
  private climateClock = 0;
  private stormClock = 0;
  private debrisDamageClock = 0;
  private stormDebris: StormDebris[] = [];

  constructor(private host: HTMLElement, callbacks: EngineCallbacks) {
    this.callbacks = callbacks;
    const save = callbacks.getSave();
    this.elapsed = save.elapsed;
    this.oxygen = save.oxygen; this.exposure = save.coldExposure; this.freeFlight = save.mode === 'creative' && save.flight;
    const coarse = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    const memory = typeof navigator !== 'undefined' ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory : undefined;
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: !coarse && (!memory || memory > 4), powerPreference: 'high-performance', alpha: false });
    } catch {
      // Some integrated GPUs reject a high-performance antialiased context but
      // can still run the complete game with a conservative context request.
      this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power', alpha: false });
    }
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.setAttribute('aria-label', 'ERNAS 3D world. Use W A S D to move, drag to look, and click to mine.');
    this.renderer.domElement.setAttribute('tabindex', '-1');
    this.renderer.domElement.style.touchAction = 'none';
    host.appendChild(this.renderer.domElement);
    this.world = new VoxelWorld(save.edits);
    this.scene.add(this.world.group);
    this.atmosphere = new WorldEnvironment(this.scene);
    this.position = save.position && Object.values(save.position).every(Number.isFinite)
      ? { u: wrapU(save.position.u), h: THREE.MathUtils.clamp(save.position.h, WORLD_FLOOR + 1, RADIUS - 28), z: THREE.MathUtils.clamp(save.position.z, -HALF_LENGTH + 3, HALF_LENGTH - 3), yaw: save.position.yaw, pitch: THREE.MathUtils.clamp(save.position.pitch, -1.5, 1.5) }
      : { u: 13, h: 3.51, z: 22, yaw: .12, pitch: .12 };
    this.world.prime(this.position.u, this.position.z, save.settings.quality);
    this.position.h = this.world.safeHeight(this.position.u, this.position.z, this.position.h);
    this.fallPeak = this.position.h;

    this.highlight = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.015, 1.025, 1.025)), new THREE.LineBasicMaterial({ color: '#e8ecc8', transparent: true, opacity: .7 }));
    this.highlight.visible = false;
    this.scene.add(this.highlight);
    this.scene.add(this.cropGroup);
    this.buildPylons();
    const camp = this.buildCamp();
    this.flame = camp.flame;
    this.fireLight = camp.light;
    const bossParts = this.buildBoss();
    this.boss = bossParts.group;
    this.bossOrbit = bossParts.orbit;
    if (save.bossDefeated) { this.boss.visible = false; this.bossHealth = 0; }
    this.buildFauna();
    const toolMaterial = new THREE.MeshLambertMaterial({ color: '#acae94', fog: false });
    const shaft = this.box(.09, .66, .1, '#816744', 0, -.12, 0);
    this.handShaft = shaft;
    this.toolHead = new THREE.Mesh(new THREE.BoxGeometry(.6, .14, .14), toolMaterial);
    this.toolHead.position.y = .16;
    this.heldBlock = new THREE.Mesh(new THREE.BoxGeometry(.35, .35, .35), new THREE.MeshLambertMaterial({ color: '#889376', fog: false }));
    this.heldBlock.rotation.y = .4;
    this.heldBlock.visible = false;
    this.hand.add(shaft, this.toolHead, this.heldBlock);
    this.hand.position.set(.48, -.48, -.8);
    this.hand.rotation.z = -.45;
    this.camera.add(this.hand);
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(.8, .03, 1.05), new THREE.MeshLambertMaterial({ color: '#cac7a9', transparent: true, opacity: .75, fog: false }));
      wing.position.set(side * .8, -.65, -.65);
      wing.rotation.z = side * .3;
      wing.visible = false;
      this.camera.add(wing); this.wings.push(wing);
    }
    this.scene.add(this.camera);
    if (save.companion) this.summonChill();
    this.audio.setVolume(save.settings.volume);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    window.addEventListener('blur', this.blur);
    window.addEventListener('pointermove', this.pointerMove);
    window.addEventListener('pointerup', this.pointerUp);
    window.addEventListener('pointercancel', this.pointerUp);
    document.addEventListener('pointerlockchange', this.pointerLockChange);
    this.renderer.domElement.addEventListener('pointerdown', this.pointerDown);
    this.renderer.domElement.addEventListener('contextmenu', this.contextMenu);
    this.renderer.domElement.addEventListener('webglcontextlost', this.contextLostHandler, false);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.contextRestoredHandler, false);
    this.animation = requestAnimationFrame(this.animate);
  }

  private material(color: string) {
    let material = this.materialCache.get(color);
    if (!material) { material = new THREE.MeshLambertMaterial({ color }); this.materialCache.set(color, material); }
    return material;
  }

  private box(w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(this.basicCube, this.material(color));
    mesh.scale.set(w, h, d); mesh.position.set(x, y, z);
    return mesh;
  }

  private placeGroup(group: THREE.Group, u: number, h: number, z: number) {
    toWorld(u, h, z, group.position);
    group.rotation.set(0, 0, u / RADIUS);
    this.scene.add(group);
  }

  private buildPylons() {
    for (const pylon of PYLONS) {
      const group = new THREE.Group();
      group.add(this.box(3.5, .3, 3.5, '#676d58', 0, .15));
      group.add(this.box(2.6, .4, 2.6, '#818770', 0, .5));
      for (const side of [-1, 1]) {
        group.add(this.box(.55, 3.6, .65, '#70775d', side * .9, 2.2));
        group.add(this.box(.8, .4, .85, '#909779', side * .9, 4.15));
      }
      group.add(this.box(2.6, .55, .75, '#8e9679', 0, 4.45));
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(.43), new THREE.MeshBasicMaterial({ color: '#e2edb3' }));
      crystal.position.set(0, 2.6, 0); group.add(crystal);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlow('#ceeaa5'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .45 }));
      glow.scale.set(4.5, 4.5, 1); glow.position.set(0, 2.6, 0); group.add(glow);
      group.userData.crystal = crystal;
      crystal.material.color.set(BIOMES[pylon.biome].color);
      this.placeGroup(group, pylon.u, pylon.height + .5, pylon.z);
      this.actors.push({ group, u: pylon.u, z: pylon.z, h: pylon.height + .5, type: `pylon:${pylon.id}`, label: pylon.name });
      if (pylon.id !== 'hearth') {
        const cache = new THREE.Group();
        cache.add(this.box(1.25, .75, .9, '#75644b', 0, .4));
        for (const side of [-1, 1]) cache.add(this.box(.08, .82, .96, '#adb390', side * .45, .42));
        const lid = this.box(1.35, .14, 1, '#8b7a5a', 0, .84); cache.add(lid); cache.userData.lid = lid;
        cache.userData.cacheId = `cache:${pylon.id}`;
        cache.add(this.box(.16, .2, .06, '#d8dca8', 0, .56, -.48));
        if (pylon.biome === 'clouds') for (let i = 0; i < 12; i++) {
          const twig = this.box(1.1, .2, .23, '#9c9b87', Math.cos(i * Math.PI / 6) * 1.2, .11, Math.sin(i * Math.PI / 6) * 1.2);
          twig.rotation.y = -i * Math.PI / 6; cache.add(twig);
        }
        this.placeGroup(cache, pylon.u + 5, pylon.height + .5, pylon.z + 2);
        this.actors.push({ group: cache, u: pylon.u + 5, z: pylon.z + 2, h: pylon.height + .5, type: `cache:${pylon.id}`, label: pylon.biome === 'clouds' ? 'Cloud nest / Search cache' : 'Expedition cache / Search' });
      }
    }
  }

  private buildCamp() {
    const group = new THREE.Group();
    for (let i = 0; i < 8; i++) group.add(this.box(.4, .27, .4, '#7e816b', Math.cos(i * Math.PI / 4) * .85, .13, Math.sin(i * Math.PI / 4) * .85));
    const log = this.box(1.5, .2, .28, '#65533c', 0, .22); log.rotation.y = .4;
    const log2 = log.clone(); log2.rotation.y = -.8; group.add(log, log2);
    const flame = new THREE.Group();
    flame.add(this.box(.45, .7, .4, '#e4b763', 0, .45), this.box(.25, 1, .2, '#f1d89a', .1, .65), this.box(.65, .3, .55, '#c88749', 0, .2));
    group.add(flame);
    const light = new THREE.PointLight('#ffc06b', 18, 14, 2); light.position.y = 1.3; group.add(light);
    const tripod = new THREE.Group();
    for (const side of [-1, 1]) { const stick = this.box(.09, 1.8, .09, '#817051', side * .5, .9); stick.rotation.z = side * .22; tripod.add(stick); }
    tripod.add(this.box(1.7, .1, .1, '#817051', 0, 1.8), this.box(.6, .35, .6, '#43473e', 0, 1.15));
    group.add(tripod);
    this.placeGroup(group, 14, 3.5, 15);
    this.actors.push({ group, u: 14, z: 15, type: 'steam', label: 'Campfire / Steam pork' });

    const bed = new THREE.Group();
    bed.add(this.box(1.55, .18, 2.7, '#735f45', 0, .5));
    for (const x of [-.6, .6]) for (const z of [-1.1, 1.1]) bed.add(this.box(.2, .5, .2, '#65583f', x, .25, z));
    bed.add(this.box(1.4, .3, 2.35, '#a4ad84', 0, .72, .1), this.box(1.3, .23, .55, '#d5d4b9', 0, .77, -.85));
    this.placeGroup(bed, 17, 3.5, 21);
    this.actors.push({ group: bed, u: 17, z: 21, type: 'sleep', label: 'Mothsilk bed / Rest' });
    return { flame, light };
  }

  private buildBoss() {
    const group = new THREE.Group();
    group.add(this.box(2.5, 6.5, 2.5, '#343a30', 0, 5));
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.77, 2, 4), this.material('#404737'));
    cap.rotation.y = Math.PI / 4; cap.position.y = 9.25; group.add(cap);
    for (const y of [2, 5, 7.7]) group.add(this.box(2.55, .09, 2.55, '#c7c98f', 0, y));
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(.7), new THREE.MeshBasicMaterial({ color: '#ececc5' }));
    core.position.set(0, 4.8, 1.45); group.add(core);
    const orbit = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const stone = this.box(.5 + hash(i, 4) * .5, .6, .6, '#858b71');
      const angle = i / 12 * Math.PI * 2;
      stone.position.set(Math.cos(angle) * 4.7, 2 + i * .6, Math.sin(angle) * 4.7);
      stone.rotation.set(i, i * .7, i * .4); orbit.add(stone);
    }
    group.add(orbit);
    this.placeGroup(group, -76, 4.5, -35);
    return { group, orbit };
  }

  private makeCreature(name: string) {
    const group = new THREE.Group();
    const falsePlayer = name === 'False Player';
    const bone = falsePlayer ? '#dbf0d2' : '#bcc0a8', dark = falsePlayer ? '#9fbf9a' : '#8e9280';
    // Spine, pelvis, and a proper ribcage.
    group.add(this.box(.16, .92, .16, dark, 0, 1.14));
    group.add(this.box(.46, .14, .24, bone, 0, .74));
    for (let i = 0; i < 4; i++) {
      const y = .95 + i * .17, width = .56 - Math.abs(i - 1.2) * .07;
      group.add(this.box(width, .08, .1, bone, 0, y, -.11), this.box(width, .08, .1, bone, 0, y, .11));
      for (const side of [-1, 1]) group.add(this.box(.08, .1, .24, bone, side * width / 2, y, 0));
    }
    group.add(this.box(.52, .14, .26, bone, 0, 1.66));
    // Skull with brow, jaw, and sunken eyes.
    group.add(this.box(.15, .12, .14, dark, 0, 1.78));
    group.add(this.box(.46, .34, .42, bone, 0, 2));
    group.add(this.box(.48, .09, .44, bone, 0, 2.14));
    group.add(this.box(.38, .12, .34, dark, 0, 1.79, -.03));
    for (const side of [-1, 1]) {
      group.add(this.box(.13, .13, .07, '#20261f', side * .12, 2.03, -.2));
      if (falsePlayer) group.add(this.box(.07, .07, .04, '#e8f6dd', side * .12, 2.04, -.22));
      group.add(this.box(.05, .26, .05, dark, side * .17, 2.3, -.05));
      // Arms, hung from the shoulders.
      group.add(this.box(.12, .42, .13, bone, side * .33, 1.42), this.box(.1, .4, .11, bone, side * .36, 1.02));
      group.add(this.box(.14, .1, .18, bone, side * .36, .79));
      // Legs with knees and long feet.
      group.add(this.box(.14, .44, .15, bone, side * .16, .5), this.box(.12, .38, .13, bone, side * .16, .14));
      group.add(this.box(.16, .08, .3, bone, side * .16, -.06, -.06));
      if (falsePlayer) {
        const wing = this.box(.95, 1.35, .06, '#e3efd0', side * .78, 1.25, .14); wing.rotation.z = side * .32; group.add(wing);
        const lower = this.box(.6, .8, .05, '#cfe0bc', side * .64, .62, .12); lower.rotation.z = side * .5; group.add(lower);
      }
    }
    return group;
  }

  private buildFauna() {
    const positions = [[27, -8], [-26, -14], [43, -26], [88, -28], [-63, -10], [-290, 114], [-615, 30], [795, 32], [460, 331], [108, 579]];
    positions.forEach(([u, z], i) => {
      const group = this.batchCreatureModel(this.makeCreature('Skeleton'));
      this.placeGroup(group, u, this.world.ground(u, z), z);
      this.enemies.push({ group, u, z, homeU: u, homeZ: z, hp: 36, cooldown: 0, name: 'Skeleton', phase: i * 1.8 });
    });
    const pig = new THREE.Group();
    const hide = '#bd9b89', shade = '#a5836f';
    pig.add(this.box(1.12, .78, 1.6, hide, 0, .82));
    pig.add(this.box(1.16, .26, 1.5, shade, 0, .58));
    pig.add(this.box(.86, .72, .74, hide, 0, .98, -1.02));
    pig.add(this.box(.5, .3, .18, '#caa294', 0, .84, -1.44));
    pig.add(this.box(.16, .1, .05, shade, -.12, .84, -1.52), this.box(.16, .1, .05, shade, .12, .84, -1.52));
    for (const side of [-1, 1]) {
      const ear = this.box(.28, .3, .1, shade, side * .28, 1.33, -.86); ear.rotation.z = side * .3; pig.add(ear);
      pig.add(this.box(.12, .12, .05, '#31372c', side * .24, 1.04, -1.38));
      pig.add(this.box(.11, .11, .04, '#f2efdc', side * .26, 1.07, -1.4));
    }
    for (const x of [-.38, .38]) for (const z of [-.52, .58]) {
      pig.add(this.box(.27, .44, .27, shade, x, .32, z));
      pig.add(this.box(.29, .16, .29, '#6f5b4c', x, .1, z));
    }
    const tail = this.box(.1, .3, .1, shade, 0, 1.1, .82); tail.rotation.x = .6; pig.add(tail);
    pig.add(this.box(.14, .12, .12, shade, 0, 1.26, .92));
    this.placeGroup(pig, 23, this.world.ground(23, 12), 12);
    this.actors.push({ group: pig, u: 23, z: 12, type: 'pig', label: 'A perfectly ordinary pig' });
  }

  summonChill() {
    if (this.companion) return;
    const group = new THREE.Group();
    group.add(this.box(1.08, 1.08, 1.08, '#b5bea0', 0, .93));
    group.add(this.box(1.12, .1, 1.12, '#c6cfae', 0, 1.44));
    group.add(this.box(1.12, .1, 1.12, '#98a184', 0, .42));
    for (const side of [-1, 1]) {
      group.add(this.box(.17, .44, .19, '#6f7b5b', side * .3, .21));
      group.add(this.box(.25, .13, .34, '#5d6a4b', side * .3, -.03, -.04));
      group.add(this.box(.1, .1, .1, '#c6cfae', side * .56, 1.32, -.5));
    }
    // A carved :] that always faces forward.
    group.add(this.box(.1, .1, .02, '#374630', -.24, 1.13, -.551), this.box(.1, .1, .02, '#374630', -.24, .86, -.551));
    group.add(this.box(.27, .08, .02, '#374630', .12, 1.18, -.551), this.box(.08, .4, .02, '#374630', .22, 1.01, -.551), this.box(.27, .08, .02, '#374630', .12, .83, -.551));
    this.companionPosition = { u: wrapU(this.position.u + 2.5), z: this.position.z - 2.5 };
    this.placeGroup(group, this.companionPosition.u, this.world.ground(this.companionPosition.u, this.companionPosition.z), this.companionPosition.z);
    this.companion = group;
  }

  private resize() {
    if (this.disposed) return;
    const width = Math.max(1, this.host.clientWidth || window.innerWidth);
    const height = Math.max(1, this.host.clientHeight || window.innerHeight);
    const quality = this.callbacks.getSave().settings.quality;
    const pixelBudget = quality === 'high' ? 3_600_000 : 2_400_000;
    const budgetRatio = Math.sqrt(pixelBudget / (width * height));
    const pixelRatio = Math.max(.75, Math.min(window.devicePixelRatio || 1, quality === 'high' ? 1.5 : 1, budgetRatio));
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.previousQuality = quality;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.keys.clear(); this.heldMine = false; this.drag = null;
      if (document.pointerLockElement === this.renderer.domElement) document.exitPointerLock();
    }
  }

  lock() {
    this.audio.start();
    const coarse = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    if (!this.enabled || !this.renderer.domElement.requestPointerLock || coarse) return;
    try {
      const result = this.renderer.domElement.requestPointerLock();
      if (result && typeof result.catch === 'function') void result.catch(() => undefined);
    } catch { /* Drag-to-look works in embeds that do not allow pointer lock. */ }
  }

  input(code: string, down: boolean) {
    if (down && this.enabled) {
      if (code === 'Space' && !this.keys.has(code) && this.grounded && !this.freeFlight) { this.velocityH = 5.8; this.grounded = false; }
      this.keys.add(code);
    } else this.keys.delete(code);
  }

  toggleFlight() {
    if (!this.enabled || this.callbacks.getSave().mode !== 'creative') return;
    this.freeFlight = !this.freeFlight; this.velocityH = 0;
    this.callbacks.onMessage(this.freeFlight ? 'Wings unbound. Space rises, Shift descends, Q boosts cruise speed.' : 'Gravity has found you again.');
  }

  private keyDown = (event: KeyboardEvent) => {
    if (!this.enabled || (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))) return;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'KeyQ'].includes(event.code)) {
      event.preventDefault(); this.input(event.code, true);
    }
    if (event.code === 'KeyF' && !event.repeat) {
      if (this.callbacks.getSave().mode === 'creative') this.toggleFlight();
      else this.callbacks.onMessage('Hold Space to use your wings. Their integrity determines your lift.');
    }
  };
  private keyUp = (event: KeyboardEvent) => this.input(event.code, false);
  private blur = () => { this.keys.clear(); this.heldMine = false; if (this.enabled) this.callbacks.onUnlock(); };
  private contextMenu = (event: Event) => event.preventDefault();
  private contextLostHandler = (event: Event) => {
    event.preventDefault();
    this.contextLost = true;
    this.keys.clear(); this.heldMine = false;
    this.callbacks.onMessage('The graphics context was interrupted. ERNAS is waiting for the browser to restore it.');
  };
  private contextRestoredHandler = () => {
    this.contextLost = false;
    this.lastTime = performance.now();
    this.resize();
    this.callbacks.onMessage('The world is visible again.');
  };
  private pointerLockChange = () => {
    const locked = document.pointerLockElement === this.renderer.domElement;
    if (this.wasLocked && !locked) {
      this.keys.clear(); this.heldMine = false;
      if (this.enabled) this.callbacks.onUnlock();
    }
    this.wasLocked = locked;
  };
  private pointerDown = (event: PointerEvent) => {
    if (!this.enabled) return;
    this.audio.start();
    if (event.button === 2) { event.preventDefault(); this.place(); return; }
    if (event.button !== 0) return;
    if (document.pointerLockElement === this.renderer.domElement) { this.heldMine = true; this.primaryAction(); }
    else {
      this.drag = { x: event.clientX, y: event.clientY, moved: false, touch: event.pointerType === 'touch' };
      if (event.pointerType !== 'touch') this.lock();
    }
  };
  private pointerMove = (event: PointerEvent) => {
    if (!this.enabled) return;
    const sensitivity = .00065 + this.callbacks.getSave().settings.sensitivity / 100 * .003;
    if (document.pointerLockElement === this.renderer.domElement) {
      this.position.yaw -= event.movementX * sensitivity;
      this.position.pitch = THREE.MathUtils.clamp(this.position.pitch - event.movementY * sensitivity, -1.5, 1.5);
    } else if (this.drag) {
      const dx = event.clientX - this.drag.x, dy = event.clientY - this.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 1) this.drag.moved = true;
      this.position.yaw -= dx * sensitivity * (this.drag.touch ? 1.6 : 1);
      this.position.pitch = THREE.MathUtils.clamp(this.position.pitch - dy * sensitivity * (this.drag.touch ? 1.6 : 1), -1.5, 1.5);
      this.drag.x = event.clientX; this.drag.y = event.clientY;
    }
  };
  private pointerUp = () => {
    if (this.drag && !this.drag.moved && document.pointerLockElement !== this.renderer.domElement && this.enabled) this.primaryAction();
    this.drag = null; this.heldMine = false;
  };

  private rayBlock(): BlockHit | null {
    this.camera.getWorldDirection(this.direction);
    let previous = { x: Math.round(this.position.u), y: Math.round(this.position.h + 1.6), z: Math.round(this.position.z) };
    for (let distance = .3; distance < 7.5; distance += .12) {
      this.temp.copy(this.camera.position).addScaledVector(this.direction, distance);
      const logical = fromWorld(this.temp);
      const x = wrapU(Math.round(logical.u)), y = Math.round(logical.h), z = Math.round(logical.z);
      const kind = this.world.get(x, y, z);
      if (kind) return { x, y, z, kind, previous };
      previous = { x, y, z };
    }
    return null;
  }

  primaryAction() {
    if (!this.enabled) return;
    const save = this.callbacks.getSave();
    const mineTool = /pickaxe|war-pick|hand-axe|shovel|hammer|ice-axe|scythe|machete/.test(this.selectedItem);
    const cooldown = save.mode === 'creative' ? .12 : this.selectedItem === 'sword' ? .28 : mineTool ? .55 - Math.min(.3, (save.toolQualities[this.selectedItem] || .5) * .3) : .6;
    if (this.renderTime - this.lastAction < cooldown) return;
    this.lastAction = this.renderTime;
    this.swing = .3;
    this.camera.getWorldDirection(this.direction);
    for (const projectile of this.projectiles) {
      if (projectile.reflected) continue;
      this.temp.copy(projectile.mesh.position).sub(this.camera.position);
      if (this.temp.length() < (this.selectedItem === 'sword' ? 7 : 5.5) && this.temp.normalize().dot(this.direction) > .35) {
        projectile.reflected = true;
        toWorld(-76, 9.3, -35, this.temp);
        projectile.velocity.copy(this.temp).sub(projectile.mesh.position).normalize().multiplyScalar(22);
        (projectile.mesh.material as THREE.MeshBasicMaterial).color.set('#f0f1bd');
        this.audio.tick('place'); this.callbacks.onMessage('Gravity reverses.'); return;
      }
    }
    for (const projectile of this.bossProjectiles) {
      if (projectile.reflected || !this.activeBoss) continue;
      this.temp.copy(projectile.mesh.position).sub(this.camera.position);
      if (this.temp.length() < (this.selectedItem === 'sword' ? 8 : 6) && this.temp.normalize().dot(this.direction) > .3) {
        projectile.reflected = true;
        this.temp.copy(this.activeBoss.group.position);
        projectile.velocity.copy(this.temp).sub(projectile.mesh.position).normalize().multiplyScalar(30);
        (projectile.mesh.material as THREE.MeshBasicMaterial).color.set('#f2f0c0');
        this.audio.tick('place'); return;
      }
    }
    if (this.activeBoss) {
      this.temp.copy(this.activeBoss.group.position).sub(this.camera.position);
      const reach = this.selectedItem === 'sword' ? 8 : this.selectedItem === 'spear' ? 9 : 6;
      if (this.temp.length() < reach && this.temp.normalize().dot(this.direction) > .8) {
        const weapon = /sword|war-pick|spear|dagger|hand-axe|hammer|machete/.test(this.selectedItem);
        const melee = this.selectedItem === 'sword' ? 8 + (save.toolQualities.sword || .5) * 8 : weapon ? 8 : 4;
        if (weapon) this.callbacks.onToolWear(this.selectedItem, 1);
        this.damageBoss(melee); return;
      }
    }
    {
      const weapon = /sword|dagger|spear|war-pick|machete|hand-axe/.test(this.selectedItem);
      const power = this.selectedItem === 'sword' ? 18 + (save.toolQualities.sword || .5) * 14 : weapon ? 13 : 7;
      if (this.strikeCreature(power)) { if (weapon) this.callbacks.onToolWear(this.selectedItem, 1); return; }
    }
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || !enemy.group.visible) continue;
      toWorld(enemy.u, this.world.ground(enemy.u, enemy.z) + 1.1, enemy.z, this.temp);
      this.temp.sub(this.camera.position);
      if (this.temp.length() < 5.5 && this.temp.normalize().dot(this.direction) > .87) {
        const weapon = /sword|dagger|spear|war-pick|machete|hand-axe/.test(this.selectedItem);
        enemy.hp -= this.selectedItem === 'sword' ? 20 + (save.toolQualities.sword || .5) * 16 : weapon ? 15 : 9;
        enemy.group.scale.setScalar(.9);
        this.audio.tick('hurt');
        if (weapon) this.callbacks.onToolWear(this.selectedItem, 1);
        if (enemy.hp <= 0) { enemy.group.visible = false; this.callbacks.onKill(enemy.name); }
        return;
      }
    }
    if (ITEMS[this.selectedItem].category === 'Provisions' || this.selectedItem === 'cloth' || this.selectedItem === 'chisel') { this.callbacks.onUse(this.selectedItem); return; }
    const hit = this.rayBlock();
    if (!hit) return;
    if (hit.y <= WORLD_FLOOR) { this.callbacks.onMessage('The outer iron crust does not yield in this fragment.'); return; }
    this.world.set(hit.x, hit.y, hit.z, null);
    this.startSandFall(hit.x, hit.z);
    this.callbacks.onMine(hit.kind);
    if (save.mode === 'survival' && mineTool) this.callbacks.onToolWear(this.selectedItem, 1);
    this.audio.tick('mine');
  }

  place() {
    if (!this.enabled) return;
    const seed = ITEMS[this.selectedItem].seed;
    if (seed) { this.plantSeed(seed); return; }
    if (this.selectedItem === 'hoe') { this.tillSoil(); return; }
    if (!ITEMS[this.selectedItem].placeable) { this.callbacks.onMessage('Select a building material, seed, or a hoe to till.'); return; }
    const hit = this.rayBlock();
    if (!hit) { this.callbacks.onMessage('Move closer to a surface to place a block.'); return; }
    const { x, y, z } = hit.previous;
    if (Math.abs(z) >= HALF_LENGTH || y <= WORLD_FLOOR || y > WORLD_CEILING) return;
    if (Math.abs(wrapU(x - this.position.u)) < .8 && Math.abs(z - this.position.z) < .8 && y > this.position.h - .5 && y < this.position.h + 2) {
      this.callbacks.onMessage('Leave a little room for yourself.'); return;
    }
    if (this.world.get(x, y, z)) return;
    if (this.callbacks.onPlace(this.selectedItem as BlockKind)) {
      this.world.set(x, y, z, this.selectedItem as BlockKind);
      if (this.selectedItem === 'sand' || this.selectedItem === 'red-sand') this.startSandFall(x, z);
      this.audio.tick('place'); this.swing = .2;
    }
  }

  private groundInFront(reach = 3.5) {
    this.camera.getWorldDirection(this.direction);
    for (let d = 1.2; d < reach; d += .3) {
      this.temp.copy(this.camera.position).addScaledVector(this.direction, d);
      const logical = fromWorld(this.temp);
      const x = wrapU(Math.round(logical.u)), z = Math.round(logical.z);
      const ground = this.world.ground(x, z, logical.h + 2);
      if (ground > WORLD_FLOOR && Math.abs(ground - logical.h) < 2.5) return { x, z, h: ground };
    }
    const x = wrapU(Math.round(this.position.u - Math.sin(this.position.yaw) * 2)), z = Math.round(this.position.z - Math.cos(this.position.yaw) * 2);
    return { x, z, h: this.world.ground(x, z, this.position.h + 2) };
  }

  private tillSoil() {
    const spot = this.groundInFront();
    const top = this.world.get(spot.x, Math.floor(spot.h - .5), spot.z);
    const tillable: (BlockKind | null)[] = ['grass', 'moss', 'rich-soil', 'savanna-grass', 'mud', 'sand', 'red-sand', 'frozen-soil', 'mycelium', 'stone', 'cracked-earth', 'bleached-sand', 'flowers', 'heather', 'lichen'];
    if (!tillable.includes(top)) { this.callbacks.onMessage('Till grassy or soft ground: grass, soil, moss, or sand.'); return; }
    this.world.set(spot.x, Math.floor(spot.h - .5), spot.z, 'tilled-soil');
    this.callbacks.onToolWear('hoe', 1); this.audio.tick('place');
    this.callbacks.onMessage('Soil tilled. Plant a seed here with right-click.');
  }

  private plantSeed(crop: string) {
    const spot = this.groundInFront();
    if (this.callbacks.getSave().farms.some(f => Math.abs(wrapU(f.u - spot.x)) < 1 && Math.abs(f.z - spot.z) < 1)) { this.callbacks.onMessage('Something is already growing here.'); return; }
    this.callbacks.onPlant(crop, spot.x, spot.z, spot.h);
    this.audio.tick('place');
  }

  private updateCrops(delta: number) {
    const save = this.callbacks.getSave();
    const seen = new Set<number>();
    for (const plot of save.farms) {
      // Keep remote farms in the save, but do not create hundreds of offscreen
      // meshes around a world that is thousands of blocks wide.
      const near = Math.hypot(wrapU(plot.u - this.position.u), plot.z - this.position.z) < 110 && Math.abs(plot.h - this.position.h) < 120;
      if (!near) {
        const old = this.cropVisuals.get(plot.id);
        if (old) { this.cropGroup.remove(old.group); this.cropVisuals.delete(plot.id); }
        continue;
      }
      seen.add(plot.id);
      const definition = CROPS[plot.crop]; if (!definition) continue;
      let visual = this.cropVisuals.get(plot.id);
      if (!visual) {
        const group = new THREE.Group();
        const stem = this.box(.16, 1, .16, definition.color); stem.position.y = .5;
        const cap = this.box(.5, .5, .5, definition.cap); cap.position.y = 1;
        group.add(stem, cap); toWorld(plot.u, plot.h, plot.z, group.position); group.rotation.z = plot.u / RADIUS;
        this.cropGroup.add(group); visual = { group, stem, cap }; this.cropVisuals.set(plot.id, visual);
      }
      const grow = Math.max(.08, Math.min(1, (this.elapsed - plot.planted) / definition.growTime + (this.elapsed - plot.watered < 40 ? .0004 * delta * 60 : 0)));
      const tall = definition.tall * grow;
      visual.stem.scale.y = tall; visual.stem.position.y = tall / 2;
      visual.cap.position.y = tall + .25; visual.cap.scale.setScalar(.35 + grow * .75);
      (visual.cap.material as THREE.MeshLambertMaterial).color.set(grow >= 1 ? definition.cap : definition.color);
      visual.cap.rotation.y += delta * (grow >= 1 ? .8 : .2);
    }
    for (const [id, visual] of this.cropVisuals) if (!seen.has(id)) {
      this.cropGroup.remove(visual.group);
      // Crop boxes share basicCube with the hand, creatures, and world props.
      this.cropVisuals.delete(id);
    }
  }

  private startSandFall(x: number, z: number) {
    for (const block of this.world.releaseSand(x, z)) {
      const mesh = this.box(1, 1, 1, ITEMS[block.kind].color);
      mesh.rotation.z = block.x / RADIUS;
      toWorld(block.x, block.y, block.z, mesh.position);
      this.scene.add(mesh);
      this.fallingVoxels.push({ mesh, x: block.x, h: block.y, z: block.z, velocity: 0, kind: block.kind });
    }
  }

  private updateFalling(delta: number) {
    this.fallingVoxels.sort((a, b) => a.h - b.h);
    for (let i = 0; i < this.fallingVoxels.length; i++) {
      const block = this.fallingVoxels[i];
      const ground = this.world.ground(block.x, block.z, block.h - .51) + .5;
      block.velocity -= 13 * delta;
      block.h += block.velocity * delta;
      if (block.h <= ground) {
        this.world.set(block.x, Math.round(ground), block.z, block.kind);
        this.scene.remove(block.mesh);
        this.fallingVoxels.splice(i--, 1);
      } else {
        toWorld(block.x, block.h, block.z, block.mesh.position);
        block.mesh.scale.x = (RADIUS - block.h) / RADIUS;
      }
    }
  }

  private settlePendingVoxels() {
    // Checkpoints settle transient sand so reloading cannot silently lose a block.
    this.fallingVoxels.sort((a, b) => a.h - b.h);
    for (const block of this.fallingVoxels) {
      const ground = this.world.ground(block.x, block.z, block.h - .51) + .5;
      this.world.set(block.x, Math.round(ground), block.z, block.kind);
      this.scene.remove(block.mesh);
    }
    this.fallingVoxels = [];
    for (const debris of this.stormDebris) this.settleStormDebris(debris);
    this.stormDebris = [];
  }

  private nearestInteraction() {
    let nearest: Actor | undefined;
    let distance = 5;
    for (const actor of this.actors) {
      if (actor.type === 'pig') continue;
      const d = Math.hypot(wrapU(actor.u - this.position.u), actor.z - this.position.z);
      const vertical = Math.abs(this.position.h - (actor.h ?? this.world.height(actor.u, actor.z) + .5));
      if (d < distance && vertical < 4) { nearest = actor; distance = d; }
    }
    if (nearest) return { type: nearest.type, label: nearest.label };
    const save = this.callbacks.getSave();
    for (const plot of save.farms) {
      const definition = CROPS[plot.crop]; if (!definition) continue;
      if (Math.hypot(wrapU(plot.u - this.position.u), plot.z - this.position.z) < 2.6 && Math.abs(this.position.h - plot.h) < 3) {
        const ripe = this.elapsed - plot.planted >= definition.growTime;
        return { type: `harvest:${plot.id}`, label: ripe ? `${definition.name} / Harvest` : `${definition.name} / Growing (${Math.min(99, Math.floor((this.elapsed - plot.planted) / definition.growTime * 100))}%)` };
      }
    }
    if (surfaceDistance(OUTER_PLUG, this.position) < 10) return { type: 'plug', label: 'The Plug / Haul toward the Socket' };
    if (surfaceDistance(OUTER_SOCKET, this.position) < 10) return { type: 'socket', label: 'The Socket / Seat the Plug' };
    const fluid = this.world.fluid(this.position.u, this.position.z);
    if (fluid && this.position.h < fluid.height + 3) return fluid.kind === 'water' ? { type: 'water', label: 'Fresh water / Refill flasks' } : { type: 'blood', label: 'Liquid blood / Collect' };
    return null;
  }

  interact() {
    if (!this.enabled) return;
    const interaction = this.nearestInteraction();
    if (interaction?.type.startsWith('harvest:')) { this.callbacks.onHarvest(Number(interaction.type.split(':')[1])); return; }
    if (interaction) this.callbacks.onInteract(interaction.type);
    else this.callbacks.onMessage('Approach a pylon, bed, campfire, crop, or the river to interact.');
  }

  teleport(u: number, z: number) {
    this.settlePendingVoxels();
    this.clearActiveBoss();
    while (this.creatures.length) this.removeCreature(this.creatures.length - 1);
    this.world.prime(u, z + 3, this.callbacks.getSave().settings.quality);
    const pylon = PYLONS.find(site => site.u === u && site.z === z);
    const expected = pylon ? pylon.height + .5 : this.world.ground(u, z + 3);
    const landings = [[0, 3], [-3, 3], [3, 3], [0, -3], [-3, -3], [3, -3], [-5, 0], [5, 0]].map(([dx, dz]) => {
      const x = wrapU(u + dx), longitude = z + dz, ground = this.world.ground(x, longitude);
      return { u: x, z: longitude, h: ground + .01, cost: Math.abs(ground - expected) * 10 + Math.hypot(dx, dz - 3) };
    }).sort((a, b) => a.cost - b.cost);
    const landing = landings[0];
    this.position = { u: landing.u, z: landing.z, h: landing.h, yaw: 0, pitch: .06 };
    this.oxygen = 100; this.exposure = Math.max(0, this.exposure - 30); this.submerged = this.swimming = false;
    this.velocityH = 0; this.fallPeak = this.position.h; this.grounded = true;
    this.projectiles.forEach(p => { this.scene.remove(p.mesh); p.mesh.geometry.dispose(); (p.mesh.material as THREE.Material).dispose(); });
    this.projectiles = []; this.bossAwake = false;
    this.audio.tick('travel');
    if (this.companion) this.companionPosition = { u: u + 2, z: z + 3 };
  }

  respawn() { this.teleport(13, 19); this.stamina = 100; this.oxygen = 100; this.exposure = 0; this.freeFlight = false; }
  rest(recovery: number, elapsed: number) { this.elapsed = elapsed; this.exposure *= 1 - recovery; this.oxygen = 100; this.stamina = Math.min(100, this.stamina + recovery * 100); }
  snapshot() { this.settlePendingVoxels(); return { position: { ...this.position }, elapsed: this.elapsed, edits: this.world.snapshot(), oxygen: this.oxygen, coldExposure: this.exposure, flight: this.freeFlight }; }

  private move(delta: number) {
    const save = this.callbacks.getSave();
    if (save.mode !== 'creative') this.freeFlight = false;
    const legFactor = (save.body.leftLeg + save.body.rightLeg) / 200;
    const prone = save.body.leftLeg === 0 && save.body.rightLeg === 0;
    const wingFactor = (save.body.leftWing + save.body.rightWing) / 200;
    const forward = Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));
    const sideways = Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA'));
    if (this.keys.has('ArrowLeft')) this.position.yaw += delta * 1.5;
    if (this.keys.has('ArrowRight')) this.position.yaw -= delta * 1.5;
    const moving = !!(forward || sideways);
    const shift = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const dive = this.keys.has('ControlLeft') || this.keys.has('ControlRight');
    const boost = this.freeFlight && this.keys.has('KeyQ');
    const fluid = this.world.fluid(this.position.u, this.position.z);
    this.swimming = !!fluid && this.position.h < fluid.height - .15;
    const drag = this.swimming && !this.freeFlight ? fluid?.kind === 'blood' ? .4 : .7 : 1;
    const speed = (this.freeFlight ? boost ? 88 : 30 : shift && this.stamina > 1 ? 10 : 5.8) * (this.freeFlight ? 1 : prone ? .26 : .45 + legFactor * .55) * drag;
    const normalization = forward && sideways ? .7071 : 1;
    const yaw = this.position.yaw;
    const curvature = RADIUS / Math.max(28, RADIUS - this.position.h);
    const du = (sideways * Math.cos(yaw) - forward * Math.sin(yaw)) * speed * normalization * delta * curvature;
    const dz = (-forward * Math.cos(yaw) - sideways * Math.sin(yaw)) * speed * normalization * delta;
    const nextU = wrapU(this.position.u + du), nextZ = THREE.MathUtils.clamp(this.position.z + dz, -HALF_LENGTH + 2.5, HALF_LENGTH - 2.5);
    const nextGround = this.world.ground(nextU, nextZ, this.position.h + 1.6);
    if (this.freeFlight || nextGround <= this.position.h + 1.15) {
      this.position.u = nextU; this.position.z = nextZ;
      if (this.grounded && nextGround > this.position.h) this.position.h = nextGround;
    }
    const holdingJump = this.keys.has('Space');
    const previousHeight = this.position.h;
    if (this.freeFlight) {
      this.position.h += (Number(holdingJump) - Number(shift || dive)) * delta * (boost ? 50 : 22);
      this.position.h = THREE.MathUtils.clamp(this.position.h, WORLD_FLOOR + 1, RADIUS - 28);
      this.velocityH = 0; this.grounded = false;
    } else {
      const zeroGravity = this.position.h > RADIUS - 45;
      const lifting = holdingJump && wingFactor > .1 && (this.stamina > 0 || save.mode === 'creative') && !this.grounded;
      if (this.swimming) {
        this.velocityH = holdingJump ? 5.5 : dive ? -4.7 : THREE.MathUtils.lerp(this.velocityH, .4, delta * 5);
        this.fallPeak = this.position.h;
        this.stamina = Math.min(100, this.stamina + delta * 6);
      } else {
        this.velocityH -= (zeroGravity ? .15 : 13) * delta;
        if (lifting) {
          this.velocityH += 19 * wingFactor * delta;
          this.velocityH = Math.min(this.velocityH, 6 * wingFactor);
          if (save.mode !== 'creative') this.stamina = Math.max(0, this.stamina - delta * 17);
        }
      }
      this.position.h += this.velocityH * delta;
      this.fallPeak = Math.max(this.fallPeak, this.position.h);
      const ground = this.world.ground(this.position.u, this.position.z, Math.max(previousHeight, this.position.h) + .5);
      if (this.position.h <= ground + .025) {
        const drop = this.fallPeak - ground;
        if (drop > 5.5 && this.velocityH < -8 && save.mode === 'survival' && !this.swimming) {
          const damage = Math.min(100, (drop - 4.5) * 7);
          this.callbacks.onDamage('leftLeg', damage, 'The inner wall breaks your fall.');
          this.callbacks.onDamage('rightLeg', damage, 'A hard landing.');
          this.callbacks.onDamage('torso', damage * .35, 'A hard landing.');
          this.audio.tick('hurt');
        }
        this.position.h = ground + .01; this.velocityH = 0; this.grounded = true; this.fallPeak = ground;
      } else this.grounded = false;
      if (this.position.h > RADIUS - 28) { this.position.h = RADIUS - 28; this.velocityH = 0; }
      if (!lifting) this.stamina = Math.min(100, this.stamina + delta * (this.grounded ? 13 : 3));
      if (moving && shift && !prone) this.stamina = Math.max(0, this.stamina - delta * 8);
    }
    if (save.mode === 'creative') this.stamina = 100;
    const bob = moving && this.grounded && !save.settings.reducedMotion ? Math.sin(this.renderTime * (shift ? 13 : 9)) * .025 : 0;
    toWorld(this.position.u, this.position.h + (prone ? .58 : 1.68) + bob, this.position.z, this.camera.position);
    this.radialQuaternion.setFromAxisAngle(this.localAxis, this.position.u / RADIUS);
    this.euler.set(this.position.pitch, this.position.yaw, prone && moving && !save.settings.reducedMotion ? Math.sin(this.renderTime * 3) * .14 : 0, 'YXZ');
    this.yawQuaternion.setFromEuler(this.euler);
    this.camera.quaternion.copy(this.radialQuaternion).multiply(this.yawQuaternion);
    this.camera.updateMatrixWorld();
    this.hand.position.y = -.48 + Math.sin(this.swing * 13) * -.13 + bob;
    this.hand.rotation.x = -Math.sin(this.swing * 13) * .6;
    const isTool = ITEMS[this.selectedItem].category === 'Tools';
    this.handShaft.visible = this.toolHead.visible = isTool;
    this.heldBlock.visible = !isTool;
    (this.heldBlock.material as THREE.MeshLambertMaterial).color.set(ITEMS[this.selectedItem].color);
    this.hand.rotation.z = isTool ? -.45 : -.1;
    this.toolHead.scale.set(this.selectedItem === 'sword' ? .25 : this.selectedItem === 'chisel' ? .2 : 1, this.selectedItem === 'sword' ? 3.9 : 1, 1);
    this.toolHead.position.y = this.selectedItem === 'sword' ? .33 : .16;
    this.wings.forEach((wing, i) => {
      wing.visible = !this.grounded && !this.swimming && (holdingJump || this.freeFlight) && save.body[i === 0 ? 'leftWing' : 'rightWing'] > 0;
      wing.rotation.z = (i === 0 ? -1 : 1) * (.35 + Math.sin(this.renderTime * 12) * .28);
    });
    this.swing = Math.max(0, this.swing - delta);
  }

  private updateClimate(delta: number) {
    const save = this.callbacks.getSave(), biome = biomeAt(this.position.u, this.position.z);
    const fluid = this.world.fluid(this.position.u, this.position.z);
    this.submerged = !!fluid && this.position.h + (save.body.leftLeg === 0 && save.body.rightLeg === 0 ? .55 : 1.5) < fluid.height;
    this.depth = this.submerged && fluid ? Math.max(0, fluid.height - this.position.h) : 0;
    const sheltered = PYLONS.some(p => surfaceDistance(p, this.position) < 13 && Math.abs(this.position.h - p.height - .5) < 6);
    this.oxygen = save.mode === 'creative' ? 100 : THREE.MathUtils.clamp(this.oxygen + delta * (this.submerged ? -1.65 : 22), 0, 100);
    const cold = BIOMES[biome].temperature <= -18 && !sheltered && !this.submerged;
    this.exposure = THREE.MathUtils.clamp(this.exposure + delta * (cold ? save.inventory.cloth ? .45 : .9 : -3), 0, 100);
    this.radiationClock += delta;
    if (this.radiationClock >= 1.25) {
      this.radiationClock = 0; this.radiation = 0;
      if (!sheltered) {
        for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) {
          if (dx * dx + dz * dz > 30) continue;
          for (let dy = -1; dy <= 4; dy++) {
            const kind = this.world.get(Math.round(this.position.u) + dx, Math.round(this.position.h) + dy, Math.round(this.position.z) + dz);
            if (kind === 'uranium' || kind === 'toxic-crystal') this.radiation = Math.max(this.radiation, 1 - Math.hypot(dx, dz, dy) / 8);
            if (dx * dx + dz * dz <= 6 && dy >= -1 && dy <= 1 && (kind === 'magma' || kind === 'ember')) this.magma = Math.max(this.magma, 1 - Math.hypot(dx, dz) / 4);
          }
        }
      }
    }
    this.hazard = this.radiation > .05 ? `RADIATION / ${Math.round(this.radiation * 100)}%` : this.magma > .05 ? 'SCORCHING MAGMA' : this.submerged && this.depth > 28 ? `CRUSHING PRESSURE / ${Math.round(this.depth)}m` : this.exposure > 25 ? `COLD EXPOSURE / ${Math.round(this.exposure)}%` : biome === 'desert' || biome === 'outer' ? 'EXTREME HEAT / THIRST x2' : biome === 'volcanic' ? 'BLISTERING HEAT' : null;
    this.climateClock += delta;
    if (this.climateClock >= 4) {
      this.climateClock = 0;
      if (save.mode === 'survival') {
        if (this.oxygen === 0) this.callbacks.onDamage('head', 10, 'There is no air left in the deep.');
        if (this.submerged && this.depth > 28) this.callbacks.onDamage('torso', (this.depth - 25) * .14, 'The abyss closes around your body.');
        if (this.radiation > .1) this.callbacks.onDamage('torso', 3 + this.radiation * 5, 'The crystal forest burns through your shell.');
        if (this.magma > .1) this.callbacks.onDamage(this.magma > .6 ? 'torso' : 'leftLeg', 4 + this.magma * 9, 'The magma scorches you.');
        if (this.exposure > 90) this.callbacks.onDamage('leftWing', 4, 'The high-altitude cold freezes your wings.');
      }
    }
    this.magma = Math.max(0, this.magma - delta * .4);
  }

  private settleStormDebris(debris: StormDebris) {
    const logical = fromWorld(debris.mesh.position), x = wrapU(Math.round(logical.u)), z = Math.round(logical.z);
    if (Math.abs(z) < HALF_LENGTH - 1) {
      const ground = this.world.ground(x, z, logical.h + 1);
      let y = Math.round(ground + .5);
      while (y < WORLD_CEILING && this.world.get(x, y, z)) y++;
      this.world.set(x, y, z, debris.kind);
    }
    this.scene.remove(debris.mesh);
  }

  private updateStorms(delta: number) {
    this.stormClock += delta; this.debrisDamageClock = Math.max(0, this.debrisDamageClock - delta);
    const save = this.callbacks.getSave();
    for (const tornado of this.atmosphere.tornadoes) {
      const du = wrapU(this.position.u - tornado.u), dz = this.position.z - tornado.z, distance = Math.hypot(du, dz);
      if (distance < tornado.radius && Math.abs(this.position.h - tornado.h) < 65 && save.mode === 'survival') {
        const strength = Math.max(0, 1 - distance / tornado.radius), divisor = Math.max(3, distance);
        this.position.u = wrapU(this.position.u + (-dz / divisor * 13 - du / divisor * 4) * strength * delta);
        this.position.z = THREE.MathUtils.clamp(this.position.z + (du / divisor * 13 - dz / divisor * 4) * strength * delta, -HALF_LENGTH + 3, HALF_LENGTH - 3);
        this.velocityH += strength * 33 * delta; this.grounded = false;
        this.hazard = 'VORTEX / LEAVE THE FUNNEL';
      }
      if (distance < 155 && this.stormClock > 1.4 && this.stormDebris.length < 12) {
        this.stormClock = 0;
        const angle = hash(Math.floor(this.elapsed * 10), tornado.u, 18) * Math.PI * 2;
        const x = Math.round(tornado.u + Math.cos(angle) * 6), z = Math.round(tornado.z + Math.sin(angle) * 6);
        if (PYLONS.some(pylon => surfaceDistance(pylon, { u: x, z }) < 18)) continue;
        const y = Math.floor(this.world.ground(x, z, this.world.height(x, z) + 5)), kind = this.world.get(x, y, z);
        if (!kind || y <= WORLD_FLOOR) continue;
        this.world.set(x, y, z, null);
        const mesh = this.box(.8, .8, .8, ITEMS[kind].color); toWorld(x, y + 1.5, z, mesh.position); this.scene.add(mesh);
        const tangent = new THREE.Vector3(Math.cos(x / RADIUS), Math.sin(x / RADIUS), 0);
        const up = new THREE.Vector3(-Math.sin(x / RADIUS), Math.cos(x / RADIUS), 0);
        const velocity = tangent.multiplyScalar(-Math.sin(angle) * 11).addScaledVector(up, 21).add(new THREE.Vector3(0, 0, Math.cos(angle) * 11));
        this.stormDebris.push({ mesh, velocity, age: 0, kind });
      }
    }
    for (let i = this.stormDebris.length - 1; i >= 0; i--) {
      const debris = this.stormDebris[i]; debris.age += delta;
      const radial = this.temp.set(debris.mesh.position.x, debris.mesh.position.y, 0).normalize();
      debris.velocity.addScaledVector(radial, delta * 12);
      debris.mesh.position.addScaledVector(debris.velocity, delta); debris.mesh.rotation.x += delta * 2; debris.mesh.rotation.z += delta;
      const logical = fromWorld(debris.mesh.position);
      if (this.debrisDamageClock === 0 && debris.mesh.position.distanceTo(this.camera.position) < 1.5 && save.mode === 'survival') {
        this.callbacks.onDamage('torso', 7, 'A storm-torn block strikes your body.'); this.debrisDamageClock = 1.5;
      }
      if (debris.age > 8 || debris.age > .5 && logical.h <= this.world.ground(logical.u, logical.z, logical.h + .5) + .5) {
        this.settleStormDebris(debris); this.stormDebris.splice(i, 1);
      }
    }
  }

  /** Picks a species appropriate to where the player is, on the surface or in a given cave stratum. */
  private pickSpecies(daylight: number): CreatureDefinition | null {
    const underground = this.position.h <= CAVE_TOP;
    const biome = biomeAt(this.position.u, this.position.z);
    const stratum = stratumOf(this.position.h);
    const pool = CREATURES.filter(c => {
      if (underground) return c.biomes.length === 0 && c.minStratum !== undefined && c.minStratum <= stratum;
      if (!c.biomes.includes(biome)) return false;
      if (c.nocturnal && daylight > .4) return false;
      return true;
    });
    if (!pool.length) return null;
    // Each species carries its own rarity; heavier weights are more common.
    const weights = pool.map(c => c.weight);
    let r = hash(Math.floor(this.elapsed * 7), this.position.u, 91) * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }

  private spawnCreature(def: CreatureDefinition) {
    const angle = hash(this.elapsed, def.hp, 3) * Math.PI * 2, dist = 22 + hash(this.elapsed, def.hp, 4) * 30;
    const u = wrapU(this.position.u + Math.cos(angle) * dist), z = THREE.MathUtils.clamp(this.position.z + Math.sin(angle) * dist, -HALF_LENGTH + 10, HALF_LENGTH - 10);
    const fluid = this.world.fluid(u, z);
    if (def.locomotion === 'swim' && !fluid) return;
    if (def.locomotion !== 'swim' && fluid && def.locomotion !== 'fly') return;
    let h: number;
    if (this.position.h <= CAVE_TOP) {
      // Find air near the player's depth inside the cave.
      const column = this.world.columnAt(u, z);
      let found: number | null = null;
      for (let y = Math.round(this.position.h) + 6; y > Math.round(this.position.h) - 30; y--) {
        if (!this.world.get(u, y, z) && !this.world.get(u, y + 1, z) && this.world.get(u, y - 1, z)) { found = y; break; }
      }
      if (found === null || column.height < found) return;
      h = found - .5;
    } else h = def.locomotion === 'swim' && fluid ? Math.min(fluid.height - 1, Math.max(this.world.ground(u, z) + 1, fluid.height + (def.hover ?? -3))) : this.world.ground(u, z);
    if (h <= WORLD_FLOOR + 1) return;
    const model = buildCreatureModel(def.id, (w, hh, d, c, x = 0, y = 0, zz = 0) => this.box(w, hh, d, c, x, y, zz));
    const group = this.batchCreatureModel(model);
    this.placeGroup(group, u, h + (def.locomotion === 'fly' ? (def.hover ?? 3) : 0), z);
    this.creatures.push({ def, group, u, z, h, homeU: u, homeZ: z, hp: def.hp, cooldown: 0, phase: hash(u, z, 5) * 6, flee: 0, born: this.elapsed, wanderU: u, wanderZ: z });
  }

  /** Collapse a detailed box model to one colored mesh and one draw call. */
  private batchCreatureModel(source: THREE.Group) {
    const parts: THREE.BufferGeometry[] = [];
    source.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.updateMatrix();
      const geometry = object.geometry.clone().applyMatrix4(object.matrix);
      const color = (object.material as THREE.MeshBasicMaterial | THREE.MeshLambertMaterial).color || new THREE.Color('#999999');
      const attribute = new Float32Array(geometry.attributes.position.count * 3);
      for (let i = 0; i < attribute.length; i += 3) {
        attribute[i] = color.r; attribute[i + 1] = color.g; attribute[i + 2] = color.b;
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(attribute, 3));
      parts.push(geometry);
    });
    let merged: THREE.BufferGeometry | null = null;
    try { merged = mergeGeometries(parts, false); }
    catch { /* The source group below remains a correct multi-mesh fallback. */ }
    parts.forEach(part => part.dispose());
    if (!merged) return source;
    const group = new THREE.Group();
    group.scale.copy(source.scale);
    const mesh = new THREE.Mesh(merged, this.creatureMaterial);
    mesh.userData.creatureGeometry = true;
    group.add(mesh);
    return group;
  }

  private removeCreature(index: number) {
    const creature = this.creatures[index];
    this.scene.remove(creature.group);
    // Batched creature geometry is unique; the material remains shared.
    creature.group.traverse(object => {
      if (object instanceof THREE.Mesh && object.userData.creatureGeometry) object.geometry.dispose();
    });
    creature.group.clear();
    this.creatures.splice(index, 1);
  }

  private updateCreatures(delta: number, daylight: number) {
    const save = this.callbacks.getSave();
    const underground = this.position.h <= CAVE_TOP;
    this.spawnClock += delta;
    const cap = underground ? 14 : 22;
    if (this.spawnClock > 2.2 && this.creatures.length < cap) {
      this.spawnClock = 0;
      const def = this.pickSpecies(daylight);
      if (def) this.spawnCreature(def);
    }
    for (let i = this.creatures.length - 1; i >= 0; i--) {
      const c = this.creatures[i], def = c.def;
      const du = wrapU(this.position.u - c.u), dz = this.position.z - c.z, distance = Math.hypot(du, dz);
      // Despawn far away, or when a nocturnal animal meets the day.
      if (distance > 110 || (def.nocturnal && daylight > .55 && this.elapsed - c.born > 20) || Math.abs(this.position.h - c.h) > 90) { this.removeCreature(i); continue; }
      c.cooldown = Math.max(0, c.cooldown - delta); c.flee = Math.max(0, c.flee - delta);
      const hostile = def.temperament === 'hostile' && distance < 20 && (save.mode === 'survival' || distance < 6);
      const fleeing = (def.temperament === 'skittish' && distance < 6) || c.flee > 0;
      let goalU = c.wanderU, goalZ = c.wanderZ;
      if (hostile) { goalU = this.position.u; goalZ = this.position.z; }
      else if (fleeing) { goalU = wrapU(c.u - du); goalZ = c.z - dz; }
      else if (hash(Math.floor(this.elapsed / 3), c.phase, 8) < .04 * delta * 60 / 3 || Math.hypot(wrapU(goalU - c.u), goalZ - c.z) < .5) {
        // Pick a new wander target near home.
        c.wanderU = wrapU(c.homeU + (hash(this.elapsed, c.phase, 1) - .5) * 14);
        c.wanderZ = THREE.MathUtils.clamp(c.homeZ + (hash(this.elapsed, c.phase, 2) - .5) * 14, -HALF_LENGTH + 10, HALF_LENGTH - 10);
        goalU = c.wanderU; goalZ = c.wanderZ;
      }
      const dirU = wrapU(goalU - c.u), dirZ = goalZ - c.z, length = Math.hypot(dirU, dirZ);
      const speed = def.speed * (hostile || fleeing ? 1.9 : def.temperament === 'ambient' ? .8 : .55);
      const hop = def.locomotion === 'hop' ? (Math.sin(this.renderTime * 6 + c.phase) > .3 ? 1 : 0) : 1;
      if (length > .4 && hop) {
        const nu = wrapU(c.u + dirU / length * delta * speed), nz = c.z + dirZ / length * delta * speed;
        const fluid = this.world.fluid(nu, nz);
        const ok = def.locomotion === 'swim' ? !!fluid : def.locomotion === 'fly' || !fluid || !!def.amphibious;
        if (ok) {
          if (def.locomotion === 'walk' || def.locomotion === 'hop') {
            const g = this.world.ground(nu, nz, c.h + 1.5);
            if (g <= c.h + 1.2 && g > WORLD_FLOOR + 1) { c.u = nu; c.z = nz; c.h = g; }
          } else { c.u = nu; c.z = nz; }
        }
      }
      if (def.locomotion === 'fly') {
        const groundH = this.world.ground(c.u, c.z, c.h + 2);
        const target = groundH + (def.hover ?? 3) + Math.sin(this.renderTime * 1.3 + c.phase) * .6;
        c.h = THREE.MathUtils.lerp(c.h, target, delta * 2);
      } else if (def.locomotion === 'swim') {
        const fluid = this.world.fluid(c.u, c.z);
        const floor = this.world.ground(c.u, c.z, fluid ? fluid.height : c.h);
        const target = fluid ? Math.max(floor + .8, fluid.height + (def.hover ?? -3)) + Math.sin(this.renderTime + c.phase) * .3 : c.h;
        c.h = THREE.MathUtils.lerp(c.h, target, delta * 1.5);
      } else if (hop) {
        c.h = this.world.ground(c.u, c.z, c.h + 1.5);
      }
      const bounce = def.locomotion === 'hop' ? Math.max(0, Math.sin(this.renderTime * 6 + c.phase)) * .5 : def.locomotion === 'walk' && length > .4 ? Math.abs(Math.sin(this.renderTime * 8 + c.phase)) * .06 : 0;
      toWorld(c.u, c.h + bounce, c.z, c.group.position);
      c.group.rotation.set(0, 0, c.u / RADIUS);
      if (length > .2) c.group.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-dirU, -dirZ)));
      if (def.flutter) c.group.rotation.x += Math.sin(this.renderTime * 12 + c.phase) * .3;
      c.group.scale.lerp(this.temp.set(def.scale ?? 1, def.scale ?? 1, def.scale ?? 1), delta * 8);
      if (hostile && distance < 2.4 && Math.abs(this.position.h - c.h) < 3.5 && c.cooldown <= 0 && save.mode === 'survival') {
        const limb = LIMBS[Math.floor(hash(Math.floor(this.renderTime), c.phase) * LIMBS.length)];
        this.callbacks.onDamage(limb, def.damage, `${def.name} strikes.`);
        this.audio.tick('hurt'); c.cooldown = 1.6;
      }
      if (def.sting && distance < 1.4 && c.cooldown <= 0 && save.mode === 'survival') {
        this.callbacks.onDamage('torso', def.damage, def.sting);
        this.audio.tick('hurt');
        c.cooldown = 2;
      }
    }
  }

  /** Called by primaryAction when the player swings at something in range. Returns true if a creature was hit. */
  private strikeCreature(power: number): boolean {
    for (let i = 0; i < this.creatures.length; i++) {
      const c = this.creatures[i];
      toWorld(c.u, c.h + .8, c.z, this.temp);
      this.temp.sub(this.camera.position);
      if (this.temp.length() < 5.5 && this.temp.normalize().dot(this.direction) > .85) {
        c.hp -= power; c.flee = 4; c.group.scale.setScalar((c.def.scale ?? 1) * .85);
        this.audio.tick('hurt');
        if (c.hp <= 0) { this.callbacks.onCreatureKill(c.def.id, c.def.name, c.def.drop, c.def.dropCount); this.removeCreature(i); }
        return true;
      }
    }
    return false;
  }

  private updateEntities(delta: number, daylight: number) {
    const save = this.callbacks.getSave();
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      if (surfaceDistance(this.position, enemy) > 160) continue;
      enemy.group.visible = enemy.name !== 'False Player' || daylight < .35;
      if (!enemy.group.visible) continue;
      enemy.cooldown = Math.max(0, enemy.cooldown - delta);
      const du = wrapU(this.position.u - enemy.u), dz = this.position.z - enemy.z;
      const distance = Math.hypot(du, dz);
      const aggressive = distance < 15 && (daylight < .45 || ['broken', 'spiked', 'sinkholes'].includes(biomeAt(enemy.u, enemy.z)));
      const goalU = aggressive ? this.position.u : enemy.homeU + Math.sin(this.renderTime * .18 + enemy.phase) * 2;
      const goalZ = aggressive ? this.position.z : enemy.homeZ + Math.cos(this.renderTime * .14 + enemy.phase) * 2;
      const directionU = wrapU(goalU - enemy.u), directionZ = goalZ - enemy.z;
      const length = Math.hypot(directionU, directionZ);
      if (length > (aggressive ? 1.5 : .3)) {
        const speed = aggressive ? 1.3 : .35;
        enemy.u = wrapU(enemy.u + directionU / length * delta * speed);
        enemy.z += directionZ / length * delta * speed;
      }
      const height = this.world.ground(enemy.u, enemy.z);
      toWorld(enemy.u, height, enemy.z, enemy.group.position);
      enemy.group.rotation.set(0, 0, enemy.u / RADIUS);
      const facing = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-directionU, -directionZ));
      enemy.group.quaternion.multiply(facing);
      enemy.group.scale.lerp(this.temp.set(1, 1, 1), delta * 8);
      if (aggressive && distance < 2.2 && Math.abs(this.position.h - height) < 3 && enemy.cooldown <= 0 && save.mode === 'survival') {
        const limb = LIMBS[Math.floor(hash(Math.floor(this.renderTime), enemy.phase) * LIMBS.length)];
        this.callbacks.onDamage(limb, 13, `${enemy.name} strikes from the dark.`);
        this.audio.tick('hurt'); enemy.cooldown = 1.5;
      }
    }
    if (daylight < .3 && !this.enemies.some(e => e.name === 'False Player')) {
      const u = wrapU(this.position.u + 17), z = THREE.MathUtils.clamp(this.position.z - 8, -HALF_LENGTH + 20, HALF_LENGTH - 20);
      const group = this.batchCreatureModel(this.makeCreature('False Player')); this.placeGroup(group, u, this.world.ground(u, z), z);
      this.enemies.push({ group, u, z, homeU: u, homeZ: z, hp: 55, cooldown: 0, name: 'False Player', phase: 7 });
      this.callbacks.onMessage('You hear footsteps that almost sound like your own.');
    }
    if (this.companion) {
      const du = wrapU(this.position.u - this.companionPosition.u), dz = this.position.z - this.companionPosition.z;
      const distance = Math.hypot(du, dz);
      if (distance > 4) {
        const speed = distance > 15 ? 8 : 3.8;
        this.companionPosition.u = wrapU(this.companionPosition.u + du / distance * delta * speed);
        this.companionPosition.z += dz / distance * delta * speed;
      }
      const u = this.companionPosition.u, z = this.companionPosition.z;
      const height = this.world.ground(u, z, Math.max(this.position.h + 3, this.world.height(u, z) + 1));
      toWorld(u, height + (distance > 4 ? Math.abs(Math.sin(this.renderTime * 9)) * .12 : 0), z, this.companion.position);
      this.companion.rotation.set(0, 0, u / RADIUS);
      this.companion.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-du, -dz)));
    }
  }

  private buildBossModel(id: string, color: string) {
    const group = new THREE.Group();
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(1), new THREE.MeshBasicMaterial({ color, fog: false }));
    if (id === 'warper') {
      group.add(new THREE.Mesh(new THREE.SphereGeometry(2.4, 20, 16), this.material(color)));
      for (let i = 0; i < 10; i++) { const pike = this.box(.16, 3.4, .16, '#c9c2ac', 0, 0, 0); const a = i / 10 * Math.PI * 2; pike.position.set(Math.cos(a) * 2.3, Math.sin(i) * 1.5, Math.sin(a) * 2.3); pike.lookAt(0, 0, 0); group.add(pike); }
      core.position.set(0, 0, 0); core.scale.setScalar(1.1);
    } else if (id === 'scruncle') {
      group.add(this.box(2.4, .3, 2.4, '#2a2724', 0, 0)); group.add(this.box(1.5, 2.1, 1.5, color, 0, 1.2));
      group.add(this.box(1.7, .3, 1.7, '#7a5a48', 0, .35)); core.position.set(0, 1.2, .8); core.scale.setScalar(.5);
    } else if (id === 'moonholder') {
      group.add(new THREE.Mesh(new THREE.SphereGeometry(3.2, 24, 18), this.material(color))); core.position.set(0, 0, 0); core.scale.setScalar(.8);
    } else if (id === 'obil') {
      group.add(this.box(2.4, 7, 2.4, '#343a30', 0, 0)); const cap = new THREE.Mesh(new THREE.ConeGeometry(1.7, 2, 4), this.material('#40473 7'.replace(' ', ''))); cap.position.y = 4.3; group.add(cap); core.position.set(0, 0, 1.4);
    } else {
      group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(2.1, 1), this.material(color)));
      for (let i = 0; i < 4; i++) { const funnel = new THREE.Mesh(new THREE.ConeGeometry(.7, 2.4, 8), this.material('#767c92')); const a = i / 4 * Math.PI * 2; funnel.position.set(Math.cos(a) * 2.6, 0, Math.sin(a) * 2.6); funnel.rotation.z = Math.PI / 2; group.add(funnel); }
      core.position.set(0, 0, 0);
    }
    group.add(core);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlow(color), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .5, fog: false }));
    glow.scale.set(11, 11, 1); group.add(glow);
    return { group, core };
  }

  summonBoss(id: string) {
    const definition = BOSSES.find(boss => boss.id === id);
    if (!definition || !this.enabled) return;
    this.clearActiveBoss();
    const { group, core } = this.buildBossModel(id, definition.color);
    const u = wrapU(this.position.u - Math.sin(this.position.yaw) * 15), z = this.position.z - Math.cos(this.position.yaw) * 15;
    const baseH = Math.max(this.position.h, this.world.ground(u, z)) + 7;
    this.scene.add(group);
    const maxHp = 100 + (definition.order - 1) * 40;
    this.activeBoss = { id, name: definition.name, subtitle: definition.subtitle, hint: definition.hint, reward: definition.reward, group, core, u, z, h: baseH, baseH, hp: maxHp, maxHp, fire: 2.5, teleport: 4, hitFlash: 0 };
    toWorld(u, baseH, z, group.position); group.rotation.z = u / RADIUS;
    this.callbacks.onMessage(`${definition.name} manifests. ${definition.hint}`);
    this.audio.tick('hurt');
  }

  private damageBoss(amount: number) {
    const boss = this.activeBoss; if (!boss) return;
    boss.hp -= amount; boss.hitFlash = .18; this.audio.tick('hurt');
    if (boss.hp <= 0) {
      this.callbacks.onBossKill(boss.id, boss.reward);
      this.callbacks.onMessage(`${boss.name} is undone. ${boss.reward} recovered.`);
      this.clearActiveBoss();
    }
  }

  private clearActiveBoss() {
    if (this.activeBoss) {
      this.scene.remove(this.activeBoss.group);
      this.activeBoss.group.traverse(object => {
        if (object instanceof THREE.Mesh && object.geometry !== this.basicCube) object.geometry.dispose();
        if (object instanceof THREE.Sprite) {
          object.material.map?.dispose();
          object.material.dispose();
        }
      });
      // The core material is encounter-owned; cached Lambert materials are not.
      (this.activeBoss.core.material as THREE.Material).dispose();
      this.activeBoss = null;
    }
    for (const projectile of this.bossProjectiles) { this.scene.remove(projectile.mesh); projectile.mesh.geometry.dispose(); (projectile.mesh.material as THREE.Material).dispose(); }
    this.bossProjectiles = [];
  }

  private fireBossProjectile(harm: number, speed: number, size: number, color: string) {
    const boss = this.activeBoss; if (!boss) return;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshBasicMaterial({ color, fog: false }));
    mesh.position.copy(boss.group.position);
    const velocity = this.camera.position.clone().sub(mesh.position).normalize().multiplyScalar(speed);
    this.scene.add(mesh); this.bossProjectiles.push({ mesh, velocity, reflected: false, age: 0, harm });
  }

  private updateActiveBoss(delta: number) {
    const boss = this.activeBoss;
    if (!boss) return;
    const save = this.callbacks.getSave();
    boss.hitFlash = Math.max(0, boss.hitFlash - delta);
    (boss.core.material as THREE.MeshBasicMaterial).color.set(boss.hitFlash > 0 ? '#ffffff' : '#f2efc4');
    const du = wrapU(this.position.u - boss.u), dz = this.position.z - boss.z, distance = Math.hypot(du, dz);
    if (boss.id === 'scruncle') {
      boss.teleport -= delta;
      if (boss.teleport <= 0) { boss.teleport = 2.5 + hash(Math.floor(this.elapsed), boss.u) * 2; const angle = hash(this.elapsed, 3) * Math.PI * 2, r = 8 + hash(this.elapsed, 5) * 5; boss.u = wrapU(this.position.u + Math.sin(angle) * r); boss.z = this.position.z + Math.cos(angle) * r; boss.baseH = Math.max(this.position.h, this.world.ground(boss.u, boss.z)) + 6; this.audio.tick('travel'); }
    } else if (distance > 11) { const speed = 4.5 * delta; boss.u = wrapU(boss.u + du / distance * speed); boss.z += dz / distance * speed; boss.baseH = THREE.MathUtils.lerp(boss.baseH, Math.max(this.position.h, this.world.ground(boss.u, boss.z)) + 7, delta * 2); }
    boss.h = boss.baseH + Math.sin(this.renderTime * 1.5) * .6;
    toWorld(boss.u, boss.h, boss.z, boss.group.position);
    boss.group.rotation.set(0, this.renderTime * (boss.id === 'moonholder' ? .2 : .6), boss.u / RADIUS);
    boss.fire -= delta;
    if (boss.fire <= 0 && distance < 60) {
      const cadence = boss.id === 'scruncle' ? 1 : boss.id === 'moonholder' ? 3.4 : 2.2;
      boss.fire = cadence;
      if (boss.id === 'moonholder') this.fireBossProjectile(30, 9, 3, '#c8d0da');
      else if (boss.id === 'warper') { for (let i = -1; i <= 1; i++) this.fireBossProjectile(16, 12, .8, '#c8bda9'); }
      else if (boss.id === 'farbreaker') this.fireBossProjectile(14, 8, 1.1, '#9195bb');
      else if (boss.id === 'scruncle') this.fireBossProjectile(18, 26, .5, '#e6e2c4');
      else this.fireBossProjectile(20, 10, 1, boss.id === 'obil' ? '#b6ba8a' : '#d0d0a6');
    }
    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const projectile = this.bossProjectiles[i];
      projectile.age += delta;
      if (projectile.reflected) projectile.velocity.copy(boss.group.position).sub(projectile.mesh.position).normalize().multiplyScalar(30);
      projectile.mesh.position.addScaledVector(projectile.velocity, delta);
      projectile.mesh.rotation.x += delta * 3; projectile.mesh.rotation.y += delta * 4;
      let remove = projectile.age > 10;
      if (projectile.reflected && projectile.mesh.position.distanceTo(boss.group.position) < 2.4) { this.damageBoss(100 / 6); remove = true; if (!this.activeBoss) return; }
      else if (!projectile.reflected && projectile.mesh.position.distanceTo(this.camera.position) < 1.4) {
        if (save.mode === 'survival') { this.callbacks.onDamage(LIMBS[Math.floor(hash(Math.floor(this.elapsed * 5), i) * LIMBS.length)], projectile.harm, `${boss.name} strikes you.`); this.audio.tick('hurt'); }
        remove = true;
      }
      if (remove) { this.scene.remove(projectile.mesh); projectile.mesh.geometry.dispose(); (projectile.mesh.material as THREE.Material).dispose(); this.bossProjectiles.splice(i, 1); }
    }
  }

  private updateBoss(delta: number) {
    if (this.bossHealth <= 0) {
      this.projectiles.forEach(projectile => { this.scene.remove(projectile.mesh); projectile.mesh.geometry.dispose(); (projectile.mesh.material as THREE.Material).dispose(); });
      this.projectiles = [];
      return;
    }
    const distance = Math.hypot(wrapU(this.position.u + 76), this.position.z + 35);
    if (distance < 23 && !this.bossAwake) { this.bossAwake = true; this.bossClock = 2; this.callbacks.onMessage('OBIL awakens. Strike incoming stones to return them to its core.'); }
    if (distance > 36) { this.bossAwake = false; this.bossClock = 0; }
    this.boss.position.copy(toWorld(-76, 4.5 + Math.sin(this.renderTime * .6) * .4, -35));
    this.bossOrbit.rotation.y += delta * (this.bossAwake ? .8 : .13);
    if (this.bossAwake) {
      this.bossClock += delta;
      if (this.bossClock > 5.5) {
        this.bossClock = 0;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(.65, .65, .65), new THREE.MeshBasicMaterial({ color: '#b6ba8a' }));
        toWorld(-76, 10, -35, mesh.position);
        const velocity = this.camera.position.clone().sub(mesh.position).normalize().multiplyScalar(6.5);
        this.scene.add(mesh); this.projectiles.push({ mesh, velocity, reflected: false, age: 0 });
      }
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.age += delta;
      projectile.mesh.position.addScaledVector(projectile.velocity, delta);
      projectile.mesh.rotation.x += delta; projectile.mesh.rotation.y += delta * 2;
      let remove = projectile.age > 12;
      if (projectile.reflected) {
        toWorld(-76, 9.3, -35, this.temp);
        if (projectile.mesh.position.distanceTo(this.temp) < 2.2) {
          this.bossHealth = Math.max(0, this.bossHealth - 100 / 3 - .001);
          this.callbacks.onMessage(this.bossHealth > 0 ? 'The obelisk fractures. Its own gravity is the weapon.' : 'OBIL is silent. The Fracture is yours.');
          this.audio.tick('hurt'); remove = true;
          if (this.bossHealth <= 0) { this.boss.visible = false; this.bossAwake = false; this.callbacks.onBossDefeated(); }
        }
      } else if (projectile.mesh.position.distanceTo(this.camera.position) < 1.3) {
        if (this.callbacks.getSave().mode === 'survival') {
          this.callbacks.onDamage('torso', 24, 'OBIL tears through your shell.');
          this.callbacks.onDamage('leftWing', 12, 'A stone catches your wing.');
          this.audio.tick('hurt');
        }
        remove = true;
      }
      if (remove) { this.scene.remove(projectile.mesh); projectile.mesh.geometry.dispose(); (projectile.mesh.material as THREE.Material).dispose(); this.projectiles.splice(i, 1); }
    }
  }

  private report() {
    this.blockHit = this.rayBlock();
    const hit = this.blockHit;
    this.highlight.visible = this.enabled && !!hit;
    if (hit) {
      toWorld(hit.x, hit.y, hit.z, this.highlight.position);
      this.highlight.rotation.z = hit.x / RADIUS;
      this.highlight.scale.x = (RADIUS - hit.y) / RADIUS;
    }
    const interaction = this.nearestInteraction();
    const nearPylon = PYLONS.find(p => surfaceDistance(p, this.position) < 13 && Math.abs(this.position.h - p.height - .5) < 6);
    const bossReflectReady = this.bossProjectiles.some(p => !p.reflected && p.mesh.position.distanceTo(this.camera.position) < 9);
    const reflectReady = this.projectiles.some(p => !p.reflected && p.mesh.position.distanceTo(this.camera.position) < 8);
    const biome = biomeAt(this.position.u, this.position.z), save = this.callbacks.getSave();
    const underground = this.position.h <= CAVE_TOP;
    const cave = underground ? caveBiomeAt(this.position.u, this.position.h, this.position.z) : null;
    if (cave && !save.visitedCaves.includes(cave.id)) this.callbacks.onDiscoverCave(cave.id, cave.name);
    if (!underground && !save.visitedBiomes.includes(biome)) this.callbacks.onDiscover(biome);
    const destination = PYLONS.find(pylon => pylon.id === save.waypoint);
    const boss = this.activeBoss
      ? { name: this.activeBoss.name, subtitle: this.activeBoss.subtitle, health: this.activeBoss.hp / this.activeBoss.maxHp * 100, hint: this.activeBoss.hint, reflectReady: bossReflectReady }
      : this.bossAwake && this.bossHealth > 0 ? { name: 'OBIL', subtitle: 'PHASE I / THE FIRST DISTURBANCE', health: this.bossHealth, hint: 'Its own gravity is the weapon.', reflectReady } : null;
    this.callbacks.onSnapshot({
      position: { ...this.position }, elapsed: this.elapsed, biome,
      target: hit ? ITEMS[hit.kind].name : null, nearPylon: nearPylon?.id || null,
      interaction: interaction?.label || null, stamina: this.stamina, flying: this.freeFlight || (!this.grounded && !this.swimming && this.keys.has('Space')),
      locked: document.pointerLockElement === this.renderer.domElement,
      bossHealth: this.bossAwake && this.bossHealth > 0 ? this.bossHealth : null, boss, circuit: save.circuit,
      reflectReady, blocks: this.world.visibleBlocks, chunks: this.world.loadedChunks, pendingChunks: this.world.pendingChunks,
      swimming: this.swimming, submerged: this.submerged, oxygen: this.oxygen, depth: this.depth,
      temperature: BIOMES[biome].temperature, hazard: this.hazard,
      waypoint: destination ? { name: destination.name, distance: Math.hypot(surfaceDistance(destination, this.position), destination.height + .5 - this.position.h), bearing: Math.atan2(wrapU(destination.u - this.position.u), -(destination.z - this.position.z)) + this.position.yaw, arrived: nearPylon?.id === destination.id } : null,
      toolDurability: save.toolMax[this.selectedItem] ? { value: save.toolDurability[this.selectedItem] ?? save.toolMax[this.selectedItem], max: save.toolMax[this.selectedItem] } : null,
      cave: cave ? { id: cave.id, name: cave.name, subtitle: cave.subtitle, color: cave.color, stratum: stratumOf(this.position.h) + 1, danger: cave.danger, resources: cave.resources } : null,
      depthBelow: Math.max(0, Math.round(this.world.height(this.position.u, this.position.z) - this.position.h)),
    });
  }

  private animate = (time: number) => {
    if (this.disposed) return;
    this.animation = requestAnimationFrame(this.animate);
    const delta = this.lastTime ? Math.min((time - this.lastTime) / 1000, .045) : .016;
    this.lastTime = time;
    this.renderTime += delta;
    // Keep the RAF alive for restoration, but do no simulation or allocation
    // while WebGL is unavailable.
    if (this.contextLost) return;
    const save = this.callbacks.getSave();
    if (save.settings.quality !== this.previousQuality) this.resize();
    this.world.update(this.position.u, this.position.z, save.settings.quality, save.settings.reducedMotion ? 0 : this.elapsed, this.position.h);
    if (this.enabled) {
      this.elapsed += delta;
      this.move(delta);
      this.updateClimate(delta);
      if (this.heldMine) this.primaryAction();
    }
    this.updateCrops(delta);
    const daylight = Math.max(.08, Math.sin(((this.elapsed % 720) / 720) * Math.PI * 2 - Math.PI / 2) * .55 + .45);
    this.atmosphere.update(delta, this.renderTime, this.elapsed, this.position, this.submerged, save.aurora, save.settings.reducedMotion);
    this.flame.scale.y = 1 + Math.sin(this.renderTime * 8) * .12 + Math.sin(this.renderTime * 13) * .08;
    this.fireLight.intensity = 16 + Math.sin(this.renderTime * 7) * 2;
    for (const actor of this.actors) {
      const crystal = actor.group.userData.crystal as THREE.Mesh | undefined;
      if (crystal) { crystal.rotation.y = this.renderTime * .35; crystal.position.y = 2.6 + Math.sin(this.renderTime * 1.1) * .12; }
      const lid = actor.group.userData.lid as THREE.Mesh | undefined;
      if (lid) { const opened = save.claimedCaches.includes(actor.group.userData.cacheId); lid.rotation.x = THREE.MathUtils.lerp(lid.rotation.x, opened ? -.65 : 0, delta * 5); lid.position.y = opened ? 1.04 : .84; }
    }
    if (this.enabled) { this.updateFalling(delta); this.updateStorms(delta); this.updateEntities(delta, daylight); this.updateCreatures(delta, daylight); this.updateBoss(delta); this.updateActiveBoss(delta); }
    this.reportTime += delta;
    if (this.reportTime > .13) { this.reportTime = 0; this.report(); }
    if (!this.contextLost) this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animation);
    this.clearActiveBoss();
    this.setEnabled(false);
    this.resizeObserver.disconnect();
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    window.removeEventListener('blur', this.blur);
    window.removeEventListener('pointermove', this.pointerMove);
    window.removeEventListener('pointerup', this.pointerUp);
    window.removeEventListener('pointercancel', this.pointerUp);
    document.removeEventListener('pointerlockchange', this.pointerLockChange);
    this.renderer.domElement.removeEventListener('pointerdown', this.pointerDown);
    this.renderer.domElement.removeEventListener('contextmenu', this.contextMenu);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.contextLostHandler, false);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.contextRestoredHandler, false);
    this.scene.remove(this.world.group);
    this.world.dispose();
    this.atmosphere.dispose();
    this.creatureMaterial.dispose();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.LineSegments || object instanceof THREE.Sprite) {
        if ('geometry' in object) geometries.add(object.geometry);
        const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
        objectMaterials.forEach(material => { materials.add(material); Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); }); });
      }
    });
    geometries.add(this.basicCube);
    this.materialCache.forEach(material => materials.add(material));
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    textures.forEach(texture => texture.dispose());
    this.materialCache.clear();
    this.audio.dispose();
    this.renderer.dispose();
    try { this.renderer.forceContextLoss(); } catch { /* Context may already be lost. */ }
    this.renderer.domElement.remove();
  }
}