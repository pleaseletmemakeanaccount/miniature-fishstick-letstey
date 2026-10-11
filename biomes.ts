export const CIRCUMFERENCE = 3072;
export const HALF_LENGTH = 896;
export const RADIUS = CIRCUMFERENCE / (2 * Math.PI);
export const DIAMETER = RADIUS * 2;
export const WORLD_FLOOR = -520;
export const WORLD_CEILING = Math.floor(RADIUS - 40);
export const WATER_HEIGHT = 1;
export const CHUNK_SIZE = 16;
export const SURFACE_AREA = CIRCUMFERENCE * HALF_LENGTH * 2;

export type Biome = 'taiga' | 'sinkholes' | 'sky' | 'clouds' | 'reef' | 'abyss' | 'broken' | 'spiked' | 'storm' | 'desert' | 'blood' | 'grove' | 'alpine' | 'volcanic' | 'mushroom' | 'bone' | 'outer'
  | 'deepocean' | 'glacier' | 'badlands' | 'savanna' | 'jungle' | 'swamp' | 'meadow' | 'tundra' | 'canyon' | 'highlands' | 'crystalcave';
export type Weather = 'snow' | 'mist' | 'clear' | 'rain' | 'dust' | 'spores' | 'ash';

export interface BiomeDefinition {
  name: string;
  shortName: string;
  subtitle: string;
  description: string;
  color: string;
  ground: string;
  sky: string;
  night: string;
  fog: number;
  temperature: number;
  weather: Weather;
  danger: string;
  resources: string;
  tip: string;
  seed: [number, number];
}

