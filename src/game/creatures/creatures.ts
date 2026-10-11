import * as THREE from 'three';
import { BIOME_IDS, type Biome } from '../world/biomes';
import { ITEMS } from '../data/model';

/* ==========================================================================
 * Species schema
 * ========================================================================== */

/** How a species treats the player when it notices them. */
export type Temperament = 'passive' | 'skittish' | 'hostile' | 'ambient';

/** How a species gets around. */
export type Locomotion = 'walk' | 'fly' | 'swim' | 'hop';

/** Coarse grouping used by the bestiary tables and the field notes index. */
export type CreatureGroup =
  | 'pasture' | 'woodland' | 'wetland' | 'polar' | 'sky'
  | 'desert' | 'waste' | 'shore' | 'deep' | 'underground';

export interface CreatureDefinition {
  id: string;
  name: string;
  group: CreatureGroup;
  temperament: Temperament;
  locomotion: Locomotion;
  /** Surface biomes this species spawns in. Empty means underground only. */
  biomes: Biome[];
  /** Cave-only species appear from this stratum downward (0 = shallowest). */
  minStratum?: number;
  /** Only shows itself once the sun is low. */
  nocturnal?: boolean;
  hp: number;
  /** Damage per strike. Passive and ambient species deal none. */
  damage: number;
  speed: number;
  /** Relative chance of being rolled by the spawn table. */
  weight: number;
  /** Item dropped on death, and how many. */
  drop: string;
  dropCount: number;
  /** Vertical offset above the ground used by flyers and swimmers. */
  hover?: number;
  /** Model scale multiplier. */
  scale?: number;
  /** Wings that beat while moving. */
  flutter?: boolean;
  /** Message shown when the species damages you by touch rather than by chase. */
  sting?: string;
  /** Walks happily through shallow fluid instead of refusing to enter it. */
  amphibious?: boolean;
  /** One line of field notes. */
  flavour: string;
}

/** A roster row, before the shared defaults are filled in. */
type CreatureSeed = Omit<CreatureDefinition, 'damage' | 'weight'> & {
  damage?: number;
  weight?: number;
};

const GROUPS: { id: CreatureGroup; label: string; subtitle: string }[] = [
  { id: 'pasture', label: 'Pasture and farmland', subtitle: 'MEADOW, SAVANNA, AND SETTLED GROUND' },
  { id: 'woodland', label: 'Woodland and canopy', subtitle: 'TAIGA, GIANT GROVES, AND JUNGLE' },
  { id: 'wetland', label: 'Wetland and fungal marsh', subtitle: 'SWAMP, SPOREHOLLOW, AND SINKHOLES' },
  { id: 'polar', label: 'Cold and high ground', subtitle: 'TUNDRA, GLACIER, AND THE TITAN RANGE' },
  { id: 'sky', label: 'Sky and weather', subtitle: 'SKY RING, CLOUD NESTS, AND STORM FIELDS' },
  { id: 'desert', label: 'Sand and stone wastes', subtitle: 'DESERT, BADLANDS, AND CANYON' },
  { id: 'waste', label: 'Ash, bone, and dead world', subtitle: 'VOLCANIC, BONEFIELDS, AND OUTER SPHERE' },
  { id: 'shore', label: 'Shallows and coastline', subtitle: 'REEFS, SHORES, AND THE SUNLIT SEA' },
  { id: 'deep', label: 'The deep ocean', subtitle: 'ABYSSAL TRENCHES AND PRESSURE' },
  { id: 'underground', label: 'Underground strata', subtitle: 'CAVES, STRATA 0-6, AND THE CRADLE' },
];

export const CREATURE_GROUPS = GROUPS;

/* ==========================================================================
 * The roster
 *
 * One entry per species. Shared defaults are filled in below: damage is 0
 * unless the species is written with one, and weight is 1 unless written.
 * Heavier weights are common; weights below .3 are rare.
 * ========================================================================== */

