# ERNAS

An atmospheric, playable browser fragment of the ERNAS specification. React, TypeScript, Vite, and Three.js. The title screen deliberately contains exactly one interactive element: START. Its backdrop is layered: `public/images/ernas-world.jpg` sits on top of the moth mark from `public/favicon.svg`. Remove the photograph and the title screen quietly falls back to the vector mark; edit the favicon and the fallback follows, because both read the same file.

## Bestiary 0.7

**Ninety species** now share the cylinder: the inner wall, the air above it, the shallows and trenches, and the seven strata under your feet. Each one has a hand-built blocky model, a disposition, a biome or depth it belongs to, its own chance of showing up, and something to drop when it falls.

| | |
| --- | --- |
| Species on record | **90** (45 in 0.5, 45 added in 0.7) |
| Dispositions | Passive, skittish, ambient, hostile |
| Locomotion | Walk, hop, fly, swim |
| Biomes with resident fauna | All 28 |
| Underground-only species | 13, spread across strata 0-6 |
| Aquatic species / flyers | 13 / 20 |

What changed in 0.7:

- **Rarity is written into the roster.** Every species carries its own spawn weight, so common farm animals, ambient life, and rare horrors are tuned table-side rather than inferred from health in the engine.
- **Species behaviour is data, not special cases.** Wing flutter, contact stings, and amphibious walkers are now flags on the species definition; the engine no longer names individual creatures.
- **45 new species**, listed in the tables below: farm stock, canopy wildlife, marsh and fungal fauna, cold-ground animals, sky and weather life, desert and badlands hunters, ash-and-bone scavengers, coastline and reef life, one very large abyssal mouth, and four new deep-strata residents including the cave troll and the lodestone golem.
- **The field notes now hold a bestiary.** Open the journal with J and pick *Everything that moves.* to read the whole roster grouped by habitat, with disposition, range, and drops for each species. Hover a name for its field description.

Striking a creature with a weapon damages it and wears the tool. Kills grant that species' drop: meat, feathers, leather, shell, chitin, ink, crystal, storm glass, cloudstone, or — at the very bottom of the world — the Ernas seed. Night shifts the roster, and so does depth: the deeper the stratum, the less familiar the neighbours.

### Species tables

### Pasture and farmland

*MEADOW, SAVANNA, AND SETTLED GROUND*

| Species | Disposition | Habitat | Drops |
| --- | --- | --- | --- |
| Cow | Passive | Meadow / Savanna / Taiga / Highlands | Raw pork ×2 |
| Sheep | Passive | Meadow / Highlands / Tundra / Mountains | Mothsilk cloth ×2 |
| Pig | Passive | Meadow / Taiga / Savanna / Giant Groves | Raw pork ×2 |
| Steppe horse | Passive | Savanna / Meadow / Badlands / Canyon | Cured leather ×2 |
| Chicken | Skittish | Meadow / Savanna / Taiga / Giant Groves / Jungle | Boiled egg |
| Dog | Passive | Meadow / Taiga / Savanna / Highlands | — |
| Cat | Skittish | Meadow / Giant Groves / Desert / Badlands | — |
| Butterfly | Ambient | Meadow / Jungle / Giant Groves / Savanna | — |
| Dune meerkat | Ambient | Desert / Savanna / Badlands | Raw pork |
| Stag beetle | Ambient | Meadow / Jungle / Giant Groves | Chitin plate |

### Woodland and canopy

*TAIGA, GIANT GROVES, AND JUNGLE*

| Species | Disposition | Habitat | Drops |
| --- | --- | --- | --- |
| Kiwi bird | Skittish | Giant Groves / Jungle / Taiga / Mushroom Marsh | Roast kiwi |
| Owl | Ambient | Taiga / Giant Groves / Highlands / Mountains | Wing feather ×2 |
| Canopy monkey | Skittish | Jungle / Giant Groves | Sweet berries ×2 |
| Reef parrot | Ambient | Jungle / Giant Groves / Coral Reefs / Savanna | Wing feather ×2 |
| Great moth | Ambient | Giant Groves / Sinkholes / Highlands / Taiga | Mothsilk cloth ×2 |
| Canopy hornet | Hostile | Jungle / Giant Groves / Mushroom Marsh | Chitin plate |
| Grove panther | Hostile | Jungle / Giant Groves | Cured leather ×3 |
| Salt gull | Ambient | Coral Reefs / Blood Shores / Desert / Taiga | Wing feather ×2 |

