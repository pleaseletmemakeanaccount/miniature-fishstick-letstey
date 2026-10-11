import { BIOME_IDS, CIRCUMFERENCE, EXPEDITION_LINKS, HALF_LENGTH, PYLONS, WORLD_CEILING, WORLD_FLOOR, type Biome } from '../world/biomes';
export { PYLONS } from '../world/biomes';
export type { Biome } from '../world/biomes';

export type ItemCategory = 'Tools' | 'Materials' | 'Provisions' | 'Relics';
export type Limb = 'head' | 'torso' | 'leftWing' | 'rightWing' | 'leftLeg' | 'rightLeg' | 'leftEye' | 'rightEye';
export type Panel = 'inventory' | 'body' | 'journal' | 'chisel' | 'pylons' | 'sleep' | 'pause' | 'controls' | 'settings' | 'chat' | 'bosses' | null;

export interface ItemDefinition {
  name: string;
  category: ItemCategory;
  description: string;
  color: string;
  use?: string;
  placeable?: boolean;
  glow?: boolean;
  restore?: { hunger?: number; thirst?: number; poison?: number; heal?: number };
  seed?: string;
}

const B = (name: string, description: string, color: string, glow = false): ItemDefinition => ({ name, category: 'Materials', description, color, placeable: true, glow });
const M = (name: string, description: string, color: string): ItemDefinition => ({ name, category: 'Materials', description, color });
const T = (name: string, description: string, color: string, use = 'Equip tool'): ItemDefinition => ({ name, category: 'Tools', description, color, use });
const P = (name: string, description: string, color: string, restore: ItemDefinition['restore'], use = 'Consume'): ItemDefinition => ({ name, category: 'Provisions', description, color, use, restore });
const R = (name: string, description: string, color: string): ItemDefinition => ({ name, category: 'Relics', description, color });
const S = (name: string, description: string, color: string, seed: string): ItemDefinition => ({ name, category: 'Provisions', description, color, use: 'Plant seed', seed });

