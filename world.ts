import * as THREE from 'three';
import { BIOMES, CHUNK_SIZE, CIRCUMFERENCE, HALF_LENGTH, WORLD_CEILING, WORLD_FLOOR, wrapU, type Biome } from './biomes';
import { baseKind, biomeAt, caveRange, clearTerrainCaches, columnBands, fluidAt, generateCaveDressing, generateFeatures, hash, terrainHeight, type ColumnInfo, type NaturalBlock } from './terrain';
import { BLOCK_KINDS, GLOWING_KINDS, ITEMS, type BlockKind, type Settings, type WorldEdit } from './model';
import { FaceBuilder, FACES } from './geometry';
import { CAVE_TOP } from './caves';
import { gridKey } from './coordinates';

export { CIRCUMFERENCE, HALF_LENGTH, RADIUS, WATER_HEIGHT, WORLD_FLOOR, WORLD_CEILING, wrapU } from './biomes';
export { gridKey, toWorld, fromWorld } from './coordinates';
export { biomeAt, hash, terrainHeight } from './terrain';

const COLUMNS = CIRCUMFERENCE / CHUNK_SIZE;
const ROWS = HALF_LENGTH * 2 / CHUNK_SIZE;
const HORIZON_STEP = CHUNK_SIZE * 2;
const HORIZON_COLUMNS = CIRCUMFERENCE / HORIZON_STEP;
const HORIZON_ROWS = HALF_LENGTH * 2 / HORIZON_STEP;
const GLOWING: BlockKind[] = GLOWING_KINDS;
const localIndex = (x: number, y: number, z: number) => (y - WORLD_FLOOR) * 256 + z * 16 + x;

interface ChunkData {
  cx: number;
  cz: number;
  columns: ColumnInfo[];
  features?: Map<number, NaturalBlock>;
  caveDressing?: Map<number, NaturalBlock>;
  caveDressingBand: number;
  top: number;
  touched: number;
}
interface RenderedChunk { group: THREE.Group; blocks: number; builtY: number }

function texture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 16;
  const context = canvas.getContext('2d')!;
  for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
    const shade = Math.floor(193 + hash(x, y, 9) * 62);
    context.fillStyle = `rgb(${shade},${shade},${shade})`; context.fillRect(x, y, 1, 1);
  }
  const map = new THREE.CanvasTexture(canvas);
  map.magFilter = THREE.NearestFilter; map.minFilter = THREE.NearestMipmapLinearFilter; map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

export class VoxelWorld {
  readonly group = new THREE.Group();
  readonly edits = new Map<string, WorldEdit>();
  visibleBlocks = 0;
  private data = new Map<number, ChunkData>();
  private rendered = new Map<number, RenderedChunk>();
  private editIndex = new Map<number, Map<number, WorldEdit>>();
  private exposed = new Map<number, Set<number>>();
  private dirty = new Set<number>();
  private failed = new Map<number, number>();
  private queue: number[] = [];
  private desired = new Set<number>();
  private centerKey = -1;
  private focusY = 4;
  private dressingBand = -1;
  private radius = 5;
  private lastPrune = 0;
  private clock = 0;
  private map = texture();
  private material = new THREE.MeshLambertMaterial({ map: this.map, vertexColors: true });
  private glowMaterial = new THREE.MeshBasicMaterial({ map: this.map, vertexColors: true });
  private waterMaterial = new THREE.MeshPhongMaterial({ color: '#78b5af', transparent: true, opacity: .64, shininess: 100, specular: '#d9f2e5', side: THREE.DoubleSide, depthWrite: false });
  private bloodMaterial = new THREE.MeshPhongMaterial({ color: '#8e3343', emissive: '#401220', emissiveIntensity: .25, transparent: true, opacity: .88, shininess: 85, specular: '#d89181', side: THREE.DoubleSide, depthWrite: false });
  private farMaterials: THREE.Material[] = [];
  private maskData = new Uint8Array(COLUMNS * ROWS);
  private mask = new THREE.DataTexture(this.maskData, COLUMNS, ROWS, THREE.RedFormat);
  private time = { value: 0 };
  private tint = new THREE.Color();
  private colors = Object.fromEntries(BLOCK_KINDS.map(kind => [kind, new THREE.Color(ITEMS[kind].color)])) as Record<BlockKind, THREE.Color>;
  private biomeColors = Object.fromEntries(Object.entries(BIOMES).map(([id, biome]) => [id, new THREE.Color(biome.ground)])) as Record<Biome, THREE.Color>;