const ROSTER: CreatureSeed[] = [
  /* ---- Pasture and farmland ------------------------------------------- */
  {
    id: 'cow', name: 'Cow', group: 'pasture', temperament: 'passive', locomotion: 'walk',
    biomes: ['meadow', 'savanna', 'taiga', 'highlands'], hp: 40, speed: .5,
    drop: 'raw-meat', dropCount: 2,
    flavour: 'Placid, enormous, and entirely unbothered by the shape of the sky.',
  },
  {
    id: 'sheep', name: 'Sheep', group: 'pasture', temperament: 'passive', locomotion: 'walk',
    biomes: ['meadow', 'highlands', 'tundra', 'alpine'], hp: 28, speed: .55,
    drop: 'cloth', dropCount: 2,
    flavour: 'A walking cloud with firm opinions about where the fence ought to be.',
  },
  {
    id: 'pig', name: 'Pig', group: 'pasture', temperament: 'passive', locomotion: 'walk',
    biomes: ['meadow', 'taiga', 'savanna', 'grove'], hp: 30, speed: .6,
    drop: 'raw-meat', dropCount: 2,
    flavour: 'It has already forgiven you for whatever you are about to do.',
  },
  {
    id: 'horse', name: 'Steppe horse', group: 'pasture', temperament: 'passive', locomotion: 'walk',
    biomes: ['savanna', 'meadow', 'badlands', 'canyon'], hp: 55, speed: 1.15,
    drop: 'leather', dropCount: 2, scale: 1.35,
    flavour: 'Faster than you are, and quietly aware of it.',
  },
  {
    id: 'chicken', name: 'Chicken', group: 'pasture', temperament: 'skittish', locomotion: 'walk',
    biomes: ['meadow', 'savanna', 'taiga', 'grove', 'jungle'], hp: 10, speed: 1.1,
    drop: 'boiled-egg', dropCount: 1,
    flavour: 'Small, loud, and convinced every shadow is a hawk.',
  },
  {
    id: 'dog', name: 'Dog', group: 'pasture', temperament: 'passive', locomotion: 'walk',
    biomes: ['meadow', 'taiga', 'savanna', 'highlands'], hp: 26, speed: .95,
    drop: 'leather', dropCount: 0,
    flavour: 'It has decided you are worth following. This is not negotiable.',
  },
  {
    id: 'cat', name: 'Cat', group: 'pasture', temperament: 'skittish', locomotion: 'walk',
    biomes: ['meadow', 'grove', 'desert', 'badlands'], hp: 14, speed: 1.7,
    drop: 'string', dropCount: 0,
    flavour: 'It has decided you are not worth following. This is also not negotiable.',
  },
  {
    id: 'butterfly', name: 'Butterfly', group: 'pasture', temperament: 'ambient', locomotion: 'fly',
    biomes: ['meadow', 'jungle', 'grove', 'savanna'], hp: 2, speed: 1.4,
    weight: 1.2, drop: 'feather', dropCount: 0, hover: 1.6, scale: .4, flutter: true,
    flavour: 'A scrap of colour that has never once landed where you expected.',
  },
  {
    id: 'meerkat', name: 'Dune meerkat', group: 'pasture', temperament: 'ambient', locomotion: 'walk',
    biomes: ['desert', 'savanna', 'badlands'], hp: 9, speed: 1.3,
    weight: 1.2, drop: 'raw-meat', dropCount: 1, scale: .5,
    flavour: 'One of them always watches the sky. It is never the one you are looking at.',
  },
  {
    id: 'stagbeetle', name: 'Stag beetle', group: 'pasture', temperament: 'ambient', locomotion: 'walk',
    biomes: ['meadow', 'jungle', 'grove'], hp: 6, speed: .5,
    weight: 1.2, drop: 'chitin', dropCount: 1, scale: .7,
    flavour: 'It carries its own weapons and has never once needed them against you.',
  },

  /* ---- Woodland and canopy -------------------------------------------- */
  {
    id: 'kiwi', name: 'Kiwi bird', group: 'woodland', temperament: 'skittish', locomotion: 'walk',
    biomes: ['grove', 'jungle', 'taiga', 'mushroom', 'sinkholes'], hp: 12, speed: 1.4,
    drop: 'roast-kiwi', dropCount: 1,
    flavour: 'A quiet, round, flightless bird that snuffles through the leaf litter.',
  },
  {
    id: 'owl', name: 'Owl', group: 'woodland', temperament: 'ambient', locomotion: 'fly',
    biomes: ['taiga', 'grove', 'highlands', 'alpine'], hp: 14, speed: 2.2,
    weight: 1.2, drop: 'feather', dropCount: 2, hover: 5,
    nocturnal: true, flutter: true,
    flavour: 'It watches you from a branch with grave and total attention.',
  },
  {
    id: 'monkey', name: 'Canopy monkey', group: 'woodland', temperament: 'skittish', locomotion: 'walk',
    biomes: ['jungle', 'grove'], hp: 18, speed: 1.8,
    drop: 'sweet-berry', dropCount: 2,
    flavour: 'One look at you, one decision, and the canopy is suddenly empty.',
  },
  {
    id: 'parrot', name: 'Reef parrot', group: 'woodland', temperament: 'ambient', locomotion: 'fly',
    biomes: ['jungle', 'grove', 'reef', 'savanna'], hp: 10, speed: 1.9,
    weight: 1.2, drop: 'feather', dropCount: 2, hover: 4, flutter: true,
    flavour: 'It repeats the last thing you said, badly, and at considerable volume.',
  },
  {
    id: 'moth', name: 'Great moth', group: 'woodland', temperament: 'ambient', locomotion: 'fly',
    biomes: ['grove', 'sinkholes', 'highlands', 'taiga'], hp: 16, speed: 1.1,
    weight: 1.2, drop: 'cloth', dropCount: 2, hover: 4, scale: 1.6,
    nocturnal: true, flutter: true,
    flavour: 'Wings the span of your arms, dusted with the pale light of the canopy.',
  },
  {
    id: 'hornet', name: 'Canopy hornet', group: 'woodland', temperament: 'hostile', locomotion: 'fly',
    biomes: ['jungle', 'grove', 'mushroom'], hp: 14, damage: 6, speed: 2.6,
    weight: .5, drop: 'chitin', dropCount: 1, hover: 3, scale: .7, flutter: true,
    flavour: 'One of them is a nuisance. The noise behind the first one is the threat.',
  },
  {
    id: 'panther', name: 'Grove panther', group: 'woodland', temperament: 'hostile', locomotion: 'walk',
    biomes: ['jungle', 'grove'], hp: 55, damage: 14, speed: 2.2,
    weight: .4, drop: 'leather', dropCount: 3,
    nocturnal: true,
    flavour: 'You will not hear it coming. That is rather the entire point of it.',
  },
  {
    id: 'gull', name: 'Salt gull', group: 'woodland', temperament: 'ambient', locomotion: 'fly',
    biomes: ['reef', 'blood', 'desert', 'taiga'], hp: 9, speed: 1.8,
    weight: 1.2, drop: 'feather', dropCount: 2, hover: 8, flutter: true,
    flavour: 'It will take your food, your patience, and then the whole afternoon.',
  },

  /* ---- Wetland and fungal marsh --------------------------------------- */
  {
    id: 'frog', name: 'Frog', group: 'wetland', temperament: 'passive', locomotion: 'hop',
    biomes: ['swamp', 'meadow', 'jungle', 'mushroom', 'sinkholes'], hp: 8, speed: 1.6,
    drop: 'cheese', dropCount: 0, amphibious: true,
    flavour: 'Waiting, patiently, for someone to offer it cheese.',
  },
  {
    id: 'toad', name: 'Horned toad', group: 'wetland', temperament: 'passive', locomotion: 'hop',
    biomes: ['swamp', 'jungle', 'mushroom', 'sinkholes'], hp: 14, speed: 1.2,
    drop: 'spore-cap', dropCount: 1, amphibious: true,
    flavour: 'Patient, damp, and utterly unimpressed by the sword you are holding.',
  },
  {
    id: 'snail', name: 'Glow snail', group: 'wetland', temperament: 'ambient', locomotion: 'walk',
    biomes: ['mushroom', 'swamp', 'sinkholes'], hp: 4, speed: .1,
    weight: 1.2, drop: 'glow-fungus', dropCount: 1, scale: .5,
    flavour: 'Leaves a faint luminous trail across the mycelium.',
  },
  {
    id: 'firefly', name: 'Firefly swarm', group: 'wetland', temperament: 'ambient', locomotion: 'fly',
    biomes: ['swamp', 'meadow', 'mushroom', 'grove'], hp: 1, speed: .8,
    weight: 1.2, drop: 'glowstone', dropCount: 0, hover: 2, scale: .35,
    nocturnal: true, flutter: true,
    flavour: 'A drifting constellation that only comes out after dark.',
  },
  {
    id: 'wisp', name: 'Will-o-wisp', group: 'wetland', temperament: 'ambient', locomotion: 'fly',
    biomes: ['swamp', 'mushroom', 'sinkholes'], hp: 5, speed: .9,
    weight: 1.2, drop: 'glow-fungus', dropCount: 1, hover: 2.5, scale: .5,
    nocturnal: true, flutter: true,
    flavour: 'A light that leads, and never to anywhere you meant to go.',
  },
  {
    id: 'heron', name: 'Grey heron', group: 'wetland', temperament: 'ambient', locomotion: 'walk',
    biomes: ['swamp', 'reef', 'meadow', 'jungle'], hp: 16, speed: .7,
    weight: 1.2, drop: 'feather', dropCount: 2,
    flavour: 'It stands so perfectly still that you begin to doubt it is alive at all.',
  },
  {
    id: 'leech', name: 'Marsh leech', group: 'wetland', temperament: 'hostile', locomotion: 'swim',
    biomes: ['swamp', 'mushroom'], hp: 8, damage: 4, speed: 1.4,
    weight: .45, drop: 'blood', dropCount: 1, scale: .6,
    flavour: 'It does not want to kill you. It wants a snack, and you are the snack.',
  },
  {
    id: 'sporeling', name: 'Sporeling', group: 'wetland', temperament: 'hostile', locomotion: 'hop',
    biomes: ['mushroom', 'swamp'], hp: 18, damage: 6, speed: 1.2,
    weight: .45, drop: 'spore-cap', dropCount: 2,
    flavour: 'A walking mushroom cap with far too many small legs under it.',
  },
  {
    id: 'mireling', name: 'Mireling', group: 'wetland', temperament: 'hostile', locomotion: 'walk',
    biomes: ['swamp'], hp: 38, damage: 9, speed: .7,
    weight: .45, drop: 'mud', dropCount: 3,
    flavour: 'The mud stood up. It seems genuinely annoyed about having done so.',
  },
  {
    id: 'crocodile', name: 'Blood crocodile', group: 'wetland', temperament: 'hostile', locomotion: 'swim',
    biomes: ['swamp', 'reef', 'blood'], hp: 70, damage: 16, speed: 1.5,
    weight: .3, drop: 'leather', dropCount: 3, hover: -1.5, scale: 1.3,
    flavour: 'It has been floating there, pretending to be a log, for an hour.',
  },

  /* ---- Cold and high ground ------------------------------------------- */
  {
    id: 'goat', name: 'Mountain goat', group: 'polar', temperament: 'skittish', locomotion: 'walk',
    biomes: ['alpine', 'highlands', 'glacier', 'sky'], hp: 30, speed: 1.3,
    drop: 'raw-meat', dropCount: 1,
    flavour: 'Standing calmly on a ledge no sane creature should be able to reach.',
  },
  {
    id: 'penguin', name: 'Penguin', group: 'polar', temperament: 'passive', locomotion: 'walk',
    biomes: ['glacier', 'tundra', 'alpine'], hp: 18, speed: .9,
    drop: 'raw-fish', dropCount: 1,
    flavour: 'Dignified on the ice, and a comedy everywhere else.',
  },
  {
    id: 'mammoth', name: 'Woolly mammoth', group: 'polar', temperament: 'passive', locomotion: 'walk',
    biomes: ['tundra', 'glacier'], hp: 140, speed: .45,
    weight: .35, drop: 'leather', dropCount: 4, scale: 1.9,
    flavour: 'A walking hill of hair and patience, older than the taiga around it.',
  },
  {
    id: 'caribou', name: 'Caribou', group: 'polar', temperament: 'passive', locomotion: 'walk',
    biomes: ['tundra', 'glacier', 'taiga', 'alpine'], hp: 60, speed: .9,
    drop: 'leather', dropCount: 2, scale: 1.4,
    flavour: 'The herd crosses the ice in a line you could set your watch by.',
  },
  {
    id: 'hare', name: 'Snow hare', group: 'polar', temperament: 'skittish', locomotion: 'walk',
    biomes: ['tundra', 'glacier', 'meadow', 'highlands'], hp: 8, speed: 2.4,
    drop: 'raw-meat', dropCount: 1, scale: .55,
    flavour: 'It was there the whole time. It is simply faster than your eyes are.',
  },
  {
    id: 'fox', name: 'Arctic fox', group: 'polar', temperament: 'skittish', locomotion: 'walk',
    biomes: ['glacier', 'tundra', 'alpine'], hp: 16, speed: 1.9,
    drop: 'leather', dropCount: 1, scale: .7,
    flavour: 'Small, white, and better at this world than you will ever be.',
  },
  {
    id: 'eagle', name: 'Ridge eagle', group: 'polar', temperament: 'hostile', locomotion: 'fly',
    biomes: ['alpine', 'highlands', 'sky'], hp: 35, damage: 10, speed: 2.4,
    weight: .4, drop: 'feather', dropCount: 3, hover: 6, flutter: true,
    flavour: 'It decides, from a great and unhurried height, that you look edible.',
  },
  {
    id: 'frostwolf', name: 'Frost wolf', group: 'polar', temperament: 'hostile', locomotion: 'walk',
    biomes: ['glacier', 'tundra', 'alpine', 'taiga'], hp: 44, damage: 12, speed: 2.1,
    weight: .45, drop: 'leather', dropCount: 2, nocturnal: true,
    flavour: 'White on white. You hear it long before you ever see it.',
  },
  {
    id: 'snowwalker', name: 'Snowwalker', group: 'polar', temperament: 'hostile', locomotion: 'walk',
    biomes: ['glacier', 'tundra'], hp: 110, damage: 18, speed: 1.1,
    weight: .1, drop: 'blue-ice', dropCount: 3, scale: 1.7, nocturnal: true,
    flavour: 'Something tall and pale that walks through blizzards as if they were doors.',
  },

  /* ---- Sky and weather ------------------------------------------------- */
  {
    id: 'skysquirrel', name: 'Sky squirrel', group: 'sky', temperament: 'hostile', locomotion: 'fly',
    biomes: ['sky', 'clouds', 'alpine'], hp: 12, damage: 6, speed: 2.6,
    weight: .45, drop: 'feather', dropCount: 1, hover: 3,
    flavour: 'A fast, furious ball of fur that dive-bombs anything on its ledge.',
  },
  {
    id: 'cloudserpent', name: 'Cloud serpent', group: 'sky', temperament: 'hostile', locomotion: 'fly',
    biomes: ['clouds', 'sky', 'storm'], hp: 70, damage: 16, speed: 2,
    weight: .2, drop: 'wyrm-scale', dropCount: 1, hover: 6, scale: 1.5,
    flavour: 'A ribbon of scales sliding through the vapour, hunting by silhouette.',
  },
  {
    id: 'thunderling', name: 'Thunderling', group: 'sky', temperament: 'hostile', locomotion: 'fly',
    biomes: ['storm', 'broken'], hp: 26, damage: 9, speed: 2.8,
    weight: .5, drop: 'storm-glass', dropCount: 1, hover: 3, scale: .6, flutter: true,
    flavour: 'Small, fast, and crackling with the storm that happened to spawn it.',
  },
  {
    id: 'skywhale', name: 'Sky whale', group: 'sky', temperament: 'ambient', locomotion: 'fly',
    biomes: ['clouds', 'sky'], hp: 160, speed: .6,
    weight: 1, drop: 'cloudstone', dropCount: 3, hover: 14, scale: 3,
    flavour: 'A slow grey island, singing to itself a mile above the snow.',
  },
  {
    id: 'cloudjelly', name: 'Cloud jelly', group: 'sky', temperament: 'ambient', locomotion: 'fly',
    biomes: ['clouds', 'sky', 'storm'], hp: 6, speed: .6,
    weight: 1.2, drop: 'glowstone', dropCount: 1, hover: 6, scale: .9, flutter: true,
    flavour: 'Mostly water, briefly shaped. It does not appear to be in any hurry.',
  },
  {
    id: 'roc', name: 'Storm roc', group: 'sky', temperament: 'hostile', locomotion: 'fly',
    biomes: ['clouds', 'storm', 'sky'], hp: 90, damage: 18, speed: 2.2,
    weight: .1, drop: 'feather', dropCount: 4, hover: 8, scale: 1.8, flutter: true,
    flavour: 'Its shadow arrives a full second before the rest of it does.',
  },

  /* ---- Sand and stone wastes ------------------------------------------ */
  {
    id: 'camel', name: 'Camel', group: 'desert', temperament: 'passive', locomotion: 'walk',
    biomes: ['desert', 'badlands', 'outer', 'bone'], hp: 48, speed: .7,
    drop: 'leather', dropCount: 2,
    flavour: 'Tall, disdainful, and better at the desert than you will ever be.',
  },
  {
    id: 'tortoise', name: 'Sand tortoise', group: 'desert', temperament: 'passive', locomotion: 'walk',
    biomes: ['desert', 'savanna', 'badlands'], hp: 60, speed: .2,
    drop: 'shell', dropCount: 1,
    flavour: 'It will get there. Eventually. It has always gotten there.',
  },
  {
    id: 'lizard', name: 'Sun lizard', group: 'desert', temperament: 'skittish', locomotion: 'walk',
    biomes: ['desert', 'badlands', 'canyon', 'volcanic'], hp: 9, speed: 2,
    drop: 'leather', dropCount: 0, scale: .6,
    flavour: 'A quick flick of scales across hot stone, and then nothing at all.',
  },
  {
    id: 'ostrich', name: 'Dust ostrich', group: 'desert', temperament: 'skittish', locomotion: 'walk',
    biomes: ['desert', 'savanna', 'badlands'], hp: 30, speed: 2.6,
    drop: 'feather', dropCount: 3, scale: 1.5,
    flavour: 'It cannot fly, and it would like you to know it does not need to.',
  },
  {
    id: 'scorpion', name: 'Dune scorpion', group: 'desert', temperament: 'hostile', locomotion: 'walk',
    biomes: ['desert', 'badlands', 'outer', 'canyon'], hp: 35, damage: 10, speed: 1.4,
    weight: .45, drop: 'chitin', dropCount: 2,
    flavour: 'Sand-coloured until it is very far too late to notice.',
  },
  {
    id: 'jackal', name: 'Canyon jackal', group: 'desert', temperament: 'hostile', locomotion: 'walk',
    biomes: ['badlands', 'canyon', 'desert', 'savanna'], hp: 38, damage: 10, speed: 2.3,
    weight: .5, drop: 'leather', dropCount: 1, nocturnal: true,
    flavour: 'You will never see the whole pack. You will hear every part of it.',
  },
  {
    id: 'sandserpent', name: 'Sand serpent', group: 'desert', temperament: 'hostile', locomotion: 'walk',
    biomes: ['desert', 'badlands'], hp: 65, damage: 15, speed: 1.6,
    weight: .2, drop: 'sandstone', dropCount: 2, scale: 1.6,
    flavour: 'The dune moves against the wind, and then it is much closer to you.',
  },
  {
    id: 'vulture', name: 'Bone vulture', group: 'desert', temperament: 'ambient', locomotion: 'fly',
    biomes: ['bone', 'desert', 'badlands', 'outer'], hp: 20, speed: 1.6,
    weight: 1.2, drop: 'feather', dropCount: 2, hover: 12, scale: 1.2, flutter: true,
    flavour: 'Circling, always, over something that has not died yet.',
  },
  {
    id: 'glasswing', name: 'Glasswing', group: 'desert', temperament: 'ambient', locomotion: 'fly',
    biomes: ['spiked', 'desert', 'canyon', 'crystalcave'], hp: 3, speed: 1.5,
    weight: 1.2, drop: 'glass', dropCount: 1, hover: 2, scale: .6, flutter: true,
    flavour: 'Wings so thin the sky shows through, in a place where nothing is transparent.',
  },

  /* ---- Ash, bone, and dead world -------------------------------------- */
  {
    id: 'ashwalker', name: 'Ash walker', group: 'waste', temperament: 'hostile', locomotion: 'walk',
    biomes: ['volcanic'], hp: 60, damage: 15, speed: .9,
    weight: .45, drop: 'ember', dropCount: 2,
    flavour: 'Cooled slag in the shape of a person, still glowing at the seams.',
  },
  {
    id: 'cinderhound', name: 'Cinder hound', group: 'waste', temperament: 'hostile', locomotion: 'walk',
    biomes: ['volcanic', 'broken'], hp: 55, damage: 16, speed: 2.2,
    weight: .45, drop: 'ember', dropCount: 2,
    flavour: 'It leaves small fires where its feet fall. It does not seem to notice them.',
  },
  {
    id: 'salamander', name: 'Ember salamander', group: 'waste', temperament: 'passive', locomotion: 'walk',
    biomes: ['volcanic', 'canyon', 'badlands'], hp: 20, speed: .7,
    drop: 'sulfur', dropCount: 1, scale: .8,
    flavour: 'It sleeps in the warm cracks and wakes only to be indignant at you.',
  },
  {
    id: 'obsidianbeetle', name: 'Obsidian beetle', group: 'waste', temperament: 'ambient', locomotion: 'walk',
    biomes: ['volcanic', 'broken'], hp: 8, speed: .6,
    weight: 1.2, drop: 'obsidian', dropCount: 1, scale: .6,
    flavour: 'Six legs of black glass, ticking across the cooled flow.',
  },
  {
    id: 'bonethief', name: 'Bone thief', group: 'waste', temperament: 'hostile', locomotion: 'walk',
    biomes: ['bone', 'broken', 'desert'], hp: 40, damage: 12, speed: 1.5,
    weight: .45, drop: 'bone-block', dropCount: 3, nocturnal: true,
    flavour: 'A hunched thing that collects what other creatures leave behind, including you.',
  },
  {
    id: 'scarab', name: 'Tomb scarab', group: 'waste', temperament: 'ambient', locomotion: 'walk',
    biomes: ['bone', 'desert', 'outer'], hp: 7, speed: .5,
    weight: 1.2, drop: 'chitin', dropCount: 1, scale: .5,
    flavour: 'It rolls something small and round toward a hole you will never find.',
  },
  {
    id: 'gravemoth', name: 'Grave moth', group: 'waste', temperament: 'ambient', locomotion: 'fly',
    biomes: ['bone', 'outer'], hp: 6, speed: 1,
    weight: 1.2, drop: 'cloth', dropCount: 1, hover: 3, scale: 1.1,
    nocturnal: true, flutter: true,
    flavour: 'Drawn to the pale lights that gather over very old bones.',
  },
  {
    id: 'scraphound', name: 'Scrap hound', group: 'waste', temperament: 'hostile', locomotion: 'walk',
    biomes: ['outer', 'bone', 'broken'], hp: 42, damage: 11, speed: 1.9,
    weight: .45, drop: 'scrap-metal', dropCount: 2,
    flavour: 'Assembled from whatever the dead world dropped, and loyal to nothing.',
  },
  {
    id: 'terminus', name: 'Terminus protector', group: 'waste', temperament: 'hostile', locomotion: 'walk',
    biomes: ['outer'], hp: 120, damage: 20, speed: 1,
    weight: .1, drop: 'circuit', dropCount: 3, scale: 1.6,
    flavour: 'A rusted sentinel still guarding a circuit no one remembers closing.',
  },
  {
    id: 'crystalcrawler', name: 'Crystal crawler', group: 'waste', temperament: 'hostile', locomotion: 'walk',
    biomes: ['crystalcave', 'spiked'], hp: 55, damage: 13, speed: .8,
    weight: .45, drop: 'crystal-shard', dropCount: 2,
    flavour: 'A beetle armoured in living crystal, humming as it comes.',
  },
  {
    id: 'geodecrab', name: 'Geode crab', group: 'waste', temperament: 'hostile', locomotion: 'walk',
    biomes: ['crystalcave', 'spiked', 'broken'], hp: 60, damage: 12, speed: .9,
    weight: .45, drop: 'crystal-shard', dropCount: 2, scale: 1.1,
    flavour: 'It grew its own armour, slowly, and is proud of every single facet.',
  },

  /* ---- Shallows and coastline ----------------------------------------- */
  {
    id: 'cod', name: 'Cod', group: 'shore', temperament: 'ambient', locomotion: 'swim',
    biomes: ['reef', 'deepocean', 'abyss'], hp: 6, speed: 1.2,
    weight: 1.2, drop: 'raw-fish', dropCount: 1, hover: -3, scale: .8, flutter: true,
    flavour: 'Silver, unremarkable, and delicious.',
  },
  {
    id: 'salmon', name: 'Salmon', group: 'shore', temperament: 'ambient', locomotion: 'swim',
    biomes: ['taiga', 'meadow', 'reef'], hp: 8, speed: 1.6,
    weight: 1.2, drop: 'raw-fish', dropCount: 1, hover: -2, scale: .9, flutter: true,
    flavour: 'Fighting upstream, as it always has, in a river with no sea to reach.',
  },
  {
    id: 'jellyfish', name: 'Moon jelly', group: 'shore', temperament: 'ambient', locomotion: 'swim',
    biomes: ['reef', 'deepocean'], hp: 3, damage: 4, speed: .3,
    weight: 1.2, drop: 'glowstone', dropCount: 0, hover: -4, scale: .8,
    sting: 'The jelly stings.',
    flavour: 'A slow pale bell that stings anyone careless enough to brush it.',
  },
  {
    id: 'turtle', name: 'Sea turtle', group: 'shore', temperament: 'passive', locomotion: 'swim',
    biomes: ['reef', 'deepocean'], hp: 45, speed: .6,
    drop: 'shell', dropCount: 1, hover: -2.5, scale: 1.3, amphibious: true, flutter: true,
    flavour: 'Ancient and unhurried, gliding over the coral like a slow cloud.',
  },
  {
    id: 'ray', name: 'Reef ray', group: 'shore', temperament: 'ambient', locomotion: 'swim',
    biomes: ['reef', 'deepocean'], hp: 14, speed: .9,
    weight: 1.2, drop: 'raw-fish', dropCount: 1, hover: -3, scale: 1.4, flutter: true,
    flavour: 'A slow dark kite, riding a current you cannot see and will never feel.',
  },
  {
    id: 'starfish', name: 'Reef star', group: 'shore', temperament: 'ambient', locomotion: 'walk',
    biomes: ['reef'], hp: 4, speed: .08,
    weight: 1.2, drop: 'rose-coral', dropCount: 1, scale: .5, amphibious: true,
    flavour: 'It moves so slowly that the coral has come to think of it as furniture.',
  },
  {
    id: 'hermitcrab', name: 'Hermit crab', group: 'shore', temperament: 'passive', locomotion: 'walk',
    biomes: ['reef', 'desert', 'savanna'], hp: 10, speed: .6,
    drop: 'shell', dropCount: 1, scale: .6, amphibious: true,
    flavour: 'It has found a house, and it is not moving again for anything.',
  },
  {
    id: 'piranha', name: 'River piranha', group: 'shore', temperament: 'hostile', locomotion: 'swim',
    biomes: ['swamp', 'jungle', 'reef'], hp: 16, damage: 7, speed: 2.4,
    weight: .45, drop: 'raw-fish', dropCount: 1, scale: .6, flutter: true,
    flavour: 'You will feel the first one. You will not feel the rest of them.',
  },
  {
    id: 'barracuda', name: 'Barracuda', group: 'shore', temperament: 'hostile', locomotion: 'swim',
    biomes: ['reef', 'deepocean', 'abyss'], hp: 42, damage: 12, speed: 2,
    weight: .45, drop: 'raw-fish', dropCount: 2, flutter: true,
    flavour: 'It has been following you for some time now, at a very reasonable distance.',
  },
  {
    id: 'flamingo', name: 'Two-headed flamingo', group: 'shore', temperament: 'hostile', locomotion: 'walk',
    biomes: ['blood', 'swamp', 'reef'], hp: 48, damage: 11, speed: 1.4,
    weight: .45, drop: 'feather', dropCount: 3,
    flavour: 'Pink, tall, and arguing with itself about which head gets to bite you.',
  },

  /* ---- The deep ocean -------------------------------------------------- */
  {
    id: 'anglerfish', name: 'Anglerfish', group: 'deep', temperament: 'hostile', locomotion: 'swim',
    biomes: ['abyss', 'deepocean'], hp: 30, damage: 9, speed: 1,
    weight: .45, drop: 'glowstone', dropCount: 1, hover: -20,
    flavour: 'A single hanging light in the black, and a mouth beneath it.',
  },
  {
    id: 'squid', name: 'Giant squid', group: 'deep', temperament: 'hostile', locomotion: 'swim',
    biomes: ['abyss', 'deepocean'], hp: 90, damage: 14, speed: 1.3,
    weight: .2, drop: 'squid-ink', dropCount: 2, hover: -25, scale: 2.4,
    flavour: 'Guardian of deep water. It does not want you here, and it is not subtle about it.',
  },
  {
    id: 'gulper', name: 'Abyss gulper', group: 'deep', temperament: 'hostile', locomotion: 'swim',
    biomes: ['abyss'], hp: 60, damage: 15, speed: 1.2,
    weight: .3, drop: 'abyss-crystal', dropCount: 1, hover: -26, scale: 1.5,
    flavour: 'Mostly mouth. The rest of it is an afterthought it never got around to.',
  },
  {
    id: 'kraken', name: 'Kraken', group: 'deep', temperament: 'hostile', locomotion: 'swim',
    biomes: ['abyss'], hp: 220, damage: 26, speed: 1.1,
    weight: .08, drop: 'kraken-tooth', dropCount: 1, hover: -32, scale: 3.4,
    flavour: 'The dark at the bottom of the ocean, with an opinion about visitors.',
  },

  /* ---- Underground strata --------------------------------------------- */
  {
    id: 'glowworm', name: 'Glowworm', group: 'underground', temperament: 'ambient', locomotion: 'walk',
    biomes: [], minStratum: 0, hp: 3, speed: .05,
    weight: 1.2, drop: 'glow-fungus', dropCount: 1, scale: .3,
    flavour: 'A tiny cold light clinging to the cave roof.',
  },
  {
    id: 'pillbug', name: 'Pale pillbug', group: 'underground', temperament: 'ambient', locomotion: 'walk',
    biomes: [], minStratum: 0, hp: 4, speed: .35,
    weight: 1.2, drop: 'chitin', dropCount: 1, scale: .5,
    flavour: 'It rolls itself up as you pass. That is the entirety of the plan.',
  },
  {
    id: 'molerat', name: 'Mole rat', group: 'underground', temperament: 'skittish', locomotion: 'walk',
    biomes: [], minStratum: 0, hp: 10, speed: 1.5,
    drop: 'raw-meat', dropCount: 1, scale: .6,
    flavour: 'Pink, blind, and very surprised to meet you down here.',
  },
  {
    id: 'bat', name: 'Cave bat', group: 'underground', temperament: 'ambient', locomotion: 'fly',
    biomes: [], minStratum: 0, hp: 5, speed: 3,
    weight: 1.2, drop: 'leather', dropCount: 0, hover: 3, scale: .45, flutter: true,
    flavour: 'A flicker of wings past your lantern, and then silence again.',
  },
  {
    id: 'cavespider', name: 'Cave spider', group: 'underground', temperament: 'hostile', locomotion: 'walk',
    biomes: [], minStratum: 0, hp: 22, damage: 8, speed: 2,
    weight: .45, drop: 'string', dropCount: 2,
    flavour: 'Eight legs, quick, and very fond of the dark corners you are not looking at.',
  },
  {
    id: 'gembug', name: 'Gem beetle', group: 'underground', temperament: 'ambient', locomotion: 'walk',
    biomes: [], minStratum: 1, hp: 6, speed: .5,
    weight: 1.2, drop: 'quartz', dropCount: 1, scale: .6,
    flavour: 'A small jewelled thing picking through gravel that has never seen light.',
  },
  {
    id: 'deepskeleton', name: 'Deep skeleton', group: 'underground', temperament: 'hostile', locomotion: 'walk',
    biomes: [], minStratum: 1, hp: 50, damage: 14, speed: 1.2,
    weight: .45, drop: 'bone-block', dropCount: 2,
    flavour: 'Older bones than the ones on the surface, and considerably better rested.',
  },
  {
    id: 'magmaslug', name: 'Magma slug', group: 'underground', temperament: 'hostile', locomotion: 'walk',
    biomes: [], minStratum: 2, hp: 40, damage: 12, speed: .4,
    weight: .45, drop: 'magma', dropCount: 1,
    flavour: 'A glowing lump of half-molten rock, slowly coming toward your boots.',
  },
  {
    id: 'cavetroll', name: 'Cave troll', group: 'underground', temperament: 'hostile', locomotion: 'walk',
    biomes: [], minStratum: 2, hp: 110, damage: 20, speed: 1.1,
    weight: .12, drop: 'bone-block', dropCount: 3, scale: 1.7,
    flavour: 'Something down here long enough to have forgotten the surface ever existed.',
  },
  {
    id: 'echowraith', name: 'Echo wraith', group: 'underground', temperament: 'hostile', locomotion: 'fly',
    biomes: [], minStratum: 3, hp: 45, damage: 11, speed: 1.8,
    weight: .45, drop: 'echo-stone', dropCount: 2, hover: 2, flutter: true,
    flavour: 'It repeats your footsteps back to you from a slightly wrong direction.',
  },
  {
    id: 'golem', name: 'Lodestone golem', group: 'underground', temperament: 'hostile', locomotion: 'walk',
    biomes: [], minStratum: 4, hp: 140, damage: 18, speed: .8,
    weight: .12, drop: 'lodestone', dropCount: 1, scale: 1.5,
    flavour: 'It gathers what is metal and keeps what it gathers, including your tools.',
  },
  {
    id: 'voidcrawler', name: 'Void crawler', group: 'underground', temperament: 'hostile', locomotion: 'walk',
    biomes: [], minStratum: 5, hp: 85, damage: 19, speed: 1.5,
    weight: .2, drop: 'void-stone', dropCount: 3, scale: 1.4,
    flavour: 'Its geometry does not quite add up, and neither do its shadows.',
  },
  {
    id: 'cradlekeeper', name: 'Cradle keeper', group: 'underground', temperament: 'hostile', locomotion: 'walk',
    biomes: [], minStratum: 6, hp: 200, damage: 24, speed: .9,
    weight: .05, drop: 'ernas-seed', dropCount: 1, scale: 2.2,
    flavour: 'It sleeps at the bottom of the world. You have just woken it up.',
  },
];