const RAW_ITEMS = {
  // Core tools
  chisel: T('Iron chisel', 'Nothing is crafted. Everything is revealed. Opens the 1/8-voxel shaping bench.', '#afbab6', 'Open shaping bench'),
  pickaxe: T('Stone pickaxe', 'A roughly shaped tool. Break the surface and see what lies beneath.', '#a7a997'),
  sword: T('Carved sword', 'Your own silhouette, given an edge. Accuracy determines its damage.', '#c4caba', 'Equip weapon'),
  hammer: T('Stone hammer', 'A blunt shaping tool. Heavy enough to feel like progress.', '#9a9c8c'),
  'hand-axe': T('Hand axe', 'For heartwood and worse. Bites deeper than a pickaxe into timber.', '#b0967f'),
  shovel: T('Bone shovel', 'Moves sand, snow, and moss without complaint.', '#cfc9ac'),
  spear: T('Iron spear', 'Reach exceeds the sword. Grace does not.', '#b3b6a4', 'Equip weapon'),
  dagger: T('Flint dagger', 'Small, quick, and honest about what it is for.', '#b8bcae', 'Equip weapon'),
  'war-pick': T('War pick', 'A pick that learned to fight. Cruel against skeletons.', '#a6a68f', 'Equip weapon'),
  torch: T('Pine torch', 'A little light against a very large dark.', '#e0b264', 'Place light'),
  lantern: T('Moth lantern', 'Caged flame that survives the wind and the deep.', '#e6c982', 'Place light'),
  rope: T('Silk rope', 'For climbs you would rather not fall out of.', '#c8bd97'),
  'grapple-hook': T('Grapple hook', 'Iron claw on a long line. The canopy comes closer.', '#9fa290'),
  compass: T('Brass compass', 'Always points toward the Hearth, more or less.', '#c3ac6a'),
  spyglass: T('Salvaged spyglass', 'Brings a distant biome into uncomfortable focus.', '#8f9a86'),
  bucket: T('Iron bucket', 'Carries water, or something you should not carry.', '#a7aa9a'),
  waterskin: T('Mothskin flask', 'Holds a long drink for a longer walk.', '#b6ac86'),
  'fishing-net': T('Fishing net', 'Patience, woven. The reefs are generous.', '#c6c2a4'),
  shears: T('Bone shears', 'For mothsilk, thatch, and overgrown moss.', '#b7bba6'),
  'hand-drill': T('Hand drill', 'Bores neat holes in stubborn stone.', '#9c9e8d'),
  wrench: T('Rust wrench', 'The outer sphere left a few of these behind.', '#b58a5f'),
  crowbar: T('Iron crowbar', 'Opens what does not wish to be opened.', '#9aa091'),
  'flint-and-steel': T('Flint and steel', 'A spark on demand. Do not point it at the ash fields.', '#b3ab8e', 'Consume'),
  lodestone: T('Lodestone', 'A stone that remembers a direction. Golems adore it.', '#7f8794'),
  bellows: T('Leather bellows', 'Coaxes a fire toward a forge-worthy heat.', '#a98f6f'),
  whetstone: T('Whetstone', 'Returns an edge to a tired blade.', '#9ba08f'),
  'climbing-spikes': T('Climbing spikes', 'The Titan Range is more suggestion than obstacle now.', '#a6a996'),
  // Farming and utility tools
  hoe: T('Bone hoe', 'Turns soil into a bed for seeds. Right-click grassy ground to till it.', '#b7a878', 'Till soil'),
  scythe: T('Iron scythe', 'Reaps grown crops and tall grass in a single sweep.', '#b0b39d', 'Equip tool'),
  'watering-can': T('Watering can', 'A drink for a thirsty field. Speeds nearby crops along.', '#8fb0b6', 'Water crops'),
  'fishing-rod': T('Fishing rod', 'Cast into water and wait. The ocean usually answers.', '#b39a6a', 'Cast line'),
  saw: T('Timber saw', 'Turns raw logs into clean planks, and trees into regret.', '#c2b190'),
  machete: T('Jungle machete', 'Clears vines and leaves fast. A blunt argument with the forest.', '#a9b199', 'Equip weapon'),
  'ice-axe': T('Ice axe', 'Bites into blue ice and frozen ground the way nothing else will.', '#a7c4d0'),
  trowel: T('Mason trowel', 'For clay, brick, and the patient work of walls.', '#aeb0a0'),
  // Original materials
  stone: B('Weathered stone', 'The bones of the inner wall. Shape it, place it, break it.', '#92988a'),
  wood: B('Taiga heartwood', 'Resin-scented timber from a tree that has never known an outside.', '#9b7e54'),
  iron: B('Raw iron', 'Cold, heavy, and stubborn. The same metal that seals the world.', '#afb1a0'),
  gold: B('Native gold', 'The only metal through which runic energy willingly flows.', '#c8b266'),
  sand: B('Pale sand', 'A million little stones, each patiently obeying gravity.', '#c6b993'),
  leaves: B('Pine needles', 'A handful of the forest. Place as a living block.', '#667757'),
  uranium: B('Uranium fragment', 'An uncomfortable warmth. Do not linger in the crystal fields.', '#b6c16d'),
  snow: B('Packed snow', 'The white silence of the taiga, gathered a block at a time.', '#d9e3dc'),
  ice: B('Glacial ice', 'Blue-white ice from the alpine slopes and frozen pools.', '#8fbed0'),
  moss: B('Deep moss', 'Soft green growth from the sinkholes and ancient roots.', '#6a8854'),
  'glow-fungus': B('Luminous fungus', 'A pale teal fungus that lights the deep caverns.', '#76d8bb', true),
  cloudstone: B('Cloudstone', 'A strangely light rock. A solid place to stand in an uncertain sky.', '#c8cedc'),
  'rose-coral': B('Rose coral', 'Living pink pigment from the warm reef shelves.', '#dc8b8f'),
  'violet-coral': B('Violet coral', 'A saturated violet reef fragment.', '#a58bc9'),
  basalt: B('Dark basalt', 'Dense, blue-black stone from trenches and storm plateaus.', '#535f6e'),
  'abyss-crystal': B('Abyss crystal', 'A cold blue glow from the bottom of the ocean.', '#70bdde', true),
  'toxic-crystal': B('Irradiated crystal', 'A luminous green spike. Standing close to it burns.', '#c7e277', true),
  'storm-glass': B('Storm glass', 'Violet glass fused by lightning in the basalt fields.', '#a3a6de', true),
  sandstone: B('Carved sandstone', 'Warm, layered stone from the desert arches.', '#cba975'),
  'red-sand': B('Sanguine sand', 'Red sand from the shores of the blood ocean. It falls, too.', '#b77c61'),
  salt: B('Pale salt', 'White mineral crust from the desert and the red shore.', '#e0d6be'),
  blood: M('Liquid blood', 'Dense, restless energy. Fuel for gold-bound runic circuits.', '#a75c58'),
  cloth: T('Mothsilk cloth', 'Light enough to catch steam. Soft enough to bind a wound.', '#d4cdb8', 'Bind injured limb'),
  // Mountain blocks
  granite: B('Granite', 'The grey heart of the Titan Range.', '#9a938a'),
  slate: B('Slate', 'Layered mountain stone that splits into clean sheets.', '#6f7681'),
  marble: B('Veined marble', 'Pale stone with grey rivers running through it.', '#d7d6cc'),
  quartz: B('Quartz block', 'Milk-white crystal quarried from high passes.', '#e3e2d8'),
  permafrost: B('Permafrost', 'Soil that has forgotten how to thaw.', '#a8bcc0'),
  'silver-ore': B('Silver ore', 'Bright metal veined through alpine granite.', '#c3c8cb'),
  // Volcanic blocks
  obsidian: B('Obsidian', 'Volcanic glass, black and unforgiving.', '#2f2b3a'),
  magma: B('Magma block', 'Cooled crust over a burning core. It scorches anything near.', '#c25a34', true),
  ash: B('Ash block', 'Grey fall from the cinder cones. Soft and choking.', '#6a655e'),
  sulfur: B('Sulfur', 'Yellow crust reeking of the deep vents.', '#cbbf5c'),
  pumice: B('Pumice', 'Stone light enough to float, if the world allowed it.', '#948d84'),
  ember: B('Ember stone', 'It never quite goes out.', '#d97b45', true),
  // Mushroom blocks
  'mushroom-cap': B('Mushroom cap', 'The glowing roof of a giant fungus.', '#b5638f', true),
  'mushroom-stem': B('Mushroom stem', 'Pale, spongy, and structural.', '#d8cdb6'),
  mycelium: B('Mycelium', 'Threaded soil that hums faintly underfoot.', '#7c6a86'),
  'spore-bloom': B('Spore bloom', 'A cluster that breathes soft violet light.', '#a97fc4', true),
  // Bonefield blocks
  'bone-block': B('Bone block', 'Fused remains of something enormous.', '#d8d2b8'),
  fossil: B('Fossil', 'Stone that kept the shape of the living.', '#b8b394'),
  tar: B('Tar', 'Black, slow, and patient. It holds what it catches.', '#26241f'),
  'bleached-sand': B('Bleached sand', 'Sun-whitened grit of the Ossuary flats.', '#ddd6bc'),
  // Outer sphere blocks
  'cracked-earth': B('Cracked earth', 'The dead skin of a separate, ruined world.', '#b09166'),
  'rust-metal': B('Rusted plate', 'Iron the outer sphere abandoned long ago.', '#a06a49'),
  'scrap-metal': B('Scrap metal', 'Salvage with no memory of its purpose.', '#8f8577'),
  'copper-ore': B('Copper ore', 'Green-veined ore. The circuit runs on it.', '#b5764a'),
  circuit: B('Circuit block', 'A living current, waiting for a completed loop.', '#6fc79a', true),
  // General building blocks
  clay: B('Clay', 'Soft earth that hardens into brick.', '#a98f76'),
  brick: B('Fired brick', 'Clay, given purpose and a corner.', '#b06e57'),
  glass: B('Glass', 'Sand that learned to be clear.', '#bcd4d2'),
  planks: B('Timber planks', 'Squared, sanded, and ready to build.', '#b48a56'),
  thatch: B('Thatch', 'Bundled reed for a quick, warm roof.', '#c6ab63'),
  amber: B('Amber', 'Ancient resin with a low, warm glow.', '#d59a4a', true),
  jade: B('Jade', 'Green stone the grove keeps for itself.', '#6fa384'),
  coal: B('Coal', 'Old carbon. It remembers being a forest.', '#3a3a37'),
  glowstone: B('Glowstone', 'A block of gathered light.', '#e6d98a', true),
  chalk: B('Chalk', 'Soft white stone that marks everything it touches.', '#e2ddc9'),
  driftwood: B('Driftwood', 'Wood the oceans returned, grey and smooth.', '#a89f88'),
  shell: B('Shell block', 'Pearled armor of the reef, packed tight.', '#d8c9a8'),
  kelp: B('Kelp', 'Green ribbons from the shallow shelves.', '#5f7a55'),
  'coral-fan': B('Coral fan', 'A delicate orange lattice of the reef.', '#d99a6a'),
  'lantern-block': B('Lantern block', 'A caged flame that never asks for fuel.', '#e8c574', true),
  'iron-block': B('Iron block', 'Nine bars of iron, honestly stacked.', '#b9bbab'),
  'gold-block': B('Gold block', 'A wealth you cannot spend on a dead world.', '#d0be6f'),
  'copper-block': B('Copper block', 'Warm metal, slowly turning green.', '#bd7c52'),
  'silver-block': B('Silver block', 'Cold, bright, and quietly valuable.', '#cbd0d2'),
  'crystal-block': B('Crystal block', 'Cut light, held in a cube.', '#a8d8e0', true),
  geode: B('Geode', 'Plain outside, impossible within.', '#8a94a0'),
  // Deep ocean blocks
  prismarine: B('Prismarine', 'Sea-green stone from the drowned ridges.', '#4f8f8a'),
  'dark-prismarine': B('Dark prismarine', 'Denser, deeper, and nearly black-green.', '#2f5a55'),
  'sea-lantern': B('Sea lantern', 'A cold light the deep never learned to swallow.', '#a7e0dc', true),
  // Glacier blocks
  'packed-ice': B('Packed ice', 'Snow crushed to stone under a mountain of its own.', '#b6d6e2'),
  'blue-ice': B('Blue ice', 'Ancient ice, blue as the bottom of a crevasse.', '#7fb6d6'),
  // Badlands blocks
  terracotta: B('Terracotta', 'Baked earth in a warm, dusty orange.', '#b5764f'),
  'red-terracotta': B('Banded terracotta', 'Layered red clay from the mesa walls.', '#9c5238'),
  'red-stone': B('Red stone', 'Iron-stained rock from the ochre basin.', '#a35a3f'),
  // Savanna and meadow blocks
  'savanna-grass': B('Savanna turf', 'Dry golden grass over cracked earth.', '#b6a659'),
  'acacia-wood': B('Acacia wood', 'Pale, hard timber from the flat-topped trees.', '#b07a4c'),
  'rich-soil': B('Rich soil', 'Dark, crumbling earth. Anything will grow here.', '#5f4a34'),
  grass: B('Grass block', 'Green turf over plain brown soil.', '#6f9a4f'),
  flowers: B('Wildflowers', 'A block bright with small, stubborn blooms.', '#c78fb0'),
  hay: B('Hay bale', 'Dried grass, bundled and stacked.', '#c7ac52'),
  // Jungle blocks
  'jungle-wood': B('Jungle wood', 'Dense, dark timber wound with old growth.', '#7a5a37'),
  'jungle-leaves': B('Jungle canopy', 'A wall of broad, dripping leaves.', '#3f6b34'),
  vine: B('Vines', 'Green rope the forest grows for itself.', '#5c7a45'),
  // Swamp blocks
  'swamp-wood': B('Swamp wood', 'Waterlogged, grey-brown, and stubbornly alive.', '#5c5a44'),
  mud: B('Mud', 'Soft, dark, and reluctant to let go of your feet.', '#4b4030'),
  'hanging-moss': B('Hanging moss', 'Grey-green curtains that drip without end.', '#7c8560', true),
  // Tundra and highlands blocks
  'frozen-soil': B('Frozen soil', 'Grey earth locked hard by the endless wind.', '#8f9d92'),
  lichen: B('Lichen', 'Grey-green crust on cold, patient stone.', '#9aa891'),
  'highland-stone': B('Highland stone', 'Weathered grey rock of the rolling summits.', '#7f8a72'),
  heather: B('Heather', 'A block of purple-flowered mountain scrub.', '#8f7a9e'),
  peat: B('Peat', 'Dark, spongy earth that burns slow and warm.', '#4a3c2c'),
  // Canyon and crystal blocks
  'layered-stone': B('Layered stone', 'Striped sedimentary rock from the gorge walls.', '#a17f57'),
  'amethyst-block': B('Amethyst block', 'Violet crystal packed into a solid cube.', '#8f6fbf', true),
  'crystal-shard': B('Crystal shard', 'A cluster of raw, glowing crystal.', '#b79ee0', true),
  // Furniture
  chair: B('Wooden chair', 'A place to sit and consider an impossible sky.', '#9a7a4e'),
  table: B('Wooden table', 'Flat, honest, and good for a map.', '#a5824f'),
  stool: B('Round stool', 'A humble seat for a humble moth.', '#9c7c50'),
  bookshelf: B('Bookshelf', 'Full of things no one has read in a long time.', '#8f6f45'),
  'bed-block': B('Mothsilk bed', 'A soft place to rest and repair, wherever you build it.', '#a7ad84'),
  rug: B('Woven rug', 'A little warmth underfoot.', '#a86a63'),
  'lamp-post': B('Lamp post', 'A tall light for a path you are still building.', '#d8c078', true),
  barrel: B('Oak barrel', 'For water, or things that were once water.', '#8a6b42'),
  crate: B('Storage crate', 'Squared, stacked, and reassuringly ordinary.', '#a6844f'),
  fence: B('Timber fence', 'A line between your world and the rest of it.', '#9a7a4c'),
  banner: B('Cloth banner', 'A small claim on a very large place.', '#b5766e'),
  painting: B('Painting', 'A window that shows only what you remember.', '#9c8964'),
  'plant-pot': B('Plant pot', 'A little green, kept close.', '#a86f52'),
  brazier: B('Iron brazier', 'A caged fire, for light and for company.', '#c98a4c', true),
  sign: B('Wooden sign', 'For a word to your future self.', '#b0895440'.slice(0, 7)),
  lantern2: B('Hanging lantern', 'A warm point of light to hang from a beam.', '#e6c574', true),
  candle: B('Candle', 'One small, brave flame.', '#e2d29a', true),
  carpet: B('Soft carpet', 'Quieter footsteps, warmer floors.', '#b08a7a'),
  clock: B('Standing clock', 'It keeps the day-length of an impossible world.', '#a89768'),
  // Deep strata and cave blocks
  deepslate: B('Deepslate', 'The hard grey rock of the deep strata.', '#4e5158'),
  shale: B('Shale', 'Thin dark layers that split under a pick.', '#5c5b55'),
  dripstone: B('Dripstone', 'Stone grown one slow drop at a time.', '#a99c86'),
  'glow-moss': B('Glow moss', 'Green light creeping across a cave wall.', '#7fc98a', true),
  'echo-stone': B('Echo stone', 'It gives back more sound than it receives.', '#8f97a8', true),
  'void-stone': B('Void stone', 'Rock from where the world stops bothering.', '#2f3340'),
  'blood-crystal': B('Blood crystal', 'A red facet with a slow pulse inside it.', '#a8434f', true),
  flint: B('Flint', 'Sharp grey nodules from chalk and shale.', '#6b6f74'),
  // Farming blocks
  'tilled-soil': B('Tilled soil', 'Broken, watered ground, ready for seed.', '#5a4632'),
  // Refined materials
  'iron-ingot': M('Iron ingot', 'Smelted and squared. The start of most metal things.', '#bcbeae'),
  'gold-ingot': M('Gold ingot', 'A bar of conductive gold for runic work.', '#d3c072'),
  'copper-ingot': M('Copper ingot', 'Drawn into wire, it carries the circuit.', '#c1814f'),
  'silver-ingot': M('Silver ingot', 'Bright bar from alpine ore.', '#cdd2d4'),
  'steel-ingot': M('Steel ingot', 'Iron, taught to hold an edge.', '#9ea4a6'),
  'bronze-ingot': M('Bronze ingot', 'Copper and grit, older than iron.', '#b08a56'),
  'glass-pane': M('Glass pane', 'A thin sheet of the outside, kept out.', '#c3d9d7'),
  nails: M('Iron nails', 'Small, sharp, and holding everything together.', '#9fa294'),
  gear: M('Iron gear', 'Teeth for a machine you have not built yet.', '#a6a897'),
  spring: M('Coiled spring', 'Stored motion, waiting to be released.', '#b0b2a2'),
  wire: M('Copper wire', 'The nervous system of every mechanism.', '#c08050'),
  charcoal: M('Charcoal', 'Slow-burned wood. Hotter than it looks.', '#41403b'),
  gunpowder: M('Gunpowder', 'Sulfur, coal, and salt. Handle with respect.', '#5c5952'),
  resin: M('Pine resin', 'Sticky amber sap, good for torches and glue.', '#c99a55'),
  wax: M('Beeswax', 'Seals, candles, and a faint sweetness.', '#d9c583'),
  string: M('Silk string', 'Unwound mothsilk. The bones of rope and nets.', '#cdc4a2'),
  leather: M('Cured leather', 'Tough hide, softened into something wearable.', '#a17c53'),
  feather: M('Wing feather', 'Shed from your own kind. Light as intention.', '#d7d3bd'),
  chitin: M('Chitin plate', 'Hard shell salvaged from the reef and the deep.', '#b39c74'),
  // Gems
  ruby: M('Ruby', 'A drop of frozen fire.', '#c1544f'),
  sapphire: M('Sapphire', 'The abyss, cut into a facet.', '#5a7bc4'),
  emerald: M('Emerald', 'The grove, distilled to green.', '#4fa774'),
  topaz: M('Topaz', 'Desert light, made solid.', '#d0a054'),
  opal: M('Opal', 'It cannot decide on a color, and is lovelier for it.', '#c7c6d6'),
  diamond: M('Diamond', 'The hardest thing in a very hard world.', '#cfe4e6'),
  amethyst: M('Amethyst', 'Violet crystal from the geode fields.', '#9b7cc0'),
  garnet: M('Garnet', 'Deep red stone with an inner heat.', '#9c4c4a'),
  pearl: M('Pearl', 'The reef, apologizing for an intrusion.', '#e2ddca'),
  'obsidian-shard': M('Obsidian shard', 'An edge sharper than any you could chisel.', '#37324a'),
  moonstone: M('Moonstone', 'Pale gem that catches the sourceless night.', '#c9cdda'),
  sunstone: M('Sunstone', 'A shard that holds the central sun at dawn.', '#d99f57'),
  // Provisions
  water: P('Spring water', 'Clear water from the inner river. Refill near water with R.', '#8baeb8', { thirst: 35 }, 'Drink water'),
  berries: P('Pale berries', 'A small, safe meal.', '#bba1ae', { hunger: 25 }, 'Eat berries'),
  'raw-meat': P('Raw pork', 'Restores hunger but poisons you. Steam it instead.', '#bd8278', { hunger: 18, poison: 45 }, 'Eat raw meat'),
  'cooked-meat': P('Steamed pork', 'An ordinary meal. An extraordinary expression.', '#bb9066', { hunger: 45 }, 'Eat steamed pork'),
  cheese: P('Aged cheese', 'A pleasantly questionable dairy product.', '#d2bd79', { hunger: 20 }, 'Eat cheese'),
  'mushroom-stew': P('Mushroom stew', 'Warm, earthy, and faintly glowing.', '#9a7f5e', { hunger: 40, thirst: 10 }, 'Eat stew'),
  'berry-jam': P('Berry jam', 'Sweet enough to forget the cold for a moment.', '#a85f6e', { hunger: 30 }, 'Eat jam'),
  'dried-fish': P('Dried fish', 'Reef catch, cured against the long walk.', '#c3b48c', { hunger: 28 }, 'Eat fish'),
  'cooked-fish': P('Grilled fish', 'Better than dried, worse than fresh.', '#c99c6e', { hunger: 42 }, 'Eat fish'),
  'roast-kiwi': P('Roast kiwi', 'A quiet bird, respectfully prepared.', '#a8905f', { hunger: 46 }, 'Eat roast'),
  honey: P('Wild honey', 'Sticky, golden, and briefly wonderful.', '#d9ab4e', { hunger: 22, thirst: 6 }, 'Eat honey'),
  milk: P('Fresh milk', 'Leave it out and it becomes cheese.', '#e4ddca', { thirst: 20, hunger: 8 }, 'Drink milk'),
  'salted-jerky': P('Salted jerky', 'Salt makes it last. It also makes you thirsty.', '#a06a52', { hunger: 38, thirst: -10 }, 'Eat jerky'),
  'cactus-fruit': P('Cactus fruit', 'The desert, offering an apology.', '#b5738a', { hunger: 18, thirst: 22 }, 'Eat fruit'),
  snowmelt: P('Snowmelt', 'Cold, clean water from the high passes.', '#c2dbe0', { thirst: 40 }, 'Drink'),
  'blood-tonic': P('Blood tonic', 'It should not work. It cures poison anyway.', '#9c4750', { poison: -45, heal: 8 }, 'Drink tonic'),
  'spore-cap': P('Edible spore cap', 'Filling, if you can ignore the aftertaste.', '#a884b8', { hunger: 24 }, 'Eat cap'),
  'boiled-egg': P('Boiled egg', 'A small, complete thing.', '#e0d8c0', { hunger: 20 }, 'Eat egg'),
  bread: P('Flat bread', 'Grain, water, heat. The oldest comfort.', '#c9ac74', { hunger: 34 }, 'Eat bread'),
  'hearty-soup': P('Hearty soup', 'Everything left over, made kind by a fire.', '#b58c5a', { hunger: 48, thirst: 14 }, 'Eat soup'),
  'herbal-tea': P('Herbal tea', 'Warmth that reaches the wings.', '#a9b57c', { thirst: 28, hunger: 4 }, 'Drink tea'),
  'frost-melon': P('Frost melon', 'A cold, watery gourd from the taiga edge.', '#8fb497', { thirst: 32, hunger: 10 }, 'Eat melon'),
  'glow-berry': P('Glow berry', 'It lights your palm as you eat it.', '#8fd0a0', { hunger: 20, heal: 4 }, 'Eat berry'),
  coconut: P('Coconut', 'Reef island fruit. Two meals in one shell.', '#a98f66', { hunger: 26, thirst: 16 }, 'Eat coconut'),
  'cave-nectar': P('Cave nectar', 'Sweet drip from the fungal ceilings.', '#c9b56a', { thirst: 24, hunger: 12 }, 'Drink nectar'),
  'salt-cracker': P('Salt cracker', 'Dry, sharp, and strangely moreish.', '#ddd3b6', { hunger: 16, thirst: -6 }, 'Eat cracker'),
  // Farm produce and cooking
  grain: P('Grain', 'Threshed wheat. Grind and bake it into bread.', '#cdb56a', { hunger: 8 }, 'Eat raw'),
  'corn-cob': P('Corn cob', 'Sweet, golden, and satisfying off the plant.', '#d8c256', { hunger: 26 }, 'Eat corn'),
  carrot: P('Carrot', 'Crisp and bright orange. Good raw or roasted.', '#cc823f', { hunger: 22 }, 'Eat carrot'),
  pumpkin: P('Pumpkin', 'A heavy autumn gourd. Bakes into a fine pie.', '#c9793c', { hunger: 20 }, 'Eat pumpkin'),
  'sweet-berry': P('Sweet berries', 'Plump red berries from a tended bush.', '#b5495a', { hunger: 24, thirst: 6 }, 'Eat berries'),
  tomato: P('Tomato', 'Vine-ripe and faintly sun-warm.', '#bf5245', { hunger: 18, thirst: 8 }, 'Eat tomato'),
  'pumpkin-pie': P('Pumpkin pie', 'Baked, spiced, and deeply reassuring.', '#c79758', { hunger: 55 }, 'Eat pie'),
  'vegetable-stew': P('Vegetable stew', 'A whole farm in a single bowl.', '#a88a54', { hunger: 52, thirst: 16 }, 'Eat stew'),
  'corn-bread': P('Corn bread', 'Golden, crumbly, and filling.', '#cdaa5f', { hunger: 40 }, 'Eat bread'),
  'raw-fish': P('Raw fish', 'A fresh catch. Better grilled, but it will do.', '#9cb0a0', { hunger: 16 }, 'Eat fish'),
  pufferfish: P('Pufferfish', 'Edible, technically. Poisons you either way.', '#c3b05e', { hunger: 8, poison: 30 }, 'Eat pufferfish'),
  'golden-fish': P('Golden fish', 'A rare catch that mends as much as it feeds.', '#d8bd60', { hunger: 30, heal: 12 }, 'Eat golden fish'),
  // Seeds
  'wheat-seeds': S('Wheat seeds', 'Scatter on tilled soil to grow grain.', '#c6b878', 'wheat'),
  'corn-seeds': S('Corn kernels', 'Plant on tilled soil for tall corn.', '#d3c05c', 'corn'),
  'carrot-seeds': S('Carrot seeds', 'Plant on tilled soil for a root crop.', '#c99a6a', 'carrot'),
  'pumpkin-seeds': S('Pumpkin seeds', 'Plant on tilled soil for heavy gourds.', '#cbb37a', 'pumpkin'),
  'berry-seeds': S('Berry seeds', 'Plant on tilled soil for a berry bush.', '#b48a8f', 'berry'),
  'tomato-seeds': S('Tomato seeds', 'Plant on tilled soil for ripe tomatoes.', '#bb9a7a', 'tomato'),
  'glowshroom-spores': S('Glowshroom spores', 'Plant anywhere shaded for a glowing crop.', '#8fd0b0', 'glowshroom'),
  // Relics
  'pylon-shard': R('Obelisk fragment', 'Gravity remembers this shape. Proof OBIL can be broken.', '#c3c5a4'),
  'moon-shard': R('Moon shard', 'A cold sliver of the satellite that fell.', '#c5cdd6'),
  'sun-fragment': R('Sun fragment', 'Impossibly, a piece of the perfect central sun.', '#e6d488'),
  'plug-core': R('Plug core', 'The heart of the outer terminal. It hums when carried.', '#c2894f'),
  'socket-key': R('Socket key', 'It fits exactly one hole in a dead world.', '#9fb08a'),
  'warper-flesh': R('Warper flesh', 'Stitched remains of everything you have killed.', '#b06f7d'),
  'scruncle-hat': R("The Scruncle's hat", 'Still warm. Still smug.', '#39352f'),
  'farbreaker-eye': R('Farbreaker eye', 'It watches the weather from inside your pack.', '#9195bb'),
  'moonholder-tear': R('Moonholder tear', 'Heavy out of all proportion to its size.', '#b8c0cb'),
  'aurora-vial': R('Aurora vial', 'Bottled northern light. It never quite settles.', '#8fd0b6'),
  'rune-tablet': R('Rune tablet', 'Gold-inlaid stone covered in the old marks.', '#c9b878'),
  'false-mirror': R('False mirror', 'Your reflection blinks a half-second too late.', '#c8d0c0'),
  'doom-plate': R('Doom plate', 'Armor torn from a three-legged walker.', '#8f9384'),
  'wyrm-scale': R('Wyrm scale', 'Iridescent, and warm from a distant sky.', '#7f9a80'),
  'squid-ink': R('Squid ink', 'From the guardians of the anchor moons.', '#2f3340'),
  'kraken-tooth': R('Kraken tooth', 'Longer than your arm. You did not take it easily.', '#d8d2bd'),
  'ancient-coin': R('Ancient coin', 'Currency of a civilization grown inside a tree.', '#c2a45f'),
  'chill-charm': R('Chill charm', 'A tiny cube with a :] carved into it. A gift.', '#b5be9f'),
  'ernas-seed': R('Ernas seed', 'It should not fit in your hand. It does.', '#a7b58a'),
  'golem-core': R('Golem core', 'A block that wants to gather other blocks.', '#8b937c'),
  'dragon-egg-shard': R('Dragon egg shard', 'A curved fragment, warm at the center of the cold moon.', '#5c6b57'),
};

