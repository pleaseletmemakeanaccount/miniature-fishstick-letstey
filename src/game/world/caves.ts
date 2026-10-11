import { WORLD_FLOOR, wrapU } from './biomes';
import type { BlockKind } from '../data/model';

// The crust is now extremely thick. Caves are organised into deep strata,
// and each stratum hosts its own set of fully subterranean biomes.
export const STRATUM_HEIGHT = 62;
export const CAVE_TOP = -26;
export const STRATA = Math.max(1, Math.floor((CAVE_TOP - (WORLD_FLOOR + 10)) / STRATUM_HEIGHT));

export interface CaveBiomeDefinition {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  filler: BlockKind;
  accent: BlockKind;
  glow: number;
  depth: [number, number];
  danger: string;
  resources: string;
}

// id, name, subtitle, colour, filler, accent, glow(0-2), minStratum, maxStratum, danger, resources
type Row = [string, string, string, string, BlockKind, BlockKind, number, number, number, string, string];

const ROWS: Row[] = [
  ['hollowveins', 'The Hollow Veins', 'SHALLOW LIMESTONE GALLERIES', '#9a9c8b', 'stone', 'iron', 0, 0, 1, 'Loose footing', 'Stone / iron / coal'],
  ['dripstonehall', 'Dripstone Hall', 'STALACTITE CATHEDRAL', '#a99c86', 'dripstone', 'stone', 0, 0, 2, 'Falling spires', 'Dripstone / clay'],
  ['glowwormgrotto', 'Glowworm Grotto', 'CEILINGS FULL OF SOFT LIGHT', '#7fd8c0', 'stone', 'glow-fungus', 2, 0, 1, 'None to speak of', 'Glow fungus / moss'],
  ['mossgarden', 'The Moss Garden', 'GREEN UNDERGROWTH WITHOUT SUN', '#6f9a5c', 'moss', 'glow-moss', 1, 0, 1, 'Slippery stone', 'Moss / glow moss / clay'],
  ['lichenhollow', 'Lichen Hollow', 'PALE CRUSTS ON COLD ROCK', '#9aa891', 'stone', 'lichen', 0, 0, 2, 'Cold draughts', 'Lichen / stone'],
  ['rootcellar', 'The Root Cellar', 'THE UNDERSIDE OF THE GREAT TREES', '#7b5f3c', 'rich-soil', 'wood', 0, 0, 1, 'Tangling roots', 'Heartwood / soil / amber'],
  ['buriedgrove', 'The Buried Grove', 'A FOREST THAT SANK', '#5f7a48', 'rich-soil', 'jungle-leaves', 1, 0, 2, 'Rotten ground', 'Wood / leaves / vines'],
  ['minetunnels', 'The Abandoned Workings', 'SOMEONE DUG HERE FIRST', '#8b7a5c', 'stone', 'planks', 0, 0, 2, 'Collapsing props', 'Planks / iron / scrap'],
  ['claypits', 'The Clay Pits', 'SOFT WET STRATA', '#a98f76', 'clay', 'mud', 0, 0, 1, 'Sinking mud', 'Clay / mud / brick'],
  ['saltcathedral', 'The Salt Cathedral', 'WHITE VAULTS OF MINERAL', '#e0d6be', 'salt', 'chalk', 1, 0, 2, 'Thirst and dry air', 'Salt / chalk'],
  ['chalkmaze', 'The Chalk Maze', 'WHITE WALLS THAT ALL LOOK ALIKE', '#e2ddc9', 'chalk', 'flint' as BlockKind, 0, 0, 2, 'Easy to lose your way', 'Chalk / flint'],
  ['undergroundriver', 'The Underground River', 'COLD WATER IN THE DARK', '#6f9fb0', 'stone', 'prismarine', 0, 1, 3, 'Fast water and drowning', 'Prismarine / clay / pearl'],
  ['floodedgallery', 'The Flooded Gallery', 'DROWNED HALLS', '#4f7f92', 'dark-prismarine', 'sea-lantern', 1, 1, 3, 'Drowning', 'Prismarine / sea lanterns'],
  ['sunkengrotto', 'The Sunken Grotto', 'STILL, GLASSY POOLS', '#5f9a9a', 'prismarine', 'shell', 1, 1, 3, 'Deep water', 'Shell / pearl / coral'],
  ['drownedhall', 'The Drowned Hall', 'A ROOM THE WATER TOOK', '#3f6f80', 'dark-prismarine', 'kelp', 0, 2, 4, 'Drowning and cold', 'Kelp / prismarine'],
  ['fungalbloom', 'The Fungal Bloom', 'CAPS THE SIZE OF HOUSES', '#b5638f', 'mycelium', 'mushroom-cap', 2, 1, 3, 'Thick spores', 'Mushroom / mycelium'],
  ['sporegarden', 'The Spore Garden', 'A SLOW VIOLET SNOWFALL', '#a97fc4', 'mycelium', 'spore-bloom', 2, 1, 3, 'Spore clouds', 'Spore bloom / mycelium'],
  ['myceliumweb', 'The Mycelium Web', 'THREADS THROUGH EVERY WALL', '#8a7a96', 'mycelium', 'glow-fungus', 1, 1, 3, 'Soft, unstable floors', 'Mycelium / fungus'],
  ['mushroomcity', 'The Mushroom City', 'STACKED CAPS LIKE ROOFTOPS', '#c07a9a', 'mushroom-stem', 'mushroom-cap', 2, 2, 4, 'Long falls between caps', 'Mushroom stem / caps'],
  ['ambercave', 'The Amber Cave', 'GOLDEN RESIN, ANCIENT AND WARM', '#d59a4a', 'stone', 'amber', 2, 1, 3, 'Sticky resin', 'Amber / resin'],
  ['goldlode', 'The Gold Lode', 'A SEAM THAT WILL NOT END', '#c8b266', 'stone', 'gold', 1, 1, 4, 'Greed', 'Native gold / quartz'],
  ['silverseam', 'The Silver Seam', 'BRIGHT METAL IN GREY ROCK', '#c3c8cb', 'granite', 'silver-ore', 1, 1, 4, 'Sharp scree', 'Silver / granite'],
  ['copperwarren', 'The Copper Warren', 'GREEN-VEINED TUNNELS', '#b5764a', 'stone', 'copper-ore', 0, 1, 3, 'Narrow crawls', 'Copper / clay'],
  ['ironcatacomb', 'The Iron Catacomb', 'RUST AND ORDERLY GRAVES', '#a08573', 'deepslate', 'iron', 0, 1, 4, 'Restless skeletons', 'Iron / bone'],
  ['coalmeasures', 'The Coal Measures', 'BLACK SEAMS AND OLD FORESTS', '#3a3a37', 'shale', 'coal', 0, 1, 3, 'Choking dust', 'Coal / shale'],
  ['quartzhall', 'The Quartz Hall', 'MILK-WHITE COLUMNS', '#e3e2d8', 'quartz', 'crystal-block', 2, 2, 4, 'Blinding reflections', 'Quartz / crystal'],
  ['crystalvault', 'The Crystal Vault', 'A ROOM GROWN FROM LIGHT', '#a8d8e0', 'stone', 'crystal-shard', 2, 2, 5, 'Razor crystal', 'Crystal / geodes'],
  ['amethystgeode', 'The Amethyst Geode', 'INSIDE A HOLLOW STONE', '#9b7cc0', 'amethyst-block', 'crystal-shard', 2, 2, 5, 'Sharp facets', 'Amethyst / crystal'],
  ['geodefields', 'The Geode Fields', 'PLAIN OUTSIDE, IMPOSSIBLE WITHIN', '#8a94a0', 'stone', 'geode', 1, 2, 4, 'Unstable shells', 'Geodes / gems'],
  ['marblecatacomb', 'The Marble Catacomb', 'VEINED WHITE PASSAGES', '#d7d6cc', 'marble', 'quartz', 1, 2, 4, 'Echoing dark', 'Marble / quartz'],
  ['emeraldfissure', 'The Emerald Fissure', 'A GREEN CRACK IN THE DEEP', '#4fa774', 'deepslate', 'jade', 1, 3, 5, 'Sheer drops', 'Emerald / jade'],
  ['rubychamber', 'The Ruby Chamber', 'FROZEN FIRE IN THE WALLS', '#c1544f', 'deepslate', 'ember', 2, 3, 5, 'Heat and sharp stone', 'Ruby / ember'],
  ['sapphiredeep', 'The Sapphire Deep', 'BLUE LIGHT WITHOUT A SOURCE', '#5a7bc4', 'deepslate', 'abyss-crystal', 2, 3, 6, 'Cold and pressure', 'Sapphire / crystal'],
  ['opalcave', 'The Opal Cave', 'IT CANNOT DECIDE ON A COLOUR', '#c7c6d6', 'marble', 'crystal-block', 2, 3, 5, 'Disorienting light', 'Opal / crystal'],
  ['diamondhollow', 'The Diamond Hollow', 'THE HARDEST ROOM IN THE WORLD', '#cfe4e6', 'deepslate', 'crystal-block', 2, 4, 6, 'Deep and far from air', 'Diamond / crystal'],
  ['lavatube', 'The Lava Tube', 'A PIPE CUT BY MOLTEN STONE', '#a8603f', 'basalt', 'magma', 2, 1, 4, 'Magma burns', 'Basalt / magma'],
  ['magmacore', 'The Magma Core', 'THE ROCK IS STILL MOVING', '#c25a34', 'basalt', 'magma', 2, 3, 6, 'Severe burns', 'Magma / obsidian'],
  ['sulfurvent', 'The Sulfur Vents', 'YELLOW CRUST AND BAD AIR', '#cbbf5c', 'basalt', 'sulfur', 1, 2, 4, 'Toxic fumes', 'Sulfur / basalt'],
  ['obsidianrift', 'The Obsidian Rift', 'BLACK GLASS, EDGE TO EDGE', '#2f2b3a', 'obsidian', 'ember', 1, 3, 6, 'Cutting glass', 'Obsidian / shards'],
  ['cinderhollow', 'The Cinder Hollow', 'WARM ASH UNDERFOOT', '#6a655e', 'ash', 'ember', 1, 2, 4, 'Choking ash', 'Ash / ember / coal'],
  ['emberdepths', 'The Ember Depths', 'IT NEVER QUITE GOES OUT', '#d97b45', 'basalt', 'ember', 2, 3, 6, 'Constant heat', 'Ember / obsidian'],
  ['frostcavern', 'The Frost Cavern', 'BREATH HANGS IN THE AIR', '#a7c8d6', 'packed-ice', 'ice', 1, 1, 3, 'Deep cold', 'Ice / permafrost'],
  ['icelabyrinth', 'The Ice Labyrinth', 'BLUE WALLS THAT REPEAT', '#7fb6d6', 'blue-ice', 'packed-ice', 1, 2, 4, 'Cold and easy to lose', 'Blue ice / silver'],
  ['permafrostvault', 'The Permafrost Vault', 'SOIL THAT FORGOT HOW TO THAW', '#a8bcc0', 'permafrost', 'frozen-soil', 0, 1, 3, 'Freezing exposure', 'Permafrost / ice'],
  ['bonepit', 'The Bone Pit', 'EVERYTHING THAT FELL IN', '#d8d2b8', 'bone-block', 'fossil', 0, 1, 3, 'Skeletons', 'Bone / fossil'],
  ['fossilbed', 'The Fossil Bed', 'STONE THAT KEPT THEIR SHAPE', '#b8b394', 'shale', 'fossil', 0, 1, 4, 'Brittle floors', 'Fossil / shale'],
  ['ossuarydeep', 'The Deep Ossuary', 'ORDERED RANKS OF THE DEAD', '#cbc7ad', 'bone-block', 'chalk', 1, 2, 5, 'Restless dead', 'Bone / relics'],
  ['tarsumps', 'The Tar Sumps', 'BLACK, SLOW, AND PATIENT', '#26241f', 'tar', 'shale', 0, 1, 3, 'Tar traps', 'Tar / coal'],
  ['tombcomplex', 'The Forgotten Tombs', 'DOORS NOBODY OPENED', '#a89768', 'sandstone', 'gold', 1, 2, 4, 'Old defences', 'Gold / relics / coin'],
  ['buriedcity', 'The Buried City', 'STREETS BENEATH THE STONE', '#9a8d74', 'brick', 'lantern-block', 1, 2, 5, 'Unstable ruins', 'Brick / relics'],
  ['machinehalls', 'The Machine Halls', 'SOMETHING WAS BUILT DOWN HERE', '#8f8577', 'scrap-metal', 'circuit', 2, 3, 5, 'Live circuits', 'Scrap / circuit / gear'],
  ['circuitdepths', 'The Circuit Depths', 'A CURRENT STILL RUNNING', '#6fc79a', 'rust-metal', 'circuit', 2, 4, 6, 'Discharge', 'Circuit / copper'],
  ['rustwarren', 'The Rust Warren', 'METAL EATING ITSELF', '#a06a49', 'rust-metal', 'scrap-metal', 0, 2, 4, 'Sharp rusted edges', 'Rust / scrap'],
  ['echochamber', 'The Echo Chamber', 'IT REPEATS EVERYTHING', '#8f97a8', 'echo-stone', 'deepslate', 1, 2, 5, 'Disorientation', 'Echo stone'],
  ['whisperinghollow', 'The Whispering Hollow', 'YOU ARE ALMOST SURE IT IS WIND', '#7c8494', 'deepslate', 'echo-stone', 1, 3, 5, 'Something is talking', 'Echo stone / deepslate'],
  ['screamingfissure', 'The Screaming Fissure', 'A CRACK THAT NEVER STOPS', '#6b6f80', 'deepslate', 'void-stone', 1, 4, 6, 'Noise and vertigo', 'Void stone'],
  ['windtunnels', 'The Howling Tunnels', 'AIR MOVING FROM SOMEWHERE', '#94a0a6', 'stone', 'shale', 0, 1, 4, 'Buffeting wind', 'Shale / stone'],
  ['shadowdepths', 'The Shadow Depths', 'LIGHT DOES NOT CARRY HERE', '#3a3f4a', 'deepslate', 'void-stone', 0, 4, 6, 'Total darkness', 'Void stone / deepslate'],
  ['blackglass', 'The Black Glass', 'A FLOOR LIKE STILL WATER', '#2b2b38', 'obsidian', 'void-stone', 0, 4, 6, 'No grip, no light', 'Obsidian / void stone'],
  ['silentabyss', 'The Silent Abyss', 'NO ECHO COMES BACK', '#26303a', 'void-stone', 'abyss-crystal', 1, 5, 6, 'Bottomless drops', 'Void stone / crystal'],
  ['voidpocket', 'The Void Pocket', 'A HOLE WHERE ROCK SHOULD BE', '#2f3340', 'void-stone', 'crystal-shard', 1, 5, 6, 'Falling forever', 'Void stone'],
  ['nullchamber', 'The Null Chamber', 'THE GEOMETRY IS WRONG', '#4a4458', 'void-stone', 'echo-stone', 1, 5, 6, 'Spatial confusion', 'Void stone / echo'],
  ['bloodwell', 'The Blood Well', 'A RED SPRING, FAR TOO DEEP', '#9c4750', 'red-stone', 'blood-crystal', 2, 3, 6, 'Blood mist', 'Blood crystal / blood'],
  ['crimsonhollow', 'The Crimson Hollow', 'EVERYTHING HERE IS RED', '#a35a4f', 'red-terracotta', 'blood-crystal', 2, 3, 5, 'Heat and haze', 'Blood crystal / terracotta'],
  ['thecradle', 'The Cradle', 'THE DEEPEST ROOM THERE IS', '#c9c2a4', 'void-stone', 'crystal-block', 2, 6, 6, 'Whatever sleeps here', 'Everything, and a seed'],
];

