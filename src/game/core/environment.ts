import * as THREE from 'three';
import { BIOMES, CIRCUMFERENCE, HALF_LENGTH, PYLONS, RADIUS, TORNADO_PATHS, WHALE_PATHS, wrapU, type Biome } from '../world/biomes';
import { toWorld } from '../world/coordinates';
import { biomeAt, fluidAt, hash, terrainHeight } from '../world/terrain';
import { caveBiomeAt, CAVE_TOP } from '../world/caves';
import type { PlayerPosition } from '../data/model';

export function makeGlow(color: string) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 64);
  gradient.addColorStop(0, color); gradient.addColorStop(.15, `${color}a0`); gradient.addColorStop(.45, `${color}35`); gradient.addColorStop(1, `${color}00`);
  context.fillStyle = gradient; context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

interface Tornado {
  group: THREE.Group;
  debris: THREE.InstancedMesh;
  u: number;
  z: number;
  h: number;
  radius: number;
}
interface Fish { group: THREE.Group; u: number; z: number; h: number; phase: number }
interface Whale { group: THREE.Group; u: number; z: number; height: number; radius: number; phase: number; speed: number }

export class WorldEnvironment {
  readonly fog = new THREE.FogExp2('#b9c6ba', .0028);
  readonly ambient = new THREE.AmbientLight('#d8dfcd', 1.7);
  readonly sunlight = new THREE.PointLight('#fff1c8', 620000, 3200, 2);
  readonly sun = new THREE.Group();
  readonly tornadoes: Tornado[] = [];
  private group = new THREE.Group();
  private glow: THREE.Sprite;
  private clouds: THREE.InstancedMesh;
  private motes: THREE.Points;
  private weather = new THREE.Group();
  private snow: THREE.Points;
  private rain: THREE.LineSegments;
  private lantern = new THREE.PointLight('#a6d2b9', 24, 20, 2);
  private aurora: THREE.Mesh;
  private auroraMaterial: THREE.ShaderMaterial;
  private fish: Fish[] = [];
  private whales: Whale[] = [];
  private wyrm: THREE.InstancedMesh;
  private wyrmHead = new THREE.Group();
  private dummy = new THREE.Object3D();
  private point = new THREE.Vector3();
  private sky = new THREE.Color();
  private targetColor = new THREE.Color();
  private nightColors = Object.fromEntries(Object.entries(BIOMES).map(([id, value]) => [id, new THREE.Color(value.night)])) as Record<Biome, THREE.Color>;
  private dayColors = Object.fromEntries(Object.entries(BIOMES).map(([id, value]) => [id, new THREE.Color(value.sky)])) as Record<Biome, THREE.Color>;
  private glowMap: THREE.CanvasTexture;