export const ITEMS: Record<string, ItemDefinition> = RAW_ITEMS;
export type ItemId = keyof typeof RAW_ITEMS;

export const BLOCK_KINDS = (Object.keys(ITEMS) as ItemId[]).filter(id => ITEMS[id].placeable);
export type BlockKind = typeof BLOCK_KINDS[number];
export const GLOWING_KINDS = (Object.keys(ITEMS) as ItemId[]).filter(id => ITEMS[id].glow && ITEMS[id].placeable) as BlockKind[];

export const BIOME_CACHE_ITEMS: Record<Biome, Partial<Record<ItemId, number>>> = {
  taiga: { snow: 8, wood: 8, berries: 4 }, sinkholes: { 'glow-fungus': 4, iron: 6, 'mushroom-stew': 2 },
  sky: { cloudstone: 10, ice: 6, feather: 4 }, clouds: { cloudstone: 16, cloth: 6, gold: 3 },
  reef: { 'rose-coral': 6, 'violet-coral': 6, 'dried-fish': 3, pearl: 1 }, abyss: { 'abyss-crystal': 4, basalt: 12, sapphire: 1 },
  broken: { stone: 12, gold: 4, 'rune-tablet': 1 }, spiked: { uranium: 4, 'toxic-crystal': 6 },
  storm: { 'storm-glass': 6, basalt: 12 }, desert: { sandstone: 12, salt: 6, 'cactus-fruit': 3, topaz: 1 },
  blood: { blood: 8, 'red-sand': 12, 'blood-tonic': 2 }, grove: { wood: 24, moss: 12, 'glow-fungus': 4, emerald: 1 },
  alpine: { granite: 12, ice: 8, 'silver-ore': 4, snowmelt: 3, 'climbing-spikes': 1 },
  volcanic: { obsidian: 8, sulfur: 6, 'obsidian-shard': 2, ember: 4 },
  mushroom: { 'mushroom-cap': 8, 'spore-bloom': 4, 'mushroom-stew': 3, mycelium: 8 },
  bone: { 'bone-block': 10, fossil: 4, 'salted-jerky': 3, 'ancient-coin': 2 },
  outer: { 'cracked-earth': 12, 'scrap-metal': 8, 'copper-ore': 6, circuit: 3, 'socket-key': 1 },
  deepocean: { prismarine: 10, kelp: 8, 'sea-lantern': 3, pearl: 2, 'fishing-rod': 1 },
  glacier: { 'blue-ice': 10, 'packed-ice': 8, 'silver-ore': 4, 'ice-axe': 1, snowmelt: 3 },
  badlands: { terracotta: 12, 'red-stone': 8, 'copper-ore': 4, gold: 3 },
  savanna: { 'savanna-grass': 10, 'acacia-wood': 10, 'wheat-seeds': 4, hoe: 1 },
  jungle: { 'jungle-wood': 12, vine: 8, emerald: 1, 'berry-seeds': 3, machete: 1 },
  swamp: { 'swamp-wood': 10, mud: 12, 'hanging-moss': 6, clay: 6 },
  meadow: { 'rich-soil': 12, flowers: 8, 'wheat-seeds': 4, 'carrot-seeds': 3, hoe: 1 },
  tundra: { 'frozen-soil': 12, lichen: 8, iron: 4, snowmelt: 3 },
  canyon: { 'layered-stone': 12, 'copper-ore': 4, gold: 3, clay: 6 },
  highlands: { 'highland-stone': 12, heather: 8, peat: 6, 'silver-ore': 3 },
  crystalcave: { 'amethyst-block': 8, 'crystal-shard': 4, amethyst: 2, quartz: 6 },
};