  constructor(savedEdits: WorldEdit[]) {
    this.mask.magFilter = this.mask.minFilter = THREE.NearestFilter;
    this.mask.generateMipmaps = false; this.mask.needsUpdate = true;
    for (const material of [this.waterMaterial, this.bloodMaterial]) {
      material.onBeforeCompile = shader => {
        shader.uniforms.worldTime = this.time;
        shader.vertexShader = `uniform float worldTime;\n${shader.vertexShader}`.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normal * (sin(position.x * .12 + worldTime * .65) + cos(position.z * .15 - worldTime * .4)) * .055;');
      };
    }
    for (const edit of savedEdits) {
      if (Number.isInteger(edit.x) && Number.isInteger(edit.y) && Number.isInteger(edit.z) && Math.abs(edit.z) < HALF_LENGTH && edit.y >= WORLD_FLOOR && edit.y <= WORLD_CEILING && (edit.kind === null || BLOCK_KINDS.includes(edit.kind))) this.recordEdit({ ...edit, x: wrapU(edit.x) });
    }
    this.buildHorizon();
  }

  get loadedChunks() { return this.rendered.size; }
  get pendingChunks() { return this.queue.length + this.dirty.size; }

  private address(x: number, z: number) {
    const u = wrapU(Math.round(x)) + CIRCUMFERENCE / 2;
    const longitude = Math.max(0, Math.min(HALF_LENGTH * 2 - 1, Math.round(z) + HALF_LENGTH));
    const cx = Math.floor(u / 16), cz = Math.floor(longitude / 16);
    return { cx, cz, key: cz * COLUMNS + cx, lx: u % 16, lz: longitude % 16 };
  }

