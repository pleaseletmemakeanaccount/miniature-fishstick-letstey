import * as THREE from 'three';
import type { Biome } from './biomes';

export type Temperament = 'passive' | 'skittish' | 'hostile' | 'ambient';
export type Locomotion = 'walk' | 'fly' | 'swim' | 'hop';

export interface CreatureDefinition {
  id: string;
  name: string;
  temperament: Temperament;
  locomotion: Locomotion;
  hp: number;
  damage: number;
  speed: number;
  /** Surface biomes this species spawns in. Empty means underground only. */
  biomes: Biome[];
  /** Cave-only species spawn from this stratum downward. */
  minStratum?: number;
  nocturnal?: boolean;
  drop: string;
  dropCount: number;
  flavour: string;
  /** Vertical offset above ground for flyers/swimmers. */
  hover?: number;
  scale?: number;
}

const D = (id: string, name: string, temperament: Temperament, locomotion: Locomotion, hp: number, damage: number, speed: number, biomes: Biome[], drop: string, dropCount: number, flavour: string, extra: Partial<CreatureDefinition> = {}): CreatureDefinition =>
  ({ id, name, temperament, locomotion, hp, damage, speed, biomes, drop, dropCount, flavour, ...extra });

export const CREATURES: CreatureDefinition[] = [
  // Passive surface fauna
  D('cow', 'Cow', 'passive', 'walk', 40, 0, .5, ['meadow', 'savanna', 'taiga', 'highlands'], 'raw-meat', 2, 'Placid, enormous, and entirely unbothered by the shape of the sky.'),
  D('chicken', 'Chicken', 'skittish', 'walk', 10, 0, 1.1, ['meadow', 'savanna', 'taiga', 'grove', 'jungle'], 'boiled-egg', 1, 'Small, loud, and convinced every shadow is a hawk.'),
  D('kiwi', 'Kiwi bird', 'skittish', 'walk', 12, 0, 1.4, ['grove', 'jungle', 'taiga', 'mushroom'], 'roast-kiwi', 1, 'A quiet, round, flightless bird that snuffles through the leaf litter.'),
  D('frog', 'Frog', 'passive', 'hop', 8, 0, 1.6, ['swamp', 'meadow', 'jungle', 'mushroom'], 'cheese', 0, 'Waiting, patiently, for someone to offer it cheese.'),
  D('owl', 'Owl', 'ambient', 'fly', 14, 0, 2.2, ['taiga', 'grove', 'highlands', 'alpine'], 'feather', 2, 'It watches you from a branch with grave and total attention.', { nocturnal: true, hover: 5 }),
  D('butterfly', 'Butterfly', 'ambient', 'fly', 2, 0, 1.4, ['meadow', 'jungle', 'grove', 'savanna'], 'feather', 0, 'A scrap of colour that has never once landed where you expected.', { hover: 1.6, scale: .4 }),
  D('dog', 'Dog', 'passive', 'walk', 26, 0, 1.9, ['meadow', 'taiga', 'savanna', 'highlands'], 'leather', 0, 'It has decided you are worth following. This is not negotiable.'),
  D('cat', 'Cat', 'skittish', 'walk', 14, 0, 1.7, ['meadow', 'grove', 'desert', 'badlands'], 'string', 0, 'It has decided you are not worth following. This is also not negotiable.'),
  D('goat', 'Mountain goat', 'skittish', 'walk', 30, 0, 1.3, ['alpine', 'highlands', 'glacier', 'sky'], 'raw-meat', 1, 'Standing calmly on a ledge no sane creature should be able to reach.'),
  D('camel', 'Camel', 'passive', 'walk', 48, 0, .7, ['desert', 'badlands', 'outer', 'bone'], 'leather', 2, 'Tall, disdainful, and better at the desert than you will ever be.'),
  D('tortoise', 'Sand tortoise', 'passive', 'walk', 60, 0, .2, ['desert', 'savanna', 'badlands'], 'shell', 1, 'It will get there. Eventually. It has always gotten there.'),
  D('penguin', 'Penguin', 'passive', 'walk', 18, 0, .9, ['glacier', 'tundra', 'alpine'], 'raw-fish', 1, 'Dignified on ice and a comedy everywhere else.'),
  D('mammoth', 'Woolly mammoth', 'passive', 'walk', 140, 0, .45, ['tundra', 'glacier'], 'leather', 4, 'A walking hill of hair and patience, older than the taiga.', { scale: 1.9 }),
  D('lizard', 'Sun lizard', 'skittish', 'walk', 9, 0, 2, ['desert', 'badlands', 'canyon', 'volcanic'], 'leather', 0, 'A quick flick of scales across hot stone, then gone.', { scale: .6 }),
  D('snail', 'Glow snail', 'ambient', 'walk', 4, 0, .1, ['mushroom', 'swamp', 'sinkholes'], 'glow-fungus', 1, 'Leaves a faint luminous trail across the mycelium.', { scale: .5 }),
  D('firefly', 'Firefly swarm', 'ambient', 'fly', 1, 0, .8, ['swamp', 'meadow', 'mushroom', 'grove'], 'glowstone', 0, 'A drifting constellation that only comes out after dark.', { nocturnal: true, hover: 2, scale: .35 }),
  // Sea life
  D('cod', 'Cod', 'ambient', 'swim', 6, 0, 1.2, ['reef', 'deepocean', 'abyss'], 'raw-fish', 1, 'Silver, unremarkable, and delicious.', { hover: -3, scale: .8 }),
  D('salmon', 'Salmon', 'ambient', 'swim', 8, 0, 1.6, ['taiga', 'meadow', 'reef'], 'raw-fish', 1, 'Fighting upstream, as it always has, in a river with no sea.', { hover: -2, scale: .9 }),
  D('jellyfish', 'Moon jelly', 'ambient', 'swim', 3, 4, .3, ['reef', 'deepocean'], 'glowstone', 0, 'A slow pale bell that stings anyone careless enough to brush it.', { hover: -4, scale: .8 }),
  D('turtle', 'Sea turtle', 'passive', 'swim', 45, 0, .6, ['reef', 'deepocean'], 'shell', 1, 'Ancient and unhurried, gliding over the coral like a slow cloud.', { hover: -2.5, scale: 1.3 }),
  D('anglerfish', 'Anglerfish', 'hostile', 'swim', 30, 9, 1, ['abyss', 'deepocean'], 'glowstone', 1, 'A single hanging light in the black, and a mouth beneath it.', { hover: -20, nocturnal: false }),
  D('squid', 'Giant squid', 'hostile', 'swim', 90, 14, 1.3, ['abyss', 'deepocean'], 'squid-ink', 2, 'Guardian of deep water. It does not want you here.', { hover: -25, scale: 2.4 }),
  // Sky fauna
  D('skysquirrel', 'Sky squirrel', 'hostile', 'fly', 12, 6, 2.6, ['sky', 'clouds', 'alpine'], 'feather', 1, 'A fast, furious ball of fur that dive-bombs anything on its ledge.', { hover: 3 }),
  D('cloudserpent', 'Cloud serpent', 'hostile', 'fly', 70, 16, 2, ['clouds', 'sky', 'storm'], 'wyrm-scale', 1, 'A ribbon of scales sliding through the vapour, hunting by silhouette.', { hover: 6, scale: 1.5 }),
  D('flamingo', 'Two-headed flamingo', 'hostile', 'walk', 48, 11, 1.4, ['blood', 'swamp', 'reef'], 'feather', 3, 'Pink, tall, and arguing with itself about which head gets to bite you.'),
  D('bat', 'Cave bat', 'ambient', 'fly', 5, 0, 3, [], 'leather', 0, 'A flicker of wings past your lantern, then silence.', { minStratum: 0, hover: 3, scale: .45, nocturnal: false }),
  D('vulture', 'Bone vulture', 'ambient', 'fly', 20, 0, 1.6, ['bone', 'desert', 'badlands', 'outer'], 'feather', 2, 'Circling, always, over something that has not died yet.', { hover: 12, scale: 1.2 }),
  // Hostile surface
  D('bonethief', 'Bone thief', 'hostile', 'walk', 40, 12, 1.5, ['bone', 'broken', 'desert'], 'bone-block', 3, 'A hunched thing that collects what other creatures leave behind, including you.', { nocturnal: true }),
  D('ashwalker', 'Ash walker', 'hostile', 'walk', 60, 15, .9, ['volcanic'], 'ember', 2, 'Cooled slag in the shape of a person, still glowing at the seams.'),
  D('frostwolf', 'Frost wolf', 'hostile', 'walk', 44, 12, 2.1, ['glacier', 'tundra', 'alpine', 'taiga'], 'leather', 2, 'White on white. You hear it before you see it.', { nocturnal: true }),
  D('sporeling', 'Sporeling', 'hostile', 'hop', 18, 6, 1.2, ['mushroom', 'swamp'], 'spore-cap', 2, 'A walking mushroom cap with far too many small legs.'),
  D('crystalcrawler', 'Crystal crawler', 'hostile', 'walk', 55, 13, .8, ['crystalcave', 'spiked'], 'crystal-shard', 2, 'A beetle armoured in living crystal, humming as it comes.'),
  D('scorpion', 'Dune scorpion', 'hostile', 'walk', 35, 10, 1.4, ['desert', 'badlands', 'outer', 'canyon'], 'chitin', 2, 'Sand-coloured until it is far too late to notice.'),
  D('mireling', 'Mireling', 'hostile', 'walk', 38, 9, .7, ['swamp'], 'mud', 3, 'The mud stood up. It seems annoyed about it.'),
  D('terminus', 'Terminus protector', 'hostile', 'walk', 120, 20, 1, ['outer'], 'circuit', 3, 'A rusted sentinel still guarding a circuit no one remembers closing.', { scale: 1.6 }),
  D('snowwalker', 'Snowwalker', 'hostile', 'walk', 110, 18, 1.1, ['glacier', 'tundra'], 'blue-ice', 3, 'Something tall and pale that walks through blizzards as if they were doors.', { scale: 1.7, nocturnal: true }),
  // Underground creatures
  D('cavespider', 'Cave spider', 'hostile', 'walk', 22, 8, 2, [], 'string', 2, 'Eight legs, quick, and very fond of the dark corners you are not looking at.', { minStratum: 0 }),
  D('glowworm', 'Glowworm', 'ambient', 'walk', 3, 0, .05, [], 'glow-fungus', 1, 'A tiny cold light clinging to the cave roof.', { minStratum: 0, scale: .3 }),
  D('molerat', 'Mole rat', 'skittish', 'walk', 10, 0, 1.5, [], 'raw-meat', 1, 'Pink, blind, and very surprised to meet you down here.', { minStratum: 0, scale: .6 }),
  D('deepskeleton', 'Deep skeleton', 'hostile', 'walk', 50, 14, 1.2, [], 'bone-block', 2, 'Older bones than the ones on the surface, and better rested.', { minStratum: 1 }),
  D('magmaslug', 'Magma slug', 'hostile', 'walk', 40, 12, .4, [], 'magma', 1, 'A glowing lump of half-molten rock, slowly coming toward your boots.', { minStratum: 2 }),
  D('echowraith', 'Echo wraith', 'hostile', 'fly', 45, 11, 1.8, [], 'echo-stone', 2, 'It repeats your footsteps back to you from a slightly wrong direction.', { minStratum: 3, hover: 2 }),
  D('voidcrawler', 'Void crawler', 'hostile', 'walk', 85, 19, 1.5, [], 'void-stone', 3, 'Its geometry does not quite add up, and neither do its shadows.', { minStratum: 5, scale: 1.4 }),
  D('cradlekeeper', 'Cradle keeper', 'hostile', 'walk', 200, 24, .9, [], 'ernas-seed', 1, 'It sleeps at the bottom of the world. You have woken it.', { minStratum: 6, scale: 2.2 }),
  D('kraken', 'Kraken', 'hostile', 'swim', 220, 26, 1.1, ['abyss'], 'kraken-tooth', 1, 'The dark at the bottom of the ocean, with an opinion.', { hover: -32, scale: 3.4 }),
];