// Carving material determines a shaped tool's durability and its edge.
export interface CarveMaterial { id: ItemId; label: string; durability: number; damage: number; mine: number; color: string }
export const CARVE_MATERIALS: CarveMaterial[] = [
  { id: 'stone', label: 'Weathered stone', durability: 120, damage: .55, mine: .6, color: '#92988a' },
  { id: 'bone-block', label: 'Bone', durability: 150, damage: .6, mine: .55, color: '#d8d2b8' },
  { id: 'iron', label: 'Raw iron', durability: 320, damage: .8, mine: .82, color: '#afb1a0' },
  { id: 'basalt', label: 'Dark basalt', durability: 260, damage: .7, mine: .74, color: '#535f6e' },
  { id: 'granite', label: 'Granite', durability: 300, damage: .72, mine: .8, color: '#9a938a' },
  { id: 'gold', label: 'Native gold', durability: 90, damage: .95, mine: 1, color: '#c8b266' },
  { id: 'quartz', label: 'Quartz', durability: 280, damage: .78, mine: .84, color: '#e3e2d8' },
  { id: 'obsidian', label: 'Obsidian', durability: 620, damage: 1, mine: .95, color: '#2f2b3a' },
  { id: 'crystal-block', label: 'Crystal', durability: 900, damage: 1.1, mine: 1.05, color: '#a8d8e0' },
];