export const BIOMES: Record<Biome, BiomeDefinition> = {
  taiga: {
    name: 'The Endless Taiga', shortName: 'Taiga', subtitle: 'SNOWBOUND CONIFER RING',
    description: 'Tall pines climb the curve of the world. Snow settles over gold-bearing ridges, and a silver river threads between the roots.',
    color: '#94ad96', ground: '#789077', sky: '#b9c6ba', night: '#26382f', fog: .0028, temperature: -12, weather: 'snow',
    danger: 'Cold at high elevations', resources: 'Heartwood / snow / ice / native gold', tip: 'The Hearth is a safe starting point. Follow the river, or open the atlas with M.', seed: [0, 0],
  },
  sinkholes: {
    name: 'The Hollow Reaches', shortName: 'Sinkholes', subtitle: 'COLLAPSED FOREST / DEEP CAVERNS',
    description: 'The floor gives way to immense circular sinkholes. Beneath the forest, linked caverns glow with strange fungi and exposed metal seams.',
    color: '#79978a', ground: '#596e55', sky: '#93a893', night: '#1c3029', fog: .004, temperature: 7, weather: 'mist',
    danger: 'Deep falls and cave darkness', resources: 'Moss / glow fungi / iron / stone', tip: 'Watch your footing. The shafts open into real, mineable caves. Hold Space to soften a fall.', seed: [-280, 190],
  },
  sky: {
    name: 'The Sky Ring', shortName: 'Sky Ring', subtitle: 'ALPINE RIDGES / FLOATING ISLANDS',
    description: 'Mountains reach toward the axis. Beyond their summits, entire shelves of rock float free, carrying tiny forests into the light.',
    color: '#a9bbcd', ground: '#9ba798', sky: '#c1d2d8', night: '#263443', fog: .0016, temperature: -22, weather: 'snow',
    danger: 'Exposure and long falls', resources: 'Cloudstone / ice / iron / highland wood', tip: 'The High Aerie pylon lands on an alpine ledge. Creative flight has a fast cruise mode: hold Q.', seed: [335, -220],
  },
  clouds: {
    name: 'The Cloud Nests', shortName: 'Cloud Nests', subtitle: 'UPPER ATMOSPHERE / LOST ROOSTS',
    description: 'Luminous, lumpy cloud platforms drift above a sea of vapor. Follow their stepping stones to an abandoned nest and its forgotten cache.',
    color: '#d2cfe1', ground: '#b4b7cd', sky: '#d3d2df', night: '#38344b', fog: .0025, temperature: -28, weather: 'mist',
    danger: 'Cold exposure and exposed drops', resources: 'Cloudstone / mothsilk / nest relics', tip: 'Cloudrest is on a solid floating platform. Its nearby nest contains a one-time supply cache.', seed: [590, -540],
  },
  reef: {
    name: 'The Prismatic Reefs', shortName: 'Coral Reefs', subtitle: 'SHALLOW OCEAN / LIVING COLOR',
    description: 'Turquoise shallows reveal branching pink, orange, and violet coral. Bright fish trace the shelves between pale limestone islands.',
    color: '#58b9b5', ground: '#b6c1a1', sky: '#a8d4d0', night: '#153e43', fog: .0019, temperature: 24, weather: 'clear',
    danger: 'Drowning beyond the shelf', resources: 'Rose coral / violet coral / sand / water', tip: 'Hold Space to surface. Hold Ctrl, or use the Dive touch button, to swim down. Watch your air.', seed: [-200, -325],
  },
  abyss: {
    name: 'The Abyssal Ocean', shortName: 'Abyss', subtitle: 'BLACK TRENCHES / HIGH PRESSURE',
    description: 'The seafloor falls away into darkness. Basalt chimneys and cold blue crystals mark trenches more than forty blocks beneath the surface.',
    color: '#497b9b', ground: '#30485b', sky: '#789cac', night: '#102331', fog: .0026, temperature: 3, weather: 'mist',
    danger: 'Drowning and crushing pressure', resources: 'Basalt / abyss crystals / iron', tip: 'Deepwatch is a safe island. Dive in short trips; pressure becomes dangerous below 28 blocks.', seed: [-570, -570],
  },
  broken: {
    name: 'The Broken Lands', shortName: 'Broken Lands', subtitle: 'FARLANDS / GEOMETRIC FAILURE',
    description: 'Parallel walls and impossible strips of stone rise from fractured terraces. The land repeats, skips, and occasionally forgets to exist.',
    color: '#a5a184', ground: '#7f8271', sky: '#a5a38c', night: '#32362a', fog: .0025, temperature: 11, weather: 'dust',
    danger: 'Sheer trenches and OBIL', resources: 'Weathered stone / basalt / gold', tip: 'The original Fracture and OBIL remain at their familiar coordinates. Beware the expanding fault lines.', seed: [-205, -65],
  },
  spiked: {
    name: 'The Spiked Forest', shortName: 'Spiked Forest', subtitle: 'IRRADIATED CRYSTAL WILDERNESS',
    description: 'Lime-green crystal spires pierce a field of dark, mineralized trees. The air shimmers with radioactive dust and an uncomfortable warmth.',
    color: '#bbcc68', ground: '#657250', sky: '#b0bd79', night: '#29341c', fog: .0035, temperature: 31, weather: 'spores',
    danger: 'Proximity radiation', resources: 'Uranium / toxic crystal / basalt', tip: 'Radiation rises near the crystals, not just when you look at them. The pylon clearing is sheltered.', seed: [-655, 65],
  },
  storm: {
    name: 'The Storm Fields', shortName: 'Storm Fields', subtitle: 'RAIN WALLS / TRAVELING VORTICES',
    description: 'Rain sweeps across enormous basalt plateaus. Traveling tornadoes pull at the world, tearing out blocks and throwing them back through the air.',
    color: '#9294b3', ground: '#666d79', sky: '#737f91', night: '#262838', fog: .004, temperature: 9, weather: 'rain',
    danger: 'Tornado lift and flying debris', resources: 'Basalt / storm glass / iron', tip: 'Give each funnel a wide berth. Stones torn free by the wind settle back into the editable world.', seed: [835, -65],
  },
  desert: {
    name: 'The Pale Expanse', shortName: 'Desert', subtitle: 'SAND SEAS / ERODED MONOLITHS',
    description: 'Dunes roll for hundreds of blocks beneath a copper sky. Sandstone arches stand where an older landscape once held itself together.',
    color: '#d6b477', ground: '#c4ab78', sky: '#d9bd94', night: '#4a392c', fog: .0022, temperature: 43, weather: 'dust',
    danger: 'Heat and faster thirst loss', resources: 'Falling sand / sandstone / salt', tip: 'Carry water. Sand obeys gravity, including the dunes you mine out from underneath.', seed: [440, 345],
  },
  blood: {
    name: 'The Sanguine Shores', shortName: 'Blood Shores', subtitle: 'DENSE RED OCEAN / SALT FLATS',
    description: 'An ocean of liquid blood pulses between rust-colored islands. White salt crusts edge its shores. Nothing here is safe to drink.',
    color: '#c57d74', ground: '#9d6857', sky: '#c39887', night: '#41242b', fog: .0028, temperature: 35, weather: 'dust',
    danger: 'Blood slows movement; no fresh water', resources: 'Liquid blood / red sand / salt', tip: 'Press R at the shoreline to collect blood. It is a material, not a substitute for spring water.', seed: [740, 565],
  },
  grove: {
    name: 'The Rootbound Cities', shortName: 'Giant Groves', subtitle: 'ANCIENT MEGATREES / CANOPY RUINS',
    description: 'Trees taller than mountains carry wooden balconies, bridges, and the quiet remnants of canopy settlements. Green light filters through their enormous crowns.',
    color: '#81ad79', ground: '#617b4c', sky: '#a3bd89', night: '#243825', fog: .0028, temperature: 25, weather: 'spores',
    danger: 'Great heights in the canopy', resources: 'Heartwood / moss / glow fungi / leaves', tip: 'Rootspire opens beneath a giant tree. The canopy structures are real voxels you can explore and reshape.', seed: [45, 555],
  },
  alpine: {
    name: 'The Titan Range', shortName: 'Mountains', subtitle: 'COLOSSAL PEAKS / GRANITE AND ICE',
    description: 'The largest mountains in the world claw toward the central axis. Granite shoulders and slate cliffs disappear into permanent snow, and glaciers hang in the passes between summits.',
    color: '#b6c2c9', ground: '#8f9ba2', sky: '#c4d0d6', night: '#232f39', fog: .0015, temperature: -33, weather: 'snow',
    danger: 'Severe cold and immense falls', resources: 'Granite / slate / permafrost / silver / ice', tip: 'The Summit pylon lands near the highest peak. Bring cloth against the cold, and mind the drop.', seed: [-430, 400],
  },
  volcanic: {
    name: 'The Cinder Wastes', shortName: 'Volcanic', subtitle: 'LAVA FIELDS / ASH AND OBSIDIAN',
    description: 'Cracked black plains glow from beneath. Cinder cones vent ash into a rust-red sky, and rivers of magma cut through fields of obsidian and sulfur.',
    color: '#8f5648', ground: '#48342e', sky: '#6f4941', night: '#281310', fog: .0038, temperature: 74, weather: 'ash',
    danger: 'Magma burns and falling ash', resources: 'Obsidian / magma / sulfur / ash / iron', tip: 'Magma scorches anything nearby, placed or natural. The Cinder pylon clearing is cooled stone.', seed: [975, -445],
  },
  mushroom: {
    name: 'The Sporehollow Marsh', shortName: 'Mushroom Marsh', subtitle: 'BIOLUMINESCENT FUNGAL WETLAND',
    description: 'Giant caps glow violet and teal over a soft, humming marsh. Mycelium threads every surface, and the ground breathes a faint luminous mist.',
    color: '#9a7bb0', ground: '#584a63', sky: '#7c6a86', night: '#241a2e', fog: .0042, temperature: 19, weather: 'spores',
    danger: 'Soft ground and drifting spores', resources: 'Mushroom caps / mycelium / spore bloom / glow fungi', tip: 'Sporehollow glows even at night. The giant caps are climbable, editable voxels.', seed: [-885, 470],
  },
  bone: {
    name: 'The Ossuary Flats', shortName: 'Bonefields', subtitle: 'DESOLATE GRAVEYARD PLAIN',
    description: 'A pale, cracked plain studded with colossal ribs and fossils. Tar pits glisten between bleached dunes, and nothing living stays here for long.',
    color: '#cbc7ad', ground: '#b1ab8c', sky: '#c2bda2', night: '#37342a', fog: .003, temperature: 22, weather: 'dust',
    danger: 'Tar pits and restless skeletons', resources: 'Bone / fossil / tar / bleached sand', tip: 'The Ossuary pylon is a rib-cage arch. Skeletons roam the flats after dark.', seed: [235, -560],
  },
  outer: {
    name: 'The Outer Desert Sphere', shortName: 'Outer Sphere', subtitle: 'DESOLATE PLANET / THE SOCKET AND PLUG',
    description: 'Across a hyper-distant threshold lies a separate, dead world: an endless cracked desert of rust and dust. At its far reaches stand the Socket and the Plug, a vast circuit waiting to be connected.',
    color: '#c9a878', ground: '#a98f63', sky: '#c9a482', night: '#3c2e20', fog: .0026, temperature: 41, weather: 'dust',
    danger: 'Total desolation; extreme thirst', resources: 'Cracked earth / rust / scrap / copper / circuitry', tip: 'The Threshold pylon sits between the Socket and the Plug. Drag the Plug to the Socket to complete the circuit.', seed: [-955, -175],
  },
  deepocean: {
    name: 'The Sunless Deep', shortName: 'Deep Ocean', subtitle: 'OPEN OCEAN / LEVIATHAN WATERS',
    description: 'A vast, open ocean with no shore in sight. Kelp forests sway over drowned ridges, and something enormous moves in the dark below.',
    color: '#2f6f8c', ground: '#274a55', sky: '#6f9aae', night: '#0d2430', fog: .0032, temperature: 8, weather: 'mist',
    danger: 'Deep drowning and crushing pressure', resources: 'Kelp / prismarine / pearl / driftwood', tip: 'The Trawl pylon floats on a raft. Dive for pearls, but keep an eye on your air and the depths.', seed: [-1290, -470],
  },
  glacier: {
    name: 'The Glacier Crown', shortName: 'Glacier', subtitle: 'FROZEN MOUNTAINS / BLUE ICE',
    description: 'Colossal blue-ice mountains split the sky. Frozen waterfalls hang mid-fall, and crevasses run deeper than the light can follow.',
    color: '#a7c8d6', ground: '#8fb0c0', sky: '#c6dae2', night: '#1f2f3b', fog: .0018, temperature: -41, weather: 'snow',
    danger: 'Extreme cold and hidden crevasses', resources: 'Packed ice / blue ice / permafrost / silver', tip: 'The Rime pylon is cut into a glacier. Cloth slows the cold; the peaks are enormous.', seed: [-1210, 300],
  },
  badlands: {
    name: 'The Ochre Badlands', shortName: 'Badlands', subtitle: 'BANDED MESAS / RED STONE TOWERS',
    description: 'Layered mesas rise in bands of rust, ochre, and bone. Hoodoos stand like watchers over a cracked, sun-baked basin.',
    color: '#c07648', ground: '#a75f3c', sky: '#d1946a', night: '#3a221a', fog: .0024, temperature: 46, weather: 'dust',
    danger: 'Heat, thirst, and sheer drops', resources: 'Terracotta / red stone / copper / gold', tip: 'The Mesa pylon crowns a flat butte. The banded towers are climbable and mineable.', seed: [1290, 250],
  },
  savanna: {
    name: 'The Amber Savanna', shortName: 'Savanna', subtitle: 'DRY GRASSLAND / LONE TREES',
    description: 'Endless golden grass rolls under a wide sky, broken only by flat-topped acacia and the occasional watering hole.',
    color: '#c3b168', ground: '#a89a52', sky: '#cdc389', night: '#332e1c', fog: .0022, temperature: 33, weather: 'clear',
    danger: 'Heat and grassland predators', resources: 'Savanna grass / acacia wood / clay / gold', tip: 'The Acacia pylon shelters under a lone tree. Good, open land for a first farm.', seed: [1150, -260],
  },
  jungle: {
    name: 'The Verdant Reach', shortName: 'Jungle', subtitle: 'DENSE RAINFOREST / CANOPY LAYERS',
    description: 'A riot of green. Broad-leafed giants tangle overhead while vines, ferns, and bright flowers crowd every inch of the humid floor.',
    color: '#4f8a4a', ground: '#3d6b38', sky: '#8fb87f', night: '#16281a', fog: .0044, temperature: 30, weather: 'spores',
    danger: 'Dense cover; easy to get lost', resources: 'Jungle wood / vines / cocoa / emerald', tip: 'The Canopy pylon rests on a jungle platform. The layered leaves are fully editable.', seed: [-1100, -620],
  },
  swamp: {
    name: 'The Mirewater', shortName: 'Swamp', subtitle: 'MURKY WETLAND / HANGING MOSS',
    description: 'Still, dark water threads between the knees of drowned trees. Hanging moss drips, and mist never fully lifts from the mire.',
    color: '#6b7a52', ground: '#4c5738', sky: '#8c9877', night: '#1c2419', fog: .005, temperature: 21, weather: 'mist',
    danger: 'Sinking mud and murk', resources: 'Swamp wood / mud / hanging moss / clay', tip: 'The Mire pylon stands on stilts. The water is shallow, but the mud is slow.', seed: [1310, -560],
  },
  meadow: {
    name: 'The Sunlit Meadow', shortName: 'Meadow', subtitle: 'FLOWER FIELDS / GENTLE HILLS',
    description: 'Soft green hills scattered with wildflowers and tall grass. The mildest, kindest ground in the whole cylinder.',
    color: '#8fbb6a', ground: '#6f9a4f', sky: '#b7d29a', night: '#25341e', fog: .002, temperature: 17, weather: 'clear',
    danger: 'None to speak of', resources: 'Rich soil / flowers / grain / hay', tip: 'The Bloom pylon sits in a field of flowers. The best soil for farming is here.', seed: [1050, 570],
  },
  tundra: {
    name: 'The Pale Tundra', shortName: 'Tundra', subtitle: 'FROZEN PLAINS / LICHEN AND STONE',
    description: 'A flat, wind-scoured plain of frozen soil and grey lichen. Nothing grows tall where the wind never rests.',
    color: '#b6c4bd', ground: '#8f9d97', sky: '#c3ccc6', night: '#242c2b', fog: .0026, temperature: -19, weather: 'snow',
    danger: 'Cold and biting wind', resources: 'Frozen soil / lichen / stone / iron', tip: 'The Lichen pylon is a low cairn. Bleaner than the taiga, and colder.', seed: [-1050, -560],
  },
  canyon: {
    name: 'The Riven Canyon', shortName: 'Canyon', subtitle: 'DEEP GORGES / STACKED STRATA',
    description: 'The ground splits into a maze of deep, striped gorges. Natural bridges span drops that seem to have no bottom.',
    color: '#b0895f', ground: '#93704b', sky: '#c19a72', night: '#33261b', fog: .0022, temperature: 28, weather: 'dust',
    danger: 'Sheer canyon walls and long falls', resources: 'Layered stone / copper / gold / clay', tip: 'The Rimrock pylon perches on a canyon edge. The natural bridges are real, and thin.', seed: [1400, 60],
  },
  highlands: {
    name: 'The Windswept Highlands', shortName: 'Highlands', subtitle: 'ROLLING MOUNTAINS / HEATHER SLOPES',
    description: 'Great rolling mountains carpeted in heather and cropped grass. High, open, and endlessly windy.',
    color: '#8b9c74', ground: '#6d7d57', sky: '#aebb98', night: '#232b1f', fog: .0018, temperature: 4, weather: 'clear',
    danger: 'High wind and steep slopes', resources: 'Highland stone / heather / peat / silver', tip: 'The Cairn pylon crowns a broad summit. Gentler than the Titan Range, but still tall.', seed: [-1350, 100],
  },
  crystalcave: {
    name: 'The Geode Hollows', shortName: 'Crystal Fields', subtitle: 'CRYSTAL CANYONS / GLOWING GEODES',
    description: 'Canyons walled in living crystal. Amethyst and quartz spires catch a light that has no obvious source, humming faintly.',
    color: '#a98fca', ground: '#6a5c86', sky: '#9d8fc0', night: '#221b34', fog: .003, temperature: 13, weather: 'mist',
    danger: 'Sharp crystal and deep hollows', resources: 'Amethyst / quartz / crystal / geodes', tip: 'The Geode pylon glows on its own. The crystal spires are the brightest thing for miles.', seed: [1450, -350],
  },
};