### Wetland and fungal marsh

*SWAMP, SPOREHOLLOW, AND SINKHOLES*

| Species | Disposition | Habitat | Drops |
| --- | --- | --- | --- |
| Frog | Passive | Swamp / Meadow / Jungle / Mushroom Marsh | — |
| Horned toad | Passive | Swamp / Jungle / Mushroom Marsh / Sinkholes | Edible spore cap |
| Glow snail | Ambient | Mushroom Marsh / Swamp / Sinkholes | Luminous fungus |
| Firefly swarm | Ambient | Swamp / Meadow / Mushroom Marsh / Giant Groves | — |
| Will-o-wisp | Ambient | Swamp / Mushroom Marsh / Sinkholes | Luminous fungus |
| Grey heron | Ambient | Swamp / Coral Reefs / Meadow / Jungle | Wing feather ×2 |
| Marsh leech | Hostile | Swamp / Mushroom Marsh | Liquid blood |
| Sporeling | Hostile | Mushroom Marsh / Swamp | Edible spore cap ×2 |
| Mireling | Hostile | Swamp | Mud ×3 |
| Blood crocodile | Hostile | Swamp / Coral Reefs / Blood Shores | Cured leather ×3 |

### Cold and high ground

*TUNDRA, GLACIER, AND THE TITAN RANGE*

| Species | Disposition | Habitat | Drops |
| --- | --- | --- | --- |
| Mountain goat | Skittish | Mountains / Highlands / Glacier / Sky Ring | Raw pork |
| Penguin | Passive | Glacier / Tundra / Mountains | Raw fish |
| Woolly mammoth | Passive | Tundra / Glacier | Cured leather ×4 |
| Caribou | Passive | Tundra / Glacier / Taiga / Mountains | Cured leather ×2 |
| Snow hare | Skittish | Tundra / Glacier / Meadow / Highlands | Raw pork |
| Arctic fox | Skittish | Glacier / Tundra / Mountains | Cured leather |
| Ridge eagle | Hostile | Mountains / Highlands / Sky Ring | Wing feather ×3 |
| Frost wolf | Hostile | Glacier / Tundra / Mountains / Taiga | Cured leather ×2 |
| Snowwalker | Hostile | Glacier / Tundra | Blue ice ×3 |

### Sky and weather

*SKY RING, CLOUD NESTS, AND STORM FIELDS*

| Species | Disposition | Habitat | Drops |
| --- | --- | --- | --- |
| Sky squirrel | Hostile | Sky Ring / Cloud Nests / Mountains | Wing feather |
| Cloud serpent | Hostile | Cloud Nests / Sky Ring / Storm Fields | Wyrm scale |
| Thunderling | Hostile | Storm Fields / Broken Lands | Storm glass |
| Sky whale | Ambient | Cloud Nests / Sky Ring | Cloudstone ×3 |
| Cloud jelly | Ambient | Cloud Nests / Sky Ring / Storm Fields | Glowstone |
| Storm roc | Hostile | Cloud Nests / Storm Fields / Sky Ring | Wing feather ×4 |

### Sand and stone wastes

*DESERT, BADLANDS, AND CANYON*

| Species | Disposition | Habitat | Drops |
| --- | --- | --- | --- |
| Camel | Passive | Desert / Badlands / Outer Sphere / Bonefields | Cured leather ×2 |
| Sand tortoise | Passive | Desert / Savanna / Badlands | Shell block |
| Sun lizard | Skittish | Desert / Badlands / Canyon / Volcanic | — |
| Dust ostrich | Skittish | Desert / Savanna / Badlands | Wing feather ×3 |
| Dune scorpion | Hostile | Desert / Badlands / Outer Sphere / Canyon | Chitin plate ×2 |
| Canyon jackal | Hostile | Badlands / Canyon / Desert / Savanna | Cured leather |
| Sand serpent | Hostile | Desert / Badlands | Carved sandstone ×2 |
| Bone vulture | Ambient | Bonefields / Desert / Badlands / Outer Sphere | Wing feather ×2 |
| Glasswing | Ambient | Spiked Forest / Desert / Canyon | Glass |