export type CarveTool = 'sword' | 'pickaxe' | 'hammer' | 'hand-axe' | 'shovel' | 'spear' | 'dagger' | 'war-pick' | 'machete' | 'scythe' | 'ice-axe';
export const CARVE_TOOLS: { id: CarveTool; label: string }[] = [
  { id: 'sword', label: 'Sword' }, { id: 'pickaxe', label: 'Pickaxe' }, { id: 'hand-axe', label: 'Axe' },
  { id: 'shovel', label: 'Shovel' }, { id: 'spear', label: 'Spear' }, { id: 'dagger', label: 'Dagger' },
  { id: 'war-pick', label: 'War pick' }, { id: 'hammer', label: 'Hammer' }, { id: 'machete', label: 'Machete' },
];

export const FURNITURE: ItemId[] = ['chair', 'table', 'stool', 'bookshelf', 'bed-block', 'rug', 'lamp-post', 'barrel', 'crate', 'fence', 'banner', 'painting', 'plant-pot', 'brazier', 'sign', 'lantern2', 'candle', 'carpet', 'clock'];

export interface CropDefinition { name: string; produce: ItemId; produceCount: number; seed: ItemId; growTime: number; color: string; cap: string; tall: number }
export const CROPS: Record<string, CropDefinition> = {
  wheat: { name: 'Wheat', produce: 'grain', produceCount: 2, seed: 'wheat-seeds', growTime: 210, color: '#9aa35a', cap: '#d0bd68', tall: 1.3 },
  corn: { name: 'Corn', produce: 'corn-cob', produceCount: 2, seed: 'corn-seeds', growTime: 260, color: '#6f9a4a', cap: '#d8c256', tall: 2 },
  carrot: { name: 'Carrots', produce: 'carrot', produceCount: 3, seed: 'carrot-seeds', growTime: 200, color: '#5f8a45', cap: '#cc823f', tall: .8 },
  pumpkin: { name: 'Pumpkins', produce: 'pumpkin', produceCount: 2, seed: 'pumpkin-seeds', growTime: 300, color: '#6f9a4a', cap: '#c9793c', tall: .9 },
  berry: { name: 'Berry bush', produce: 'sweet-berry', produceCount: 3, seed: 'berry-seeds', growTime: 230, color: '#4f6b3f', cap: '#b5495a', tall: 1.1 },
  tomato: { name: 'Tomatoes', produce: 'tomato', produceCount: 3, seed: 'tomato-seeds', growTime: 220, color: '#5f8a48', cap: '#bf5245', tall: 1.2 },
  glowshroom: { name: 'Glowshrooms', produce: 'glow-berry', produceCount: 2, seed: 'glowshroom-spores', growTime: 180, color: '#6f9a86', cap: '#8fd0b0', tall: 1 },
};
export const SEED_TO_CROP: Partial<Record<ItemId, string>> = Object.fromEntries((Object.keys(ITEMS) as ItemId[]).filter(id => ITEMS[id].seed).map(id => [id, ITEMS[id].seed!]));

