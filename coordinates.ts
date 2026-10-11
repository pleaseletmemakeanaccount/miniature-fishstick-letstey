import * as THREE from 'three';
import { RADIUS, wrapU } from './biomes';

export const gridKey = (x: number, y: number, z: number) => `${wrapU(x)},${y},${z}`;

// Height points inward; positive gravity pulls back toward the iron shell.
export function toWorld(u: number, h: number, z: number, out = new THREE.Vector3()) {
  const angle = u / RADIUS;
  return out.set(Math.sin(angle) * (RADIUS - h), -Math.cos(angle) * (RADIUS - h), z);
}

export function fromWorld(point: THREE.Vector3) {
  return { u: Math.atan2(point.x, -point.y) * RADIUS, h: RADIUS - Math.hypot(point.x, point.y), z: point.z };
}