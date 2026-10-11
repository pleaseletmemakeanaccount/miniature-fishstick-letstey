import { BIOMES, BIOME_IDS, CHUNK_SIZE, CIRCUMFERENCE, HALF_LENGTH, OUTER_PLUG, OUTER_SOCKET, PYLONS, WATER_HEIGHT, WORLD_FLOOR, wrapU, type Biome } from './biomes';
import type { BlockKind } from '../data/model';
import { caveBiomeAt, CAVE_TOP, STRATUM_HEIGHT } from './caves';

export const hash = (x: number, z: number, seed = 0) => {
  const n = Math.sin(x * 127.1 + z * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const LEGACY_PYLONS = PYLONS.filter(pylon => ['hearth', 'cloudbreak', 'fracture'].includes(pylon.id));
export const smoothstep = (a: number, b: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function noise(x: number, z: number) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  return lerp(lerp(hash(ix, iz), hash(ix + 1, iz), ux), lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), ux), uz);
}

function ringNoise(x: number, z: number, scaleX: number, scaleZ = scaleX, offsetX = 0, offsetZ = 0) {
  const value = noise(x * scaleX + offsetX, z * scaleZ + offsetZ);
  const blend = smoothstep(CIRCUMFERENCE / 2 - 128, CIRCUMFERENCE / 2, Math.abs(x)) * .5;
  if (!blend) return value;
  return lerp(value, noise((x - Math.sign(x) * CIRCUMFERENCE) * scaleX + offsetX, z * scaleZ + offsetZ), blend);
}

function biomePair(u: number, z: number) {
  const x = wrapU(u);
  const wx = x + Math.sin(z * .012) * 25 + Math.sin(x * Math.PI / (CIRCUMFERENCE / 2) * 5) * 17;
  const wz = z + Math.cos(x * Math.PI / (CIRCUMFERENCE / 2) * 4) * 30;
  let first: Biome = 'taiga', second: Biome = 'taiga', nearest = Infinity, next = Infinity;
  for (const id of BIOME_IDS) {
    const [sx, sz] = BIOMES[id].seed;
    const distance = Math.hypot(wrapU(wx - sx), (wz - sz) * 1.12);
    if (distance < nearest) { next = nearest; second = first; nearest = distance; first = id; }
    else if (distance < next) { next = distance; second = id; }
  }
  return { first, second, blend: .5 + smoothstep(0, 68, next - nearest) * .5 };
}

// Small bounded memo caches. The horizon and every chunk column hit these hot
// paths tens of thousands of times, and biomePair loops every surface biome.
const biomeCache = new Map<number, Biome>();
const heightCache = new Map<number, number>();
const cacheKey = (x: number, z: number) => (x + 4096) * 8192 + (z + 4096);
// ChunkData retains nearby columns. Larger global caches only duplicate them
// and used to survive across game sessions because this module is a singleton.
const CACHE_LIMIT = 48000;

function trimCache<T>(cache: Map<number, T>, limit: number) {
  if (cache.size <= limit) return;
  // Map iteration is insertion ordered. Incremental eviction avoids the large
  // regeneration spike caused by clearing an entire hot cache at once.
  const remove = Math.ceil(limit * .2);
  let removed = 0;
  for (const key of cache.keys()) {
    cache.delete(key);
    if (++removed >= remove) break;
  }
}

export function biomeAt(u: number, z = 0): Biome {
  const x = wrapU(Math.round(u)), zi = Math.round(z);
  const key = cacheKey(x, zi);
  const cached = biomeCache.get(key);
  if (cached) return cached;
  let result: Biome;
  if (Math.abs(x) <= 138 && Math.abs(zi) <= 48) result = x > 48 && x < 114 ? 'sky' : x < -46 ? 'broken' : 'taiga';
  else {
    result = biomePair(x, zi).first;
    for (const pylon of PYLONS) if (Math.abs(wrapU(x - pylon.u)) < 18 && Math.abs(zi - pylon.z) < 18) { result = pylon.biome; break; }
  }
  trimCache(biomeCache, CACHE_LIMIT);
  biomeCache.set(key, result);
  return result;
}

// Keep the original settlement's logical terrain and features, including saved edits.
export function legacyHeight(x: number, z: number) {
  for (const pylon of LEGACY_PYLONS) {
    if (Math.hypot(x - pylon.u, z - pylon.z) < 5.5) return pylon.height;
  }
  if (Math.hypot(x - 13, z - 20) < 9.5) return 3;
  if (Math.hypot(x + 76, z + 35) < 9) return 4;
  const region = x > 48 && x < 114 ? 'sky' : x < -46 ? 'broken' : 'taiga';
  const riverDistance = Math.abs(x - (Math.sin(z * .06) * 3 - 1));
  if (riverDistance < 3.5) return -1;
  if (riverDistance < 5.5) return 1;
  const n = noise(x * .048, z * .045) * 6 + noise(x * .14, z * .14) * 2.8 + noise(x * .4, z * .4);
  let height = Math.floor(n - .8);
  if (region === 'sky') height += Math.floor(noise(x * .07, z * .07) * 7);
  if (region === 'broken') height = Math.floor(n * .7) + (Math.abs(x) % 7 < 2 ? 4 : 0);
  if (Math.abs(z) > 42) height += Math.floor((Math.abs(z) - 42) * 1.4);
  return Math.max(1, height);
}