export const LIMB_NAMES: Record<Limb, string> = {
  head: 'Head', torso: 'Torso', leftWing: 'Left wing', rightWing: 'Right wing',
  leftLeg: 'Left leg', rightLeg: 'Right leg', leftEye: 'Left eye', rightEye: 'Right eye',
};
export const LIMBS = Object.keys(LIMB_NAMES) as Limb[];
export const healthyBody = (): Record<Limb, number> => Object.fromEntries(LIMBS.map(limb => [limb, 100])) as Record<Limb, number>;

export interface WorldEdit { x: number; y: number; z: number; kind: BlockKind | null }
export interface PlayerPosition { u: number; h: number; z: number; yaw: number; pitch: number }
export interface Settings { volume: number; sensitivity: number; quality: 'balanced' | 'high'; reducedMotion: boolean }
export interface SaveData {
  version: 2;
  inventory: Partial<Record<ItemId, number>>;
  body: Record<Limb, number>;
  scars: Limb[];
  hunger: number;
  thirst: number;
  poison: number;
  oxygen: number;
  coldExposure: number;
  flight: boolean;
  elapsed: number;
  mode: 'survival' | 'creative';
  position: PlayerPosition | null;
  edits: WorldEdit[];
  unlockedPylons: string[];
  companion: boolean;
  aurora: boolean;
  achievement: boolean;
  mined: number;
  crafted: number;
  kills: string[];
  bossDefeated: boolean;
  toolQuality: number;
  toolQualities: Record<string, number>;
  toolDurability: Record<string, number>;
  toolMax: Record<string, number>;
  toolMaterials: Record<string, string>;
  farms: FarmPlot[];
  visitedBiomes: Biome[];
  visitedCaves: string[];
  claimedCaches: string[];
  waypoint: string | null;
  circuit: number;
  circuitDone: boolean;
  defeatedBosses: string[];
  settings: Settings;
}