/** Fills in the shared defaults so the roster tables above stay readable. */
export const CREATURES: CreatureDefinition[] = ROSTER.map(seed => ({ damage: 0, weight: 1, ...seed }));

export const CREATURE_BY_ID: Record<string, CreatureDefinition> = Object.fromEntries(CREATURES.map(creature => [creature.id, creature]));

export const creaturesOfGroup = (group: CreatureGroup): CreatureDefinition[] => CREATURES.filter(creature => creature.group === group);

export const countCreatures = (predicate: (creature: CreatureDefinition) => boolean): number => CREATURES.filter(predicate).length;

/** Species that only appear underground, listed by the stratum they open up. */
export const stratumSpecies = (stratum: number): CreatureDefinition[] => CREATURES.filter(creature => creature.biomes.length === 0 && creature.minStratum === stratum);

/* ==========================================================================
 * Roster audit
 *
 * The roster is hand-written, so a typo in a species id, biome, or drop would
 * otherwise only surface in play. Report problems once, at load time.
 * ========================================================================== */

const audit: string[] = [];
const ids = new Set<string>();
for (const creature of CREATURES) {
  if (ids.has(creature.id)) audit.push(`duplicate species id "${creature.id}"`);
  ids.add(creature.id);
  if (!ITEMS[creature.drop]) audit.push(`${creature.id} drops unknown item "${creature.drop}"`);
  if (!creature.biomes.length && creature.minStratum === undefined) audit.push(`${creature.id} has no habitat`);
  for (const biome of creature.biomes) if (!BIOME_IDS.includes(biome)) audit.push(`${creature.id} lists unknown biome "${biome}"`);
}