function regionHeight(id: Biome, x: number, z: number) {
  const broad = ringNoise(x, z, .009);
  const detail = ringNoise(x, z, .04);
  const grain = ringNoise(x, z, .12);
  const ridge = 1 - Math.abs(ringNoise(x, z, .016, .018, 12, -5) * 2 - 1);
  switch (id) {
    case 'taiga': return 8 + broad * 18 + Math.pow(ridge, 5) * 18 + detail * 5 + grain * 2;
    case 'sinkholes': return 16 + broad * 13 + detail * 5 + grain;
    case 'sky': return 27 + Math.pow(ridge, 2) * 46 + broad * 20 + detail * 8 + grain * 2;
    case 'clouds': return 18 + broad * 28 + ridge * 12 + detail * 5;
    case 'reef': return -11 + broad * 11 + detail * 6 + Math.pow(grain, 4) * 7;
    case 'abyss': return -52 + broad * 12 + detail * 7 + grain * 3;
    case 'broken': return 11 + broad * 21 + (Math.floor(Math.abs(x) / 8) % 3 === 0 ? 22 : 0) + (Math.floor(z / 11) % 4 === 0 ? 13 : 0) + grain * 2;
    case 'spiked': return 13 + broad * 17 + detail * 9 + grain * 3;
    case 'storm': return 18 + Math.floor(broad * 5) * 4 + detail * 6 + grain * 2;
    case 'desert': return 7 + Math.pow(.5 + .5 * Math.sin(x * (Math.PI * 26 / CIRCUMFERENCE) + z * .011 + broad * 6), 2) * 20 + broad * 13 + detail * 3;
    case 'blood': return -15 + broad * 21 + detail * 6 + Math.pow(grain, 4) * 7;
    case 'grove': return 9 + broad * 13 + detail * 5 + grain * 2;
    case 'alpine': return 34 + Math.pow(ridge, 1.5) * 96 + broad * 30 + detail * 7 + grain * 3;
    case 'volcanic': return 5 + broad * 10 + Math.pow(ridge, 4) * 34 + detail * 4 + grain * 2;
    case 'mushroom': return 3 + broad * 8 + detail * 4 + grain * 2;
    case 'bone': return 5 + broad * 9 + Math.pow(.5 + .5 * Math.sin(x * .03 + z * .02), 2) * 11 + detail * 3;
    case 'outer': return 6 + broad * 5 + detail * 2 + grain;
    case 'deepocean': return -68 + broad * 20 + detail * 8 + grain * 3;
    case 'glacier': return 40 + Math.pow(ridge, 1.4) * 120 + broad * 34 + detail * 6;
    case 'badlands': return 8 + Math.floor((broad * 5 + Math.pow(ridge, 3) * 9)) * 6 + detail * 3;
    case 'savanna': return 5 + broad * 9 + detail * 3 + grain;
    case 'jungle': return 8 + broad * 15 + Math.pow(ridge, 3) * 14 + detail * 5 + grain * 2;
    case 'swamp': return -1 + broad * 5 + detail * 3;
    case 'meadow': return 5 + broad * 10 + detail * 3 + grain;
    case 'tundra': return 4 + broad * 7 + detail * 3;
    case 'canyon': { const gorge = Math.abs(ringNoise(x, z, .02, .022, 5, 9) * 2 - 1); return 18 + broad * 14 - Math.pow(1 - gorge, 3) * 46 + detail * 3; }
    case 'highlands': return 24 + Math.pow(ridge, 1.8) * 62 + broad * 26 + detail * 6;
    case 'crystalcave': return 12 + broad * 14 + Math.pow(ridge, 2) * 24 + detail * 6 + grain * 3;
  }
}

export function sinkholeAt(x: number, z: number) {
  let distance = Math.hypot(x + 250, z - 120), radius = 17;
  const gx = Math.floor(x / 96), gz = Math.floor(z / 96);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const ax = (gx + dx) * 96 + 15 + hash(gx + dx, gz + dz, 8) * 64;
    const az = (gz + dz) * 96 + 15 + hash(gx + dx, gz + dz, 9) * 64;
    const d = Math.hypot(wrapU(x - ax), z - az);
    if (d < distance) { distance = d; radius = 11 + hash(gx + dx, gz + dz, 10) * 8; }
  }
  return { distance, radius };
}

export function terrainHeight(u: number, longitude: number) {
  const x = wrapU(Math.round(u)), z = Math.round(longitude);
  const key = cacheKey(x, z);
  const cached = heightCache.get(key);
  if (cached !== undefined) return cached;
  const value = computeHeight(x, z);
  trimCache(heightCache, CACHE_LIMIT);
  heightCache.set(key, value);
  return value;
}

function computeHeight(x: number, z: number) {
  if (Math.abs(x) <= 138 && Math.abs(z) <= 48) return legacyHeight(x, z);
  const pair = biomePair(x, z);
  let height = lerp(regionHeight(pair.second, x, z), regionHeight(pair.first, x, z), pair.blend);
  const region = biomeAt(x, z);
  if (region === 'sinkholes') {
    const hole = sinkholeAt(x, z);
    height -= (1 - smoothstep(hole.radius * .38, hole.radius + 8, hole.distance)) * 51;
  }
  if (region === 'taiga') {
    const river = Math.sin(z * .025) * 12 - 2;
    const distance = Math.abs(wrapU(x - river));
    height = lerp(-2, height, smoothstep(6, 18, distance));
  }
  const oldDistance = Math.max(Math.abs(x) - 138, Math.abs(z) - 48);
  if (oldDistance < 28) {
    const oldX = Math.max(-138, Math.min(138, x)), oldZ = Math.max(-48, Math.min(48, z));
    height = lerp(legacyHeight(oldX, oldZ), height, smoothstep(0, 28, oldDistance));
  }
  for (const pylon of PYLONS) {
    if (pylon.biome === 'clouds') continue;
    const dx = Math.abs(wrapU(x - pylon.u)), dz = Math.abs(z - pylon.z);
    if (dx > 32 || dz > 32) continue;
    const distance = Math.hypot(dx, dz);
    height = lerp(pylon.height, height, smoothstep(9, 31, distance));
  }
  if (Math.abs(z) > HALF_LENGTH - 25) height += smoothstep(HALF_LENGTH - 25, HALF_LENGTH, Math.abs(z)) * 30;
  return Math.floor(Math.max(WORLD_FLOOR + 4, height));
}