export const BIOME_IDS = Object.keys(BIOMES) as Biome[];

export interface PylonDefinition {
  id: string;
  name: string;
  biome: Biome;
  region: string;
  u: number;
  z: number;
  height: number;
  description: string;
}

export const PYLONS: PylonDefinition[] = [
  { id: 'hearth', name: 'The Hearth', biome: 'taiga', region: 'Taiga / Original settlement', u: 10, z: 14, height: 3, description: 'A small fire in a much larger world. All expedition links begin here.' },
  { id: 'cloudbreak', name: 'Cloudbreak Ridge', biome: 'sky', region: 'Sky ring / Lower trail', u: 76, z: -17, height: 8, description: 'The familiar ridge. Beyond it, mountains rise into an immense sky.' },
  { id: 'aerie', name: 'The High Aerie', biome: 'sky', region: 'Sky ring / Alpine summit', u: 330, z: -250, height: 58, description: 'A high ledge beneath a flotilla of rock islands and hanging pines.' },
  { id: 'cloudrest', name: 'Cloudrest', biome: 'clouds', region: 'Cloud nests / Upper atmosphere', u: 560, z: -490, height: 104, description: 'A floating roost, high above the inner wall. Its supply nest has survived.' },
  { id: 'hollow', name: 'The Hollow', biome: 'sinkholes', region: 'Sinkholes / Cave entrance', u: -275, z: 150, height: 17, description: 'A mossy stone on the lip of a deep, fungus-lit collapse.' },
  { id: 'prism', name: 'Prism Atoll', biome: 'reef', region: 'Coral reefs / Shallow shelf', u: -220, z: -355, height: 3, description: 'Warm, clear water and the colors the rest of the world has forgotten.' },
  { id: 'deepwatch', name: 'Deepwatch', biome: 'abyss', region: 'Abyssal ocean / Last island', u: -520, z: -585, height: 3, description: 'The last dry stone above the abyss. Beneath it, the light runs out.' },
  { id: 'fracture', name: 'The Fracture', biome: 'broken', region: 'Broken lands / Original fault', u: -77, z: -23, height: 3, description: 'The old fault has spread. OBIL still waits beyond this standing stone.' },
  { id: 'spine', name: 'The Green Spine', biome: 'spiked', region: 'Spiked forest / Shielded clearing', u: -650, z: 70, height: 20, description: 'A sheltered clearing in a radioactive forest of mineral needles.' },
  { id: 'tempest', name: 'Tempest Anchor', biome: 'storm', region: 'Storm fields / Basalt plateau', u: 760, z: 5, height: 25, description: 'The standing stone is still. Almost nothing around it is.' },
  { id: 'dunewatch', name: 'Dunewatch', biome: 'desert', region: 'Pale expanse / Sandstone arch', u: 410, z: 360, height: 17, description: 'A weathered arch marks a route through the rolling sand sea.' },
  { id: 'redshore', name: 'The Red Shore', biome: 'blood', region: 'Sanguine shores / Salt island', u: 730, z: 535, height: 4, description: 'A dry refuge beside a dense and restless red ocean.' },
  { id: 'rootspire', name: 'Rootspire', biome: 'grove', region: 'Giant groves / Canopy settlement', u: 60, z: 555, height: 12, description: 'The roots of a tree large enough to remember an entire city.' },
  { id: 'summit', name: 'The Summit', biome: 'alpine', region: 'Titan Range / Highest peak', u: -430, z: 400, height: 72, description: 'A standing stone hammered into the shoulder of the tallest mountain in the world.' },
  { id: 'cinder', name: 'Cinder Rest', biome: 'volcanic', region: 'Cinder Wastes / Cooled shelf', u: 975, z: -445, height: 20, description: 'A patch of cooled black stone, ringed by the glow of moving magma.' },
  { id: 'sporehall', name: 'Sporehollow', biome: 'mushroom', region: 'Mushroom Marsh / Glowing grove', u: -885, z: 470, height: 14, description: 'Beneath a cap the size of a house, everything gives off a gentle light.' },
  { id: 'ossuary', name: 'The Ossuary', biome: 'bone', region: 'Bonefields / Rib arch', u: 235, z: -560, height: 12, description: 'A pylon raised inside the ribs of something that was very, very large.' },
  { id: 'threshold', name: 'The Threshold', biome: 'outer', region: 'Outer Sphere / Between the terminals', u: -955, z: -175, height: 10, description: 'The only landmark on a dead world, standing between the Socket and the Plug.' },
  { id: 'trawl', name: 'The Trawl', biome: 'deepocean', region: 'Deep Ocean / Floating raft', u: -1290, z: -470, height: 3, description: 'A lashed-together raft on an ocean with no shore. Sky whales pass far overhead.' },
  { id: 'rime', name: 'The Rime', biome: 'glacier', region: 'Glacier Crown / Ice ledge', u: -1210, z: 300, height: 66, description: 'A shelf carved into blue ice, halfway up a frozen mountain.' },
  { id: 'mesa', name: 'The Mesa', biome: 'badlands', region: 'Badlands / Flat butte', u: 1290, z: 250, height: 40, description: 'A standing stone on a flat-topped tower of banded red rock.' },
  { id: 'acacia', name: 'The Acacia', biome: 'savanna', region: 'Savanna / Lone tree', u: 1150, z: -260, height: 14, description: 'Shade under the only tree for a very long way. Good farming land nearby.' },
  { id: 'canopy', name: 'The Canopy', biome: 'jungle', region: 'Jungle / Rainforest platform', u: -1100, z: -620, height: 22, description: 'A platform lashed into the rainforest canopy, drowning in green.' },
  { id: 'mire', name: 'The Mire', biome: 'swamp', region: 'Swamp / Stilt platform', u: 1310, z: -560, height: 6, description: 'A stilted refuge above the still, dark water of the mire.' },
  { id: 'bloom', name: 'The Bloom', biome: 'meadow', region: 'Meadow / Flower field', u: 1050, z: 570, height: 10, description: 'The gentlest ground in the world, and the best soil for a farm.' },
  { id: 'lichen', name: 'The Lichen Cairn', biome: 'tundra', region: 'Tundra / Low cairn', u: -1050, z: -560, height: 9, description: 'A cairn of stacked stone on a frozen, wind-scoured plain.' },
  { id: 'rimrock', name: 'Rimrock', biome: 'canyon', region: 'Canyon / Gorge edge', u: 1400, z: 60, height: 34, description: 'The lip of a gorge deep enough to swallow the sky whales whole.' },
  { id: 'cairn', name: 'The High Cairn', biome: 'highlands', region: 'Highlands / Broad summit', u: -1350, z: 100, height: 58, description: 'A cairn on a rolling summit, with the wind for company.' },
  { id: 'geode', name: 'The Geode', biome: 'crystalcave', region: 'Crystal Fields / Glowing hollow', u: 1450, z: -350, height: 16, description: 'A pylon that needs no lantern, lit by the crystal all around it.' },
];