export const ROSTER_AUDIT: string[] = audit;
if (audit.length) console.warn('[ernas] bestiary audit:', audit.join('; '));

/* ==========================================================================
 * Models
 *
 * Every species is built from the same blocky vocabulary: a body sitting on
 * y = 0, a head toward -Z, and limbs where the animal would have them. The
 * engine merges each finished group into a single vertex-coloured mesh.
 * ========================================================================== */

type Box = (w: number, h: number, d: number, color: string, x?: number, y?: number, z?: number) => THREE.Mesh;

const quad = (group: THREE.Group, box: Box, color: string, w: number, h: number, d: number, y: number, spreadX: number, spreadZ: number, footColor?: string) => {
  for (const x of [-spreadX, spreadX]) for (const z of [-spreadZ, spreadZ]) {
    group.add(box(w, h, d, color, x, y, z));
    if (footColor) group.add(box(w + .04, h * .3, d + .04, footColor, x, y - h * .38, z));
  }
};

const eyes = (group: THREE.Group, box: Box, y: number, z: number, spread: number, size = .1, color = '#22261f', shine = true) => {
  for (const side of [-1, 1]) {
    group.add(box(size, size, .04, color, side * spread, y, z));
    if (shine) group.add(box(size * .4, size * .4, .03, '#f3f0dc', side * spread + size * .2, y + size * .2, z - .01));
  }
};