### Ash, bone, and dead world

*VOLCANIC, BONEFIELDS, AND OUTER SPHERE*

| Species | Disposition | Habitat | Drops |
| --- | --- | --- | --- |
| Ash walker | Hostile | Volcanic | Ember stone ×2 |
| Cinder hound | Hostile | Volcanic / Broken Lands | Ember stone ×2 |
| Ember salamander | Passive | Volcanic / Canyon / Badlands | Sulfur |
| Obsidian beetle | Ambient | Volcanic / Broken Lands | Obsidian |
| Bone thief | Hostile | Bonefields / Broken Lands / Desert | Bone block ×3 |
| Tomb scarab | Ambient | Bonefields / Desert / Outer Sphere | Chitin plate |
| Grave moth | Ambient | Bonefields / Outer Sphere | Mothsilk cloth |
| Scrap hound | Hostile | Outer Sphere / Bonefields / Broken Lands | Scrap metal ×2 |
| Terminus protector | Hostile | Outer Sphere | Circuit block ×3 |
| Crystal crawler | Hostile | Crystal Fields / Spiked Forest | Crystal shard ×2 |
| Geode crab | Hostile | Crystal Fields / Spiked Forest / Broken Lands | Crystal shard ×2 |

### Shallows and coastline

*REEFS, SHORES, AND THE SUNLIT SEA*

| Species | Disposition | Habitat | Drops |
| --- | --- | --- | --- |
| Cod | Ambient | Coral Reefs / Deep Ocean / Abyss | Raw fish |
| Salmon | Ambient | Taiga / Meadow / Coral Reefs | Raw fish |
| Moon jelly | Ambient | Coral Reefs / Deep Ocean | — |
| Sea turtle | Passive | Coral Reefs / Deep Ocean | Shell block |
| Reef ray | Ambient | Coral Reefs / Deep Ocean | Raw fish |
| Reef star | Ambient | Coral Reefs | Rose coral |
| Hermit crab | Passive | Coral Reefs / Desert / Savanna | Shell block |
| River piranha | Hostile | Swamp / Jungle / Coral Reefs | Raw fish |
| Barracuda | Hostile | Coral Reefs / Deep Ocean / Abyss | Raw fish ×2 |
| Two-headed flamingo | Hostile | Blood Shores / Swamp / Coral Reefs | Wing feather ×3 |

### The deep ocean

*ABYSSAL TRENCHES AND PRESSURE*

| Species | Disposition | Habitat | Drops |
| --- | --- | --- | --- |
| Anglerfish | Hostile | Abyss / Deep Ocean | Glowstone |
| Giant squid | Hostile | Abyss / Deep Ocean | Squid ink ×2 |
| Abyss gulper | Hostile | Abyss | Abyss crystal |
| Kraken | Hostile | Abyss | Kraken tooth |

### Underground strata

*CAVES, STRATA 0-6, AND THE CRADLE*

| Species | Disposition | Habitat | Drops |
| --- | --- | --- | --- |
| Glowworm | Ambient | Stratum 0+ | Luminous fungus |
| Pale pillbug | Ambient | Stratum 0+ | Chitin plate |
| Mole rat | Skittish | Stratum 0+ | Raw pork |
| Cave bat | Ambient | Stratum 0+ | — |
| Cave spider | Hostile | Stratum 0+ | Silk string ×2 |
| Gem beetle | Ambient | Stratum 1+ | Quartz block |
| Deep skeleton | Hostile | Stratum 1+ | Bone block ×2 |
| Magma slug | Hostile | Stratum 2+ | Magma block |
| Cave troll | Hostile | Stratum 2+ | Bone block ×3 |
| Echo wraith | Hostile | Stratum 3+ | Echo stone ×2 |
| Lodestone golem | Hostile | Stratum 4+ | Lodestone |
| Void crawler | Hostile | Stratum 5+ | Void stone ×3 |
| Cradle keeper | Hostile | Stratum 6+ | Ernas seed |

## Stability Pass 0.6

No gameplay content was removed. This pass targets the crashes introduced by the larger world:

- Fixed shared-geometry ownership. Creature despawn, crop harvest, and boss cleanup no longer dispose the cube geometry still used by the rest of the scene.
- Detailed creatures, skeletons, and the False Player are merged into one vertex-colored draw call per model, preserving all model parts while reducing scene draw calls substantially.
- Startup generates one occupied detail chunk synchronously instead of nine. Neighbor chunks stream one per frame over the complete distant world shell.
- The distant shell now uses a 32-block visual LOD while nearby terrain, caves, features, edits, and collision remain at full 16-block chunk resolution.
- Global terrain, biome, and cave-band memo caches are bounded and incrementally evicted. Chunk caches are also reduced and release feature maps explicitly.
- Remote crops, fish, sky whales, wyrms, tornado debris, and invisible weather stop creating meshes or uploading animation buffers when offscreen.
- Render resolution observes a pixel budget, with conservative WebGL context creation on touch/low-memory devices and an automatic low-power retry if the preferred context fails.
- WebGL context loss pauses simulation and allocation until restoration instead of continuing to build chunks against a dead renderer.
- Corrupt/legacy saved positions resolve directly to nearby air rather than probing hundreds of blocks, and save dictionaries/farm coordinates receive finite bounds validation.
- Failed detail-chunk allocations leave logical collision and distant terrain intact, then retry later instead of entering an immediate crash loop.

## Underground Expansion 0.4

The crust is now **extremely thick**: the world floor dropped from −72 to **−520**, giving roughly 500 blocks of rock beneath every surface biome, divided into **7 deep strata**.

Inside that rock live **65 cave biomes**, and they exist *only* underground — you have to dig down or find a natural shaft to reach them. Dripstone Hall, Glowworm Grotto, the Fungal Bloom, Flooded Galleries, the Gold Lode, Amethyst Geodes, Lava Tubes, the Bone Pit, the Buried City, the Machine Halls, the Echo Chamber, Void Pockets, and at the very bottom, **The Cradle**.

- Each stratum hosts a different pool of cave biomes, so descending keeps changing what you find. Deeper strata are darker, richer, and more hostile.
- Every cave biome has its own rock, accent/ore block, glow level, fog colour, hazard, and resources. The HUD swaps to a cave readout underground, showing the biome, stratum, and depth.
- Caverns are carved as real air bands with stalactites, stalagmites, and glowing clusters. Vertical shafts (about 1 column in 40) connect strata so the full depth is walkable.
- 8 new deep-rock blocks: deepslate, shale, dripstone, glow moss, echo stone, void stone, blood crystal, and flint.
- Cave discoveries are tracked and saved separately from surface biomes.

Meshing uses a vertical window around your depth, so only the caves near you are built; moving up or down re-meshes nearby chunks progressively.

**Creatures were rebuilt** with real anatomy: skeletons now have a spine, ribcage, pelvis, shouldered arms, knees, and a proper skull with brow, jaw, and sunken eye sockets; the False Player adds layered moth wings and pale glowing eyes; pigs gained a snout, ears, hooves, and a curled tail; the Chill Entity got rims and feet; fish gained heads, dorsal and pectoral fins, and eyes; and the sky wyrm now has a horned, jawed head with eyes and frills leading its body.

## World Expansion 0.3

Five regions join the world: the colossal **Titan Range** mountains (peaks up to ~130 blocks), the molten **Cinder Wastes** (magma that scorches anything nearby), the glowing **Mushroom Marsh**, the desolate **Bonefields**, and a dead **Outer Sphere** — a cracked-earth desert holding the giant **Socket** and **Plug**. Haul the Plug toward the Socket (press R) to complete the outer circuit and unlock the Threshold pylon. Seventeen biomes and eighteen expedition pylons in total.

The item roster grew from ~35 to **174** (≈139 new): dozens of biome and building blocks, refined metals and gems, 24 tools, 22 consumables with real hunger/thirst/poison/heal effects, and 22 boss/relic curios.

**Creative mode** now unlocks every pylon and adds a **Summon an encounter** menu (pause menu) to start any of five chief-boss phases on demand: **OBIL, The Warper, The Scruncle, The Farbreaker, and The Moonholder**. Each floats, attacks, and can be beaten by striking it with a weapon or reflecting its attacks back into it.