export interface FarmPlot { id: number; u: number; z: number; h: number; crop: string; planted: number; watered: number }

export const SAVE_KEY = 'ernas-world-v2';
export function newSave(): SaveData {
  return {
    version: 2,
    inventory: { pickaxe: 1, chisel: 1, hoe: 1, torch: 4, stone: 12, wood: 8, planks: 6, gold: 3, water: 3, berries: 5, cloth: 2, 'raw-meat': 1, 'wheat-seeds': 6, 'carrot-seeds': 4, chair: 1, table: 1 },
    body: healthyBody(), scars: [], hunger: 92, thirst: 88, poison: 0, oxygen: 100, coldExposure: 0, flight: false, elapsed: 190,
    mode: 'survival', position: null, edits: [], unlockedPylons: [...EXPEDITION_LINKS],
    companion: false, aurora: false, achievement: false, mined: 0, crafted: 0,
    kills: [], bossDefeated: false, toolQuality: 0.6, toolQualities: { sword: .6, pickaxe: .6 },
    toolDurability: { pickaxe: 120 }, toolMax: { pickaxe: 120 }, toolMaterials: { pickaxe: 'stone' }, farms: [],
    visitedBiomes: ['taiga'], visitedCaves: [], claimedCaches: [], waypoint: null, circuit: 0, circuitDone: false, defeatedBosses: [],
    settings: { volume: 25, sensitivity: 45, quality: 'balanced', reducedMotion: false },
  };
}

export function loadSave(): SaveData {
  const fallback = newSave();
  const number = (value: unknown, defaultValue: number, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : defaultValue;
  try {
    let saved: (Omit<SaveData, 'version'> & { version: number }) | null = null;
    for (const key of [SAVE_KEY, 'ernas-world-v1']) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const candidate = JSON.parse(raw) as Omit<SaveData, 'version'> & { version: number };
        if (candidate && [1, 2].includes(candidate.version) && candidate.inventory && typeof candidate.inventory === 'object' && !Array.isArray(candidate.inventory) && candidate.body && typeof candidate.body === 'object' && !Array.isArray(candidate.body) && Array.isArray(candidate.edits)) {
          saved = candidate; break;
        }
      } catch { /* A damaged current save must not hide an intact legacy backup. */ }
    }
    if (!saved) return fallback;
    const inventory = Object.fromEntries(Object.entries(saved.inventory).filter(([id, quantity]) => Object.prototype.hasOwnProperty.call(ITEMS, id) && Number.isFinite(quantity) && quantity >= 1).map(([id, quantity]) => [id, Math.floor(number(quantity, 0, 0, 99999))]));
    const body = Object.fromEntries(LIMBS.map(limb => [limb, Number.isFinite(saved.body[limb]) ? Math.max(0, Math.min(100, saved.body[limb])) : 100])) as Record<Limb, number>;
    return {
      ...fallback, ...saved, version: 2, inventory, body,
      hunger: number(saved.hunger, fallback.hunger, 0, 100),
      thirst: number(saved.thirst, fallback.thirst, 0, 100),
      poison: number(saved.poison, 0, 0, 45),
      oxygen: number(saved.oxygen, 100, 0, 100), coldExposure: number(saved.coldExposure, 0, 0, 100), flight: saved.mode === 'creative' && !!saved.flight,
      elapsed: number(saved.elapsed, fallback.elapsed, 0, 100000000),
      mode: saved.mode === 'creative' ? 'creative' : 'survival',
      position: saved.position && ['u', 'h', 'z', 'yaw', 'pitch'].every(key => typeof saved.position?.[key as keyof PlayerPosition] === 'number' && Number.isFinite(saved.position[key as keyof PlayerPosition])) ? saved.position : null,
      edits: saved.edits.filter(edit => edit && Number.isInteger(edit.x) && Number.isInteger(edit.y) && Number.isInteger(edit.z) && (edit.kind === null || BLOCK_KINDS.includes(edit.kind))),
      scars: Array.isArray(saved.scars) ? saved.scars.filter(limb => LIMBS.includes(limb)) : [],
      unlockedPylons: [...new Set([...EXPEDITION_LINKS, ...(Array.isArray(saved.unlockedPylons) ? saved.unlockedPylons.filter(id => PYLONS.some(pylon => pylon.id === id)) : [])])],
      visitedBiomes: Array.isArray(saved.visitedBiomes) ? [...new Set(saved.visitedBiomes.filter(id => BIOME_IDS.includes(id)))] : ['taiga'],
      visitedCaves: Array.isArray(saved.visitedCaves) ? [...new Set(saved.visitedCaves.filter(id => typeof id === 'string'))] : [],
      claimedCaches: Array.isArray(saved.claimedCaches) ? saved.claimedCaches.filter(id => typeof id === 'string' && PYLONS.some(pylon => `cache:${pylon.id}` === id)) : [],
      waypoint: PYLONS.some(pylon => pylon.id === saved.waypoint) ? saved.waypoint : null,
      circuit: number(saved.circuit, 0, 0, 100), circuitDone: !!saved.circuitDone,
      defeatedBosses: Array.isArray(saved.defeatedBosses) ? saved.defeatedBosses.filter(id => typeof id === 'string') : [],
      kills: Array.isArray(saved.kills) ? saved.kills.filter(name => typeof name === 'string') : [],
      mined: number(saved.mined, 0, 0, 99999999), crafted: number(saved.crafted, 0, 0, 99999999),
      toolQuality: number(saved.toolQuality, .6, 0, 1),
      toolQualities: Object.fromEntries(Object.entries({ ...fallback.toolQualities, ...(saved.toolQualities && typeof saved.toolQualities === 'object' ? saved.toolQualities : {}) }).filter(([id]) => ITEMS[id]?.category === 'Tools').map(([id, value]) => [id, number(value, .6, 0, 1)])),
      toolDurability: Object.fromEntries(Object.entries(saved.toolDurability && typeof saved.toolDurability === 'object' ? saved.toolDurability : fallback.toolDurability).filter(([id]) => ITEMS[id]?.category === 'Tools').map(([id, value]) => [id, number(value, 1, 0, 100000)])),
      toolMax: Object.fromEntries(Object.entries(saved.toolMax && typeof saved.toolMax === 'object' ? saved.toolMax : fallback.toolMax).filter(([id]) => ITEMS[id]?.category === 'Tools').map(([id, value]) => [id, number(value, 1, 1, 100000)])),
      toolMaterials: Object.fromEntries(Object.entries(saved.toolMaterials && typeof saved.toolMaterials === 'object' ? saved.toolMaterials : fallback.toolMaterials).filter(([tool, material]) => ITEMS[tool]?.category === 'Tools' && typeof material === 'string' && ITEMS[material])),
      farms: Array.isArray(saved.farms) ? saved.farms.filter(f => f && Number.isFinite(f.u) && Number.isFinite(f.z) && typeof f.crop === 'string' && CROPS[f.crop]).slice(0, 400).map((f, i) => ({ id: i + 1, u: number(f.u, 0, -CIRCUMFERENCE / 2, CIRCUMFERENCE / 2), z: number(f.z, 0, -HALF_LENGTH + 1, HALF_LENGTH - 1), h: number(f.h, 0, WORLD_FLOOR + 1, WORLD_CEILING), crop: f.crop, planted: number(f.planted, 0, 0, 1e9), watered: number(f.watered, 0, 0, 1e9) })) : [],
      companion: !!saved.companion, aurora: !!saved.aurora, achievement: !!saved.achievement, bossDefeated: !!saved.bossDefeated,
      settings: {
        volume: number(saved.settings?.volume, 25, 0, 100),
        sensitivity: number(saved.settings?.sensitivity, 45, 1, 100),
        quality: saved.settings?.quality === 'high' ? 'high' : 'balanced',
        reducedMotion: !!saved.settings?.reducedMotion,
      },
    };
  } catch { return fallback; }
}