export function caveRange(x: number, z: number, biome = biomeAt(x, z)): [number, number] | null {
  if (biome !== 'sinkholes') return null;
  const corridor = Math.abs(Math.sin(x * .033 + Math.cos(z * .024) * 2.2));
  if (corridor > .71 && noise(x * .045, z * .045) < .57) return null;
  const bottom = -31 + Math.floor(noise(x * .025, z * .025) * 6);
  return [bottom, bottom + 12 + Math.floor(noise(x * .04 + 7, z * .04) * 8)];
}

/**
 * Air pockets through the deep crust. Each stratum can hold one broad cavern,
 * and vertical shafts punch between them so the whole depth is walkable.
 */
const bandCache = new Map<number, [number, number][]>();
export function caveBands(x: number, z: number, surface: number, biome = biomeAt(x, z)): [number, number][] {
  const key = cacheKey(wrapU(Math.round(x)), Math.round(z));
  const cached = bandCache.get(key);
  if (cached) return cached;
  const result = computeBands(x, z, surface, biome);
  trimCache(bandCache, 12000);
  bandCache.set(key, result);
  return result;
}

function computeBands(x: number, z: number, surface: number, biome: Biome): [number, number][] {
  const bands: [number, number][] = [];
  const shallow = caveRange(x, z, biome);
  if (shallow && Math.min(shallow[1], surface - 1) > shallow[0]) bands.push([shallow[0], Math.min(shallow[1], surface - 1)]);

  for (let s = 0; s <= 6; s++) {
    const centre = CAVE_TOP - s * STRATUM_HEIGHT - STRATUM_HEIGHT * .5;
    const presence = noise(x * .0115 + s * 31.7, z * .0115 - s * 17.3);
    if (presence < .42) continue;
    const roominess = noise(x * .031 - s * 9.1, z * .031 + s * 5.5);
    const half = 4 + Math.pow(presence - .42, .8) * 26 + roominess * 7;
    const drift = (noise(x * .02 + s * 4.4, z * .02) - .5) * 17;
    const lo = Math.round(centre + drift - half), hi = Math.round(centre + drift + half);
    if (hi - lo < 3) continue;
    bands.push([Math.max(WORLD_FLOOR + 2, lo), Math.min(CAVE_TOP, hi)]);
  }

  // Shafts link one stratum to the next, so the whole depth can be walked down in stages.
  for (let s = 0; s <= 6; s++) {
    const shaft = noise(x * .058 + 77 + s * 12.9, z * .058 - 41 - s * 6.3);
    if (shaft < .9) continue;
    const top = s === 0 ? Math.min(surface - 1, CAVE_TOP + 18) : CAVE_TOP - s * STRATUM_HEIGHT + 6;
    const bottom = CAVE_TOP - (s + 1) * STRATUM_HEIGHT - 4;
    bands.push([Math.max(WORLD_FLOOR + 2, bottom), Math.max(WORLD_FLOOR + 3, top)]);
  }

  if (!bands.length) return bands;
  bands.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [bands[0]];
  for (let i = 1; i < bands.length; i++) {
    const last = merged[merged.length - 1];
    if (bands[i][0] <= last[1] + 1) last[1] = Math.max(last[1], bands[i][1]);
    else merged.push(bands[i]);
  }
  return merged.filter(band => band[1] > band[0]);
}

/** Release module-level procedural memo state when leaving a world. */
export function clearTerrainCaches() {
  biomeCache.clear();
  heightCache.clear();
  bandCache.clear();
}

export interface Fluid { kind: 'water' | 'blood'; height: number }
export function fluidAt(x: number, z: number, height = terrainHeight(x, z)): Fluid | null {
  if (height >= WATER_HEIGHT) return null;
  const biome = biomeAt(x, z);
  if (biome === 'reef' || biome === 'abyss' || biome === 'deepocean' || biome === 'swamp') return { kind: 'water', height: WATER_HEIGHT };
  if (biome === 'blood') return { kind: 'blood', height: WATER_HEIGHT };
  if (biome === 'taiga' || biome === 'meadow' || biome === 'jungle' || (Math.abs(x) < 12 && Math.abs(z) <= 48)) return { kind: 'water', height: WATER_HEIGHT };
  return null;
}