  private chunk(key: number, features = false): ChunkData {
    let data = this.data.get(key);
    if (!data) {
      const cx = key % COLUMNS, cz = Math.floor(key / COLUMNS), columns: ColumnInfo[] = [];
      let top = WORLD_FLOOR;
      for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) {
        const u = cx * 16 + x - CIRCUMFERENCE / 2, longitude = cz * 16 + z - HALF_LENGTH;
        const height = terrainHeight(u, longitude), biome = biomeAt(u, longitude);
        columns.push({ height, biome, cave: caveRange(u, longitude, biome), caves: [], x: u, z: longitude, bandsReady: false }); top = Math.max(top, height);
      }
      data = { cx, cz, columns, top, touched: this.clock, caveDressingBand: -1 }; this.data.set(key, data);
    }
    data.touched = this.clock;
    if (features && !data.features) {
      const minX = data.cx * 16 - CIRCUMFERENCE / 2, minZ = data.cz * 16 - HALF_LENGTH;
      const columns = data.columns;
      data.features = generateFeatures(minX, minZ, (x, z) => columns[(z - minZ) * 16 + wrapU(x - minX)]);
      for (const block of data.features.values()) data.top = Math.max(data.top, block.y);
    }
    // Cave dressing is keyed to a coarse depth band so it regenerates only when the player
    // moves to a different part of the crust, never for surface-only chunks.
    if (features && data.caveDressingBand !== this.dressingBand) {
      const band = this.dressingBand;
      const minX = data.cx * 16 - CIRCUMFERENCE / 2, minZ = data.cz * 16 - HALF_LENGTH;
      const columns = data.columns;
      data.caveDressing = band < 0 ? undefined : generateCaveDressing(minX, minZ, (x, z) => columns[(z - minZ) * 16 + wrapU(x - minX)], this.focusY - 96, this.focusY + 96);
      data.caveDressingBand = band;
    }
    return data;
  }

  height(x: number, z: number) {
    const address = this.address(x, z);
    return this.chunk(address.key).columns[address.lz * 16 + address.lx].height;
  }

  columnAt(x: number, z: number): ColumnInfo {
    const address = this.address(x, z);
    return this.chunk(address.key).columns[address.lz * 16 + address.lx];
  }

  fluid(x: number, z: number) { return fluidAt(x, z, this.height(x, z)); }

  get(x: number, y: number, z: number): BlockKind | null {
    if (Math.abs(z) >= HALF_LENGTH || y < WORLD_FLOOR || y > WORLD_CEILING) return null;
    y = Math.round(y);
    const address = this.address(x, z), data = this.chunk(address.key, true), index = localIndex(address.lx, y, address.lz);
    const edit = this.editIndex.get(address.key)?.get(index);
    if (edit) return edit.kind;
    const natural = data.features?.get(index) || data.caveDressing?.get(index);
    if (natural) return natural.kind;
    const column = data.columns[address.lz * 16 + address.lx];
    if (y > column.height) return null;
    if (y <= CAVE_TOP + 20) for (const band of columnBands(column)) if (y >= band[0] && y <= band[1]) return null;
    return baseKind(wrapU(Math.round(x)), y, Math.round(z), column.height, column.biome);
  }

  /** Scans a bounded window so deep shafts cannot stall movement queries. */
  ground(u: number, z: number, ceiling = WORLD_CEILING) {
    const address = this.address(u, z), data = this.chunk(address.key, true);
    let top = data.top;
    const edits = this.editIndex.get(address.key);
    if (edits) for (const edit of edits.values()) if (edit.kind) top = Math.max(top, edit.y);
    const start = Math.min(top, Math.floor(ceiling), WORLD_CEILING);
    const column = this.columnAt(u, z);
    // Fast path: no edits nearby and the scan starts above the caves, so the
    // terrain surface is simply the column height.
    if (!edits && !data.features?.size && start >= column.height && column.height > CAVE_TOP + 20) return column.height + .5;
    const limit = Math.max(WORLD_FLOOR, start - 190);
    for (let y = start; y >= limit; y--) {
      const kind = this.get(u, y, z);
      if (kind && kind !== 'leaves') return y + .5;
    }
    return WORLD_FLOOR - .5;
  }

  /** Resolve legacy/corrupt saved positions without hundreds of block probes. */
  safeHeight(u: number, z: number, preferred: number) {
    const clear = (h: number) => !this.get(u, Math.round(h), z) && !this.get(u, Math.round(h + 1.2), z);
    if (clear(preferred)) return preferred;
    const column = this.columnAt(u, z);
    const candidates = [column.height + .51];
    for (const [bottom, top] of columnBands(column)) {
      if (top - bottom >= 3) candidates.push(bottom + .55);
    }
    candidates.sort((a, b) => Math.abs(a - preferred) - Math.abs(b - preferred));
    return candidates.find(clear) ?? column.height + .51;
  }

  private recordEdit(edit: WorldEdit) {
    this.edits.set(gridKey(edit.x, edit.y, edit.z), edit);
    const address = this.address(edit.x, edit.z);
    let indexed = this.editIndex.get(address.key);
    if (!indexed) { indexed = new Map(); this.editIndex.set(address.key, indexed); }
    indexed.set(localIndex(address.lx, edit.y, address.lz), edit);
    for (const [dx, dy, dz] of [[0, 0, 0], ...FACES.map(face => face.direction)]) {
      const x = wrapU(edit.x + dx), y = edit.y + dy, z = edit.z + dz;
      if (Math.abs(z) >= HALF_LENGTH || y < WORLD_FLOOR || y > WORLD_CEILING) continue;
      const neighbor = this.address(x, z);
      let candidates = this.exposed.get(neighbor.key);
      if (!candidates) { candidates = new Set(); this.exposed.set(neighbor.key, candidates); }
      candidates.add(localIndex(neighbor.lx, y, neighbor.lz));
      if (this.rendered.has(neighbor.key)) this.dirty.add(neighbor.key);
    }
  }

  set(x: number, y: number, z: number, kind: BlockKind | null) {
    x = wrapU(Math.round(x)); y = Math.round(y); z = Math.round(z);
    if (Math.abs(z) >= HALF_LENGTH || y <= WORLD_FLOOR || y > WORLD_CEILING) return;
    this.recordEdit({ x, y, z, kind });
  }

  releaseSand(x: number, z: number) {
    const released: { x: number; y: number; z: number; kind: BlockKind }[] = [];
    const address = this.address(x, z), data = this.chunk(address.key, true);
    let top = data.top;
    for (const edit of this.editIndex.get(address.key)?.values() || []) if (edit.kind) top = Math.max(top, edit.y);
    for (let y = Math.max(WORLD_FLOOR + 1, top - 170); y <= top; y++) {
      const kind = this.get(x, y, z);
      if ((kind === 'sand' || kind === 'red-sand') && !this.get(x, y - 1, z)) {
        this.set(x, y, z, null); released.push({ x, y, z, kind });
      }
    }
    return released;
  }

  private color(x: number, y: number, z: number, kind: BlockKind, column: ColumnInfo) {
    this.tint.copy(kind === 'stone' && y === column.height ? this.biomeColors[column.biome] : this.colors[kind]);
    return this.tint.multiplyScalar(.85 + hash(x, z, y) * .22);
  }

  private buildChunk(key: number) {
    const data = this.chunk(key, true), minX = data.cx * 16 - CIRCUMFERENCE / 2, minZ = data.cz * 16 - HALF_LENGTH;
    const candidates = new Set<number>(data.features?.keys());
    if (data.caveDressing) for (const index of data.caveDressing.keys()) candidates.add(index);
    for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) {
      const x = minX + lx, z = minZ + lz, column = data.columns[lz * 16 + lx];
      const bottom = Math.max(WORLD_FLOOR, Math.min(column.height - 1, this.height(x - 1, z), this.height(x + 1, z), this.height(x, z - 1), this.height(x, z + 1)));
      for (let y = bottom; y <= column.height; y++) candidates.add(localIndex(lx, y, lz));
      // Cave surfaces near the player's depth: walls, floors, and ceilings.
      // Skipped entirely while the player is on the surface, so the world stays cheap up top.
      const windowLo = this.focusY - 96, windowHi = this.focusY + 96;
      if (windowLo <= CAVE_TOP + 20) {
        for (const source of [column, this.columnAt(x - 1, z), this.columnAt(x + 1, z), this.columnAt(x, z - 1), this.columnAt(x, z + 1)]) {
          for (const band of columnBands(source)) {
            if (band[1] < windowLo || band[0] > windowHi) continue;
            const lo = Math.max(WORLD_FLOOR, band[0] - 1, windowLo), hi = Math.min(column.height, band[1] + 1, windowHi);
            for (let y = lo; y <= hi; y++) candidates.add(localIndex(lx, y, lz));
          }
        }
      }
    }
    for (const index of this.exposed.get(key) || []) candidates.add(index);
    const solid = new FaceBuilder(), glow = new FaceBuilder(), water = new FaceBuilder(), blood = new FaceBuilder();
    let blocks = 0;
    for (const index of candidates) {
      const lx = index % 16, lz = Math.floor(index / 16) % 16, y = Math.floor(index / 256) + WORLD_FLOOR;
      const x = minX + lx, z = minZ + lz, kind = this.get(x, y, z);
      if (!kind) continue;
      const builder = GLOWING.includes(kind) ? glow : solid, column = data.columns[lz * 16 + lx];
      const color = this.color(x, y, z, kind, column);
      let exposed = false;
      for (let face = 0; face < 6; face++) {
        const [dx, dy, dz] = FACES[face].direction;
        if (!this.get(x + dx, y + dy, z + dz)) { builder.face(x, y, z, face, color); exposed = true; }
      }
      if (exposed) blocks++;
    }
    const white = new THREE.Color('#ffffff');
    for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) {
      const x = minX + lx, z = minZ + lz, fluid = fluidAt(x, z, data.columns[lz * 16 + lx].height);
      if (fluid) (fluid.kind === 'water' ? water : blood).face(x, fluid.height - .5, z, 2, white);
    }
    const group = new THREE.Group();
    for (const [builder, material] of [[solid, this.material], [glow, this.glowMaterial], [water, this.waterMaterial], [blood, this.bloodMaterial]] as const) {
      if (!builder.indices.length) continue;
      const mesh = new THREE.Mesh(builder.geometry(), material); mesh.receiveShadow = true; group.add(mesh);
    }
    this.unload(key);
    this.rendered.set(key, { group, blocks, builtY: this.focusY }); this.visibleBlocks += blocks; this.group.add(group);
    this.maskData[key] = 255; this.mask.needsUpdate = true; this.dirty.delete(key);
  }

  private unload(key: number) {
    const old = this.rendered.get(key); if (!old) return;
    old.group.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
    this.group.remove(old.group); this.visibleBlocks -= old.blocks; this.rendered.delete(key);
    this.maskData[key] = 0; this.mask.needsUpdate = true;
  }

  private tryBuildChunk(key: number) {
    try {
      this.buildChunk(key);
      this.failed.delete(key);
      return true;
    } catch {
      // Keep the coarse horizon and logical collision available. Retrying
      // immediately after an allocation failure causes a crash loop.
      this.failed.set(key, this.clock);
      return false;
    }
  }

  private maskMaterial<T extends THREE.Material>(source: T): T {
    const material = source.clone() as T;
    material.onBeforeCompile = shader => {
      shader.uniforms.loadedChunks = { value: this.mask };
      shader.vertexShader = `attribute vec2 cellUv; varying vec2 vCellUv;\n${shader.vertexShader}`.replace('#include <begin_vertex>', '#include <begin_vertex>\nvCellUv = cellUv;');
      shader.fragmentShader = `uniform sampler2D loadedChunks; varying vec2 vCellUv;\n${shader.fragmentShader}`.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (texture2D(loadedChunks, vCellUv).r > .5) discard;');
    };
    material.customProgramCacheKey = () => 'ernas-horizon-v2';
    this.farMaterials.push(material); return material;
  }

  private buildHorizon() {
    // This is only the distant visual shell. Nearby chunks still stream at
    // full 16x16 resolution, so doubling this step changes no editable data.
    const heights = new Int16Array(HORIZON_COLUMNS * HORIZON_ROWS);
    for (let cz = 0; cz < HORIZON_ROWS; cz++) for (let cx = 0; cx < HORIZON_COLUMNS; cx++) heights[cz * HORIZON_COLUMNS + cx] = terrainHeight(cx * HORIZON_STEP + HORIZON_STEP / 2 - CIRCUMFERENCE / 2, cz * HORIZON_STEP + HORIZON_STEP / 2 - HALF_LENGTH);
    const terrain = new FaceBuilder(), water = new FaceBuilder(), blood = new FaceBuilder();
    const white = new THREE.Color('#ffffff');
    for (let cz = 0; cz < HORIZON_ROWS; cz++) for (let cx = 0; cx < HORIZON_COLUMNS; cx++) {
      const x = cx * HORIZON_STEP + HORIZON_STEP / 2 - CIRCUMFERENCE / 2, z = cz * HORIZON_STEP + HORIZON_STEP / 2 - HALF_LENGTH, h = heights[cz * HORIZON_COLUMNS + cx];
      const biome = biomeAt(x, z), kind = baseKind(Math.round(x), h, Math.round(z), h, biome);
      const color = this.color(x, h, z, kind, { height: h, biome, cave: null, caves: [], x, z, bandsReady: true });
      // Continuous UVs let the 16x16 chunk mask cut holes through 32x32 LOD faces.
      const cell: [number, number] = [-1, -1];
      terrain.face(x, h, z, 2, color, HORIZON_STEP, 1, HORIZON_STEP, cell);
      for (const [face, dx, dz] of [[0, 1, 0], [1, -1, 0], [4, 0, 1], [5, 0, -1]]) {
        const neighborZ = cz + dz;
        // Edge cells fall to a shallow rim, not the full -520 floor: a 530-block wall per edge cell blew up the horizon mesh.
        const neighbor = neighborZ < 0 || neighborZ >= HORIZON_ROWS ? h - 12 : heights[neighborZ * HORIZON_COLUMNS + (cx + dx + HORIZON_COLUMNS) % HORIZON_COLUMNS];
        if (neighbor < h) terrain.face(x, (h + neighbor + 1) / 2, z, face, color, HORIZON_STEP, h - neighbor, HORIZON_STEP, cell);
      }
      const fluid = fluidAt(x, z, h);
      if (fluid) (fluid.kind === 'water' ? water : blood).face(x, fluid.height - .5, z, 2, white, HORIZON_STEP, 1, HORIZON_STEP, cell);
      if (hash(cx, cz, 111) > .55 && h > 3 && ['taiga', 'sky', 'grove', 'spiked'].includes(biome) && (Math.abs(x) > 145 || Math.abs(z) > 60)) {
        const treeColor = this.colors[biome === 'spiked' ? 'toxic-crystal' : 'leaves'];
        const tall = biome === 'spiked' ? 17 : biome === 'grove' ? 35 : 19;
        terrain.box(x, h + tall * .45, z, biome === 'grove' ? 10 : 4, tall * .7, biome === 'grove' ? 10 : 4, treeColor, cell);
        terrain.box(x, h + tall * .82, z, 2, tall * .4, 2, treeColor, cell);
      }
    }
    // Large landmarks remain visible before their individual voxel chunks stream in.
    const continuousMask: [number, number] = [-1, -1];
    const farIsland = (x: number, h: number, z: number, radius: number, cloud: boolean) => {
      terrain.box(x, h - 1.5, z, radius * 1.75, 4, radius * 1.55, this.colors.cloudstone, continuousMask);
      terrain.box(x, h - 6, z, radius * 1.2, cloud ? 5 : 10, radius, cloud ? this.colors.cloudstone : this.colors.stone, continuousMask);
    };
    for (let ax = -CIRCUMFERENCE / 2; ax < CIRCUMFERENCE / 2; ax += 64) for (let az = -HALF_LENGTH; az < HALF_LENGTH; az += 64) {
      const x = ax + Math.floor(hash(ax, az, 71) * 32), z = az + Math.floor(hash(ax, az, 72) * 32);
      const biome = biomeAt(x, z), chance = hash(ax, az, 73);
      if ((biome === 'sky' || biome === 'clouds') && chance > .3 && (Math.abs(x) > 142 || Math.abs(z) > 52)) farIsland(x, (biome === 'clouds' ? 100 : 86) + Math.floor(chance * 28), z, 10 + Math.floor(chance * 11), biome === 'clouds');
    }
    farIsland(560, 104, -490, 14, true); farIsland(584, 111, -501, 8, true); farIsland(543, 117, -519, 9, true);
    const farTree = (x: number, z: number) => {
      const h = terrainHeight(x, z), tall = 62 + Math.floor(hash(x, z, 93) * 20);
      terrain.box(x, h + tall / 2, z, 9, tall, 9, this.colors.wood, continuousMask);
      terrain.box(x, h + tall + 3, z, 26, 13, 26, this.colors.leaves, continuousMask);
      terrain.box(x - 10, h + tall - 3, z, 25, 10, 22, this.colors.leaves, continuousMask);
      terrain.box(x + 11, h + tall - 1, z + 1, 25, 10, 22, this.colors.leaves, continuousMask);
    };
    for (let ax = -CIRCUMFERENCE / 2; ax < CIRCUMFERENCE / 2; ax += 128) for (let az = -HALF_LENGTH; az < HALF_LENGTH; az += 128) {
      const x = ax + Math.floor(hash(ax, az, 71) * 64), z = az + Math.floor(hash(ax, az, 72) * 64);
      if (biomeAt(x, z) === 'grove' && hash(ax, az, 73) > .25 && Math.hypot(wrapU(x - 84), z - 548) > 70) farTree(x, z);
    }
    farTree(84, 548);
    for (const [builder, material] of [[terrain, this.maskMaterial(this.material)], [water, this.maskMaterial(this.waterMaterial)], [blood, this.maskMaterial(this.bloodMaterial)]] as const) {
      const mesh = new THREE.Mesh(builder.geometry(), material); mesh.frustumCulled = false; this.group.add(mesh);
    }
  }

  prime(u: number, z: number, quality: Settings['quality']) {
    this.centerKey = -1;
    this.plan(u, z, quality);
    const center = this.address(u, z);
    // Keep startup responsive: only the occupied chunk is synchronous. The
    // surrounding eight chunks retain their queue priority and stream next.
    if (!this.rendered.has(center.key)) this.tryBuildChunk(center.key);
    this.queue = this.queue.filter(key => key !== center.key && !this.rendered.has(key));
  }

  private plan(u: number, z: number, quality: Settings['quality']) {
    const coarse = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    // The low-detail whole-world shell remains visible outside this radius.
    const center = this.address(u, z), radius = coarse ? 3 : quality === 'high' ? 6 : 4;
    if (center.key === this.centerKey && radius === this.radius) return;
    this.centerKey = center.key; this.radius = radius; this.desired.clear();
    const pending: { key: number; distance: number }[] = [];
    for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dz * dz > (radius + .4) ** 2) continue;
      const cz = center.cz + dz; if (cz < 0 || cz >= ROWS) continue;
      const key = cz * COLUMNS + (center.cx + dx + COLUMNS) % COLUMNS;
      this.desired.add(key);
      const lastFailure = this.failed.get(key) ?? -Infinity;
      if (!this.rendered.has(key) && this.clock - lastFailure > 180) pending.push({ key, distance: dx * dx + dz * dz });
    }
    this.queue = pending.sort((a, b) => a.distance - b.distance).map(item => item.key);
    for (const key of this.rendered.keys()) {
      const cx = key % COLUMNS, cz = Math.floor(key / COLUMNS);
      const dx = Math.min(Math.abs(cx - center.cx), COLUMNS - Math.abs(cx - center.cx));
      if (Math.hypot(dx, cz - center.cz) > radius + 2) this.unload(key);
    }
  }

  update(u: number, z: number, quality: Settings['quality'], elapsed: number, focusY = this.focusY) {
    this.clock++; this.time.value = elapsed;
    this.bloodMaterial.emissiveIntensity = .2 + Math.sin(elapsed * .6) * .07;
    this.focusY = focusY;
    this.dressingBand = focusY > CAVE_TOP + 116 ? -1 : Math.floor(focusY / 96);
    this.plan(u, z, quality);
    // Descending or climbing re-meshes nearby chunks so new cave depths appear.
    // Throttled to one chunk every few frames and only when actually needed, so
    // falling down a shaft does not trigger a rebuild storm.
    if (this.dirty.size === 0 && this.queue.length === 0 && this.clock % 4 === 0) {
      let worst: number | null = null, worstGap = 48;
      for (const [key, chunk] of this.rendered) {
        const gap = Math.abs(chunk.builtY - focusY);
        if (gap > worstGap) { worstGap = gap; worst = key; }
      }
      if (worst !== null) this.dirty.add(worst);
    }
    const start = performance.now();
    let built = 0;
    // buildChunk is indivisible and may exceed the nominal frame budget in a
    // giant tree or cavern. Never start a second build in the same frame.
    while (built < 1 && performance.now() - start < 4) {
      const dirty = this.dirty.values().next().value as number | undefined;
      const key = dirty ?? this.queue.shift(); if (key === undefined) break;
      this.dirty.delete(key);
      if (this.desired.has(key) || this.rendered.has(key)) { this.tryBuildChunk(key); built++; }
    }
    if (this.clock - this.lastPrune > 240) {
      this.lastPrune = this.clock;
      const maximum = quality === 'high' ? 420 : 260;
      if (this.data.size > maximum) {
        const stale = [...this.data.entries()].filter(([key]) => !this.rendered.has(key) && !this.desired.has(key)).sort((a, b) => a[1].touched - b[1].touched);
        for (const [key, chunk] of stale) {
          if (this.data.size <= maximum) break;
          chunk.features?.clear();
          chunk.caveDressing?.clear();
          this.data.delete(key);
          if (!this.editIndex.has(key)) this.exposed.delete(key);
        }
      }
    }
  }

  snapshot() { return [...this.edits.values()]; }

  dispose() {
    this.group.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
    for (const material of [this.material, this.glowMaterial, this.waterMaterial, this.bloodMaterial, ...this.farMaterials]) material.dispose();
    this.mask.dispose(); this.map.dispose(); this.data.clear(); this.rendered.clear(); this.editIndex.clear(); this.exposed.clear(); this.dirty.clear(); this.failed.clear(); this.desired.clear(); this.queue = []; this.group.clear();
    clearTerrainCaches();
  }
}