/** Builds a detailed, blocky model for any creature. */
export function buildCreatureModel(id: string, box: Box): THREE.Group {
  const g = new THREE.Group();
  const def = CREATURE_BY_ID[id];
  switch (id) {
    /* ---- Grexing stock ------------------------------------------------- */
    case 'cow': {
      const hide = '#3f3a35', spot = '#e4dfd2';
      g.add(box(1.3, .95, 2.1, hide, 0, 1.15));
      g.add(box(.7, .5, .8, spot, .25, 1.3, .4));
      g.add(box(.6, .45, .7, spot, -.3, 1.2, -.5));
      g.add(box(.9, .8, .85, hide, 0, 1.35, -1.35));
      g.add(box(.7, .35, .3, '#c9a58f', 0, 1.1, -1.85));
      g.add(box(.7, .35, .55, '#d8b6a9', 0, .7, .2));
      for (const side of [-1, 1]) {
        g.add(box(.12, .28, .12, '#e6e2d3', side * .38, 1.9, -1.4));
        g.add(box(.26, .12, .1, hide, side * .5, 1.5, -1.3));
      }
      eyes(g, box, 1.55, -1.78, .28, .12);
      quad(g, box, hide, .28, .7, .28, .35, .45, .75, '#2a2624');
      const tail = box(.1, .8, .1, hide, 0, 1.2, 1.1);
      tail.rotation.x = .3;
      g.add(tail);
      break;
    }
    case 'sheep': {
      const wool = '#f0ecdf', face = '#332f2b';
      g.add(box(.8, .7, 1.15, wool, 0, .95));
      g.add(box(.62, .5, .95, wool, 0, 1.35, .05));
      g.add(box(.46, .42, .5, face, 0, 1.1, -.72));
      g.add(box(.3, .22, .18, '#e2dccb', 0, .98, -.98));
      for (const side of [-1, 1]) g.add(box(.2, .18, .12, '#e6e0d0', side * .3, 1.22, -.62));
      eyes(g, box, 1.16, -.96, .13, .07);
      quad(g, box, '#4a443c', .15, .62, .15, .3, .24, .38, '#2f2a26');
      break;
    }
    case 'pig': {
      const hide = '#d8a3a6', snout = '#c98a90';
      g.add(box(.6, .55, 1.1, hide, 0, .68));
      g.add(box(.52, .5, .5, hide, 0, .8, -.72));
      g.add(box(.34, .3, .16, snout, 0, .74, -1));
      for (const side of [-1, 1]) g.add(box(.14, .18, .07, hide, side * .2, .98, -.6));
      eyes(g, box, .88, -.96, .13, .07);
      quad(g, box, '#c08f94', .16, .42, .16, .2, .2, .36, '#5c4a45');
      const tail = box(.07, .28, .07, hide, 0, .82, .58);
      tail.rotation.x = -.9;
      g.add(tail);
      break;
    }
    case 'horse': {
      const hide = '#8a6a4a', mane = '#3a2c22';
      g.add(box(.78, .72, 1.9, hide, 0, 1.5));
      g.add(box(.44, .95, .5, hide, 0, 2.15, -.9));
      g.add(box(.5, .44, .85, hide, 0, 2.62, -1.25));
      g.add(box(.36, .28, .3, '#6f5236', 0, 2.5, -1.62));
      g.add(box(.14, .55, .45, mane, 0, 2.6, -.78));
      for (const side of [-1, 1]) {
        g.add(box(.1, .26, .12, hide, side * .17, 2.86, -1.2));
        g.add(box(.08, .1, .3, mane, side * .22, 2.55, -.85));
      }
      eyes(g, box, 2.68, -1.6, .23, .1);
      quad(g, box, hide, .18, 1.2, .18, .6, .3, .62, '#2a211a');
      const tail = box(.12, .95, .18, mane, 0, 1.7, 1.05);
      tail.rotation.x = .35;
      g.add(tail);
      break;
    }
    case 'chicken': {
      g.add(box(.55, .5, .7, '#efe9dc', 0, .6));
      g.add(box(.4, .4, .38, '#efe9dc', 0, 1, -.4));
      g.add(box(.14, .1, .22, '#d9a349', 0, .95, -.68));
      g.add(box(.14, .16, .1, '#c94f4a', 0, .78, -.5));
      g.add(box(.16, .12, .22, '#c94f4a', 0, 1.24, -.4));
      g.add(box(.3, .35, .12, '#e2dccc', 0, .75, .38));
      for (const side of [-1, 1]) {
        g.add(box(.1, .35, .5, '#e2dccc', side * .32, .6, .05));
        g.add(box(.07, .3, .07, '#d9a349', side * .14, .18));
        g.add(box(.16, .04, .16, '#d9a349', side * .14, .02));
      }
      eyes(g, box, 1.05, -.6, .14, .07);
      break;
    }
    case 'dog': {
      const fur = '#a9855a';
      g.add(box(.6, .55, 1.1, fur, 0, .7));
      g.add(box(.5, .45, .5, fur, 0, .95, -.7));
      g.add(box(.3, .25, .3, '#8a6a45', 0, .85, -1.05));
      g.add(box(.12, .1, .08, '#221f1c', 0, .9, -1.22));
      g.add(box(.5, .12, .12, '#b34a3c', 0, .8, -.5));
      for (const side of [-1, 1]) g.add(box(.14, .22, .1, '#8a6a45', side * .22, 1.2, -.62));
      eyes(g, box, 1.02, -.95, .15, .09);
      quad(g, box, fur, .16, .45, .16, .22, .2, .4);
      const tail = box(.1, .5, .1, fur, 0, .95, .6);
      tail.rotation.x = -.6;
      g.add(tail);
      break;
    }
    case 'cat': {
      const fur = '#6d6a72';
      g.add(box(.42, .4, .85, fur, 0, .5));
      g.add(box(.4, .38, .36, fur, 0, .75, -.55));
      g.add(box(.08, .06, .06, '#d99aa1', 0, .68, -.74));
      for (const side of [-1, 1]) g.add(box(.12, .16, .08, fur, side * .14, .98, -.5));
      eyes(g, box, .8, -.74, .11, .09, '#9fc44a');
      quad(g, box, fur, .12, .35, .12, .17, .14, .3);
      const tail = box(.08, .6, .08, fur, 0, .7, .5);
      tail.rotation.x = -.9;
      g.add(tail);
      break;
    }
    case 'meerkat': {
      const fur = '#b59a72', dark = '#6f5a3c';
      g.add(box(.26, .42, .26, fur, 0, .28));
      g.add(box(.24, .24, .26, fur, 0, .6, -.02));
      g.add(box(.14, .12, .14, dark, 0, .54, -.18));
      for (const side of [-1, 1]) {
        g.add(box(.09, .1, .06, fur, side * .13, .74, -.02));
        g.add(box(.07, .08, .04, dark, side * .1, .64, -.12));
        g.add(box(.08, .26, .08, fur, side * .08, .16));
      }
      eyes(g, box, .62, -.2, .08, .05, '#1c1a14', false);
      const tail = box(.08, .4, .08, fur, 0, .3, .2);
      tail.rotation.x = -1.2;
      g.add(tail);
      break;
    }
    case 'stagbeetle': {
      const shell = '#3f2f1e', plate = '#5c452c';
      g.add(box(.42, .3, .62, shell, 0, .32));
      g.add(box(.46, .16, .5, plate, 0, .5, .04));
      g.add(box(.26, .22, .22, shell, 0, .3, -.4));
      for (const side of [-1, 1]) {
        g.add(box(.08, .08, .42, plate, side * .1, .38, -.62));
        for (let i = 0; i < 3; i++) g.add(box(.36, .05, .06, shell, side * .34, .22, -.24 + i * .24));
      }
      eyes(g, box, .34, -.5, .08, .05, '#1c1a14', false);
      break;
    }
    case 'butterfly': {
      g.add(box(.08, .08, .4, '#2f2a2a', 0, 0));
      for (const side of [-1, 1]) {
        const fore = box(.5, .04, .5, '#d8865a', side * .3, 0, -.05);
        fore.rotation.z = side * .25;
        g.add(fore);
        const hind = box(.36, .04, .36, '#e9c46a', side * .22, -.02, .2);
        hind.rotation.z = side * .25;
        g.add(hind);
        g.add(box(.12, .03, .12, '#2f2a2a', side * .32, .02, -.05));
      }
      break;
    }

    /* ---- Woodland ------------------------------------------------------ */
    case 'kiwi': {
      g.add(box(.6, .55, .8, '#6b5a3e', 0, .45));
      g.add(box(.3, .3, .3, '#6b5a3e', 0, .75, -.45));
      g.add(box(.07, .07, .6, '#c9b384', 0, .72, -.85));
      for (const side of [-1, 1]) {
        g.add(box(.08, .3, .08, '#a08a5e', side * .16, .12));
        g.add(box(.2, .04, .18, '#a08a5e', side * .16, -.02));
      }
      eyes(g, box, .82, -.6, .1, .07);
      break;
    }
    case 'owl': {
      g.add(box(.55, .8, .5, '#7a6a52', 0, .6));
      g.add(box(.6, .5, .5, '#8f7d62', 0, 1.15));
      g.add(box(.5, .45, .1, '#e6dcc4', 0, 1.15, -.24));
      g.add(box(.09, .12, .09, '#e8c94a', 0, 1.02, -.3));
      for (const side of [-1, 1]) {
        g.add(box(.2, .2, .06, '#e8c94a', side * .14, 1.2, -.29));
        g.add(box(.09, .09, .05, '#1c1c18', side * .14, 1.21, -.31));
        g.add(box(.12, .18, .12, '#7a6a52', side * .22, 1.42));
        g.add(box(.08, .55, .4, '#6b5a44', side * .3, .65, 0));
        g.add(box(.07, .22, .07, '#c9a04f', side * .12, .12));
      }
      break;
    }
    case 'monkey': {
      const fur = '#7a5a3a', skin = '#c9a878';
      g.add(box(.42, .52, .48, fur, 0, .72));
      g.add(box(.34, .34, .34, fur, 0, 1.02, -.02));
      g.add(box(.26, .18, .22, skin, 0, .94, -.2));
      for (const side of [-1, 1]) {
        g.add(box(.12, .16, .08, skin, side * .17, 1.08, -.02));
        g.add(box(.12, .52, .12, fur, side * .3, .6, -.02));
        g.add(box(.13, .14, .13, skin, side * .3, .3, -.02));
        g.add(box(.13, .42, .13, fur, side * .15, .28, .12));
      }
      eyes(g, box, 1.04, -.2, .11, .06);
      const tail = box(.07, .55, .07, fur, 0, .78, .34);
      tail.rotation.x = -1.1;
      g.add(tail);
      break;
    }
    case 'parrot': {
      const back = '#3f8f6a', wing = '#c94f4a', cheek = '#e6d76a';
      g.add(box(.3, .36, .52, back, 0, .5));
      g.add(box(.26, .28, .28, cheek, 0, .76, -.3));
      g.add(box(.1, .12, .18, '#33302c', 0, .72, -.48));
      g.add(box(.14, .18, .1, wing, 0, .94, -.28));
      g.add(box(.1, .5, .12, '#2f6f9a', 0, .3, .34));
      for (const side of [-1, 1]) {
        g.add(box(.1, .34, .34, wing, side * .2, .5, 0));
        g.add(box(.06, .26, .06, '#c98a3c', side * .1, .2));
      }
      eyes(g, box, .8, -.42, .1, .06, '#f6efd8', false);
      break;
    }
    case 'moth': {
      const wing = '#e6dcc4', spot = '#8f7d62';
      g.add(box(.18, .2, .62, '#b8ac94', 0, 0));
      g.add(box(.22, .2, .22, '#c9bda4', 0, .04, -.36));
      for (const side of [-1, 1]) {
        g.add(box(.5, .05, .45, wing, side * .34, .06, -.12));
        g.add(box(.34, .05, .3, wing, side * .26, .02, .22));
        g.add(box(.1, .06, .1, spot, side * .42, .06, -.16));
        g.add(box(.05, .3, .05, spot, side * .08, .3, -.44));
      }
      eyes(g, box, .05, -.46, .08, .05, '#2a2620', false);
      break;
    }
    case 'hornet': {
      const shell = '#d8b04a', dark = '#3a2c22';
      g.add(box(.32, .3, .5, shell, 0, .42));
      g.add(box(.34, .3, .12, dark, 0, .42, -.14));
      g.add(box(.34, .3, .12, dark, 0, .42, .16));
      g.add(box(.26, .24, .24, dark, 0, .44, -.36));
      g.add(box(.08, .08, .3, dark, 0, .42, .42));
      for (const side of [-1, 1]) {
        g.add(box(.5, .04, .3, '#e8e2d0', side * .32, .58, -.05));
        g.add(box(.06, .22, .06, dark, side * .1, .22));
        g.add(box(.1, .1, .06, '#c94f4a', side * .09, .44, -.46));
      }
      break;
    }
    case 'panther': {
      const fur = '#2b2b33';
      g.add(box(.62, .56, 1.35, fur, 0, .78));
      g.add(box(.5, .48, .55, fur, 0, .88, -.85));
      g.add(box(.28, .22, .24, '#3d3d47', 0, .8, -1.15));
      for (const side of [-1, 1]) g.add(box(.14, .16, .08, fur, side * .2, 1.08, -.82));
      eyes(g, box, .95, -1.12, .17, .1, '#c9e04a', false);
      quad(g, box, fur, .16, .62, .16, .31, .23, .5, '#4a4a54');
      const tail = box(.1, .95, .1, fur, 0, 1.05, .72);
      tail.rotation.x = -.45;
      g.add(tail);
      break;
    }
    case 'gull': {
      const white = '#f0eee4', grey = '#b8c0c4', beak = '#e8a13c';
      g.add(box(.34, .34, .7, white, 0, .5));
      g.add(box(.26, .26, .3, white, 0, .72, -.36));
      g.add(box(.1, .1, .24, beak, 0, .7, -.6));
      for (const side of [-1, 1]) {
        const wing = box(.9, .06, .4, grey, side * .58, .6, .02);
        wing.rotation.z = side * .12;
        g.add(wing);
        g.add(box(.3, .05, .12, '#33302c', side * .92, .6, .06));
        g.add(box(.06, .2, .06, beak, side * .1, .3, .02));
      }
      eyes(g, box, .76, -.5, .1, .06);
      break;
    }

    /* ---- Wetland ------------------------------------------------------- */
    case 'frog': {
      g.add(box(.7, .4, .75, '#5f8f45', 0, .3));
      g.add(box(.6, .3, .45, '#6f9f52', 0, .5, -.3));
      g.add(box(.6, .12, .5, '#c9d69a', 0, .18, .05));
      for (const side of [-1, 1]) {
        g.add(box(.16, .16, .16, '#5f8f45', side * .22, .7, -.4));
        g.add(box(.12, .1, .06, '#e2b93c', side * .22, .72, -.48));
        g.add(box(.06, .06, .04, '#1f221b', side * .22, .73, -.5));
        g.add(box(.18, .16, .4, '#4f7f3a', side * .38, .15, .25));
        g.add(box(.12, .12, .3, '#4f7f3a', side * .3, .12, -.25));
      }
      break;
    }
    case 'toad': {
      const hide = '#6f6a3c', belly = '#a89c62';
      g.add(box(.85, .5, .9, hide, 0, .32));
      g.add(box(.7, .42, .5, hide, 0, .5, -.35));
      g.add(box(.72, .14, .72, belly, 0, .12, .05));
      for (const side of [-1, 1]) {
        g.add(box(.18, .14, .16, '#8a7a44', side * .26, .72, -.42));
        g.add(box(.07, .07, .05, '#1f221b', side * .26, .74, -.5));
        g.add(box(.08, .14, .08, '#4f5a2a', side * .16, .64, -.62));
        g.add(box(.2, .16, .45, hide, side * .42, .2, .22));
        g.add(box(.14, .12, .3, hide, side * .32, .14, -.3));
      }
      break;
    }
    case 'snail': {
      g.add(box(.3, .18, .6, '#c9c48f', 0, .1));
      g.add(box(.2, .2, .2, '#9fd8c8', 0, .4, .1));
      const shell = box(.4, .4, .4, '#6f5a8a', 0, .35, .1);
      shell.rotation.z = .3;
      g.add(shell);
      for (const side of [-1, 1]) g.add(box(.04, .2, .04, '#c9c48f', side * .08, .3, -.3));
      break;
    }
    case 'firefly': {
      for (let i = 0; i < 6; i++) g.add(box(.06, .06, .06, '#e9e07a', Math.sin(i * 1.3) * .6, Math.cos(i * .7) * .4, Math.sin(i * 2.1) * .6));
      break;
    }
    case 'wisp': {
      g.add(box(.26, .26, .26, '#bfe8c0', 0, .2));
      g.add(box(.16, .16, .16, '#f0f8d0', 0, .2, -.08));
      for (let i = 0; i < 5; i++) g.add(box(.07, .07, .07, '#9fd8b8', Math.sin(i * 1.7) * .26, .2 - i * .13, Math.cos(i * 1.3) * .26));
      break;
    }
    case 'heron': {
      const feather = '#8f96a8', beak = '#e0b04a';
      g.add(box(.42, .5, .72, feather, 0, 1.15));
      g.add(box(.3, .3, .45, '#c8ced8', 0, 1.1, -.28));
      g.add(box(.16, .85, .16, feather, 0, 1.75, -.26));
      g.add(box(.26, .24, .5, feather, 0, 2.2, -.4));
      g.add(box(.08, .08, .48, beak, 0, 2.16, -.86));
      g.add(box(.2, .14, .1, '#5a6274', 0, 2.35, -.2));
      for (const side of [-1, 1]) {
        g.add(box(.14, .42, .6, '#7f8798', side * .24, 1.2, .06));
        g.add(box(.07, .95, .07, beak, side * .14, .5));
        g.add(box(.14, .05, .3, beak, side * .14, .03, -.1));
      }
      eyes(g, box, 2.24, -.6, .12, .06);
      break;
    }
    case 'leech': {
      for (let i = 0; i < 6; i++) {
        const size = .22 - i * .012;
        g.add(box(size, .18, .24, i % 2 ? '#3a2a30' : '#4a3540', 0, .1, -.5 + i * .21));
      }
      g.add(box(.26, .22, .2, '#5c4450', 0, .1, -.66));
      break;
    }
    case 'sporeling': {
      g.add(box(.5, .4, .5, '#d8cdb6', 0, .55));
      g.add(box(.95, .35, .95, '#b5638f', 0, .9));
      g.add(box(.7, .15, .7, '#c98aa8', 0, 1.1));
      for (let i = 0; i < 6; i++) {
        const angle = i / 6 * Math.PI * 2;
        g.add(box(.08, .35, .08, '#a89a80', Math.cos(angle) * .3, .18, Math.sin(angle) * .3));
      }
      eyes(g, box, .6, -.26, .14, .08, '#2a1a2a', false);
      break;
    }
    case 'mireling': {
      g.add(box(.9, .9, .8, '#4b4030', 0, .6));
      g.add(box(.6, .5, .55, '#4b4030', 0, 1.25));
      g.add(box(.5, .12, .5, '#7c8560', 0, 1.5));
      for (const side of [-1, 1]) g.add(box(.3, .7, .3, '#3f3528', side * .55, .55));
      eyes(g, box, 1.3, -.28, .16, .1, '#9fd8c8', false);
      break;
    }
    case 'crocodile': {
      const hide = '#4f5c3f', pale = '#8a9a6a';
      g.add(box(.7, .45, 1.9, hide, 0, .3));
      g.add(box(.5, .3, .3, hide, 0, .28, -1.05));
      g.add(box(.44, .18, .28, pale, 0, .1, -1.02));
      g.add(box(.4, .3, 1, hide, 0, .28, 1.2));
      for (let i = 0; i < 6; i++) {
        g.add(box(.08, .12, .08, hide, 0, .5 + i % 2 * .08, -1.2 + i * .3));
        g.add(box(.03, .08, .03, '#f0ece0', -.2 + i % 2 * .4, .2, -1.1));
      }
      for (const side of [-1, 1]) {
        g.add(box(.2, .16, .5, hide, side * .45, .12, -.6));
        g.add(box(.2, .16, .5, hide, side * .45, .12, .6));
        g.add(box(.06, .1, .06, '#e0c15a', side * .2, .42, -1.15));
      }
      break;
    }

    /* ---- Cold and high ground ------------------------------------------ */
    case 'goat': {
      g.add(box(.7, .65, 1.2, '#e2ddd0', 0, .95));
      g.add(box(.45, .5, .55, '#e2ddd0', 0, 1.35, -.75));
      g.add(box(.2, .28, .1, '#d0cabc', 0, 1.05, -.95));
      for (const side of [-1, 1]) {
        const horn = box(.08, .4, .08, '#8d7f68', side * .14, 1.75, -.7);
        horn.rotation.x = -.6;
        g.add(horn);
      }
      eyes(g, box, 1.42, -1.04, .15, .09, '#c9a34a');
      quad(g, box, '#d8d3c6', .16, .65, .16, .32, .25, .45, '#4a4239');
      break;
    }
    case 'penguin': {
      g.add(box(.55, .8, .5, '#1f2328', 0, .6));
      g.add(box(.36, .55, .1, '#eeeae0', 0, .55, -.22));
      g.add(box(.45, .4, .45, '#1f2328', 0, 1.15));
      g.add(box(.12, .08, .25, '#e8a13c', 0, 1.1, -.35));
      for (const side of [-1, 1]) {
        g.add(box(.08, .45, .3, '#1f2328', side * .3, .62));
        g.add(box(.2, .06, .25, '#e8a13c', side * .12, .02));
      }
      eyes(g, box, 1.2, -.24, .12, .07);
      break;
    }
    case 'mammoth': {
      const fur = '#6b4b32';
      g.add(box(1.5, 1.4, 2.3, fur, 0, 1.6));
      g.add(box(1.6, .5, 2.4, '#5a3d27', 0, 1));
      g.add(box(1.1, 1.1, 1, fur, 0, 1.9, -1.5));
      g.add(box(.35, 1.4, .35, '#7a5a3d', 0, 1, -2));
      for (const side of [-1, 1]) {
        const tusk = box(.14, .14, 1.4, '#e8e0c8', side * .35, 1.2, -2.5);
        tusk.rotation.x = -.3;
        g.add(tusk);
        g.add(box(.5, .5, .1, fur, side * .6, 1.9, -1.4));
      }
      eyes(g, box, 2.1, -2.02, .3, .12);
      quad(g, box, fur, .4, 1, .4, .5, .5, .8, '#3d2a1c');
      break;
    }
    case 'caribou': {
      const hide = '#8a7458', pale = '#c9bc9c', antler = '#d8cfb4';
      g.add(box(.78, .72, 1.7, hide, 0, 1.35));
      g.add(box(.44, .8, .5, hide, 0, 1.9, -.82));
      g.add(box(.42, .38, .62, pale, 0, 2.14, -1.2));
      g.add(box(.2, .24, .22, hide, 0, 2.42, -1.05));
      for (const side of [-1, 1]) {
        g.add(box(.06, .5, .06, antler, side * .2, 2.66, -1.02));
        const branch = box(.06, .34, .06, antler, side * .34, 2.6, -.95);
        branch.rotation.z = side * .6;
        g.add(branch);
      }
      eyes(g, box, 2.16, -1.42, .21, .09);
      quad(g, box, hide, .16, 1.1, .16, .55, .28, .58, '#4a3a2a');
      break;
    }
    case 'hare': {
      const fur = '#e6e2d6', inner = '#c9a4a4';
      g.add(box(.32, .32, .52, fur, 0, .3));
      g.add(box(.26, .26, .3, fur, 0, .46, -.34));
      g.add(box(.16, .16, .16, '#f2efe6', 0, .32, .3));
      for (const side of [-1, 1]) {
        g.add(box(.08, .34, .05, fur, side * .09, .68, -.3));
        g.add(box(.04, .26, .03, inner, side * .09, .66, -.33));
        g.add(box(.1, .3, .16, fur, side * .2, .14, -.16));
      }
      eyes(g, box, .5, -.46, .1, .06);
      break;
    }
    case 'fox': {
      const fur = '#ece7dc', dark = '#c9c2b4';
      g.add(box(.36, .34, .8, fur, 0, .5));
      g.add(box(.3, .28, .34, fur, 0, .6, -.5));
      g.add(box(.14, .12, .16, dark, 0, .55, -.7));
      for (const side of [-1, 1]) g.add(box(.11, .18, .07, fur, side * .12, .78, -.46));
      eyes(g, box, .66, -.64, .1, .06, '#3a3f4a', false);
      quad(g, box, dark, .1, .34, .1, .18, .13, .3, '#3a3630');
      const tail = box(.16, .5, .16, fur, 0, .62, .48);
      tail.rotation.x = -.7;
      g.add(tail);
      break;
    }
    case 'eagle': {
      const body = '#5a4a3a', head = '#e8e3d6', beak = '#e0b04a';
      g.add(box(.42, .44, .8, body, 0, .6));
      g.add(box(.3, .3, .3, head, 0, .9, -.42));
      g.add(box(.12, .14, .24, beak, 0, .86, -.7));
      g.add(box(.34, .1, .3, '#3f352a', 0, .48, .34));
      for (const side of [-1, 1]) {
        const wing = box(1.1, .06, .5, body, side * .74, .72, -.02);
        wing.rotation.z = side * .14;
        g.add(wing);
        g.add(box(.5, .05, .12, '#3f352a', side * .58, .74, .12));
        g.add(box(.06, .2, .06, beak, side * .16, .46, -.06));
      }
      eyes(g, box, .94, -.56, .11, .06);
      break;
    }
    case 'frostwolf': {
      const fur = '#e3e8ea';
      g.add(box(.6, .6, 1.3, fur, 0, .8));
      g.add(box(.5, .5, .55, fur, 0, 1, -.85));
      g.add(box(.3, .28, .4, '#cfd6d9', 0, .9, -1.28));
      g.add(box(.12, .1, .08, '#1e2224', 0, .95, -1.5));
      for (const side of [-1, 1]) g.add(box(.14, .24, .1, fur, side * .18, 1.3, -.78));
      eyes(g, box, 1.06, -1.13, .16, .09, '#7fbfe0', false);
      quad(g, box, fur, .18, .55, .18, .27, .22, .5, '#9fa8ad');
      const tail = box(.16, .7, .16, fur, 0, .95, .7);
      tail.rotation.x = -1.1;
      g.add(tail);
      break;
    }
    case 'snowwalker': {
      const c = '#d8dfe4';
      g.add(box(.8, 1.4, .6, c, 0, 2.2));
      g.add(box(.55, .6, .55, c, 0, 3.2));
      g.add(box(.5, .3, .3, '#b0bcc4', 0, 3, -.25));
      for (const side of [-1, 1]) {
        g.add(box(.22, 1.4, .22, c, side * .5, 2));
        g.add(box(.25, 1.6, .25, c, side * .22, .8));
        g.add(box(.3, .15, .4, '#9aa6ae', side * .22, .05));
      }
      eyes(g, box, 3.3, -.28, .16, .12, '#2f3f4a', false);
      break;
    }

    /* ---- Sky and weather ----------------------------------------------- */
    case 'skysquirrel': {
      g.add(box(.35, .35, .6, '#8a6d4a', 0, .3));
      g.add(box(.3, .3, .3, '#8a6d4a', 0, .45, -.4));
      g.add(box(.3, .5, .3, '#a5875f', 0, .55, .45));
      for (const side of [-1, 1]) {
        g.add(box(.6, .04, .5, '#b59a72', side * .4, .25, 0));
        g.add(box(.08, .12, .08, '#8a6d4a', side * .12, .65, -.4));
      }
      eyes(g, box, .5, -.56, .1, .07);
      break;
    }
    case 'cloudserpent': {
      for (let i = 0; i < 9; i++) {
        const scale = .45 - i * .03;
        g.add(box(scale, scale, .6, i % 2 ? '#c9d6e6' : '#a9bcd2', 0, Math.sin(i * .9) * .2, i * .55));
      }
      g.add(box(.55, .5, .7, '#c9d6e6', 0, 0, -.45));
      for (const side of [-1, 1]) {
        const fin = box(.5, .04, .4, '#e6eef6', side * .45, .1, .6);
        fin.rotation.z = side * .5;
        g.add(fin);
        g.add(box(.06, .2, .06, '#e6eef6', side * .14, .4, -.4));
      }
      eyes(g, box, .1, -.81, .18, .1, '#3f5fa0', false);
      break;
    }
    case 'thunderling': {
      g.add(box(.4, .4, .4, '#3a3f5a', 0, .3));
      g.add(box(.3, .3, .3, '#555c80', 0, .3, -.1));
      for (const side of [-1, 1]) g.add(box(.4, .04, .3, '#7f86b8', side * .3, .48));
      for (let i = 0; i < 6; i++) g.add(box(.1, .1, .1, '#a3a6de', Math.sin(i * 2.1) * .34, .3 + Math.cos(i * 1.4) * .26, Math.sin(i * 1.1) * .3));
      eyes(g, box, .34, -.24, .1, .07, '#f0f4ff', false);
      break;
    }
    case 'skywhale': {
      const hide = '#8f9aa8', pale = '#c2cad4', dark = '#5c6674';
      g.add(box(1.5, 1.3, 3.2, hide, 0, 1.4));
      g.add(box(1.3, 1, 1.5, '#9aa6b4', 0, 1.7, -1.8));
      g.add(box(1.1, .7, .9, pale, 0, 1.3, -2.5));
      for (const side of [-1, 1]) {
        g.add(box(1.4, .12, .9, hide, side * 1.2, 1.2, .4));
        g.add(box(.07, .07, .05, '#2a2f38', side * .5, 1.85, -2.85));
        for (let i = 0; i < 4; i++) g.add(box(.08, .08, .08, dark, side * .45, 1.5 - i * .1, .9 + i * .5));
      }
      for (const side of [-1, 1]) {
        const fluke = box(.9, .14, .8, pale, side * .7, 1.5, 1.9);
        fluke.rotation.y = side * -.4;
        g.add(fluke);
      }
      for (let i = 0; i < 6; i++) g.add(box(.16, .3, .06, dark, -.4 + i * .16, 1, -3.05));
      break;
    }
    case 'cloudjelly': {
      const bell = '#e2ecf4';
      g.add(box(.9, .5, .9, bell, 0, .5));
      g.add(box(.66, .22, .66, '#c2d4e4', 0, .76));
      for (let i = 0; i < 8; i++) {
        const angle = i / 8 * Math.PI * 2;
        g.add(box(.06, 1.1, .06, '#cfdcea', Math.cos(angle) * .32, -.35, Math.sin(angle) * .32));
      }
      break;
    }
    case 'roc': {
      const feather = '#3a3138', pale = '#6f6470', beak = '#d8b04a';
      g.add(box(.9, .9, 1.6, feather, 0, 1));
      g.add(box(.6, .6, .7, feather, 0, 1.35, -.9));
      g.add(box(.3, .28, .5, beak, 0, 1.28, -1.35));
      g.add(box(.7, .12, .8, pale, 0, 1, .9));
      for (const side of [-1, 1]) {
        const wing = box(2.3, .12, 1, feather, side * 1.5, 1.25, 0);
        wing.rotation.z = side * .1;
        g.add(wing);
        g.add(box(.9, .1, .7, pale, side * 1.1, 1.15, .1));
        g.add(box(.22, .8, .22, '#5c5346', side * .3, .45, .3));
        g.add(box(.3, .12, .4, '#5c5346', side * .3, .05, .2));
      }
      eyes(g, box, 1.42, -1.1, .17, .09, '#e0b64a', false);
      break;
    }

    /* ---- Sand and stone wastes ----------------------------------------- */
    case 'camel': {
      const hide = '#c4a068';
      g.add(box(.8, .8, 1.8, hide, 0, 1.55));
      g.add(box(.7, .6, .8, '#b58f5c', 0, 2.2, .1));
      g.add(box(.3, .9, .3, hide, 0, 2.2, -1.1));
      g.add(box(.45, .4, .7, hide, 0, 2.7, -1.35));
      g.add(box(.25, .2, .2, '#8f7048', 0, 2.55, -1.75));
      for (const side of [-1, 1]) g.add(box(.1, .14, .08, hide, side * .2, 2.9, -1.3));
      eyes(g, box, 2.75, -1.55, .18, .1);
      quad(g, box, hide, .18, 1.15, .18, .58, .3, .65, '#7a6040');
      break;
    }
    case 'tortoise': {
      g.add(box(1.1, .5, 1.3, '#5f6b45', 0, .5));
      g.add(box(.85, .25, 1, '#7a875a', 0, .85));
      for (let i = -1; i <= 1; i++) g.add(box(.25, .08, .25, '#495438', i * .3, 1, i * .1));
      g.add(box(.35, .3, .45, '#8f9a6a', 0, .4, -.85));
      eyes(g, box, .48, -1.06, .1, .07);
      quad(g, box, '#8f9a6a', .22, .25, .22, .14, .5, .5);
      break;
    }
    case 'lizard': {
      g.add(box(.3, .18, .8, '#b78e4c', 0, .1));
      g.add(box(.26, .16, .3, '#b78e4c', 0, .12, -.5));
      g.add(box(.1, .08, .6, '#a37d42', 0, .08, .65));
      for (const side of [-1, 1]) {
        g.add(box(.22, .06, .1, '#a37d42', side * .22, .05, -.25));
        g.add(box(.22, .06, .1, '#a37d42', side * .22, .05, .25));
      }
      eyes(g, box, .18, -.6, .1, .06, '#e0c15a', false);
      break;
    }
    case 'ostrich': {
      const body = '#33302f', pale = '#e6e0d2', beak = '#d9a349';
      g.add(box(.7, .7, 1.1, body, 0, 1.35));
      g.add(box(.6, .4, .8, pale, 0, 1.05, .2));
      g.add(box(.22, .9, .22, pale, 0, 2, -.4));
      g.add(box(.3, .3, .4, pale, 0, 2.5, -.5));
      g.add(box(.14, .12, .34, beak, 0, 2.45, -.82));
      for (const side of [-1, 1]) {
        g.add(box(.14, .6, .12, body, side * .3, 1.45));
        g.add(box(.1, 1, .1, beak, side * .16, .55));
        g.add(box(.16, .1, .34, beak, side * .16, .05, -.1));
      }
      eyes(g, box, 2.55, -.68, .12, .07);
      break;
    }
    case 'scorpion': {
      g.add(box(.6, .3, .9, '#b59a5c', 0, .3));
      for (let i = 0; i < 4; i++) {
        const segment = box(.2, .2, .22, '#a3894f', 0, .45 + i * .22, .5 + i * .18);
        segment.rotation.x = -.5;
        g.add(segment);
      }
      g.add(box(.14, .3, .14, '#6a5330', 0, 1.35, 1));
      for (const side of [-1, 1]) {
        g.add(box(.3, .12, .5, '#b59a5c', side * .4, .3, -.55));
        g.add(box(.25, .15, .2, '#a3894f', side * .55, .3, -.85));
        for (let i = 0; i < 4; i++) g.add(box(.5, .06, .08, '#a3894f', side * .5, .18, -.3 + i * .22));
      }
      eyes(g, box, .38, -.46, .12, .06, '#1c1a14', false);
      break;
    }
    case 'jackal': {
      const fur = '#8a6a45', pale = '#c9b48f';
      g.add(box(.48, .46, 1, fur, 0, .68));
      g.add(box(.4, .38, .44, fur, 0, .82, -.68));
      g.add(box(.22, .18, .3, pale, 0, .72, -.95));
      g.add(box(.34, .1, .5, pale, 0, .48, -.1));
      for (const side of [-1, 1]) g.add(box(.14, .22, .08, fur, side * .17, 1, -.6));
      eyes(g, box, .88, -.88, .12, .07, '#e0b64a', false);
      quad(g, box, fur, .12, .42, .12, .22, .17, .34, '#4a3a2a');
      const tail = box(.1, .55, .1, fur, 0, .6, .55);
      tail.rotation.x = -.9;
      g.add(tail);
      break;
    }
    case 'sandserpent': {
      const scale = '#c4ab78', dark = '#9c8557', pale = '#e6d6ac';
      for (let i = 0; i < 8; i++) {
        const size = .5 - i * .035;
        g.add(box(size, size * .8, .55, i % 2 ? scale : dark, 0, .28 + Math.sin(i * .9) * .06, i * .5));
      }
      g.add(box(.6, .4, .6, scale, 0, .28, -.5));
      g.add(box(.44, .3, .34, dark, 0, .28, -.85));
      for (const side of [-1, 1]) {
        g.add(box(.06, .06, .05, '#e0c15a', side * .16, .36, -.95));
        g.add(box(.5, .1, .12, pale, side * .3, .24, -.2));
      }
      break;
    }
    case 'vulture': {
      g.add(box(.5, .45, .8, '#3d3733', 0, .6));
      g.add(box(.25, .25, .3, '#d38b7a', 0, .9, -.5));
      g.add(box(.1, .1, .25, '#e0c470', 0, .85, -.75));
      g.add(box(.4, .2, .3, '#e6e0d0', 0, .5, -.35));
      for (const side of [-1, 1]) {
        const wing = box(1.6, .05, .6, '#3d3733', side * 1, .7, 0);
        wing.rotation.z = side * .12;
        g.add(wing);
      }
      eyes(g, box, .95, -.66, .09, .06);
      break;
    }
    case 'glasswing': {
      const glass = '#cde4e6';
      g.add(box(.1, .1, .35, '#8fa8a8', 0, 0));
      g.add(box(.05, .05, .12, '#5f7a7a', 0, .04, -.22));
      for (const side of [-1, 1]) {
        g.add(box(.46, .03, .42, glass, side * .3, .03, -.05));
        g.add(box(.3, .03, .28, '#e6f2f0', side * .22, 0, .18));
        g.add(box(.06, .04, .06, '#5f7a7a', side * .38, .04, -.1));
      }
      break;
    }

    /* ---- Ash, bone, and dead world ------------------------------------- */
    case 'ashwalker': {
      g.add(box(.7, .9, .45, '#3a3333', 0, 1.3));
      g.add(box(.5, .5, .5, '#3a3333', 0, 2.05));
      g.add(box(.6, .1, .4, '#e06a30', 0, 1.3));
      g.add(box(.55, .1, .4, '#e06a30', 0, 1.6));
      for (const side of [-1, 1]) {
        g.add(box(.2, .85, .2, '#2c2727', side * .5, 1.2));
        g.add(box(.22, .8, .22, '#2c2727', side * .2, .45));
        g.add(box(.1, .06, .2, '#e06a30', side * .5, .78));
      }
      eyes(g, box, 2.1, -.26, .13, .12, '#ff9a3c', false);
      break;
    }
    case 'cinderhound': {
      const hide = '#2c2727', glow = '#e06a30';
      g.add(box(.55, .5, 1.15, hide, 0, .72));
      g.add(box(.44, .42, .5, hide, 0, .86, -.75));
      g.add(box(.3, .2, .34, glow, 0, .74, -1.04));
      for (let i = 0; i < 3; i++) g.add(box(.1, .08, .3, glow, 0, .5 + i * .16, .1 + i * .1));
      for (const side of [-1, 1]) {
        g.add(box(.12, .2, .08, hide, side * .18, 1.08, -.68));
        g.add(box(.14, .1, .1, glow, side * .16, .78, -1.05));
      }
      eyes(g, box, .94, -.98, .14, .08, '#ffb05c', false);
      quad(g, box, hide, .14, .45, .14, .24, .2, .4, '#141212');
      const tail = box(.1, .5, .1, hide, 0, .85, .62);
      tail.rotation.x = -.8;
      g.add(tail);
      break;
    }
    case 'salamander': {
      const hide = '#3a2a26', glow = '#e06a30', pale = '#c98a4c';
      g.add(box(.3, .18, .7, hide, 0, .12));
      g.add(box(.26, .16, .28, hide, 0, .16, -.44));
      g.add(box(.16, .12, .5, hide, 0, .1, .5));
      for (let i = 0; i < 4; i++) g.add(box(.32, .06, .1, glow, 0, .12, -.2 + i * .2));
      for (const side of [-1, 1]) {
        g.add(box(.2, .06, .1, pale, side * .22, .1, -.28));
        g.add(box(.2, .06, .1, pale, side * .22, .1, .28));
      }
      eyes(g, box, .2, -.55, .09, .05, '#e8c94a', false);
      break;
    }
    case 'obsidianbeetle': {
      const shell = '#241f2e', sheen = '#4a3f66';
      g.add(box(.5, .3, .7, shell, 0, .28));
      g.add(box(.44, .16, .5, sheen, 0, .46, .04));
      g.add(box(.24, .2, .22, shell, 0, .26, -.44));
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) g.add(box(.4, .05, .06, shell, side * .34, .2, -.26 + i * .26));
        g.add(box(.07, .07, .05, '#b79ee0', side * .1, .3, -.55));
      }
      break;
    }
    case 'bonethief': {
      const bone = '#c9c3aa';
      g.add(box(.5, .7, .4, '#7a6f5a', 0, .9));
      g.add(box(.42, .4, .42, bone, 0, 1.4));
      g.add(box(.36, .14, .3, '#5c5346', 0, 1.22, -.05));
      g.add(box(.7, .5, .5, '#8f8570', 0, 1.15, .4));
      for (let i = 0; i < 4; i++) g.add(box(.12, .28, .12, bone, -.2 + i * .14, 1.5, .4));
      for (const side of [-1, 1]) {
        g.add(box(.12, .6, .12, '#7a6f5a', side * .3, .9));
        g.add(box(.14, .18, .14, bone, side * .3, .56));
        g.add(box(.12, .45, .12, '#7a6f5a', side * .14, .22));
      }
      eyes(g, box, 1.45, -.22, .12, .1, '#e0b64a', false);
      break;
    }
    case 'scarab': {
      const shell = '#2f4a5a', sheen = '#6f9a8a';
      g.add(box(.34, .26, .46, shell, 0, .26));
      g.add(box(.3, .12, .34, sheen, 0, .4, .04));
      g.add(box(.2, .18, .18, shell, 0, .24, -.3));
      g.add(box(.2, .2, .2, '#c9c3aa', 0, .22, -.52));
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) g.add(box(.26, .04, .05, shell, side * .22, .2, -.16 + i * .18));
        g.add(box(.08, .06, .05, '#1c1a14', side * .06, .28, -.38));
      }
      break;
    }
    case 'gravemoth': {
      const wing = '#d8d2c4', bone = '#a89f88';
      g.add(box(.16, .18, .5, bone, 0, 0));
      g.add(box(.2, .18, .2, '#c9c2b0', 0, .04, -.3));
      for (const side of [-1, 1]) {
        g.add(box(.44, .04, .4, wing, side * .3, .06, -.1));
        g.add(box(.3, .04, .26, wing, side * .22, .02, .2));
        g.add(box(.09, .05, .09, bone, side * .36, .07, -.14));
        g.add(box(.04, .26, .04, bone, side * .07, .28, -.38));
      }
      eyes(g, box, .05, -.4, .07, .05, '#2a2620', false);
      break;
    }
    case 'scraphound': {
      const plate = '#8f8577', rust = '#a06a49', lens = '#6fc79a';
      g.add(box(.6, .5, 1, plate, 0, .7));
      g.add(box(.46, .4, .44, rust, 0, .84, -.7));
      g.add(box(.26, .16, .22, '#5c5450', 0, .74, -.95));
      g.add(box(.06, .5, .06, '#5c5450', 0, 1.1, .1));
      g.add(box(.1, .1, .1, lens, 0, 1.4, .1));
      for (const side of [-1, 1]) {
        g.add(box(.1, .16, .1, rust, side * .2, 1, -.62));
        g.add(box(.12, .4, .12, plate, side * .2, .22, -.4));
        g.add(box(.12, .4, .12, plate, side * .2, .22, .4));
      }
      eyes(g, box, .9, -.98, .13, .07, lens, false);
      break;
    }
    case 'terminus': {
      const metal = '#8f8577';
      g.add(box(1.1, 1.3, .8, metal, 0, 1.6));
      g.add(box(.7, .6, .7, '#a06a49', 0, 2.55));
      g.add(box(.5, .1, .5, '#6fc79a', 0, 2.3));
      g.add(box(.9, .2, .1, '#6fc79a', 0, 1.7, -.42));
      for (const side of [-1, 1]) {
        g.add(box(.35, 1.2, .35, metal, side * .75, 1.4));
        g.add(box(.4, .4, .4, '#a06a49', side * .75, .7));
        g.add(box(.4, 1, .4, metal, side * .3, .5));
        g.add(box(.45, .2, .5, '#5c5450', side * .3, .05));
      }
      eyes(g, box, 2.6, -.36, .2, .14, '#6fc79a', false);
      break;
    }
    case 'crystalcrawler': {
      g.add(box(1, .5, 1.3, '#4a3f66', 0, .5));
      g.add(box(.45, .35, .4, '#4a3f66', 0, .4, -.8));
      for (let i = -1; i <= 1; i++) g.add(box(.3, .45, .3, '#b79ee0', i * .32, .95, i * .2));
      for (const side of [-1, 1]) for (let i = 0; i < 3; i++) g.add(box(.6, .08, .1, '#3a3050', side * .55, .25 - i * .04, -.4 + i * .4));
      eyes(g, box, .45, -1.02, .14, .1, '#d6c3ff', false);
      break;
    }
    case 'geodecrab': {
      const stone = '#8a94a0', shell = '#6f6a7a', crystal = '#b79ee0';
      g.add(box(.8, .38, .9, stone, 0, .4));
      g.add(box(.62, .2, .7, shell, 0, .62));
      for (let i = 0; i < 4; i++) {
        const shard = box(.22, .5 - i * .06, .22, crystal, -.24 + i * .16, 1, i % 2 ? .12 : -.12);
        shard.rotation.z = i % 2 ? .35 : -.3;
        g.add(shard);
      }
      for (const side of [-1, 1]) {
        g.add(box(.34, .16, .3, shell, side * .55, .4, -.4));
        g.add(box(.2, .22, .2, stone, side * .68, .3, -.6));
        for (let i = 0; i < 3; i++) g.add(box(.4, .1, .08, shell, side * .5, .26, .1 + i * .26));
        g.add(box(.06, .18, .06, '#d6c3ff', side * .26, .62, -.48));
        g.add(box(.07, .07, .05, '#2a2038', side * .26, .72, -.5));
      }
      break;
    }

    /* ---- Shallows ------------------------------------------------------ */
    case 'cod': case 'salmon': {
      const c = id === 'salmon' ? '#c47a6a' : '#9aa89a';
      g.add(box(.35, .45, 1, c, 0, 0));
      g.add(box(.3, .3, .35, c, 0, 0, -.6));
      g.add(box(.5, .35, .2, c, 0, 0, .65));
      g.add(box(.06, .3, .5, c, 0, .35, 0));
      eyes(g, box, .08, -.78, .12, .08);
      break;
    }
    case 'jellyfish': {
      g.add(box(.8, .45, .8, '#c9c0e0', 0, .4));
      g.add(box(.6, .2, .6, '#e6dff2', 0, .62));
      for (let i = 0; i < 8; i++) {
        const angle = i / 8 * Math.PI * 2;
        g.add(box(.05, 1.2, .05, '#b7aad6', Math.cos(angle) * .3, -.4, Math.sin(angle) * .3));
      }
      break;
    }
    case 'turtle': {
      g.add(box(1.2, .5, 1.5, '#3f6b56', 0, .4));
      g.add(box(.9, .2, 1.1, '#527d66', 0, .75));
      g.add(box(.4, .3, .45, '#7a9a6f', 0, .35, -.95));
      for (const side of [-1, 1]) {
        const flipper = box(.55, .1, .35, '#7a9a6f', side * .75, .3, -.4);
        flipper.rotation.y = side * .4;
        g.add(flipper);
        g.add(box(.35, .1, .3, '#7a9a6f', side * .6, .3, .55));
      }
      eyes(g, box, .45, -1.18, .12, .08);
      break;
    }
    case 'ray': {
      const back = '#4a5560', pale = '#8f9aa4';
      g.add(box(1.2, .16, .9, back, 0, .1));
      g.add(box(.9, .12, .6, pale, 0, -.02, .05));
      g.add(box(.4, .2, .4, '#5c6672', 0, .1, -.55));
      g.add(box(.08, .08, 1.1, back, 0, .08, .85));
      for (const side of [-1, 1]) g.add(box(.5, .06, .3, pale, side * .8, .1, -.1));
      eyes(g, box, .16, -.7, .1, .06, '#f0ece0', false);
      break;
    }
    case 'starfish': {
      const skin = '#d98a6a', pale = '#e8c2a0';
      g.add(box(.34, .16, .34, skin, 0, .1));
      g.add(box(.2, .1, .2, pale, 0, .2));
      for (let i = 0; i < 5; i++) {
        const angle = i / 5 * Math.PI * 2;
        const arm = box(.6, .14, .22, skin, Math.sin(angle) * .36, .1, Math.cos(angle) * .36);
        arm.rotation.y = -angle;
        g.add(arm);
      }
      break;
    }
    case 'hermitcrab': {
      const shell = '#b59a72', spiral = '#8a6b45', legs = '#c98a4c';
      g.add(box(.5, .45, .5, shell, 0, .5, .18));
      g.add(box(.4, .36, .4, spiral, 0, .72, .22));
      g.add(box(.26, .24, .26, shell, 0, .9, .26));
      g.add(box(.34, .3, .3, '#c9a878', 0, .3, -.24));
      for (const side of [-1, 1]) {
        g.add(box(.2, .2, .24, legs, side * .3, .26, -.3));
        for (let i = 0; i < 3; i++) g.add(box(.28, .05, .06, legs, side * .3, .18, -.05 + i * .18));
        g.add(box(.05, .22, .05, legs, side * .12, .42, -.3));
        g.add(box(.07, .07, .05, '#1c1a14', side * .12, .54, -.32));
      }
      break;
    }
    case 'piranha': {
      const scale = '#8f9aa0', belly = '#d8c9a8', fin = '#c94f4a';
      g.add(box(.3, .32, .6, scale, 0, 0));
      g.add(box(.26, .26, .24, scale, 0, .02, -.38));
      g.add(box(.24, .16, .1, belly, 0, -.08, -.4));
      g.add(box(.06, .26, .3, fin, 0, .24, .04));
      g.add(box(.16, .22, .14, fin, 0, 0, .38));
      for (let i = 0; i < 5; i++) g.add(box(.03, .06, .03, '#f0ece0', -.16 + i * .08, -.06, -.46));
      for (const side of [-1, 1]) g.add(box(.14, .04, .18, fin, side * .2, -.04, .06));
      eyes(g, box, .06, -.46, .11, .06, '#e8e0c8', false);
      break;
    }
    case 'barracuda': {
      const scale = '#9fb0b8', dark = '#5c6672', fin = '#c9d2d6';
      g.add(box(.32, .34, 1.3, scale, 0, 0));
      g.add(box(.28, .3, .4, scale, 0, .02, -.8));
      g.add(box(.24, .18, .5, '#7f8f98', 0, -.02, -1.15));
      g.add(box(.06, .3, .4, dark, 0, .26, .1));
      g.add(box(.2, .34, .3, fin, 0, 0, .74));
      for (let i = 0; i < 6; i++) g.add(box(.03, .08, .03, '#f0ece0', -.12 + i * .05, -.02, -1.36));
      for (const side of [-1, 1]) g.add(box(.16, .06, .22, scale, side * .2, -.06, .3));
      eyes(g, box, .1, -.96, .13, .07, '#e8e0c8', false);
      break;
    }
    case 'flamingo': {
      g.add(box(.6, .55, .95, '#e88aa6', 0, 1.6));
      for (const side of [-1, 1]) {
        g.add(box(.1, .9, .1, '#e88aa6', side * .18, 2.4, -.35));
        g.add(box(.3, .3, .35, '#e88aa6', side * .32, 2.95, -.4));
        g.add(box(.1, .12, .3, '#2a2724', side * .32, 2.88, -.7));
        g.add(box(.08, .08, .04, '#1d1a18', side * .32 - .1, 3, -.58));
        g.add(box(.06, 1.5, .06, '#f0a3b6', side * .16, .8));
        g.add(box(.2, .04, .2, '#c46b86', side * .16, .05));
      }
      break;
    }

    /* ---- The deep ocean ------------------------------------------------ */
    case 'anglerfish': {
      g.add(box(.9, .8, 1.1, '#2c3238', 0, 0));
      g.add(box(.95, .3, .5, '#1a1e22', 0, -.15, -.45));
      for (let i = -2; i <= 2; i++) g.add(box(.06, .18, .06, '#e8e4d2', i * .16, -.05, -.62));
      const rod = box(.05, .7, .05, '#2c3238', 0, .6, -.4);
      rod.rotation.x = .5;
      g.add(rod);
      g.add(box(.2, .2, .2, '#e8f0a0', 0, .95, -.75));
      eyes(g, box, .25, -.56, .3, .12, '#c9d0a0', false);
      break;
    }
    case 'squid': case 'kraken': {
      const c = id === 'kraken' ? '#4a2f3a' : '#8a5f6e';
      g.add(box(.9, 1.8, .9, c, 0, 1.2));
      g.add(box(.7, .8, .7, c, 0, 2.3));
      for (let i = 0; i < 8; i++) {
        const angle = i / 8 * Math.PI * 2;
        const tentacle = box(.16, 1.8, .16, c, Math.cos(angle) * .45, -.6, Math.sin(angle) * .45);
        tentacle.rotation.x = Math.sin(angle) * .35;
        tentacle.rotation.z = -Math.cos(angle) * .35;
        g.add(tentacle);
      }
      eyes(g, box, 1.2, -.46, .3, .25, '#e8e6c8', false);
      for (const side of [-1, 1]) g.add(box(.12, .12, .03, '#111', side * .3, 1.2, -.49));
      break;
    }
    case 'gulper': {
      const skin = '#2a2630', dark = '#1a171e', lure = '#a8e0c8';
      g.add(box(1, .9, 1, skin, 0, .1));
      g.add(box(1.1, .5, .7, dark, 0, -.2, -.5));
      g.add(box(.5, .5, .5, skin, 0, .6, .35));
      const rod = box(.06, .9, .06, skin, 0, .9, -.2);
      rod.rotation.x = .6;
      g.add(rod);
      g.add(box(.24, .24, .24, lure, 0, 1.25, -.8));
      for (let i = -3; i <= 3; i++) g.add(box(.06, .24, .06, '#e8e4d2', i * .14, 0, -.72));
      eyes(g, box, .34, -.66, .34, .13, '#c9d0a0', false);
      break;
    }

    /* ---- Underground strata -------------------------------------------- */
    case 'glowworm': {
      g.add(box(.12, .1, .5, '#9fd8b8', 0, 0));
      g.add(box(.1, .1, .12, '#e8f5c8', 0, .02, -.3));
      break;
    }
    case 'pillbug': {
      const shell = '#cfc4a8', dark = '#a89c80';
      for (let i = 0; i < 5; i++) {
        const size = .3 - Math.abs(i - 2) * .05;
        g.add(box(size, size * .7, .16, i % 2 ? shell : dark, 0, .18, -.3 + i * .15));
      }
      for (const side of [-1, 1]) for (let i = 0; i < 5; i++) g.add(box(.14, .04, .05, dark, side * .12, .08, -.3 + i * .15));
      break;
    }
    case 'molerat': {
      g.add(box(.4, .3, .7, '#d8b0a8', 0, .2));
      g.add(box(.3, .25, .3, '#d8b0a8', 0, .25, -.45));
      g.add(box(.1, .08, .06, '#e4c0b8', 0, .18, -.62));
      g.add(box(.14, .12, .04, '#f0ece0', 0, .12, -.62));
      g.add(box(.06, .06, .35, '#d8b0a8', 0, .18, .5));
      quad(g, box, '#c9a098', .1, .18, .1, .08, .15, .25);
      break;
    }
    case 'bat': {
      g.add(box(.25, .22, .3, '#3a3238', 0, 0));
      for (const side of [-1, 1]) {
        const wing = box(.7, .03, .4, '#4d434c', side * .45, .02, 0);
        wing.rotation.z = side * .2;
        g.add(wing);
        g.add(box(.06, .1, .06, '#3a3238', side * .08, .15));
      }
      eyes(g, box, .04, -.16, .07, .05, '#d84a4a', false);
      break;
    }
    case 'cavespider': {
      g.add(box(.5, .35, .5, '#2f2a30', 0, .35));
      g.add(box(.7, .45, .8, '#3a343b', 0, .4, .55));
      g.add(box(.3, .25, .3, '#2f2a30', 0, .3, -.35));
      for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
        const leg = box(.6, .05, .06, '#2f2a30', side * .45, .35, -.2 + i * .25);
        leg.rotation.z = side * .35;
        g.add(leg);
        g.add(box(.05, .35, .06, '#2f2a30', side * .7, .15, -.2 + i * .25));
      }
      for (let i = 0; i < 4; i++) g.add(box(.06, .06, .03, '#c93f3f', -.15 + i * .1, .38, -.5));
      break;
    }
    case 'gembug': {
      const shell = '#33403c', sheen = '#4a5c56', gem = '#e3e2d8';
      g.add(box(.34, .26, .5, shell, 0, .26));
      g.add(box(.3, .12, .34, sheen, 0, .42, .04));
      g.add(box(.18, .16, .16, shell, 0, .24, -.34));
      for (let i = 0; i < 3; i++) g.add(box(.1 - i * .02, .1, .1, gem, 0, .5, -.1 + i * .2));
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) g.add(box(.26, .04, .05, shell, side * .22, .2, -.18 + i * .2));
        g.add(box(.05, .05, .04, '#8fd0a0', side * .07, .28, -.42));
      }
      break;
    }
    case 'deepskeleton': {
      const bone = '#a8a48f';
      g.add(box(.16, .9, .16, '#6f6b5c', 0, 1.14));
      g.add(box(.46, .14, .24, bone, 0, .74));
      for (let i = 0; i < 4; i++) {
        const y = .95 + i * .17, w = .56 - Math.abs(i - 1.2) * .07;
        g.add(box(w, .08, .1, bone, 0, y, -.11));
        g.add(box(w, .08, .1, bone, 0, y, .11));
      }
      g.add(box(.46, .34, .42, bone, 0, 2));
      g.add(box(.38, .12, .34, '#6f6b5c', 0, 1.79, -.03));
      for (const side of [-1, 1]) {
        g.add(box(.13, .13, .07, '#20261f', side * .12, 2.03, -.2));
        g.add(box(.06, .06, .03, '#76d8bb', side * .12, 2.04, -.22));
        g.add(box(.12, .42, .13, bone, side * .33, 1.42));
        g.add(box(.1, .4, .11, bone, side * .36, 1.02));
        g.add(box(.14, .44, .15, bone, side * .16, .5));
        g.add(box(.12, .38, .13, bone, side * .16, .14));
      }
      break;
    }
    case 'magmaslug': {
      g.add(box(.7, .45, 1.1, '#3a2a26', 0, .3));
      g.add(box(.6, .12, .9, '#e06a30', 0, .32));
      g.add(box(.5, .4, .5, '#3a2a26', 0, .45, -.6));
      g.add(box(.4, .08, .4, '#ff9a3c', 0, .5, -.6));
      for (const side of [-1, 1]) g.add(box(.05, .25, .05, '#e06a30', side * .12, .7, -.7));
      break;
    }
    case 'cavetroll': {
      const hide = '#5c6a52', moss = '#7fc98a', tusk = '#d8d2b8';
      g.add(box(1.2, 1.1, .8, hide, 0, 1.6));
      g.add(box(.8, .7, .7, '#4f5c48', 0, 2.5));
      g.add(box(.7, .3, .4, '#6f7f62', 0, 2.6, -.4));
      for (let i = 0; i < 6; i++) g.add(box(.16, .1, .16, moss, -.5 + i * .2, 2.05, .42));
      for (const side of [-1, 1]) {
        g.add(box(.14, .18, .1, tusk, side * .2, 2.42, -.62));
        g.add(box(.26, 1.3, .26, hide, side * .8, 1.4));
        g.add(box(.3, .3, .3, '#4f5c48', side * .8, .6));
        g.add(box(.34, .9, .34, hide, side * .3, .5));
        g.add(box(.4, .2, .5, '#3f4739', side * .3, .05, -.05));
      }
      eyes(g, box, 2.56, -.36, .2, .12, '#e8c94a', false);
      break;
    }
    case 'echowraith': {
      g.add(box(.6, 1.2, .3, '#8f97a8', 0, 1));
      g.add(box(.45, .45, .4, '#a5adbd', 0, 1.8));
      g.add(box(.5, .8, .2, '#7c8494', 0, .3));
      for (const side of [-1, 1]) g.add(box(.14, .8, .14, '#8f97a8', side * .4, 1));
      eyes(g, box, 1.85, -.21, .14, .12, '#e8e6d8', false);
      break;
    }
    case 'golem': {
      const stone = '#7f8794', plate = '#5c5450', core = '#8fd0b8';
      g.add(box(1, 1.2, .7, stone, 0, 1.7));
      g.add(box(.6, .5, .5, '#6f7783', 0, 2.5));
      g.add(box(.24, .24, .16, core, 0, 1.7, -.4));
      g.add(box(.2, .2, .2, core, 0, 2.5, -.3));
      for (let i = 0; i < 4; i++) g.add(box(.12, .12, .12, core, Math.sin(i * 1.6) * .5, 2.9, Math.cos(i * 1.2) * .4));
      for (const side of [-1, 1]) {
        g.add(box(.3, 1.4, .3, stone, side * .72, 1.6));
        g.add(box(.34, .34, .34, plate, side * .72, .8));
        g.add(box(.4, 1, .4, stone, side * .3, .55));
        g.add(box(.46, .2, .5, plate, side * .3, .05, -.04));
        g.add(box(.35, .35, .35, '#a06a49', side * 1.2, 2 + side * .2, 0));
      }
      eyes(g, box, 2.54, -.27, .16, .1, core, false);
      break;
    }
    case 'voidcrawler': {
      g.add(box(1, .8, 1.4, '#2f3340', 0, .7));
      g.add(box(.6, .6, .6, '#26303a', 0, .8, -.9));
      g.add(box(.5, .5, .5, '#3a3f4a', 0, 1.3, .3));
      for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
        const limb = box(.9, .1, .12, '#26303a', side * .7, .5, -.45 + i * .45);
        limb.rotation.z = side * .25;
        g.add(limb);
      }
      for (let i = 0; i < 5; i++) g.add(box(.08, .08, .04, '#b79ee0', -.24 + i * .12, .85 + i % 2 * .12, -1.21));
      break;
    }
    case 'cradlekeeper': {
      const c = '#c9c2a4';
      g.add(box(1.2, 1.6, .9, c, 0, 2.2));
      g.add(box(.8, .8, .8, '#e0d9bc', 0, 3.4));
      g.add(box(.7, .7, .7, '#a8d8e0', 0, 2.2, -.5));
      for (let i = 0; i < 6; i++) {
        const angle = i / 6 * Math.PI * 2;
        g.add(box(.25, 1.6, .25, c, Math.cos(angle) * .9, 2, Math.sin(angle) * .9));
      }
      for (const side of [-1, 1]) g.add(box(.4, 1.8, .4, c, side * .4, .9));
      eyes(g, box, 3.5, -.41, .22, .16, '#a8d8e0', false);
      break;
    }

    default:
      g.add(box(.6, .6, .6, '#999', 0, .3));
  }
  if (def?.scale && def.scale !== 1) g.scale.setScalar(def.scale);
  return g;
}
