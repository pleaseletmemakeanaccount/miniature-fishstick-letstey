import * as THREE from 'three';
import { CIRCUMFERENCE, HALF_LENGTH, RADIUS } from './biomes';

export const FACES = [
  { direction: [1, 0, 0], shade: .84, corners: [[.5, -.5, -.5], [.5, .5, -.5], [.5, .5, .5], [.5, -.5, .5]] },
  { direction: [-1, 0, 0], shade: .76, corners: [[-.5, -.5, .5], [-.5, .5, .5], [-.5, .5, -.5], [-.5, -.5, -.5]] },
  { direction: [0, 1, 0], shade: 1, corners: [[-.5, .5, -.5], [-.5, .5, .5], [.5, .5, .5], [.5, .5, -.5]] },
  { direction: [0, -1, 0], shade: .49, corners: [[-.5, -.5, .5], [-.5, -.5, -.5], [.5, -.5, -.5], [.5, -.5, .5]] },
  { direction: [0, 0, 1], shade: .87, corners: [[.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5], [-.5, -.5, .5]] },
  { direction: [0, 0, -1], shade: .8, corners: [[-.5, -.5, -.5], [-.5, .5, -.5], [.5, .5, -.5], [.5, -.5, -.5]] },
];

/** A growable typed buffer. Avoids boxing millions of doubles into plain arrays. */
class FloatBuffer {
  data = new Float32Array(1024);
  length = 0;
  push3(a: number, b: number, c: number) { this.ensure(3); this.data[this.length++] = a; this.data[this.length++] = b; this.data[this.length++] = c; }
  push2(a: number, b: number) { this.ensure(2); this.data[this.length++] = a; this.data[this.length++] = b; }
  private ensure(n: number) {
    if (this.length + n <= this.data.length) return;
    const next = new Float32Array(Math.max(this.data.length * 2, this.length + n));
    next.set(this.data.subarray(0, this.length));
    this.data = next;
  }
  view() { return this.data.subarray(0, this.length); }
}

export class FaceBuilder {
  private positions = new FloatBuffer();
  private normals = new FloatBuffer();
  private colors = new FloatBuffer();
  private uvs = new FloatBuffer();
  private cells = new FloatBuffer();
  private indexData = new Uint32Array(1536);
  private indexLength = 0;
  private vertexCount = 0;

  /** Number of index entries written; non-zero means there is something to draw. */
  get indices() { return { length: this.indexLength }; }

  face(x: number, y: number, z: number, faceIndex: number, color: THREE.Color, width = 1, height = 1, depth = 1, cell?: [number, number]) {
    const face = FACES[faceIndex], index = this.vertexCount;
    const angle = x / RADIUS, sin = Math.sin(angle), cos = Math.cos(angle);
    const [nx, ny, nz] = face.direction;
    const shade = face.shade;
    for (let i = 0; i < 4; i++) {
      const [dx, dy, dz] = face.corners[i];
      const u = (x + dx * width) / RADIUS, r = RADIUS - y - dy * height;
      this.positions.push3(Math.sin(u) * r, -Math.cos(u) * r, z + dz * depth);
      this.normals.push3(nx * cos - ny * sin, nx * sin + ny * cos, nz);
      this.colors.push3(color.r * shade, color.g * shade, color.b * shade);
      this.uvs.push2(i === 1 || i === 2 ? 1 : 0, i >= 2 ? 1 : 0);
      if (cell) this.cells.push2(cell[0] < 0 ? (x + dx * width + CIRCUMFERENCE / 2) / CIRCUMFERENCE : cell[0], cell[1] < 0 ? (z + dz * depth + HALF_LENGTH) / (HALF_LENGTH * 2) : cell[1]);
    }
    this.vertexCount += 4;
    if (this.indexLength + 6 > this.indexData.length) {
      const next = new Uint32Array(this.indexData.length * 2);
      next.set(this.indexData.subarray(0, this.indexLength));
      this.indexData = next;
    }
    const d = this.indexData, n = this.indexLength;
    d[n] = index; d[n + 1] = index + 1; d[n + 2] = index + 2; d[n + 3] = index; d[n + 4] = index + 2; d[n + 5] = index + 3;
    this.indexLength += 6;
  }

  box(x: number, y: number, z: number, width: number, height: number, depth: number, color: THREE.Color, cell?: [number, number]) {
    for (let i = 0; i < 6; i++) this.face(x, y, z, i, color, width, height, depth, cell);
  }

  geometry() {
    const geometry = new THREE.BufferGeometry();
    // Copy into exact-size arrays so the GPU upload never carries spare capacity.
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions.view().slice(), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(this.normals.view().slice(), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors.view().slice(), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(this.uvs.view().slice(), 2));
    if (this.cells.length) geometry.setAttribute('cellUv', new THREE.BufferAttribute(this.cells.view().slice(), 2));
    const indices = this.indexData.subarray(0, this.indexLength);
    geometry.setIndex(new THREE.BufferAttribute(this.vertexCount > 65535 ? indices.slice() : Uint16Array.from(indices), 1));
    geometry.computeBoundingSphere();
    return geometry;
  }
}