## World Expansion 0.2

The inner cylinder now measures **2,048 blocks around by 1,536 blocks long**, versus the original 276 by 96: approximately **119 times the surface footprint**. It has 3,145,728 terrain columns, a 64-block-deep subsurface, much larger mountains, and giant trees reaching more than 70 blocks high.

Open the **world atlas with M or P**. Twelve expedition pylons are pre-attuned, allowing access to every biome from the Hearth or another linked pylon. The Fracture remains discoverable. In creative mode, survey-jump to any destination from anywhere. The atlas supports terrain/biome layers, destination search, zoom, panning, player location, visited-region tracking, and walking waypoints.

| Biome | Playable terrain and features | Destination |
| --- | --- | --- |
| Taiga | Snowy conifers, gold-bearing slopes, river, snow and ice | The Hearth |
| Sinkholes | Circular collapses, linked underground cavities, luminous fungi and moss | The Hollow |
| Sky Ring | Alpine mountains, floating rock islands, hanging pines, ambient wyrm | The High Aerie |
| Cloud Nests | High floating cloudstone platforms, a nest supply cache | Cloudrest |
| Coral Reefs | Turquoise shallows, rose/violet branching coral, ambient fish | Prism Atoll |
| Abyssal Ocean | Deep submerged trenches, basalt chimneys, blue crystals | Deepwatch |
| Broken Lands | Repeating vertical walls, fractured terraces, the original OBIL encounter | The Fracture |
| Spiked Forest | Radioactive crystal needles, dead trunks, uranium | The Green Spine |
| Storm Fields | Basalt plateaus, rain, traveling tornadoes, physically thrown terrain blocks | Tempest Anchor |
| Desert | Large falling-sand dunes, sandstone arches, salt | Dunewatch |
| Blood Shores | Dense red water, slowing movement, collectible blood, red sand | The Red Shore |
| Giant Groves | Megatrees, voxel balconies/houses, ascending steps, mossy canopy ruins | Rootspire |

Each expedition destination other than the Hearth has a one-time provision cache. Press R nearby to collect water, berries, cloth, and biome materials. Cache claims, surveyed biomes, and your selected waypoint are saved. The original camp, pylons, boss location, central terrain, and legacy edit coordinates remain intact; old v1 saves are read and migrated into the v2 save key without deleting the original key.

The new environmental mechanics include swimming/diving, a replenishing air meter, drowning, deep-water pressure, crystal proximity radiation, high-altitude cold, doubled desert thirst drain, and tornado lift/projectile damage. Pylon clearings shelter against cold and radiation, not drowning. Carrying cloth slows cold exposure. Snow, spores, rain, fog, water color, and lighting change with the biome.

## Play

Press START or Enter. Click the 3D world to capture the mouse. If mouse capture is unavailable in an embedded browser, drag to look instead. Touchscreen movement and action controls appear automatically.

| Input | Action |
| --- | --- |
| W A S D | Move along the cylinder's interior |
| Arrow keys | Move forward/backward and turn |
| Left click | Mine, attack, or reflect an incoming stone |
| Right click | Place the selected material |
| Space | Jump; hold to use your wings |
| Shift | Sprint; descend during creative flight |
| F | Toggle unrestricted creative flight |
| Q | Hold for fast creative cruise flight |
| Ctrl | Dive underwater; descend during flight |
| R | Interact with a pylon, bed, campfire, or river |
| 1-6 | Select a hotbar slot |
| E | Automatically sorted inventory |
| B | Limb integrity and bandaging |
| C | Sub-voxel shaping bench |
| M / P | World atlas, biome selection, pylon network, and walking waypoints |
| J | Field notes, progression, and the species bestiary |
| T | Local companion chat |
| Escape | Pause or close a panel |

## A Small Beginning

Start near the Hearth. Gather a few blocks, inspect your body, and carve a sword at the shaping bench. Click and drag through the 8x8 grid to remove material; the through-cut option affects all eight depth layers. Individual depth layers, undo, reset, a silhouette guide, and a live rotatable 3D preview are available. A tool needs at least 70% silhouette accuracy and three stone or iron blocks. Accuracy affects sword damage and pickaxe speed.