export const CAVE_BIOMES: Record<string, CaveBiomeDefinition> = Object.fromEntries(ROWS.map(row => [row[0], {
  id: row[0], name: row[1], subtitle: row[2], color: row[3], filler: row[4], accent: row[5],
  glow: row[6], depth: [row[7], row[8]] as [number, number], danger: row[9], resources: row[10],
}]));
export const CAVE_IDS = ROWS.map(row => row[0]);
export const CAVE_COUNT = CAVE_IDS.length;

// Which biomes may occupy each stratum, precomputed for fast lookup.
const BY_STRATUM: string[][] = [];
for (let s = 0; s <= 6; s++) BY_STRATUM[s] = CAVE_IDS.filter(id => CAVE_BIOMES[id].depth[0] <= s && CAVE_BIOMES[id].depth[1] >= s);

const cellHash = (x: number, z: number, seed: number) => {
  const n = Math.sin(x * 341.7 + z * 611.3 + seed * 97.1) * 29517.531;
  return n - Math.floor(n);
};

export const stratumOf = (y: number) => Math.max(0, Math.min(6, Math.floor((CAVE_TOP - y) / STRATUM_HEIGHT)));

/** Every cave biome is a large horizontal cell inside one deep stratum. */
export function caveBiomeAt(u: number, y: number, z: number): CaveBiomeDefinition {
  const stratum = stratumOf(y);
  const pool = BY_STRATUM[stratum].length ? BY_STRATUM[stratum] : CAVE_IDS;
  const cellX = Math.floor(wrapU(u) / 140), cellZ = Math.floor(z / 140);
  const pick = Math.floor(cellHash(cellX, cellZ, stratum * 7 + 3) * pool.length);
  return CAVE_BIOMES[pool[Math.min(pool.length - 1, pick)]];
}