export function storeSave(save: SaveData): boolean {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); return true; }
  catch { return false; }
}

export function sortedInventory(inventory: SaveData['inventory'], filter = 'All', search = '') {
  const order: ItemCategory[] = ['Tools', 'Materials', 'Provisions', 'Relics'];
  return (Object.entries(inventory) as [ItemId, number][])
    .filter(([id, quantity]) => quantity > 0 && (filter === 'All' || ITEMS[id].category === filter) && ITEMS[id].name.toLowerCase().includes(search.toLowerCase()))
    .sort(([a, aq], [b, bq]) => order.indexOf(ITEMS[a].category) - order.indexOf(ITEMS[b].category) || bq - aq || ITEMS[a].name.localeCompare(ITEMS[b].name));
}

export const FIELD_NOTES = [
  { id: 'world', number: '01', title: 'There is no outside.', subtitle: 'WORLD TOPOLOGY', text: 'You are standing on the inside of a cylinder. Gravity pulls toward the iron shell. Walk far enough around the inner wall and your footprints will hang above your head. The perfect sun at the central axis has no voxels to break.', hint: 'Hold Space to spread your wings. In creative mode, F toggles unrestricted flight.' },
  { id: 'body', number: '02', title: 'You are a fragile thing.', subtitle: 'MOTH PHYSIOLOGY', text: 'Your head, torso, wings, legs, and eyes each have their own integrity. An injured wing weakens flight. Two missing legs leave only a rolling crawl. A lost eye closes half the world forever. Sleep repairs injured limbs, never lost ones.', hint: 'Check your body with B. Bind a wound using mothsilk cloth.' },
  { id: 'craft', number: '03', title: 'Find the shape inside.', subtitle: 'SUB-VOXEL CHISELING', text: 'There is no recipe that will make your hands clever. Set down stone, choose an edge, and remove what does not belong. Each block is divided into an 8 x 8 x 8 sub-grid. The closer your silhouette, the better your tool.', hint: 'Open the shaping bench with C. Drag across cells to chisel. You can undo a cut.' },
  { id: 'pylon', number: '04', title: 'Some distances can be folded.', subtitle: 'WORLD ATLAS / PYLON NETWORK', text: 'The inner wall extends 2,048 blocks around and 1,536 along its axis, almost 120 times the original surface. Eighteen expedition pylons connect its seventeen biomes, from the Titan Range to the dead Outer Sphere. The Fracture still waits to be awakened in person.', hint: 'Press M or P for the atlas. Travel from a nearby pylon, or set a walking waypoint. Creative mode unlocks every pylon and permits survey jumps from anywhere.' },
  { id: 'chill', number: '05', title: 'A small, square kindness.', subtitle: 'THE CHILL ENTITY', text: 'Not everything here wants something from you. A little cube with legs knows a great deal about making things. Perhaps all you need to do is say hello. It is particularly opinionated about steamed pork.', hint: 'Open chat with T. Type "hey". Ask about crafting, cheese, pylons, or steam.' },
  { id: 'obil', number: '06', title: 'What goes out comes back.', subtitle: 'OBIL / FIRST DISTURBANCE', text: 'In the Broken Lands, an obelisk takes the ground apart. Its gravity gathers stones into an orbit, then sends them toward you. Strike a projectile before it reaches you. Three reflected stones will break its core.', hint: 'A sword makes the timing easier. Left-click when an incoming stone is close.' },
  { id: 'biomes', number: '07', title: 'Seventeen kinds of unfamiliar.', subtitle: 'THE BIOME MATRIX', text: 'Snowy taiga, sinkholes, sky rings and cloud nests, reefs and the abyss, broken lands, spiked forest, storm fields, deserts, blood shores, and giant groves are now joined by the colossal Titan Range mountains, the molten Cinder Wastes, a glowing Mushroom Marsh, the desolate Bonefields, and the dead Outer Sphere and its Socket-and-Plug circuit.', hint: 'The atlas shows biome boundaries, terrain, pylons, your position, and surveyed regions. Every expedition pylon but the Hearth has a one-time provision cache nearby.' },
  { id: 'caves', number: '08', title: 'The crust goes down a long way.', subtitle: 'SIXTY-FIVE SUBTERRANEAN BIOMES', text: 'Beneath every surface region lies an extremely thick crust, more than five hundred blocks deep, divided into seven strata. Sixty-five cave biomes live down there and nowhere else: dripstone halls, glowworm grottoes, fungal blooms, drowned galleries, gold lodes, amethyst geodes, lava tubes, bone pits, buried cities, machine halls, echoing hollows, void pockets, and at the very bottom, the Cradle.', hint: 'Dig down, or find a natural shaft. Each stratum holds different biomes, and the deeper ones are darker, richer, and less friendly. Bring a light and watch your footing.' },
  { id: 'depth', number: '09', title: 'The water has a bottom.', subtitle: 'DIVING / ENVIRONMENTAL EXPOSURE', text: 'Coral shelves lead into deep, lightless trenches. You can swim down, but your lungs and body are not made for the abyss. Air drains while submerged. Deep water applies pressure damage. In the Spiked Forest, the crystals irradiate nearby bodies. The desert doubles your thirst loss.', hint: 'Space rises, Ctrl dives. The Dive control also appears on touchscreens. Return to the surface for air. Pylon clearings protect against cold and radiation, but cannot make you breathe underwater.' },
  { id: 'bestiary', number: '10', title: 'Everything that moves.', subtitle: 'SPECIES INDEX / THE BESTIARY', text: 'Ninety species share the cylinder with you, and every one of them has its own opinion about that. Some graze, some scatter, some track you by heat, sound, or the taste of the air. What follows is the whole roster, grouped by the country it keeps, with the mood it wakes up in and what it leaves behind when it falls.', hint: 'Creatures arrive based on biome, depth, and hour. Night brings its own company; the deep strata bring worse. Kill with a weapon to claim a drop. Strike a creature and it will remember you.' },
  { id: 'beyond', number: '11', title: 'Echoes of another world.', subtitle: 'OUTER-WORLD ECOLOGIES', text: 'The pale dunes, blood shores, crystal forest, and giant tree settlements are explorable echoes of the outer desert sphere, generated here on the inner cylinder. Their landscapes and materials are real, but the separate outer planet, plug-and-socket circuit, sapient traders, and cosmic endgame remain beyond this build.', hint: 'This expansion adds environments, not the later dimensions or multiplayer. Your previous settlement and world edits are retained in the original central region.' },
];