  constructor(private scene: THREE.Scene) {
    scene.fog = this.fog; scene.background = new THREE.Color('#b9c6ba');
    scene.add(this.group); this.group.add(this.ambient, this.sunlight, this.lantern);
    this.sunlight.position.set(0, 0, -450);
    this.sun.position.copy(this.sunlight.position);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(34, 64, 48), new THREE.MeshBasicMaterial({ color: '#2b3428', fog: false }));
    const rim = new THREE.Mesh(new THREE.SphereGeometry(34.7, 64, 48), new THREE.MeshBasicMaterial({ color: '#f0ecca', side: THREE.BackSide, fog: false }));
    this.glowMap = makeGlow('#efecbd');
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowMap, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: .5, fog: false }));
    this.glow.scale.set(250, 250, 1); this.sun.add(this.glow, rim, orb); this.group.add(this.sun);

    this.clouds = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: '#d1d8cf', transparent: true, opacity: .35, depthWrite: false }), 250);
    this.clouds.frustumCulled = false;
    for (let i = 0; i < 250; i++) {
      const u = hash(i, 22) * CIRCUMFERENCE - CIRCUMFERENCE / 2;
      toWorld(u, 125 + hash(i, 4) * 90, hash(i, 17) * HALF_LENGTH * 2 - HALF_LENGTH, this.dummy.position);
      this.dummy.rotation.set(0, 0, u / RADIUS);
      this.dummy.scale.set(18 + hash(i, 12) * 47, 3 + hash(i, 16) * 9, 12 + hash(i, 31) * 38);
      this.dummy.updateMatrix(); this.clouds.setMatrixAt(i, this.dummy.matrix);
    }
    this.group.add(this.clouds);
    const dust = new THREE.BufferGeometry(); dust.setAttribute('position', new THREE.BufferAttribute(new Float32Array(450 * 3), 3));
    this.motes = new THREE.Points(dust, new THREE.PointsMaterial({ color: '#dae6ba', size: .07, transparent: true, opacity: .45, depthWrite: false }));
    const snow = new THREE.BufferGeometry(); snow.setAttribute('position', new THREE.BufferAttribute(new Float32Array(600 * 3), 3));
    this.snow = new THREE.Points(snow, new THREE.PointsMaterial({ color: '#e4eded', size: .12, transparent: true, opacity: .65, depthWrite: false }));
    const rain = new THREE.BufferGeometry(); rain.setAttribute('position', new THREE.BufferAttribute(new Float32Array(650 * 6), 3));
    this.rain = new THREE.LineSegments(rain, new THREE.LineBasicMaterial({ color: '#c3d2df', transparent: true, opacity: .22, depthWrite: false }));
    this.weather.add(this.motes, this.snow, this.rain); this.group.add(this.weather);

    const auroraGeometry = new THREE.PlaneGeometry(1, 1, 150, 20);
    const positions = auroraGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const u = positions.getX(i) * 950, h = 125 + (positions.getY(i) + .5) * 100 + Math.sin(u * .013) * 24;
      toWorld(u, h, -450 + Math.sin(u * .02) * 25, this.point); positions.setXYZ(i, this.point.x, this.point.y, this.point.z);
    }
    this.auroraMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform float time;varying vec2 vUv;void main(){float ribbon=pow(sin(vUv.y*3.14159),2.0);float fold=.4+.6*pow(sin(vUv.x*180.0+sin(vUv.x*8.0+time*.12)*5.0),2.0);vec3 c=mix(vec3(.23,.75,.37),vec3(.55,.35,.72),vUv.y);gl_FragColor=vec4(c,ribbon*fold*.5);}',
    });
    this.aurora = new THREE.Mesh(auroraGeometry, this.auroraMaterial); this.aurora.visible = false; this.aurora.frustumCulled = false; this.group.add(this.aurora);
    this.buildTornadoes(); this.buildFish(); this.buildWhales();
    this.wyrm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: '#849784' }), 27);
    this.wyrm.frustumCulled = false; this.group.add(this.wyrm);
    // A proper head for the sky wyrm, with horns, jaw, and eyes.
    const scaleMat = new THREE.MeshLambertMaterial({ color: '#93a691' });
    const cube = new THREE.BoxGeometry(1, 1, 1);
    const skull = new THREE.Mesh(cube, scaleMat); skull.scale.set(4.4, 3.4, 5.6);
    const jaw = new THREE.Mesh(cube, new THREE.MeshLambertMaterial({ color: '#7a8d79' })); jaw.scale.set(3.8, 1.1, 4.6); jaw.position.set(0, -1.9, -.6);
    this.wyrmHead.add(skull, jaw);
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(cube, scaleMat); horn.scale.set(.7, 3.2, .7); horn.position.set(side * 1.5, 2.4, 1.6); horn.rotation.z = side * .35; this.wyrmHead.add(horn);
      const eye = new THREE.Mesh(cube, new THREE.MeshBasicMaterial({ color: '#e8e2b0' })); eye.scale.set(.9, .7, .5); eye.position.set(side * 1.9, .6, -2.2); this.wyrmHead.add(eye);
      const frill = new THREE.Mesh(cube, scaleMat); frill.scale.set(.4, 2.4, 2.6); frill.position.set(side * 2.3, .2, 1.4); frill.rotation.z = side * .5; this.wyrmHead.add(frill);
    }
    this.wyrmHead.frustumCulled = false; this.group.add(this.wyrmHead);
  }

  private buildWhales() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    for (const path of WHALE_PATHS) {
      const group = new THREE.Group();
      const skin = new THREE.MeshLambertMaterial({ color: '#6b7f92' });
      const belly = new THREE.MeshLambertMaterial({ color: '#9fb0bc' });
      const body = new THREE.Mesh(geometry, skin); body.scale.set(7, 6, 22); body.position.y = 1; group.add(body);
      const under = new THREE.Mesh(geometry, belly); under.scale.set(6.4, 2.6, 20); under.position.y = -1.6; group.add(under);
      const head = new THREE.Mesh(geometry, skin); head.scale.set(6.2, 5.4, 6); head.position.set(0, 1, -12.5); group.add(head);
      const tail = new THREE.Mesh(geometry, skin); tail.scale.set(2, 3.4, 5); tail.position.set(0, 1.5, 12.5); group.add(tail);
      const fluke = new THREE.Mesh(geometry, skin); fluke.scale.set(11, 1, 3.4); fluke.position.set(0, 2.4, 15); group.add(fluke);
      for (const side of [-1, 1]) { const fin = new THREE.Mesh(geometry, skin); fin.scale.set(7, .9, 4); fin.position.set(side * 5.5, -.5, -2); fin.rotation.z = side * .4; group.add(fin); }
      const eyeGeo = new THREE.BoxGeometry(1, 1, 1), eyeMat = new THREE.MeshBasicMaterial({ color: '#20262b' });
      for (const side of [-1, 1]) { const eye = new THREE.Mesh(eyeGeo, eyeMat); eye.scale.setScalar(.6); eye.position.set(side * 3, 1.4, -13); group.add(eye); }
      group.scale.setScalar(1.15);
      this.group.add(group);
      this.whales.push({ group, u: path.u, z: path.z, height: path.height, radius: path.radius, phase: path.phase, speed: path.speed });
    }
  }

  private buildTornadoes() {
    for (const path of TORNADO_PATHS) {
      const group = new THREE.Group();
      const funnelGeometry = new THREE.CylinderGeometry(17, 1.3, 64, 18, 14, true);
      const positions = funnelGeometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i), scale = 1 + Math.sin(y * .23) * .12;
        positions.setXYZ(i, positions.getX(i) * scale + Math.sin(y * .07) * 1.8, y + 32, positions.getZ(i) * scale);
      }
      funnelGeometry.computeVertexNormals();
      const funnel = new THREE.Mesh(funnelGeometry, new THREE.MeshLambertMaterial({ color: '#667283', transparent: true, opacity: .4, side: THREE.DoubleSide, depthWrite: false })); group.add(funnel);
      const cloud = new THREE.Mesh(new THREE.BoxGeometry(43, 7, 36), new THREE.MeshLambertMaterial({ color: '#5c697c', transparent: true, opacity: .65 })); cloud.position.y = 63; group.add(cloud);
      const debris = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: '#8993a3', transparent: true, opacity: .58 }), 190);
      debris.frustumCulled = false; group.add(debris); this.group.add(group);
      this.tornadoes.push({ group, debris, u: path.u, z: path.z, h: terrainHeight(path.u, path.z), radius: 27 });
    }
  }

  private buildFish() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const colors = ['#e8b66d', '#9b81c6', '#91cfca', '#d87a6a', '#7fb0d8', '#d8c25a', '#8fd0a0'];
    // Shoals across every watered region: reefs, deep ocean, swamp, and the taiga river.
    const shoals = [{ u: -220, z: -355, spread: 130 }, { u: -1290, z: -470, spread: 200 }, { u: -520, z: -585, spread: 150 }, { u: 1310, z: -560, spread: 120 }, { u: 0, z: 0, spread: 80 }];
    let index = 0;
    for (const shoal of shoals) {
      const deep = shoal.z < -400 && shoal.u < -1000;
      for (let i = 0; i < (deep ? 26 : 18); i++, index++) {
        const u = shoal.u + (hash(index, 140) - .5) * shoal.spread, z = shoal.z + (hash(index, 141) - .5) * shoal.spread;
        const h = terrainHeight(u, z);
        if (!fluidAt(u, z, h) || h > -3) continue;
        const big = hash(index, 145) > .93;
        const group = new THREE.Group(), material = new THREE.MeshLambertMaterial({ color: deep && big ? '#3a4b57' : colors[index % colors.length] });
        const scale = big ? 2.4 + hash(index, 146) * 3 : 1;
        const body = new THREE.Mesh(geometry, material); body.scale.set(.55 * scale, .32 * scale, 1.05 * scale); group.add(body);
        const head = new THREE.Mesh(geometry, material); head.position.z = -.56 * scale; head.scale.set(.38 * scale, .26 * scale, .3 * scale); group.add(head);
        const tail = new THREE.Mesh(geometry, material); tail.position.z = .62 * scale; tail.scale.set(.75 * scale, .12 * scale, .25 * scale); group.add(tail);
        const dorsal = new THREE.Mesh(geometry, material); dorsal.position.y = .24 * scale; dorsal.scale.set(.07 * scale, .26 * scale, .6 * scale); group.add(dorsal);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: '#22262a' });
        for (const side of [-1, 1]) {
          const fin = new THREE.Mesh(geometry, material); fin.position.set(side * .26 * scale, -.04 * scale, -.1 * scale);
          fin.scale.set(.3 * scale, .05 * scale, .26 * scale); fin.rotation.z = side * .35; group.add(fin);
          const eye = new THREE.Mesh(geometry, eyeMaterial); eye.position.set(side * .17 * scale, .06 * scale, -.66 * scale);
          eye.scale.setScalar(.1 * scale); group.add(eye);
        }
        const swimH = Math.max(h + 2 + hash(index, 147) * Math.min(-h - 3, 24), -Math.min(-h - 1, 40));
        toWorld(u, swimH, z, group.position); this.group.add(group);
        this.fish.push({ group, u, z, h: swimH, phase: index * 1.7 });
      }
    }
  }

  update(delta: number, time: number, elapsed: number, position: PlayerPosition, submerged: boolean, aurora: boolean, reduced: boolean) {
    const biome = biomeAt(position.u, position.z), definition = BIOMES[biome];
    const daylight = Math.max(.08, Math.sin(((elapsed % 720) / 720) * Math.PI * 2 - Math.PI / 2) * .55 + .45);
    const depth = submerged ? Math.max(0, 1 - position.h) : 0;
    const underground = position.h <= CAVE_TOP;
    const cave = underground ? caveBiomeAt(position.u, position.h, position.z) : null;
    this.sky.copy(this.nightColors[biome]).lerp(this.dayColors[biome], Math.max(.35, daylight));
    let density = definition.fog;
    if (submerged) {
      this.sky.set(biome === 'blood' ? '#582b38' : biome === 'abyss' ? '#102d3d' : '#397d80');
      this.sky.multiplyScalar(Math.max(.2, 1 - depth * .016)); density = biome === 'abyss' ? .064 : .043;
    } else if (underground && cave) {
      // Each cave biome owns the colour and thickness of its own darkness.
      this.sky.set(cave.color).multiplyScalar(cave.glow > 1 ? .3 : cave.glow > 0 ? .19 : .1);
      density = .028 + (2 - cave.glow) * .011;
    }
    const blend = 1 - Math.exp(-delta * 2.2);
    (this.scene.background as THREE.Color).lerp(this.sky, blend); this.fog.color.lerp(this.sky, blend); this.fog.density = THREE.MathUtils.lerp(this.fog.density, density, blend);
    const darkness = submerged ? Math.max(.25, 1 - depth * .018) : underground ? (cave ? .12 + cave.glow * .1 : .2) : 1;
    this.ambient.intensity = (.65 + daylight * 1.5) * darkness;
    if (underground && cave) this.ambient.color.set(cave.color); else this.ambient.color.set('#d8dfcd');
    this.sunlight.intensity = 220000 + daylight * 540000;
    this.lantern.intensity = submerged ? 45 : underground ? 62 : 2;
    this.lantern.distance = underground ? 26 : 20;
    this.lantern.color.set(submerged ? '#81bac7' : underground && cave ? cave.color : '#a6d2b9');
    toWorld(position.u, position.h + 1.8, position.z, this.lantern.position);
    this.sun.visible = !submerged && !underground;
    this.aurora.visible = aurora && !submerged && !underground;
    this.auroraMaterial.uniforms.time.value = reduced ? 0 : time;
    this.clouds.rotation.z = reduced ? 0 : time * .000035;
    this.glow.material.opacity = .5 + (reduced ? 0 : Math.sin(time * .2) * .025);

    toWorld(position.u, position.h, position.z, this.weather.position);
    this.weather.rotation.z = position.u / RADIUS;
    this.snow.visible = !submerged && !underground && ['snow', 'spores', 'dust', 'ash'].includes(definition.weather);
    this.rain.visible = !submerged && !underground && definition.weather === 'rain';
    this.targetColor.set(definition.weather === 'ash' ? '#6b6058' : definition.weather === 'spores' ? biome === 'spiked' ? '#d9e9a0' : biome === 'mushroom' ? '#c6a7dc' : '#c5e8ae' : definition.weather === 'dust' ? '#d5bd91' : '#e4eded');
    (this.snow.material as THREE.PointsMaterial).color.copy(this.targetColor);
    (this.snow.material as THREE.PointsMaterial).size = definition.weather === 'dust' ? .07 : definition.weather === 'ash' ? .1 : .12;
    const motion = reduced ? 0 : time;
    const snowPosition = this.snow.geometry.attributes.position;
    if (this.snow.visible) {
      for (let i = 0; i < snowPosition.count; i++) {
        const drift = definition.weather === 'dust' ? motion * 2.3 : Math.sin(motion * .3 + i) * 2;
        const x = ((hash(i, 133) * 80 + drift) % 80 + 80) % 80 - 40;
        const y = ((hash(i, 134) * 55 - motion * (definition.weather === 'snow' ? 1.9 : .4)) % 55 + 55) % 55 - 7;
        snowPosition.setXYZ(i, x, y, hash(i, 135) * 90 - 45);
      }
      snowPosition.needsUpdate = true;
    }
    const rainPosition = this.rain.geometry.attributes.position;
    if (this.rain.visible) for (let i = 0; i < rainPosition.count / 2; i++) {
      const x = ((hash(i, 136) * 80 + motion * 8) % 80 + 80) % 80 - 40;
      const y = ((hash(i, 137) * 65 - motion * 24) % 65 + 65) % 65 - 5, z = hash(i, 138) * 90 - 45;
      rainPosition.setXYZ(i * 2, x, y, z); rainPosition.setXYZ(i * 2 + 1, x - .4, y + 1.8, z);
    }
    rainPosition.needsUpdate = this.rain.visible;
    const motes = this.motes.geometry.attributes.position;
    // Motes are slow-moving; a quarter-rate upload is visually identical.
    if (Math.floor(time * 15) % 4 === 0) {
      for (let i = 0; i < motes.count; i++) motes.setXYZ(i, Math.sin(hash(i, 142) * 8 + motion * .017) * 35, hash(i, 143) * 21 - 4, Math.cos(hash(i, 144) * 8 + motion * .009) * 35);
      motes.needsUpdate = true;
    }

    for (let j = 0; j < this.tornadoes.length; j++) {
      const tornado = this.tornadoes[j], path = TORNADO_PATHS[j];
      tornado.u = path.u + Math.cos(elapsed * .017 + path.phase) * path.radius;
      tornado.z = path.z + Math.sin(elapsed * .022 + path.phase) * path.radius * .7;
      tornado.h = terrainHeight(tornado.u, tornado.z) + .5;
      toWorld(tornado.u, tornado.h, tornado.z, tornado.group.position); tornado.group.rotation.z = tornado.u / RADIUS;
      const nearby = tornado.group.position.distanceTo(this.lantern.position) <= 550;
      tornado.group.visible = nearby;
      if (!nearby) continue;
      for (let i = 0; i < tornado.debris.count; i++) {
        const h = hash(i, 151) * 62, angle = hash(i, 152) * Math.PI * 2 + (reduced ? 0 : elapsed * (1.9 - h * .015));
        const radius = 1.5 + h * .25 + hash(i, 153) * 2;
        this.dummy.position.set(Math.cos(angle) * radius, h, Math.sin(angle) * radius);
        this.dummy.rotation.set(angle, angle * .7, h); this.dummy.scale.setScalar(.3 + hash(i, 154) * 1.1);
        this.dummy.updateMatrix(); tornado.debris.setMatrixAt(i, this.dummy.matrix);
      }
      tornado.debris.instanceMatrix.needsUpdate = true;
    }
    if (biome === 'storm' && !reduced && elapsed % 17 > 16.75) this.ambient.intensity += .25 * Math.sin((elapsed % 17 - 16.75) / .25 * Math.PI);

    for (const fish of this.fish) {
      const nearby = Math.hypot(wrapU(fish.u - position.u), fish.z - position.z) <= 135;
      fish.group.visible = nearby;
      if (!nearby) continue;
      const u = fish.u + Math.sin(motion * .4 + fish.phase) * 3, z = fish.z + Math.cos(motion * .4 + fish.phase) * 3;
      toWorld(u, fish.h + Math.sin(motion + fish.phase) * .2, z, fish.group.position);
      fish.group.rotation.set(0, -motion * .4 - fish.phase, u / RADIUS);
    }
    const aerie = PYLONS.find(pylon => pylon.id === 'aerie')!;
    const wyrmNearby = Math.hypot(wrapU(aerie.u - position.u), aerie.z - position.z) <= 500;
    this.wyrm.visible = this.wyrmHead.visible = wyrmNearby;
    if (wyrmNearby) for (let i = 0; i < this.wyrm.count; i++) {
      const phase = motion * .09 - i * .035;
      const u = aerie.u + 45 + Math.sin(phase) * 88, z = aerie.z - 45 + Math.cos(phase) * 66;
      toWorld(u, 108 + Math.sin(phase * 2.1) * 13 + Math.sin(i * .38 - motion) * 1.7, z, this.dummy.position);
      this.dummy.rotation.set(0, -phase, u / RADIUS);
      const size = i === 0 ? 3.6 : 3.2 * (1 - i / 34);
      this.dummy.scale.set(size, size * .8, size * 1.4); this.dummy.updateMatrix(); this.wyrm.setMatrixAt(i, this.dummy.matrix);
    }
    this.wyrm.instanceMatrix.needsUpdate = true;
    if (wyrmNearby) {
      const phase = motion * .09;
      const u = aerie.u + 45 + Math.sin(phase) * 88, z = aerie.z - 45 + Math.cos(phase) * 66;
      toWorld(u, 108 + Math.sin(phase * 2.1) * 13 + Math.sin(-motion) * 1.7, z, this.wyrmHead.position);
      this.wyrmHead.rotation.set(0, -phase + Math.PI, u / RADIUS);
    }

    for (const whale of this.whales) {
      const nearby = Math.hypot(wrapU(whale.u - position.u), whale.z - position.z) <= 700;
      whale.group.visible = nearby;
      if (!nearby) continue;
      const angle = whale.phase + motion * whale.speed;
      const u = whale.u + Math.cos(angle) * whale.radius, z = whale.z + Math.sin(angle) * whale.radius * .8;
      const height = whale.height + Math.sin(angle * 2) * 10;
      toWorld(u, height, z, whale.group.position);
      const tangent = -angle - Math.PI / 2;
      whale.group.rotation.set(0, tangent, u / RADIUS + Math.sin(angle * 2) * .08);
      whale.group.rotateX(Math.sin(motion * .5 + whale.phase) * .05);
    }
  }

  dispose() {
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    this.group.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.LineSegments) {
        geometries.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
        if (object instanceof THREE.InstancedMesh) object.dispose();
      } else if (object instanceof THREE.Sprite) materials.add(object.material);
    });
    geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); this.glowMap.dispose();
    this.scene.remove(this.group); this.group.clear();
  }
}