Open the field notes with J to read the bestiary: ninety species, grouped by the country each one keeps, with what it thinks of you and what it leaves behind. The Hearth, Cloudbreak Ridge, and the new expedition destinations are already linked. Travel while near a pylon. The Fracture lies on the western arc, at arc -77 and Z -23. Approach and interact to attune it. OBIL waits nearby at arc -76 and Z -35. Strike an incoming projectile when it is close; three reflected projectiles break its core.

Type `hey` in chat to summon the Chill Entity. Ask about crafting, cheese, pylons, steam, or OBIL. Steam one raw pork with one flask of water at the Hearth's campfire to trigger **An Albany Expression**, the only achievement. The aurora persists until you tell Chill `nyc`.

The mothsilk bed at the Hearth opens the rock-spinning sleep interaction. Complete the rest to restore surviving limbs and advance to the next morning. You can wake early for partial recovery. Missing limbs do not regrow within a life.

## Implemented

- A large procedural, editable cylindrical world with a real radial camera and gravity frame, twelve distinct biomes, streamed detail, and distant landmarks.
- Smooth central-axis sun, biome lighting and fog, layered cloud geometry, pixel-textured terrain, precipitation, water/blood surfaces, and a persistent aurora shader.
- Keyboard, mouse, pointer-lock fallback, and touch controls. Survival and creative modes.
- Mining, block placement, falling sand entities, resource collection, local world edits, and automatically sorted inventory.
- Individual health for the head, torso, wings, legs, and eyes. Wing-scaled lift, a prone state, permanent eye occlusion, fall damage, respawning, and cosmetic scars.
- Hunger, thirst, raw-meat poisoning, eating, drinking, refilling water, bandaging, and sleeping.
- Manual 8x8x8 tool shaping with accuracy-based attributes.
- An interactive world atlas, pylon travel, supply caches, a following companion, simple skeleton and False Player behavior, ambient fish/wyrm, and the OBIL encounter.
- A ninety-species bestiary with biome- and depth-aware spawning, dispositions from passive to hostile, drops, and an in-game species index in the field notes.
- Procedural ambient audio, working settings, keyboard-accessible dialogs, and reduced-motion options.
- Versioned, validated local saves. Automatic saving every ten seconds and saving on exit. World edits, inventory, physiology, discoveries, and preferences survive reloads.

## Coordinate Frame

The cylinder's longitudinal axis is world Z, with radius `R = 2048 / (2*pi)`, approximately 326 blocks. Logical coordinates are arc distance `u`, inward height `h`, and longitudinal `z`:

`world(u,h,z) = (sin(u/R)*(R-h), -cos(u/R)*(R-h), z)`

The local up vector points toward the axis; gravity acts in the opposite direction. The camera's frame rotates with `u`. Arc coordinates wrap around the full circumference. The region close to the axis has reduced gravity. The world is finite along Z, with a 1,536-block extent and terrain rising toward its end boundaries.

Voxel state is separate from rendering. Nearby 16x16-column chunks are generated on demand and meshed with only exposed faces. A lower-detail whole-world mesh and landmark silhouettes keep the distant cylinder visible. A GPU chunk mask removes the coarse representation as detailed chunks arrive. Near meshes and cached chunk data are evicted as the player moves; editing invalidates only affected meshes and their borders. Frame-budgeted streaming limits work per frame, although individual complex chunks can still cause brief loading hitches on slower devices.

Ray marching queries logical blocks rather than raycasting the entire render mesh. Mining exposes underground neighbors and cave surfaces. World edits are stored as a delta over deterministic terrain and structures. Transient sand and storm debris are settled before saving or traveling so material is not lost from a checkpoint. Surface fluids are animated meshes with immersion mechanics, not a full fluid solver.

## Project Layout