export function baseKind(x: number, y: number, z: number, height: number, biome: Biome): BlockKind {
  if (y <= WORLD_FLOOR) return 'iron';
  const ore = hash(x + y * 3, z, y + 17);
  const depth = height - y;
  // Below the shallow soil the crust belongs to whichever cave biome owns this stratum.
  if (y <= CAVE_TOP - 4) {
    const cave = caveBiomeAt(x, y, z);
    if (ore > .988) return cave.accent;
    if (ore > .975) return y < -220 ? 'gold' : 'iron';
    if (ore > .962) return 'coal';
    return cave.filler;
  }
  if (biome === 'spiked' && ore > .95) return 'uranium';
  if (ore > (biome === 'taiga' ? .972 : .992) && biome !== 'desert' && biome !== 'blood') return 'gold';
  if (ore > .963 && depth > 2) return 'iron';
  if (biome === 'desert' && depth < 4) return 'sand';
  if (biome === 'desert') return 'sandstone';
  if (biome === 'blood' && depth < 3) return height >= -1 && ore > .4 ? 'salt' : 'red-sand';
  if (biome === 'reef' && depth < 3) return 'sand';
  if (biome === 'alpine') { if (ore > .966 && depth > 2) return 'silver-ore'; if (depth === 0) return height > 58 ? 'snow' : height > 44 && ore > .82 ? 'ice' : 'granite'; return depth < 6 ? 'granite' : 'slate'; }
  if (biome === 'volcanic') { if (depth === 0 && height <= 3) return 'magma'; if (depth === 0) return ore > .88 ? 'sulfur' : 'obsidian'; return depth < 4 ? 'basalt' : ore > .92 ? 'magma' : 'obsidian'; }
  if (biome === 'mushroom') { if (depth < 3) return 'mycelium'; return depth < 7 ? 'stone' : 'stone'; }
  if (biome === 'bone') { if (depth === 0) return ore > .94 ? 'tar' : 'bleached-sand'; return depth < 4 ? 'bleached-sand' : 'bone-block'; }
  if (biome === 'outer') { if (depth === 0) return ore > .9 ? 'scrap-metal' : 'cracked-earth'; return depth < 3 ? 'cracked-earth' : ore > .86 ? 'copper-ore' : 'rust-metal'; }
  if (biome === 'deepocean') { if (ore > .985) return 'sea-lantern'; if (depth === 0) return ore > .6 ? 'prismarine' : 'sand'; return depth < 4 ? 'dark-prismarine' : 'stone'; }
  if (biome === 'glacier') { if (ore > .972 && depth > 2) return 'silver-ore'; if (depth === 0) return height > 70 ? 'snow' : 'blue-ice'; return depth < 8 ? 'packed-ice' : 'stone'; }
  if (biome === 'badlands') { if (ore > .975 && depth > 2) return 'copper-ore'; if (depth === 0) return 'red-stone'; return depth % 4 < 2 ? 'terracotta' : 'red-terracotta'; }
  if (biome === 'savanna') { if (depth === 0) return 'savanna-grass'; return depth < 3 ? 'clay' : 'stone'; }
  if (biome === 'jungle') { if (depth === 0) return 'grass'; return depth < 4 ? 'rich-soil' : 'stone'; }
  if (biome === 'swamp') { if (depth === 0) return height <= 0 ? 'mud' : ore > .5 ? 'grass' : 'mud'; return depth < 4 ? 'mud' : 'clay'; }
  if (biome === 'meadow') { if (depth === 0) return ore > .88 ? 'flowers' : 'grass'; return depth < 4 ? 'rich-soil' : 'stone'; }
  if (biome === 'tundra') { if (depth === 0) return ore > .9 ? 'lichen' : 'frozen-soil'; return depth < 3 ? 'frozen-soil' : 'stone'; }
  if (biome === 'canyon') { if (ore > .977 && depth > 2) return 'copper-ore'; if (depth === 0) return 'layered-stone'; return depth % 5 < 2 ? 'terracotta' : 'layered-stone'; }
  if (biome === 'highlands') { if (ore > .972 && depth > 2) return 'silver-ore'; if (depth === 0) return height > 60 ? 'snow' : ore > .85 ? 'heather' : 'highland-stone'; return depth < 3 ? 'peat' : 'highland-stone'; }
  if (biome === 'crystalcave') { if (ore > .93) return 'amethyst-block'; if (depth === 0) return ore > .8 ? 'crystal-shard' : 'stone'; return depth < 5 ? 'stone' : ore > .9 ? 'amethyst-block' : 'stone'; }
  if (biome === 'abyss' || biome === 'storm' || biome === 'spiked') return 'basalt';
  if (depth === 0 && (biome === 'taiga' && height > 12 || biome === 'sky' && height > 45)) return ore > .97 ? 'ice' : 'snow';
  if (depth === 0 && (biome === 'sinkholes' || biome === 'grove')) return 'moss';
  if (height <= 1 && depth === 0 && biome === 'taiga') return 'sand';
  if (biome === 'clouds' && depth < 2) return 'cloudstone';
  return 'stone';
}

export interface ColumnInfo { height: number; biome: Biome; cave: [number, number] | null; caves: [number, number][]; x: number; z: number; bandsReady: boolean }

/** Bands are expensive (7 strata of noise), so each column computes them once, on first request. */
export function columnBands(column: ColumnInfo): [number, number][] {
  if (!column.bandsReady) {
    column.caves = caveBands(column.x, column.z, column.height, column.biome);
    column.bandsReady = true;
  }
  return column.caves;
}
export interface NaturalBlock { x: number; y: number; z: number; kind: BlockKind }