export const CREATURE_BY_ID: Record<string, CreatureDefinition> = Object.fromEntries(CREATURES.map(c => [c.id, c]));

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
    case 'cow': {
      const hide = '#3f3a35', spot = '#e4dfd2';
      g.add(box(1.3, .95, 2.1, hide, 0, 1.15)); g.add(box(.7, .5, .8, spot, .25, 1.3, .4)); g.add(box(.6, .45, .7, spot, -.3, 1.2, -.5));
      g.add(box(.9, .8, .85, hide, 0, 1.35, -1.35)); g.add(box(.7, .35, .3, '#c9a58f', 0, 1.1, -1.85));
      g.add(box(.7, .35, .55, '#d8b6a9', 0, .7, .2));
      for (const side of [-1, 1]) { g.add(box(.12, .28, .12, '#e6e2d3', side * .38, 1.9, -1.4)); g.add(box(.26, .12, .1, hide, side * .5, 1.5, -1.3)); }
      eyes(g, box, 1.55, -1.78, .28, .12);
      quad(g, box, hide, .28, .7, .28, .35, .45, .75, '#2a2624');
      const tail = box(.1, .8, .1, hide, 0, 1.2, 1.1); tail.rotation.x = .3; g.add(tail);
      break;
    }
    case 'chicken': {
      g.add(box(.55, .5, .7, '#efe9dc', 0, .6)); g.add(box(.4, .4, .38, '#efe9dc', 0, 1.0, -.4));
      g.add(box(.14, .1, .22, '#d9a349', 0, .95, -.68)); g.add(box(.14, .16, .1, '#c94f4a', 0, .78, -.5)); g.add(box(.16, .12, .22, '#c94f4a', 0, 1.24, -.4));
      for (const side of [-1, 1]) { g.add(box(.1, .35, .5, '#e2dccc', side * .32, .6, .05)); g.add(box(.07, .3, .07, '#d9a349', side * .14, .18)); g.add(box(.16, .04, .16, '#d9a349', side * .14, .02)); }
      g.add(box(.3, .35, .12, '#e2dccc', 0, .75, .38));
      eyes(g, box, 1.05, -.6, .14, .07);
      break;
    }
    case 'kiwi': {
      g.add(box(.6, .55, .8, '#6b5a3e', 0, .45)); g.add(box(.3, .3, .3, '#6b5a3e', 0, .75, -.45));
      g.add(box(.07, .07, .6, '#c9b384', 0, .72, -.85));
      for (const side of [-1, 1]) { g.add(box(.08, .3, .08, '#a08a5e', side * .16, .12)); g.add(box(.2, .04, .18, '#a08a5e', side * .16, -.02)); }
      eyes(g, box, .82, -.6, .1, .07);
      break;
    }
    case 'frog': {
      g.add(box(.7, .4, .75, '#5f8f45', 0, .3)); g.add(box(.6, .3, .45, '#6f9f52', 0, .5, -.3));
      g.add(box(.6, .12, .5, '#c9d69a', 0, .18, .05));
      for (const side of [-1, 1]) { g.add(box(.16, .16, .16, '#5f8f45', side * .22, .7, -.4)); g.add(box(.12, .1, .06, '#e2b93c', side * .22, .72, -.48)); g.add(box(.06, .06, .04, '#1f221b', side * .22, .73, -.5)); g.add(box(.18, .16, .4, '#4f7f3a', side * .38, .15, .25)); g.add(box(.12, .12, .3, '#4f7f3a', side * .3, .12, -.25)); }
      break;
    }
    case 'owl': {
      g.add(box(.55, .8, .5, '#7a6a52', 0, .6)); g.add(box(.6, .5, .5, '#8f7d62', 0, 1.15));
      g.add(box(.5, .45, .1, '#e6dcc4', 0, 1.15, -.24));
      for (const side of [-1, 1]) { g.add(box(.2, .2, .06, '#e8c94a', side * .14, 1.2, -.29)); g.add(box(.09, .09, .05, '#1c1c18', side * .14, 1.21, -.31)); g.add(box(.12, .18, .12, '#7a6a52', side * .22, 1.42)); g.add(box(.08, .55, .4, '#6b5a44', side * .3, .65, 0)); g.add(box(.07, .22, .07, '#c9a04f', side * .12, .12)); }
      g.add(box(.09, .12, .09, '#e8c94a', 0, 1.02, -.3));
      break;
    }
    case 'butterfly': {
      g.add(box(.08, .08, .4, '#2f2a2a', 0, 0));
      for (const side of [-1, 1]) { const w = box(.5, .04, .5, '#d8865a', side * .3, 0, -.05); w.rotation.z = side * .25; g.add(w); const w2 = box(.36, .04, .36, '#e9c46a', side * .22, -.02, .2); w2.rotation.z = side * .25; g.add(w2); g.add(box(.12, .03, .12, '#2f2a2a', side * .32, .02, -.05)); }
      break;
    }
    case 'dog': {
      const fur = '#a9855a';
      g.add(box(.6, .55, 1.1, fur, 0, .7)); g.add(box(.5, .45, .5, fur, 0, .95, -.7)); g.add(box(.3, .25, .3, '#8a6a45', 0, .85, -1.05)); g.add(box(.12, .1, .08, '#221f1c', 0, .9, -1.22));
      for (const side of [-1, 1]) g.add(box(.14, .22, .1, '#8a6a45', side * .22, 1.2, -.62));
      eyes(g, box, 1.02, -.95, .15, .09);
      quad(g, box, fur, .16, .45, .16, .22, .2, .4);
      const tail = box(.1, .5, .1, fur, 0, .95, .6); tail.rotation.x = -.6; g.add(tail);
      g.add(box(.5, .12, .12, '#b34a3c', 0, .8, -.5));
      break;
    }
    case 'cat': {
      const fur = '#6d6a72';
      g.add(box(.42, .4, .85, fur, 0, .5)); g.add(box(.4, .38, .36, fur, 0, .75, -.55));
      for (const side of [-1, 1]) g.add(box(.12, .16, .08, fur, side * .14, .98, -.5));
      eyes(g, box, .8, -.74, .11, .09, '#9fc44a');
      g.add(box(.08, .06, .06, '#d99aa1', 0, .68, -.74));
      quad(g, box, fur, .12, .35, .12, .17, .14, .3);
      const tail = box(.08, .6, .08, fur, 0, .7, .5); tail.rotation.x = -.9; g.add(tail);
      break;
    }
    case 'goat': {
      g.add(box(.7, .65, 1.2, '#e2ddd0', 0, .95)); g.add(box(.45, .5, .55, '#e2ddd0', 0, 1.35, -.75));
      for (const side of [-1, 1]) { const horn = box(.08, .4, .08, '#8d7f68', side * .14, 1.75, -.7); horn.rotation.x = -.6; g.add(horn); }
      g.add(box(.2, .28, .1, '#d0cabc', 0, 1.05, -.95));
      eyes(g, box, 1.42, -1.04, .15, .09, '#c9a34a');
      quad(g, box, '#d8d3c6', .16, .65, .16, .32, .25, .45, '#4a4239');
      break;
    }
    case 'camel': {
      const hide = '#c4a068';
      g.add(box(.8, .8,1.8, hide, 0, 1.55)); g.add(box(.7, .6, .8, '#b58f5c', 0, 2.2, .1));
      g.add(box(.3, .9, .3, hide, 0, 2.2, -1.1)); g.add(box(.45, .4, .7, hide, 0, 2.7, -1.35)); g.add(box(.25, .2, .2, '#8f7048', 0, 2.55, -1.75));
      for (const side of [-1, 1]) g.add(box(.1, .14, .08, hide, side * .2, 2.9, -1.3));
      eyes(g, box, 2.75, -1.55, .18, .1);
      quad(g, box, hide, .18, 1.15, .18, .58, .3, .65, '#7a6040');
      break;
    }
    case 'tortoise': {
      g.add(box(1.1, .5, 1.3, '#5f6b45', 0, .5)); g.add(box(.85, .25, 1.0, '#7a875a', 0, .85));
      for (let i = -1; i <= 1; i++) g.add(box(.25, .08, .25, '#495438', i * .3, 1.0, i * .1));
      g.add(box(.35, .3, .45, '#8f9a6a', 0, .4, -.85)); eyes(g, box, .48, -1.06, .1, .07);
      quad(g, box, '#8f9a6a', .22, .25, .22, .14, .5, .5);
      break;
    }
    case 'penguin': {
      g.add(box(.55, .8, .5, '#1f2328', 0, .6)); g.add(box(.36, .55, .1, '#eeeae0', 0, .55, -.22));
      g.add(box(.45, .4, .45, '#1f2328', 0, 1.15)); g.add(box(.12, .08, .25, '#e8a13c', 0, 1.1, -.35));
      for (const side of [-1, 1]) { g.add(box(.08, .45, .3, '#1f2328', side * .3, .62)); g.add(box(.2, .06, .25, '#e8a13c', side * .12, .02)); }
      eyes(g, box, 1.2, -.24, .12, .07);
      break;
    }
    case 'mammoth': {
      const fur = '#6b4b32';
      g.add(box(1.5, 1.4, 2.3, fur, 0, 1.6)); g.add(box(1.6, .5, 2.4, '#5a3d27', 0, 1.0));
      g.add(box(1.1, 1.1, 1.0, fur, 0, 1.9, -1.5)); g.add(box(.35, 1.4, .35, '#7a5a3d', 0, 1.0, -2.0));
      for (const side of [-1, 1]) { const tusk = box(.14, .14, 1.4, '#e8e0c8', side * .35, 1.2, -2.5); tusk.rotation.x = -.3; g.add(tusk); g.add(box(.5, .5, .1, fur, side * .6, 1.9, -1.4)); }
      eyes(g, box, 2.1, -2.02, .3, .12);
      quad(g, box, fur, .4, 1.0, .4, .5, .5, .8, '#3d2a1c');
      break;
    }
    case 'lizard': {
      g.add(box(.3, .18, .8, '#b78e4c', 0, .1)); g.add(box(.26, .16, .3, '#b78e4c', 0, .12, -.5)); g.add(box(.1, .08, .6, '#a37d42', 0, .08, .65));
      for (const side of [-1, 1]) { g.add(box(.22, .06, .1, '#a37d42', side * .22, .05, -.25)); g.add(box(.22, .06, .1, '#a37d42', side * .22, .05, .25)); }
      eyes(g, box, .18, -.6, .1, .06, '#e0c15a', false);
      break;
    }
    case 'snail': {
      g.add(box(.3, .18, .6, '#c9c48f', 0, .1)); const shell = box(.4, .4, .4, '#6f5a8a', 0, .35, .1); shell.rotation.z = .3; g.add(shell); g.add(box(.2, .2, .2, '#9fd8c8', 0, .4, .1));
      for (const side of [-1, 1]) g.add(box(.04, .2, .04, '#c9c48f', side * .08, .3, -.3));
      break;
    }
    case 'firefly': for (let i = 0; i < 6; i++) g.add(box(.06, .06, .06, '#e9e07a', Math.sin(i * 1.3) * .6, Math.cos(i * .7) * .4, Math.sin(i * 2.1) * .6)); break;
    case 'cod': case 'salmon': {
      const c = id === 'salmon' ? '#c47a6a' : '#9aa89a';
      g.add(box(.35, .45, 1.0, c, 0, 0)); g.add(box(.3, .3, .35, c, 0, 0, -.6)); g.add(box(.5, .35, .2, c, 0, 0, .65)); g.add(box(.06, .3, .5, c, 0, .35, 0));
      eyes(g, box, .08, -.78, .12, .08); break;
    }
    case 'jellyfish': {
      g.add(box(.8, .45, .8, '#c9c0e0', 0, .4)); g.add(box(.6, .2, .6, '#e6dff2', 0, .62));
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(box(.05, 1.2, .05, '#b7aad6', Math.cos(a) * .3, -.4, Math.sin(a) * .3)); }
      break;
    }
    case 'turtle': {
      g.add(box(1.2, .5, 1.5, '#3f6b56', 0, .4)); g.add(box(.9, .2, 1.1, '#527d66', 0, .75)); g.add(box(.4, .3, .45, '#7a9a6f', 0, .35, -.95));
      for (const side of [-1, 1]) { const f = box(.55, .1, .35, '#7a9a6f', side * .75, .3, -.4); f.rotation.y = side * .4; g.add(f); g.add(box(.35, .1, .3, '#7a9a6f', side * .6, .3, .55)); }
      eyes(g, box, .45, -1.18, .12, .08); break;
    }
    case 'anglerfish': {
      g.add(box(.9, .8, 1.1, '#2c3238', 0, 0)); g.add(box(.95, .3, .5, '#1a1e22', 0, -.15, -.45));
      for (let i = -2; i <= 2; i++) g.add(box(.06, .18, .06, '#e8e4d2', i * .16, -.05, -.62));
      const rod = box(.05, .7, .05, '#2c3238', 0, .6, -.4); rod.rotation.x = .5; g.add(rod); g.add(box(.2, .2, .2, '#e8f0a0', 0, .95, -.75));
      eyes(g, box, .25, -.56, .3, .12, '#c9d0a0', false); break;
    }
    case 'squid': case 'kraken': {
      const c = id === 'kraken' ? '#4a2f3a' : '#8a5f6e';
      g.add(box(.9, 1.8, .9, c, 0, 1.2)); g.add(box(.7, .8, .7, c, 0, 2.3));
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const t = box(.16, 1.8, .16, c, Math.cos(a) * .45, -.6, Math.sin(a) * .45); t.rotation.x = Math.sin(a) * .35; t.rotation.z = -Math.cos(a) * .35; g.add(t); }
      eyes(g, box, 1.2, -.46, .3, .25, '#e8e6c8', false); for (const side of [-1, 1]) g.add(box(.12, .12, .03, '#111', side * .3, 1.2, -.49));
      break;
    }
    case 'skysquirrel': {
      g.add(box(.35, .35, .6, '#8a6d4a', 0, .3)); g.add(box(.3, .3, .3, '#8a6d4a', 0, .45, -.4)); g.add(box(.3, .5, .3, '#a5875f', 0, .55, .45));
      for (const side of [-1, 1]) { const m = box(.6, .04, .5, '#b59a72', side * .4, .25, 0); g.add(m); g.add(box(.08, .12, .08, '#8a6d4a', side * .12, .65, -.4)); }
      eyes(g, box, .5, -.56, .1, .07); break;
    }
    case 'cloudserpent': {
      for (let i = 0; i < 9; i++) { const s = .45 - i * .03; g.add(box(s, s, .6, i % 2 ? '#c9d6e6' : '#a9bcd2', 0, Math.sin(i * .9) * .2, i * .55)); }
      g.add(box(.55, .5, .7, '#c9d6e6', 0, 0, -.45)); for (const side of [-1, 1]) { const fin = box(.5, .04, .4, '#e6eef6', side * .45, .1, .6); fin.rotation.z = side * .5; g.add(fin); g.add(box(.06, .2, .06, '#e6eef6', side * .14, .4, -.4)); }
      eyes(g, box, .1, -.81, .18, .1, '#3f5fa0', false); break;
    }
    case 'flamingo': {
      g.add(box(.6, .55, .95, '#e88aa6', 0, 1.6));
      for (const side of [-1, 1]) { g.add(box(.1, .9, .1, '#e88aa6', side * .18, 2.4, -.35)); g.add(box(.3, .3, .35, '#e88aa6', side * .32, 2.95, -.4)); g.add(box(.1, .12, .3, '#2a2724', side * .32, 2.88, -.7)); g.add(box(.08, .08, .04, '#1d1a18', side * .32 - .1, 3.0, -.58)); g.add(box(.06, 1.5, .06, '#f0a3b6', side * .16, .8)); g.add(box(.2, .04, .2, '#c46b86', side * .16, .05)); }
      break;
    }
    case 'bat': {
      g.add(box(.25, .22, .3, '#3a3238', 0, 0)); for (const side of [-1, 1]) { const w = box(.7, .03, .4, '#4d434c', side * .45, .02, 0); w.rotation.z = side * .2; g.add(w); g.add(box(.06, .1, .06, '#3a3238', side * .08, .15)); }
      eyes(g, box, .04, -.16, .07, .05, '#d84a4a', false); break;
    }
    case 'vulture': {
      g.add(box(.5, .45, .8, '#3d3733', 0, .6)); g.add(box(.25, .25, .3, '#d38b7a', 0, .9, -.5)); g.add(box(.1, .1, .25, '#e0c470', 0, .85, -.75)); g.add(box(.4, .2, .3, '#e6e0d0', 0, .5, -.35));
      for (const side of [-1, 1]) { const w = box(1.6, .05, .6, '#3d3733', side * 1.0, .7, 0); w.rotation.z = side * .12; g.add(w); }
      eyes(g, box, .95, -.66, .09, .06); break;
    }
    case 'bonethief': {
      const bone = '#c9c3aa'; g.add(box(.5, .7, .4, '#7a6f5a', 0, .9)); g.add(box(.42, .4, .42, bone, 0, 1.4)); g.add(box(.36, .14, .3, '#5c5346', 0, 1.22, -.05));
      g.add(box(.7, .5, .5, '#8f8570', 0, 1.15, .4)); for (let i = 0; i < 4; i++) g.add(box(.12, .28, .12, bone, -.2 + i * .14, 1.5, .4));
      for (const side of [-1, 1]) { g.add(box(.12, .6, .12, '#7a6f5a', side * .3, .9)); g.add(box(.14, .18, .14, bone, side * .3, .56)); g.add(box(.12, .45, .12, '#7a6f5a', side * .14, .22)); }
      eyes(g, box, 1.45, -.22, .12, .1, '#e0b64a', false); break;
    }
    case 'ashwalker': {
      g.add(box(.7, .9, .45, '#3a3333', 0, 1.3)); g.add(box(.5, .5, .5, '#3a3333', 0, 2.05)); g.add(box(.6, .1, .4, '#e06a30', 0, 1.3)); g.add(box(.55, .1, .4, '#e06a30', 0, 1.6));
      for (const side of [-1, 1]) { g.add(box(.2, .85, .2, '#2c2727', side * .5, 1.2)); g.add(box(.22, .8, .22, '#2c2727', side * .2, .45)); g.add(box(.1, .06, .2, '#e06a30', side * .5, .78)); }
      eyes(g, box, 2.1, -.26, .13, .12, '#ff9a3c', false); break;
    }
    case 'frostwolf': {
      const fur = '#e3e8ea'; g.add(box(.6, .6, 1.3, fur, 0, .8)); g.add(box(.5, .5, .55, fur, 0, 1.0, -.85)); g.add(box(.3, .28, .4, '#cfd6d9', 0, .9, -1.28)); g.add(box(.12, .1, .08, '#1e2224', 0, .95, -1.5));
      for (const side of [-1, 1]) g.add(box(.14, .24, .1, fur, side * .18, 1.3, -.78));
      eyes(g, box, 1.06, -1.13, .16, .09, '#7fbfe0', false);
      quad(g, box, fur, .18, .55, .18, .27, .22, .5, '#9fa8ad');
      const tail = box(.16, .7, .16, fur, 0, .95, .7); tail.rotation.x = -1.1; g.add(tail); break;
    }
    case 'sporeling': {
      g.add(box(.5, .4, .5, '#d8cdb6', 0, .55)); g.add(box(.95, .35, .95, '#b5638f', 0, .9)); g.add(box(.7, .15, .7, '#c98aa8', 0, 1.1));
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(box(.08, .35, .08, '#a89a80', Math.cos(a) * .3, .18, Math.sin(a) * .3)); }
      eyes(g, box, .6, -.26, .14, .08, '#2a1a2a', false); break;
    }
    case 'crystalcrawler': {
      g.add(box(1.0, .5, 1.3, '#4a3f66', 0, .5)); for (let i = -1; i <= 1; i++) g.add(box(.3, .45, .3, '#b79ee0', i * .32, .95, i * .2));
      g.add(box(.45, .35, .4, '#4a3f66', 0, .4, -.8)); for (const side of [-1, 1]) for (let i = 0; i < 3; i++) g.add(box(.6, .08, .1, '#3a3050', side * .55, .25 - i * .04, -.4 + i * .4));
      eyes(g, box, .45, -1.02, .14, .1, '#d6c3ff', false); break;
    }
    case 'scorpion': {
      g.add(box(.6, .3, .9, '#b59a5c', 0, .3)); for (let i = 0; i < 4; i++) { const seg = box(.2, .2, .22, '#a3894f', 0, .45 + i * .22, .5 + i * .18); seg.rotation.x = -.5; g.add(seg); } g.add(box(.14, .3, .14, '#6a5330', 0, 1.35, 1.0));
      for (const side of [-1, 1]) { g.add(box(.3, .12, .5, '#b59a5c', side * .4, .3, -.55)); g.add(box(.25, .15, .2, '#a3894f', side * .55, .3, -.85)); for (let i = 0; i < 4; i++) g.add(box(.5, .06, .08, '#a3894f', side * .5, .18, -.3 + i * .22)); }
      eyes(g, box, .38, -.46, .12, .06, '#1c1a14', false); break;
    }
    case 'mireling': {
      g.add(box(.9, .9, .8, '#4b4030', 0, .6)); g.add(box(.6, .5, .55, '#4b4030', 0, 1.25)); g.add(box(.5, .12, .5, '#7c8560', 0, 1.5));
      for (const side of [-1, 1]) g.add(box(.3, .7, .3, '#3f3528', side * .55, .55));
      eyes(g, box, 1.3, -.28, .16, .1, '#9fd8c8', false); break;
    }
    case 'terminus': {
      const m = '#8f8577'; g.add(box(1.1, 1.3, .8, m, 0, 1.6)); g.add(box(.7, .6, .7, '#a06a49', 0, 2.55)); g.add(box(.5, .1, .5, '#6fc79a', 0, 2.3)); g.add(box(.9, .2, .1, '#6fc79a', 0, 1.7, -.42));
      for (const side of [-1, 1]) { g.add(box(.35, 1.2, .35, m, side * .75, 1.4)); g.add(box(.4, .4, .4, '#a06a49', side * .75, .7)); g.add(box(.4, 1.0, .4, m, side * .3, .5)); g.add(box(.45, .2, .5, '#5c5450', side * .3, .05)); }
      eyes(g, box, 2.6, -.36, .2, .14, '#6fc79a', false); break;
    }
    case 'snowwalker': {
      const c = '#d8dfe4'; g.add(box(.8, 1.4, .6, c, 0, 2.2)); g.add(box(.55, .6, .55, c, 0, 3.2)); g.add(box(.5, .3, .3, '#b0bcc4', 0, 3.0, -.25));
      for (const side of [-1, 1]) { g.add(box(.22, 1.4, .22, c, side * .5, 2.0)); g.add(box(.25, 1.6, .25, c, side * .22, .8)); g.add(box(.3, .15, .4, '#9aa6ae', side * .22, .05)); }
      eyes(g, box, 3.3, -.28, .16, .12, '#2f3f4a', false); break;
    }
    case 'cavespider': {
      g.add(box(.5, .35, .5, '#2f2a30', 0, .35)); g.add(box(.7, .45, .8, '#3a343b', 0, .4, .55)); g.add(box(.3, .25, .3, '#2f2a30', 0, .3, -.35));
      for (const side of [-1, 1]) for (let i = 0; i < 4; i++) { const leg = box(.6, .05, .06, '#2f2a30', side * .45, .35, -.2 + i * .25); leg.rotation.z = side * .35; g.add(leg); g.add(box(.05, .35, .06, '#2f2a30', side * .7, .15, -.2 + i * .25)); }
      for (let i = 0; i < 4; i++) g.add(box(.06, .06, .03, '#c93f3f', -.15 + i * .1, .38, -.5));
      break;
    }
    case 'glowworm': g.add(box(.12, .1, .5, '#9fd8b8', 0, 0)); g.add(box(.1, .1, .12, '#e8f5c8', 0, .02, -.3)); break;
    case 'molerat': {
      g.add(box(.4, .3, .7, '#d8b0a8', 0, .2)); g.add(box(.3, .25, .3, '#d8b0a8', 0, .25, -.45)); g.add(box(.1, .08, .06, '#e4c0b8', 0, .18, -.62)); g.add(box(.14, .12, .04, '#f0ece0', 0, .12, -.62));
      quad(g, box, '#c9a098', .1, .18, .1, .08, .15, .25); g.add(box(.06, .06, .35, '#d8b0a8', 0, .18, .5)); break;
    }
    case 'magmaslug': {
      g.add(box(.7, .45, 1.1, '#3a2a26', 0, .3)); g.add(box(.6, .12, .9, '#e06a30', 0, .32)); g.add(box(.5, .4, .5, '#3a2a26', 0, .45, -.6)); g.add(box(.4, .08, .4, '#ff9a3c', 0, .5, -.6));
      for (const side of [-1, 1]) g.add(box(.05, .25, .05, '#e06a30', side * .12, .7, -.7)); break;
    }
    case 'echowraith': {
      g.add(box(.6, 1.2, .3, '#8f97a8', 0, 1.0)); g.add(box(.45, .45, .4, '#a5adbd', 0, 1.8)); g.add(box(.5, .8, .2, '#7c8494', 0, .3));
      for (const side of [-1, 1]) g.add(box(.14, .8, .14, '#8f97a8', side * .4, 1.0));
      eyes(g, box, 1.85, -.21, .14, .12, '#e8e6d8', false); break;
    }
    case 'voidcrawler': {
      g.add(box(1.0, .8, 1.4, '#2f3340', 0, .7)); g.add(box(.6, .6, .6, '#26303a', 0, .8, -.9)); g.add(box(.5, .5, .5, '#3a3f4a', 0, 1.3, .3));
      for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { const l = box(.9, .1, .12, '#26303a', side * .7, .5, -.45 + i * .45); l.rotation.z = side * .25; g.add(l); }
      for (let i = 0; i < 5; i++) g.add(box(.08, .08, .04, '#b79ee0', -.24 + i * .12, .85 + (i % 2) * .12, -1.21));
      break;
    }
    case 'cradlekeeper': {
      const c = '#c9c2a4'; g.add(box(1.2, 1.6, .9, c, 0, 2.2)); g.add(box(.8, .8, .8, '#e0d9bc', 0, 3.4)); g.add(box(.7, .7, .7, '#a8d8e0', 0, 2.2, -.5));
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(box(.25, 1.6, .25, c, Math.cos(a) * .9, 2.0, Math.sin(a) * .9)); }
      for (const side of [-1, 1]) g.add(box(.4, 1.8, .4, c, side * .4, .9));
      eyes(g, box, 3.5, -.41, .22, .16, '#a8d8e0', false); break;
    }
    case 'deepskeleton': {
      const bone = '#a8a48f'; g.add(box(.16, .9, .16, '#6f6b5c', 0, 1.14)); g.add(box(.46, .14, .24, bone, 0, .74));
      for (let i = 0; i < 4; i++) { const y = .95 + i * .17, w = .56 - Math.abs(i - 1.2) * .07; g.add(box(w, .08, .1, bone, 0, y, -.11)); g.add(box(w, .08, .1, bone, 0, y, .11)); }
      g.add(box(.46, .34, .42, bone, 0, 2)); g.add(box(.38, .12, .34, '#6f6b5c', 0, 1.79, -.03));
      for (const side of [-1, 1]) { g.add(box(.13, .13, .07, '#20261f', side * .12, 2.03, -.2)); g.add(box(.06, .06, .03, '#76d8bb', side * .12, 2.04, -.22)); g.add(box(.12, .42, .13, bone, side * .33, 1.42)); g.add(box(.1, .4, .11, bone, side * .36, 1.02)); g.add(box(.14, .44, .15, bone, side * .16, .5)); g.add(box(.12, .38, .13, bone, side * .16, .14)); }
      break;
    }
    default: g.add(box(.6, .6, .6, '#999', 0, .3));
  }
  if (def?.scale && def.scale !== 1) g.scale.setScalar(def.scale);
  return g;
}