export const EXPEDITION_LINKS = PYLONS.filter(pylon => pylon.id !== 'fracture').map(pylon => pylon.id);
export const OBIL_SITE = { u: -76, z: -35, h: 4.5 };
export const OUTER_SOCKET = { u: -1000, z: -250 };
export const OUTER_PLUG = { u: -905, z: -95 };
export const TORNADO_PATHS = [{ u: 810, z: -65, radius: 40, phase: 0 }, { u: 922, z: 45, radius: 55, phase: 3.1 }];
// Gentle sky whales drift in slow circuits high above several regions.
export const WHALE_PATHS = [
  { u: 335, z: -220, radius: 150, height: 175, phase: 0, speed: .022 },
  { u: -1290, z: -470, radius: 190, height: 150, phase: 2.1, speed: .017 },
  { u: 1050, z: 570, radius: 130, height: 165, phase: 4.2, speed: .02 },
  { u: 0, z: 0, radius: 220, height: 205, phase: 1.1, speed: .014 },
];

export interface BossDefinition {
  id: string;
  name: string;
  subtitle: string;
  hint: string;
  color: string;
  reward: string;
  order: number;
}
export const BOSSES: BossDefinition[] = [
  { id: 'obil', name: 'OBIL', subtitle: 'PHASE I / THE FIRST DISTURBANCE', hint: 'Strike its thrown stones back into the core. Three returns break it.', color: '#c7c98f', reward: 'Obelisk fragment', order: 1 },
  { id: 'warper', name: 'THE WARPER', subtitle: 'PHASE II / STITCHED FROM THE SLAIN', hint: 'A floating orb shielded in flesh. Cut it, or return its skewers.', color: '#b57a86', reward: 'Warper flesh', order: 2 },
  { id: 'scruncle', name: 'THE SCRUNCLE', subtitle: 'PHASE III / THE TELEPORTING GUN', hint: 'A top hat that blinks and fires. Close in fast and strike between shots.', color: '#3c3830', reward: "The Scruncle's hat", order: 3 },
  { id: 'farbreaker', name: 'THE FARBREAKER', subtitle: 'PHASE IV / THE STORM ANOMALY', hint: 'It conjures small vortices. Strike it in the lulls, or reflect its debris.', color: '#9195bb', reward: 'Farbreaker eye', order: 4 },
  { id: 'moonholder', name: 'THE MOONHOLDER', subtitle: 'PHASE V / IT PULLS THE MOON DOWN', hint: 'Avoid the descending moon. Strike the tether when it recovers.', color: '#c5cdd6', reward: 'Moonholder tear', order: 5 },
];

export const wrapU = (u: number) => ((u + CIRCUMFERENCE / 2) % CIRCUMFERENCE + CIRCUMFERENCE) % CIRCUMFERENCE - CIRCUMFERENCE / 2;
export const surfaceDistance = (a: { u: number; z: number }, b: { u: number; z: number }) => Math.hypot(wrapU(a.u - b.u), a.z - b.z);
export const formatDistance = (distance: number) => distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${Math.round(distance)} m`;