export function generateFeatures(minX: number, minZ: number, column: (x: number, z: number) => ColumnInfo) {
  const result = new Map<number, NaturalBlock>();
  const maxX = minX + CHUNK_SIZE - 1, maxZ = minZ + CHUNK_SIZE - 1;
  // Most chunks are nowhere near a pylon. Filtering once avoids scanning the
  // entire global pylon network for every leaf, root, and structure block.
  const centerX = minX + CHUNK_SIZE / 2, centerZ = minZ + CHUNK_SIZE / 2;
  const localPylons = PYLONS.filter(pylon => Math.abs(wrapU(pylon.u - centerX)) < CHUNK_SIZE + 28 && Math.abs(pylon.z - centerZ) < CHUNK_SIZE + 28);
  const put = (rawX: number, y: number, z: number, kind: BlockKind, underground = false, protectedFeature = false) => {
    const x = wrapU(Math.round(rawX)); y = Math.round(y); z = Math.round(z);
    const lx = wrapU(x - minX), lz = z - minZ;
    if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE || Math.abs(z) >= HALF_LENGTH) return;
    if (!underground && y <= column(x, z).height) return;
    if (!protectedFeature && localPylons.some(p => Math.abs(wrapU(p.u - x)) < 7 && Math.abs(p.z - z) < 7)) return;
    const key = (y - WORLD_FLOOR) * 256 + lz * 16 + lx;
    if (!result.has(key)) result.set(key, { x, y, z, kind });
  };
  const box = (x: number, y: number, z: number, width: number, height: number, depth: number, kind: BlockKind, protectedFeature = false) => {
    for (let dx = -Math.floor(width / 2); dx < Math.ceil(width / 2); dx++) {
      if (wrapU(x + dx - minX) < 0 || wrapU(x + dx - minX) >= CHUNK_SIZE) continue;
      for (let dz = -Math.floor(depth / 2); dz < Math.ceil(depth / 2); dz++) {
        if (z + dz < minZ || z + dz > maxZ) continue;
        for (let dy = 0; dy < height; dy++) put(x + dx, y + dy, z + dz, kind, false, protectedFeature);
      }
    }
  };
  const anchors = (step: number, reach: number, visit: (x: number, z: number, chance: number) => void) => {
    for (let ax = Math.floor((minX - reach) / step) * step; ax <= maxX + reach; ax += step) {
      for (let az = Math.floor((minZ - reach) / step) * step; az <= maxZ + reach; az += step) {
        const x = ax + Math.floor(hash(wrapU(ax), az, 71) * step * .5);
        const z = az + Math.floor(hash(wrapU(ax), az, 72) * step * .5);
        if (Math.abs(z) >= HALF_LENGTH - 8) continue;
        visit(x, z, hash(wrapU(ax), az, 73));
      }
    }
  };

  const pine = (x: number, z: number, height: number, tall: number, snow: boolean) => {
    for (let dy = 1; dy < tall; dy++) put(x, height + dy, z, 'wood');
    for (let dy = Math.floor(tall * .32); dy <= tall; dy++) {
      const radius = Math.max(0, Math.floor((tall - dy) / 3.6));
      for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
        if (Math.abs(dx) + Math.abs(dz) > radius + 1 || (!dx && !dz && dy < tall)) continue;
        put(x + dx, height + dy, z + dz, snow && (dy === tall || (dy % 4 === 0 && Math.abs(dx) + Math.abs(dz) >= radius)) ? 'snow' : 'leaves');
      }
    }
  };

  // Original small-world trees use their original anchors, so reloads keep local builds intact.
  if (minX < 141 && maxX > -141 && minZ < 51 && maxZ > -51) {
    for (let x = Math.max(-138, Math.floor((minX - 3) / 3) * 3); x <= Math.min(135, maxX + 3); x += 3) {
      for (let z = -44; z < 44; z += 3) {
        if (z < minZ - 3 || z > maxZ + 3) continue;
        const height = legacyHeight(x, z);
        if (height < 2 || hash(x, z, 34) < .77 || (x < -46)) continue;
        if (Math.hypot(x - 13, z - 20) < 12 || PYLONS.some(p => Math.hypot(x - p.u, z - p.z) < 7)) continue;
        const tall = 6 + Math.floor(hash(x, z, 12) * 4);
        for (let y = height + 1; y < height + tall; y++) put(x, y, z, 'wood');
        for (let layer = 0; layer < tall - 2; layer++) {
          const radius = Math.max(0, Math.floor((tall - 1 - layer) / 2.7));
          for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
            if (Math.abs(dx) + Math.abs(dz) > radius + 1 || (!dx && !dz && layer < tall - 3)) continue;
            put(x + dx, height + 3 + layer, z + dz, 'leaves');
          }
        }
      }
    }
    for (let island = 0; island < 9; island++) {
      const x = 53 + Math.floor(hash(island, 5) * 45), z = -37 + Math.floor(hash(island, 11) * 73), h = 21 + Math.floor(hash(island, 8) * 5);
      for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
        if (dx * dx + dz * dz > 11) continue;
        for (let dy = 0; dy < Math.max(1, 4 - Math.abs(dx) - Math.abs(dz)); dy++) put(x + dx, h - dy, z + dz, 'stone');
      }
    }
  }

  anchors(16, 8, (x, z, chance) => {
    const biome = biomeAt(x, z), h = terrainHeight(x, z);
    if (Math.abs(wrapU(x)) <= 142 && Math.abs(z) <= 52) return;
    if (['taiga', 'sinkholes', 'sky'].includes(biome) && h > 2 && chance > (biome === 'sky' ? .53 : .17)) {
      pine(x, z, h, 13 + Math.floor(hash(x, z, 82) * 14), biome === 'sky' || biome === 'taiga');
    }
    if (biome === 'spiked' && chance > .12) {
      const tall = 10 + Math.floor(hash(x, z, 83) * 22);
      for (let y = 1; y <= tall; y++) {
        const r = Math.floor((tall - y) / 10);
        for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) + Math.abs(dz) <= r + 1) put(x + dx, h + y, z + dz, y > tall - 6 || (dx === 0 && dz === 0) ? 'toxic-crystal' : 'basalt');
        }
      }
      put(x + 1, h + 1, z, 'uranium');
      if (chance > .6) box(x + 4, h + 1, z - 3, 1, 9, 1, 'wood');
    }
    if (biome === 'abyss' && h < -20 && chance > .6) {
      const tall = 4 + Math.floor(chance * 8);
      box(x, h + 1, z, 3, tall, 3, 'basalt');
      box(x, h + tall + 1, z, 2, 3, 2, 'abyss-crystal');
    }
    if (biome === 'storm' && chance > .7) {
      box(x, h + 1, z, 2, 4 + Math.floor(chance * 5), 2, 'basalt');
      put(x, h + 10, z, 'storm-glass');
    }
    if ((biome === 'sinkholes' || biome === 'grove') && chance > .4) {
      const range = caveRange(x, z, biome);
      const bottom = range ? range[0] : h;
      for (let dy = 1; dy <= 3; dy++) put(x, bottom + dy, z, 'moss', true);
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
        if (dx * dx + dz * dz < 6) put(x + dx, bottom + 4, z + dz, 'glow-fungus', true);
      }
    }
  });

  anchors(8, 4, (x, z, chance) => {
    if (chance < .25 || biomeAt(x, z) !== 'reef') return;
    const h = terrainHeight(x, z); if (h >= 0 || h < -17) return;
    const color = chance > .65 ? 'violet-coral' : 'rose-coral';
    const tall = Math.min(5 + Math.floor(chance * 3), -h);
    for (let dy = 1; dy <= tall; dy++) {
      put(x, h + dy, z, color);
      if (dy > 2) for (const side of [-1, 1]) { put(x + side, h + dy - 1, z, color); put(x + side * 2, h + dy, z, color); }
      if (dy === tall) for (let dz = -2; dz <= 2; dz++) put(x, h + dy, z + dz, color);
    }
  });

  const island = (x: number, z: number, h: number, radius: number, cloud: boolean, protectedFeature = false) => {
    for (let dx = -radius; dx <= radius; dx++) {
      if (wrapU(x + dx - minX) < 0 || wrapU(x + dx - minX) >= CHUNK_SIZE) continue;
      for (let dz = -radius; dz <= radius; dz++) {
        if (z + dz < minZ || z + dz > maxZ) continue;
        const distance = Math.hypot(dx, dz * 1.13);
        if (distance > radius) continue;
        const depth = Math.max(2, Math.floor((1 - distance / radius) * (cloud ? 7 : 16)));
        for (let dy = 0; dy < depth; dy++) put(x + dx, h - dy, z + dz, cloud || dy < 2 ? 'cloudstone' : 'stone', false, protectedFeature);
      }
    }
    if (!cloud && hash(x, z, 90) > .4) pine(x, z, h, 12, false);
  };
  anchors(64, 24, (x, z, chance) => {
    const biome = biomeAt(x, z);
    if ((biome === 'sky' || biome === 'clouds') && chance > .3 && (Math.abs(wrapU(x)) > 142 || Math.abs(z) > 52)) {
      island(x, z, (biome === 'clouds' ? 100 : 86) + Math.floor(chance * 28), 10 + Math.floor(chance * 11), biome === 'clouds');
    }
  });
  if (Math.abs(wrapU(minX - 560)) < 48 && Math.abs(minZ + 490) < 48) {
    island(560, -490, 104, 14, true, true);
    island(584, -501, 111, 8, true);
    island(543, -519, 117, 9, true);
  }

  const arch = (x: number, z: number) => {
    const h = terrainHeight(x, z);
    box(x - 11, h + 1, z, 5, 18, 5, 'sandstone');
    box(x + 11, h + 1, z, 5, 18, 5, 'sandstone');
    for (let dx = -13; dx <= 13; dx++) {
      const top = h + 15 + Math.floor(Math.sqrt(Math.max(0, 169 - dx * dx)) * .7);
      box(x + dx, top - 3, z, 1, 4, 5, 'sandstone');
    }
  };
  anchors(128, 24, (x, z, chance) => { if (biomeAt(x, z) === 'desert' && chance > .5) arch(x, z); });
  if (Math.abs(wrapU(minX - 439)) < 40 && Math.abs(minZ - 347) < 24) arch(439, 347);

  const giantTree = (x: number, z: number) => {
    const h = terrainHeight(x, z), tall = 62 + Math.floor(hash(x, z, 93) * 20);
    box(x, h + 1, z, 9, tall - 5, 9, 'wood');
    for (const side of [-1, 1]) {
      box(x + side * 8, h + 1, z, 14, 4, 5, 'wood');
      box(x, h + 1, z + side * 8, 5, 4, 14, 'wood');
      box(x + side * 9, h + tall - 14, z, 20, 4, 5, 'wood');
      box(x, h + tall - 10, z + side * 9, 5, 4, 20, 'wood');
    }
    for (const [dx, dz, dy] of [[0, 0, 0], [-13, 0, -8], [13, 2, -6], [0, -12, -5], [1, 12, -7]]) {
      for (let y = 0; y < 13; y++) {
        const radius = 12 - Math.floor(Math.abs(y - 5) * .8);
        box(x + dx, h + tall + dy + y, z + dz, radius * 2, 1, radius * 2, 'leaves');
      }
    }
    for (const level of [25, 43]) {
      for (let dx = -10; dx <= 10; dx++) for (let dz = -10; dz <= 10; dz++) {
        if (Math.abs(dx) <= 4 && Math.abs(dz) <= 4) continue;
        put(x + dx, h + level, z + dz, 'wood');
        if ((Math.abs(dx) === 10 || Math.abs(dz) === 10) && (dx % 3 === 0 || dz % 3 === 0)) put(x + dx, h + level + 1, z + dz, 'wood');
      }
      const hx = x + 7, hz = z + 5;
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 1; dy <= 4; dy++) {
          if (Math.abs(dx) !== 2 && Math.abs(dz) !== 2) continue;
          if (dz === -2 && dx === 0 && dy < 3) continue;
          put(hx + dx, h + level + dy, hz + dz, dy === 3 && (dx === 0 || dz === 0) ? 'storm-glass' : 'wood');
        }
      }
      box(hx, h + level + 5, hz, 7, 1, 7, 'moss');
    }
    for (let step = 1; step <= 44; step++) {
      const side = Math.floor((step - 1) / 10) % 4, t = ((step - 1) % 10) / 9;
      const coordinates = [[-7 + t * 14, -7], [7, -7 + t * 14], [7 - t * 14, 7], [-7, 7 - t * 14]][side];
      box(x + Math.round(coordinates[0]), h + step, z + Math.round(coordinates[1]), 3, 1, 3, 'wood');
    }
  };
  anchors(128, 36, (x, z, chance) => {
    if (biomeAt(x, z) === 'grove' && chance > .25 && Math.hypot(wrapU(x - 84), z - 548) > 70) giantTree(x, z);
  });
  if (Math.abs(wrapU(minX - 84)) < 48 && Math.abs(minZ - 548) < 48) giantTree(84, 548);

  // New biome features: mushrooms, cinder cones, rib arches, and hardy peak pines.
  anchors(22, 10, (x, z, chance) => {
    const biome = biomeAt(x, z), h = terrainHeight(x, z);
    if (biome === 'mushroom' && chance > .42 && h > 1) {
      const tall = 8 + Math.floor(chance * 17), capR = 3 + Math.floor(chance * 4);
      for (let y = 1; y <= tall; y++) put(x, h + y, z, 'mushroom-stem');
      for (let dx = -capR; dx <= capR; dx++) for (let dz = -capR; dz <= capR; dz++) {
        if (dx * dx + dz * dz > capR * capR + 1) continue;
        put(x + dx, h + tall, z + dz, 'mushroom-cap');
        if (dx * dx + dz * dz < 2) put(x + dx, h + tall + 1, z + dz, 'spore-bloom');
      }
    }
    if (biome === 'volcanic' && chance > .58) {
      const tall = 6 + Math.floor(chance * 11);
      for (let y = 1; y <= tall; y++) { const r = Math.floor((tall - y) / 3); for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (dx * dx + dz * dz <= r * r + 1) put(x + dx, h + y, z + dz, y > tall - 2 ? 'magma' : 'obsidian'); }
      put(x, h + tall + 1, z, 'magma');
    }
    if (biome === 'volcanic' && chance > .28 && chance < .36) box(x, h + 1, z, 3, 1, 3, 'sulfur');
    if (biome === 'bone' && chance > .5) {
      for (let dx = -6; dx <= 6; dx++) { const top = h + Math.floor(Math.sqrt(Math.max(0, 36 - dx * dx)) * 2.4); box(x + dx, (h + top) / 2 + 1, z, 1, Math.max(1, top - h), 2, 'bone-block'); }
      put(x, h + 1, z + 3, 'fossil');
    }
    if (biome === 'alpine' && chance > .55 && h > 3 && h < 46) pine(x, z, h, 9 + Math.floor(chance * 6), true);
    if (biome === 'outer' && chance > .55) { box(x, h + 1, z, 1 + Math.floor(chance * 3), 2 + Math.floor(chance * 4), 1, 'scrap-metal'); if (chance > .8) put(x, h + 1, z + 1, 'copper-ore'); }
  });

  // Features for the newest biomes.
  const broadTree = (x: number, z: number, h: number, wood: BlockKind, leaf: BlockKind, tall: number, radius: number, flat: boolean) => {
    for (let y = 1; y <= tall; y++) put(x, h + y, z, wood);
    const crownBase = flat ? tall : Math.floor(tall * .55);
    for (let y = crownBase; y <= tall + (flat ? 1 : 3); y++) {
      const r = flat ? radius : Math.max(1, radius - Math.abs(y - (tall + 1)));
      for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
        if (dx * dx + dz * dz > r * r + 1) continue;
        if (!(dx === 0 && dz === 0 && y <= tall)) put(x + dx, h + y, z + dz, leaf);
      }
    }
  };
  anchors(14, 7, (x, z, chance) => {
    const biome = biomeAt(x, z), h = terrainHeight(x, z);
    if (biome === 'jungle' && chance > .3 && h > 1) {
      broadTree(x, z, h, 'jungle-wood', 'jungle-leaves', 12 + Math.floor(chance * 16), 4 + Math.floor(chance * 3), false);
      if (chance > .5) for (let y = 1; y <= 4 + Math.floor(chance * 6); y++) put(x + 3, h + 10 - y, z, 'vine');
    }
    if (biome === 'savanna' && chance > .58 && h > 1) broadTree(x, z, h, 'acacia-wood', 'jungle-leaves', 6 + Math.floor(chance * 4), 3 + Math.floor(chance * 2), true);
    if (biome === 'meadow' && chance > .62 && h > 1) { if (chance > .82) broadTree(x, z, h, 'wood', 'leaves', 5 + Math.floor(chance * 4), 3, false); else box(x, h + 1, z, 1, 1, 1, 'flowers'); }
    if (biome === 'swamp' && chance > .4 && h > -2) {
      const tall = 7 + Math.floor(chance * 8);
      for (let y = 1; y <= tall; y++) put(x, h + y, z, 'swamp-wood');
      for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (dx * dx + dz * dz <= 9) put(x + dx, h + tall, z + dz, 'jungle-leaves');
      for (let y = 1; y <= 3; y++) put(x + 2, h + tall - y, z, 'hanging-moss');
    }
    if (biome === 'glacier' && chance > .5 && h > 4) {
      const tall = 4 + Math.floor(chance * 12);
      for (let y = 1; y <= tall; y++) { const r = Math.floor((tall - y) / 4); for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (dx * dx + dz * dz <= r * r + 1) put(x + dx, h + y, z + dz, 'blue-ice'); }
    }
    if (biome === 'crystalcave' && chance > .34) {
      const tall = 5 + Math.floor(chance * 16);
      for (let y = 1; y <= tall; y++) { const r = Math.floor((tall - y) / 6); for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (Math.abs(dx) + Math.abs(dz) <= r + 1) put(x + dx, h + y, z + dz, y > tall - 4 || (!dx && !dz) ? 'crystal-shard' : 'amethyst-block'); }
    }
    if (biome === 'tundra' && chance > .78 && h > 1) put(x, h + 1, z, 'lichen');
    if (biome === 'highlands' && chance > .8 && h > 1 && h < 55) put(x, h + 1, z, 'heather');
    if (biome === 'badlands' && chance > .68) { const tall = 3 + Math.floor(chance * 10); box(x, h + 1, z, 2, tall, 2, chance > .85 ? 'red-terracotta' : 'terracotta'); }
    if (biome === 'deepocean' && chance > .3 && h < -6) { for (let y = 1; y <= Math.min(6 + Math.floor(chance * 6), -h - 2); y++) put(x, h + y, z, 'kelp'); }
  });

  // Canyon natural bridges span the gorges.
  anchors(48, 10, (x, z, chance) => {
    if (biomeAt(x, z) !== 'canyon' || chance < .55) return;
    const h = terrainHeight(x, z) + 8 + Math.floor(chance * 14);
    const horizontal = chance > .77;
    for (let t = -9; t <= 9; t++) box(horizontal ? x + t : x, h, horizontal ? z : z + t, 1, 1, 1, 'layered-stone');
  });

  // The outer-sphere circuit: a colossal Socket and a colossal Plug at opposite reaches.
  const socket = (x: number, z: number) => {
    const h = terrainHeight(x, z);
    for (let dx = -7; dx <= 7; dx++) for (let dz = -7; dz <= 7; dz++) { const d = Math.hypot(dx, dz); if (d > 7 || d < 3.4) continue; box(x + dx, h + 1, z + dz, 1, 8, 1, 'rust-metal', true); }
    box(x, h + 1, z, 6, 1, 6, 'circuit', true);
    for (const s of [-1, 1]) { box(x + s * 9, h + 1, z, 2, 13, 2, 'scrap-metal', true); box(x, h + 1, z + s * 9, 2, 13, 2, 'scrap-metal', true); }
    box(x, h + 13, z, 20, 1, 2, 'rust-metal', true); box(x, h + 13, z, 2, 1, 20, 'rust-metal', true);
  };
  const plug = (x: number, z: number) => {
    const h = terrainHeight(x, z);
    box(x, h + 1, z, 3, 10, 3, 'copper-ore', true); box(x, h + 4, z, 5, 1, 5, 'circuit', true);
    box(x, h + 11, z, 6, 3, 6, 'rust-metal', true); box(x, h + 14, z, 2, 6, 2, 'scrap-metal', true);
    for (const s of [-1, 1]) { box(x + s * 2, h + 1, z, 1, 7, 1, 'copper-ore', true); box(x, h + 1, z + s * 2, 1, 7, 1, 'copper-ore', true); }
  };
  if (Math.abs(wrapU(minX - OUTER_SOCKET.u)) < 52 && Math.abs(minZ - OUTER_SOCKET.z) < 52) socket(OUTER_SOCKET.u, OUTER_SOCKET.z);
  if (Math.abs(wrapU(minX - OUTER_PLUG.u)) < 52 && Math.abs(minZ - OUTER_PLUG.z) < 52) plug(OUTER_PLUG.u, OUTER_PLUG.z);
  return result;
}

