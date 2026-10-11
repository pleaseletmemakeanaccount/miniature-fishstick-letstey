# ERNAS

An atmospheric, playable browser fragment of the ERNAS specification. React, TypeScript, Vite, and Three.js. The title screen deliberately contains exactly one interactive element: START.

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

## Bestiary 0.5

**45 new creature species**, each with a detailed blocky model, its own behaviour, and a biome-aware spawn table. Creatures spawn around you based on where you are (surface biome, or cave stratum underground) and time of day, wander, and despawn when you leave.

- **Passive fauna:** cow, chicken, kiwi, frog, dog, cat, mountain goat, camel, sand tortoise, penguin, woolly mammoth, sun lizard, glow snail.
- **Ambient:** owl (nocturnal), butterfly, firefly swarm (nocturnal), cod, salmon, moon jelly (stings), sea turtle, cave bat, bone vulture, glowworm.
- **Skittish** species run when you approach; **hostile** ones chase and strike in survival.
- **Hostile surface:** sky squirrel, cloud serpent, two-headed flamingo, bone thief, ash walker, frost wolf, sporeling, crystal crawler, dune scorpion, mireling, terminus protector, snowwalker.
- **Deep sea:** anglerfish, giant squid, and the kraken at the bottom of the abyss.
- **Underground-only, by stratum:** cave spider, mole rat, deep skeleton, magma slug, echo wraith, void crawler, and the Cradle keeper at the very bottom.

Striking a creature with a weapon damages it and wears the tool; kills grant species-specific drops (meat, feathers, leather, shell, ink, crystal, and the Ernas seed from the Cradle keeper).

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
| J | Field notes and progression |
| T | Local companion chat |
| Escape | Pause or close a panel |

## A Small Beginning

Start near the Hearth. Gather a few blocks, inspect your body, and carve a sword at the shaping bench. Click and drag through the 8x8 grid to remove material; the through-cut option affects all eight depth layers. Individual depth layers, undo, reset, a silhouette guide, and a live rotatable 3D preview are available. A tool needs at least 70% silhouette accuracy and three stone or iron blocks. Accuracy affects sword damage and pickaxe speed.

The Hearth, Cloudbreak Ridge, and the new expedition destinations are already linked. Travel while near a pylon. The Fracture lies on the western arc, at arc -77 and Z -23. Approach and interact to attune it. OBIL waits nearby at arc -76 and Z -35. Strike an incoming projectile when it is close; three reflected projectiles break its core.

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
- Procedural ambient audio, working settings, keyboard-accessible dialogs, and reduced-motion options.
- Versioned, validated local saves. Automatic saving every ten seconds and saving on exit. World edits, inventory, physiology, discoveries, and preferences survive reloads.

## Coordinate Frame

The cylinder's longitudinal axis is world Z, with radius `R = 2048 / (2*pi)`, approximately 326 blocks. Logical coordinates are arc distance `u`, inward height `h`, and longitudinal `z`:

`world(u,h,z) = (sin(u/R)*(R-h), -cos(u/R)*(R-h), z)`

The local up vector points toward the axis; gravity acts in the opposite direction. The camera's frame rotates with `u`. Arc coordinates wrap around the full circumference. The region close to the axis has reduced gravity. The world is finite along Z, with a 1,536-block extent and terrain rising toward its end boundaries.

Voxel state is separate from rendering. Nearby 16x16-column chunks are generated on demand and meshed with only exposed faces. A lower-detail whole-world mesh and landmark silhouettes keep the distant cylinder visible. A GPU chunk mask removes the coarse representation as detailed chunks arrive. Near meshes and cached chunk data are evicted as the player moves; editing invalidates only affected meshes and their borders. Frame-budgeted streaming limits work per frame, although individual complex chunks can still cause brief loading hitches on slower devices.

Ray marching queries logical blocks rather than raycasting the entire render mesh. Mining exposes underground neighbors and cave surfaces. World edits are stored as a delta over deterministic terrain and structures. Transient sand and storm debris are settled before saving or traveling so material is not lost from a checkpoint. Surface fluids are animated meshes with immersion mechanics, not a full fluid solver.

## Project Map

| File | Responsibility |
| --- | --- |
| `src/App.tsx` | Minimal title screen and game entry |
| `src/components/Brand.tsx` | Original pixel wordmark and moth symbol |
| `src/game/Game.tsx` | Session, survival state, UI, and persistence orchestration |
| `src/game/engine.ts` | Rendering, input, movement, interactions, entities, and combat |
| `src/game/world.ts` | Chunk streaming, edit storage, surface meshing, distant LOD, and fluid meshes |
| `src/game/biomes.ts` | World dimensions, twelve biome definitions, expedition pylons, and climate data |
| `src/game/terrain.ts` | Domain-warped biome regions, terrain, caves, trees, coral, crystals, and ruins |
| `src/game/coordinates.ts` | Logical/world coordinate conversion |
| `src/game/geometry.ts` | Indexed, radially aligned voxel face generation |
| `src/game/environment.ts` | Biome atmosphere, weather, tornado visuals, fish, and wyrm |
| `src/game/Atlas.tsx` | Actual-world cartography, biome selection, travel, and waypoints |
| `src/game/model.ts` | Typed save schema, inventory, regions, and field records |
| `src/game/Panels.tsx` | Inventory, physiology, and journal interfaces |
| `src/game/Workbench.tsx` | Manual shaping and sleep interactions |
| `src/game/ObjectPreview.tsx` | Interactive 3D tool and rock previews |
| `src/game/audio.ts` | Procedural atmosphere and interaction sounds |

## Scope

This is a single-player vertical slice, not the full production game described in the specification. The desert, blood shores, spiked forest, and tree settlements are playable **inner-cylinder echoes of the outer-world biomes**, not a separately simulated outer sphere. Canopy settlements are explorable voxel ruins, without sapient trading NPCs. The outer void, socket-and-plug circuit, full volumetric fluids, mechanical/runic networks, golem automation, complex fauna AI, later bosses/cosmic unfolding, and LAN multiplayer remain unimplemented. The title-screen illustration is cinematic artwork; gameplay uses the real-time procedural world.

WebGL 2 and hardware acceleration are required for the world. The build has been verified using the provided production build tool. Browser performance, pointer-lock permissions, and graphics behavior on individual devices still require live-browser testing.