```
src/
  main.tsx                        entry point
  App.tsx                         title screen (one interactive element: START)
  styles/
    base.css                      title screen, tokens, and motion
    game.css                      HUD, dialogs, panels, and journal
  components/
    Brand.tsx                     pixel wordmark and moth mark
    ui.tsx                        shared dialog, item icon, and heading primitives
    cn.ts                         class-name merge helper
  game/
    Game.tsx                      session, survival state, UI, and persistence
    core/
      engine.ts                   render loop, input, movement, combat, spawning
      environment.ts              atmosphere, weather, tornadoes, fish, wyrm
      audio.ts                    procedural sounds
    world/
      biomes.ts                   dimensions, biome table, pylons, boss list
      caves.ts                    strata and the subterranean biome table
      terrain.ts                  terrain, caves, trees, coral, crystals, ruins
      world.ts                    chunk streaming, edits, meshing, distant LOD
      geometry.ts                 indexed voxel face generation
      coordinates.ts              logical <-> world conversion
    creatures/
      creatures.ts                the bestiary: roster, weights, drops, models
    data/
      model.ts                    save schema, item table, crops, field notes
    panels/
      Panels.tsx                  inventory, body, journal, bestiary index
      Atlas.tsx                   cartography, travel, waypoints
      Workbench.tsx               shaping bench and sleep interaction
      ObjectPreview.tsx           rotatable 3D tool and rock previews
public/
  favicon.svg                     the moth mark. Also the fallback title artwork.
  images/ernas-world.jpg          title-screen photograph
```

`npm install && npm run build` produces a single self-contained `dist/index.html`. `npm run dev` serves the world on port 5173.

## Project Map

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Minimal title screen and game entry |
| `src/styles/base.css` | Title screen, colour tokens, and motion |
| `src/styles/game.css` | HUD, dialogs, panels, and journal styling |
| `src/components/Brand.tsx` | Original pixel wordmark and moth symbol |
| `src/components/ui.tsx` | Shared dialog, item icon, keycap, and heading primitives |
| `src/components/cn.ts` | Class-name merge helper |
| `src/game/Game.tsx` | Session, survival state, UI, and persistence orchestration |
| `src/game/core/engine.ts` | Rendering, input, movement, interactions, entities, and combat |
| `src/game/core/environment.ts` | Biome atmosphere, weather, tornado visuals, fish, and wyrm |
| `src/game/core/audio.ts` | Procedural atmosphere and interaction sounds |
| `src/game/world/biomes.ts` | World dimensions, biome definitions, expedition pylons, and climate data |
| `src/game/world/caves.ts` | Cave strata, subterranean biome table, and depth mapping |
| `src/game/world/terrain.ts` | Domain-warped biome regions, terrain, caves, trees, coral, crystals, and ruins |
| `src/game/world/world.ts` | Chunk streaming, edit storage, surface meshing, distant LOD, and fluid meshes |
| `src/game/world/geometry.ts` | Indexed, radially aligned voxel face generation |
| `src/game/world/coordinates.ts` | Logical/world coordinate conversion |
| `src/game/creatures/creatures.ts` | **The bestiary**: species roster, disposition, spawn weights, drops, and every blocky model |
| `src/game/data/model.ts` | Typed save schema, inventory, crops, and field records |
| `src/game/panels/Panels.tsx` | Inventory, physiology, journal, and bestiary index interfaces |
| `src/game/panels/Atlas.tsx` | Actual-world cartography, biome selection, travel, and waypoints |
| `src/game/panels/Workbench.tsx` | Manual shaping and sleep interactions |
| `src/game/panels/ObjectPreview.tsx` | Interactive 3D tool and rock previews |
| `public/favicon.svg` | The moth mark, and the fallback title-screen artwork |
| `public/images/ernas-world.jpg` | Title-screen photograph |

## Scope

This is a single-player vertical slice, not the full production game described in the specification. The desert, blood shores, spiked forest, and tree settlements are playable **inner-cylinder echoes of the outer-world biomes**, not a separately simulated outer sphere. Canopy settlements are explorable voxel ruins, without sapient trading NPCs. The outer void, socket-and-plug circuit, full volumetric fluids, mechanical/runic networks, golem automation, complex fauna AI (species follow their dispositions rather than full ecologies), later bosses/cosmic unfolding, and LAN multiplayer remain unimplemented. The title-screen illustration is cinematic artwork; gameplay uses the real-time procedural world.

WebGL 2 and hardware acceleration are required for the world. The build has been verified using the provided production build tool. Browser performance, pointer-lock permissions, and graphics behavior on individual devices still require live-browser testing.