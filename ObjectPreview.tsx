import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw } from 'lucide-react';
import { hash } from './world';

interface PreviewProps { kind: 'rock' | 'voxels'; voxels?: boolean[]; color?: string }

export default function ObjectPreview({ kind, voxels, color = '#999f88' }: PreviewProps) {
  const host = useRef<HTMLDivElement>(null);
  const cells = useRef(voxels);
  const stoneColor = useRef(color);
  const rotation = useRef({ x: -.14, y: -.55 });
  const [unsupported, setUnsupported] = useState(false);
  cells.current = voxels;
  stoneColor.current = color;

  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { setUnsupported(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
    camera.position.set(0, 2, kind === 'rock' ? 11.5 : 18);
    camera.lookAt(0, 0, 0);
    const ambient = new THREE.AmbientLight('#b7c1a3', 1.4); scene.add(ambient);
    const light = new THREE.DirectionalLight('#f1e7c8', 3.5); light.position.set(3, 7, 5); scene.add(light);
    const fill = new THREE.DirectionalLight('#91a6a5', 1.6); fill.position.set(-4, 2, -4); scene.add(fill);
    const object = new THREE.Group(); scene.add(object);
    let instanced: THREE.InstancedMesh | null = null;
    let bump: THREE.CanvasTexture | null = null;
    if (kind === 'rock') {
      const geometry = new THREE.IcosahedronGeometry(2.1, 5);
      const positions = geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
        const distort = 1 + Math.sin(x * 3.7 + z * 1.8) * .06 + Math.cos(z * 4.6 + y * 2.4) * .06 + Math.sin(y * 10 + x * 6) * .025;
        positions.setXYZ(i, x * distort * 1.2, y * distort * .8, z * distort);
      }
      geometry.computeVertexNormals();
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
      const context = canvas.getContext('2d')!;
      const image = context.createImageData(256, 256);
      for (let i = 0; i < 256 * 256; i++) {
        const value = Math.floor(90 + hash(i % 256, Math.floor(i / 256), 5) * 140);
        image.data.set([value, value, value, 255], i * 4);
      }
      context.putImageData(image, 0, 0);
      bump = new THREE.CanvasTexture(canvas); bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.repeat.set(3, 3);
      object.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: '#8c9587', roughness: .94, metalness: .05, bumpMap: bump, bumpScale: .16 })));
    } else {
      const geometry = new THREE.BoxGeometry(.94, .94, .94);
      const material = new THREE.MeshStandardMaterial({ color: stoneColor.current, roughness: 1 });
      instanced = new THREE.InstancedMesh(geometry, material, 512);
      instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      instanced.frustumCulled = false;
      object.add(instanced);
    }
    let animation = 0, oldCells: boolean[] | undefined;
    const dummy = new THREE.Object3D();
    let drag: { x: number; y: number } | null = null;
    let vx = 0, vy = 0;
    let previousTime = 0;
    const down = (event: PointerEvent) => { drag = { x: event.clientX, y: event.clientY }; vx = 0; vy = 0; container.setPointerCapture(event.pointerId); };
    const move = (event: PointerEvent) => {
      if (!drag) return;
      vx = (event.clientX - drag.x) * .007;
      vy = (event.clientY - drag.y) * .007;
      rotation.current.y += vx; rotation.current.x += vy;
      drag.x = event.clientX; drag.y = event.clientY;
    };
    const up = () => { drag = null; };
    const key = (event: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
        event.preventDefault(); event.stopPropagation();
        rotation.current.y += event.code === 'ArrowLeft' ? -.2 : event.code === 'ArrowRight' ? .2 : 0;
        rotation.current.x += event.code === 'ArrowUp' ? -.2 : event.code === 'ArrowDown' ? .2 : 0;
      }
    };
    container.addEventListener('pointerdown', down); container.addEventListener('pointermove', move);
    container.addEventListener('pointerup', up); container.addEventListener('pointercancel', up); container.addEventListener('keydown', key);
    const observer = new ResizeObserver(() => {
      const width = container.clientWidth || 300, height = container.clientHeight || 300;
      renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix();
    }); observer.observe(container);
    const frame = (time: number) => {
      animation = requestAnimationFrame(frame);
      const delta = previousTime ? Math.min((time - previousTime) / 16.67, 3) : 1; previousTime = time;
      if (!drag) {
        rotation.current.y += vx * delta; rotation.current.x += vy * delta;
        vx *= Math.pow(.96, delta); vy *= Math.pow(.96, delta);
        const reduced = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduced) rotation.current.y += (kind === 'rock' ? .001 : .0018) * delta;
      }
      object.rotation.set(rotation.current.x, rotation.current.y, 0);
      if (instanced && cells.current !== oldCells) {
        for (let i = 0; i < 512; i++) {
          const x = i % 8, y = Math.floor(i / 8) % 8, z = Math.floor(i / 64);
          dummy.position.set(x - 3.5, 3.5 - y, (z - 3.5) * .42);
          dummy.scale.setScalar(cells.current?.[i] ? 1 : 0); dummy.updateMatrix(); instanced.setMatrixAt(i, dummy.matrix);
        }
        instanced.instanceMatrix.needsUpdate = true;
        oldCells = cells.current;
      }
      if (instanced) (instanced.material as THREE.MeshStandardMaterial).color.set(stoneColor.current);
      renderer.render(scene, camera);
    }; animation = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animation); observer.disconnect();
      container.removeEventListener('pointerdown', down); container.removeEventListener('pointermove', move);
      container.removeEventListener('pointerup', up); container.removeEventListener('pointercancel', up); container.removeEventListener('keydown', key);
      object.traverse(child => { if (child instanceof THREE.Mesh) { child.geometry.dispose(); (child.material as THREE.Material).dispose(); if (child instanceof THREE.InstancedMesh) child.dispose(); } });
      bump?.dispose(); renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* Context may already be lost. */ }
      renderer.domElement.remove();
    };
  }, [kind]);

  return (
    <div className={`object-preview ${kind}`}>
      <div ref={host} className="object-canvas" tabIndex={0} role="img" data-autofocus={kind === 'rock' ? 'true' : undefined} aria-label={kind === 'rock' ? 'Interactive 3D rock. Drag to spin, or focus and use arrow keys.' : 'Your chiseled voxel shape in 3D. Drag to rotate.'} />
      {unsupported && <div className="preview-fallback">3D preview needs WebGL.<br />The shaping grid still works.</div>}
      <span className="preview-caption">{kind === 'rock' ? 'ONE SMALL, ORDINARY STONE' : 'LIVE VOLUMETRIC PREVIEW'}</span>
      <span className="preview-hint">DRAG TO ROTATE / ARROW KEYS</span>
      <button className="preview-reset" aria-label="Reset object rotation" title="Reset rotation" onClick={() => { rotation.current = { x: -.14, y: -.55 }; }}><RotateCcw size={15} /></button>
    </div>
  );
}