/**
 * Cave dressing: stalagmites, stalactites, and glowing clusters. Generated separately
 * from surface features and only for bands inside the given depth window, so chunks
 * far above the caves never pay for all seven strata.
 */
export function generateCaveDressing(minX: number, minZ: number, column: (x: number, z: number) => ColumnInfo, windowLo: number, windowHi: number) {
  const result = new Map<number, NaturalBlock>();
  if (windowLo > CAVE_TOP + 20) return result;
  const maxX = minX + CHUNK_SIZE - 1, maxZ = minZ + CHUNK_SIZE - 1;
  const put = (rawX: number, y: number, z: number, kind: BlockKind) => {
    const x = wrapU(Math.round(rawX)); y = Math.round(y); z = Math.round(z);
    const lx = wrapU(x - minX), lz = z - minZ;
    if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE || Math.abs(z) >= HALF_LENGTH) return;
    if (y <= WORLD_FLOOR || y > column(x, z).height) return;
    const key = (y - WORLD_FLOOR) * 256 + lz * 16 + lx;
    if (!result.has(key)) result.set(key, { x, y, z, kind });
  };
  for (let ax = Math.floor((minX - 5) / 11) * 11; ax <= maxX + 5; ax += 11) {
    for (let az = Math.floor((minZ - 5) / 11) * 11; az <= maxZ + 5; az += 11) {
      const x = ax + Math.floor(hash(wrapU(ax), az, 71) * 5), z = az + Math.floor(hash(wrapU(ax), az, 72) * 5);
      if (Math.abs(z) >= HALF_LENGTH - 8) continue;
      const chance = hash(wrapU(ax), az, 73);
      // Anchors may sit just outside this chunk. The chunk only knows its own 16x16
      // columns, so clamp the lookup to the nearest in-chunk column.
      const cx = Math.min(maxX, Math.max(minX, wrapU(x) < minX - CHUNK_SIZE ? x + CIRCUMFERENCE : x));
      const cz = Math.min(maxZ, Math.max(minZ, z));
      const info = column(cx, cz);
      if (!info) continue;
      for (const band of columnBands(info)) {
        if (band[1] - band[0] < 4 || band[1] < windowLo || band[0] > windowHi) continue;
        const cave = caveBiomeAt(x, (band[0] + band[1]) / 2, z);
        const spike = 1 + Math.floor(chance * Math.min(6, (band[1] - band[0]) / 3));
        if (chance > .34) for (let i = 0; i < spike; i++) put(x, band[0] + 1 + i, z, i === spike - 1 && cave.glow > 0 ? cave.accent : cave.filler);
        if (chance > .58) for (let i = 0; i < spike; i++) put(x + 1, band[1] - 1 - i, z, i === spike - 1 && cave.glow > 1 ? cave.accent : cave.filler);
        if (cave.glow > 0 && chance > .46) {
          put(x - 1, band[0] + 1, z + 1, cave.accent);
          if (cave.glow > 1) put(x + 2, band[1] - 1, z - 1, cave.accent);
        }
        if (chance > .88) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
          if (dx * dx + dz * dz <= 5) put(x + dx, band[0] + 1, z + dz, cave.accent);
        }
      }
    }
  }
  return result;
}