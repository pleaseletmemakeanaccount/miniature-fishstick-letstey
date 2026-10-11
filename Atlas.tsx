import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ArrowRight, Check, Compass, Crosshair, Layers, MapPin, Minus, Plus, RotateCcw, Search, X } from 'lucide-react';
import { BIOMES, BIOME_IDS, CIRCUMFERENCE, HALF_LENGTH, PYLONS, formatDistance, surfaceDistance, wrapU, type Biome } from './biomes';
import { biomeAt, fluidAt, terrainHeight } from './terrain';
import type { WorldSnapshot } from './engine';
import type { SaveData } from './model';
import { SectionHeading } from './ui';

const WIDTH = 640, HEIGHT = 500;
const mapPoint = (u: number, z: number) => ({ x: 24 + (u + CIRCUMFERENCE / 2) / CIRCUMFERENCE * 592, y: 24 + (z + HALF_LENGTH) / (HALF_LENGTH * 2) * 444 });
const rgb = (color: string) => [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)];
const PALETTE = Object.fromEntries(BIOME_IDS.map(id => [id, rgb(BIOMES[id].color)])) as Record<Biome, number[]>;

function useCartography(mode: 'terrain' | 'biomes') {
  const [image, setImage] = useState('');
  useEffect(() => {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 192;
    const context = canvas.getContext('2d')!;
    const pixels = context.createImageData(canvas.width, canvas.height), heights = new Int16Array(canvas.width * canvas.height);
    let row = 0, frame = 0, active = true;
    const draw = () => {
      if (!active) return;
      const end = Math.min(canvas.height, row + 12);
      for (; row < end; row++) for (let col = 0; col < canvas.width; col++) {
        const u = (col + .5) / canvas.width * CIRCUMFERENCE - CIRCUMFERENCE / 2;
        const z = (row + .5) / canvas.height * HALF_LENGTH * 2 - HALF_LENGTH;
        const biome = biomeAt(u, z), h = terrainHeight(u, z), index = row * canvas.width + col;
        const fluid = fluidAt(u, z, h);
        let color = PALETTE[biome];
        if (mode === 'terrain' && fluid) color = fluid.kind === 'water' ? biome === 'abyss' ? [44, 83, 106] : [70, 151, 151] : [132, 64, 69];
        let shade = mode === 'biomes' ? .72 : .49 + Math.max(-30, h) * .004;
        if (mode === 'terrain' && col > 0 && row > 0 && Math.floor(h / 8) !== Math.floor(heights[index - 1] / 8)) shade += .11;
        if (mode === 'terrain' && col > 0) shade += Math.max(-.12, Math.min(.12, (h - heights[index - 1]) * .01));
        heights[index] = h;
        pixels.data.set([Math.min(255, color[0] * shade), Math.min(255, color[1] * shade), Math.min(255, color[2] * shade), 255], index * 4);
      }
      if (row < canvas.height) frame = requestAnimationFrame(draw);
      else { context.putImageData(pixels, 0, 0); setImage(canvas.toDataURL()); }
    };
    frame = requestAnimationFrame(draw);
    return () => { active = false; cancelAnimationFrame(frame); };
  }, [mode]);
  return image;
}

interface AtlasProps {
  save: SaveData;
  snapshot: WorldSnapshot | null;
  onTravel: (id: string) => void;
  onAttune: (id: string) => void;
  onWaypoint: (id: string) => void;
}

export default function WorldAtlas({ save, snapshot, onTravel, onAttune, onWaypoint }: AtlasProps) {
  const [selected, setSelected] = useState(save.waypoint || (snapshot?.nearPylon === 'cloudbreak' ? 'aerie' : 'cloudbreak'));
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'terrain' | 'biomes'>('terrain');
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: WIDTH / 2, y: HEIGHT / 2 });
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const image = useCartography(mode);
  const pylon = PYLONS.find(site => site.id === selected) || PYLONS[0];
  const biome = BIOMES[pylon.biome], unlocked = save.unlockedPylons.includes(pylon.id), nearby = snapshot?.nearPylon;
  const creative = save.mode === 'creative';
  const canTravel = (creative || !!nearby && save.unlockedPylons.includes(nearby) && unlocked) && nearby !== selected;
  const position = snapshot?.position || save.position || { u: 13, z: 22, yaw: 0 };
  const player = mapPoint(position.u, position.z);
  const waypoint = PYLONS.find(site => site.id === save.waypoint);
  const waypointPoint = waypoint ? mapPoint(position.u + wrapU(waypoint.u - position.u), waypoint.z) : null;
  const course = waypointPoint ? `M${player.x} ${player.y} L${waypointPoint.x} ${waypointPoint.y} M${player.x - 592} ${player.y} L${waypointPoint.x - 592} ${waypointPoint.y} M${player.x + 592} ${player.y} L${waypointPoint.x + 592} ${waypointPoint.y}` : '';
  const distance = surfaceDistance(position, pylon), isWaypoint = save.waypoint === pylon.id;
  const filtered = PYLONS.filter(point => `${point.name} ${BIOMES[point.biome].name} ${point.region}`.toLowerCase().includes(query.toLowerCase()));
  const viewW = WIDTH / zoom, viewH = HEIGHT / zoom;
  const clampedCenter = { x: Math.max(viewW / 2, Math.min(WIDTH - viewW / 2, center.x)), y: Math.max(viewH / 2, Math.min(HEIGHT - viewH / 2, center.y)) };
  const select = (id: string) => {
    setSelected(id);
    if (zoom > 1) { const point = PYLONS.find(site => site.id === id)!; setCenter(mapPoint(point.u, point.z)); }
  };
  const moveMap = (event: PointerEvent<SVGSVGElement>) => {
    if (!drag.current || !svg.current) return;
    const rect = svg.current.getBoundingClientRect();
    const dx = (event.clientX - drag.current.x) / rect.width * viewW, dy = (event.clientY - drag.current.y) / rect.height * viewH;
    setCenter({ x: clampedCenter.x - dx, y: clampedCenter.y - dy });
    drag.current = { x: event.clientX, y: event.clientY };
  };

  return <div className="world-atlas" style={{ '--biome-accent': biome.color } as CSSProperties}>
    <SectionHeading eyebrow="EXPEDITION ATLAS / THE EXPANDED INNER WALL" title="A much stranger world."><div className="atlas-survey-count"><Compass size={14} /><span>{save.visitedBiomes.length}<small> / {BIOME_IDS.length} BIOMES SURVEYED</small></span></div></SectionHeading>
    <div className="atlas-layout">
      <div className="atlas-cartography">
        <div className="atlas-map-toolbar"><div className="atlas-map-modes">{(['terrain', 'biomes'] as const).map(value => <button key={value} className={mode === value ? 'active' : ''} onClick={() => setMode(value)} aria-pressed={mode === value}>{value === 'terrain' ? <Layers size={12} /> : <Compass size={12} />}{value === 'terrain' ? 'Topography' : 'Biomes'}</button>)}</div><span>2,048 x 1,536 BLOCKS</span></div>
        <div className="atlas-viewport">
          {!image && <div className="atlas-drawing" role="status"><Compass size={24} /><span>SURVEYING THE INNER WALL</span></div>}
          <svg ref={svg} viewBox={`${clampedCenter.x - viewW / 2} ${clampedCenter.y - viewH / 2} ${viewW} ${viewH}`} aria-label="Interactive world map. Select a pylon, drag to pan, or use the map zoom controls." role="group" tabIndex={0}
            onPointerDown={event => { if ((event.target as Element).closest('[data-pylon]')) return; event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY }; }} onPointerMove={moveMap} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
            onKeyDown={event => {
              if (['+', '=', '-', 'Home', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                event.preventDefault(); event.stopPropagation();
                if (event.key === '+' || event.key === '=') setZoom(value => Math.min(3.5, value + .5));
                else if (event.key === '-') setZoom(value => Math.max(1, value - .5));
                else if (event.key === 'Home') { setZoom(1); setCenter({ x: 320, y: 250 }); }
                else setCenter({ x: clampedCenter.x + (event.key === 'ArrowRight' ? 30 : event.key === 'ArrowLeft' ? -30 : 0), y: clampedCenter.y + (event.key === 'ArrowDown' ? 30 : event.key === 'ArrowUp' ? -30 : 0) });
              }
            }}>
            <defs><pattern id="atlas-grid" width="74" height="55.5" patternUnits="userSpaceOnUse" x="24" y="24"><path d="M74 0H0v55.5" fill="none" stroke="#d3e1be" strokeOpacity=".13" strokeWidth=".6" /></pattern><clipPath id="atlas-bounds"><rect x="24" y="24" width="592" height="444" /></clipPath></defs>
            <rect x="24" y="24" width="592" height="444" fill="#1f2e25" stroke="#899d6e" strokeOpacity=".3" />
            {image && <image href={image} x="24" y="24" width="592" height="444" preserveAspectRatio="none" className="atlas-terrain-image" />}
            <rect x="24" y="24" width="592" height="444" fill="url(#atlas-grid)" pointerEvents="none" />
            <path d="M320 24v444M24 246h592" stroke="#e0e8cf" strokeWidth=".6" strokeDasharray="3 5" opacity=".18" />
            <text x="24" y="14" fill="#8da282" fontSize="6" fontFamily="monospace" letterSpacing="1">-1024 ARC</text><text x="616" y="14" textAnchor="end" fill="#8da282" fontSize="6" fontFamily="monospace" letterSpacing="1">+1024 ARC / WRAPS</text>
            <text x="24" y="482" fill="#8da282" fontSize="6" fontFamily="monospace" letterSpacing="1">-768 TO +768 Z</text><text x="616" y="482" textAnchor="end" fill="#8da282" fontSize="6" fontFamily="monospace" letterSpacing="1">1 BLOCK = 1m</text>
            {mode === 'biomes' && BIOME_IDS.map(id => { const point = mapPoint(...BIOMES[id].seed); return <text key={id} x={point.x} y={point.y + 25} textAnchor="middle" fill="#edf1da" opacity=".65" fontSize="6" fontFamily="monospace" letterSpacing=".7" pointerEvents="none">{BIOMES[id].shortName.toUpperCase()}</text>; })}
            {waypointPoint && <path d={course} clipPath="url(#atlas-bounds)" className="atlas-course-line" stroke={BIOMES[waypoint!.biome].color} strokeWidth="1" strokeDasharray="4 5" fill="none" opacity=".7" />}
            {PYLONS.map(point => {
              const coordinates = mapPoint(point.u, point.z), active = point.id === pylon.id, visited = save.visitedBiomes.includes(point.biome);
              return <g key={point.id} data-pylon={point.id} className={`atlas-node ${active ? 'active' : ''}`} role="button" tabIndex={0} aria-label={`Select ${point.name}, ${BIOMES[point.biome].shortName}`} aria-pressed={active} onClick={() => select(point.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); select(point.id); } }}>
                <title>{point.name} / {BIOMES[point.biome].shortName}</title>
                <circle cx={coordinates.x} cy={coordinates.y} r="12" fill="transparent" />
                {active && <circle cx={coordinates.x} cy={coordinates.y} r="11" fill="#152314" fillOpacity=".65" stroke={BIOMES[point.biome].color} strokeWidth=".7" />}
                <rect x={coordinates.x - 3} y={coordinates.y - 3} width="6" height="6" fill={visited || active ? BIOMES[point.biome].color : '#b0b9a2'} stroke="#172115" strokeWidth=".8" transform={`rotate(45 ${coordinates.x} ${coordinates.y})`} />
                {active && <><rect x={coordinates.x - 58} y={coordinates.y - 30} width="116" height="13" fill="#172313" fillOpacity=".88" /><text x={coordinates.x} y={coordinates.y - 21} textAnchor="middle" fill="#e3e9cb" fontSize="6.5" fontFamily="monospace" letterSpacing=".4">{point.name.toUpperCase()}</text></>}
              </g>;
            })}
            <g transform={`translate(${player.x} ${player.y})`} pointerEvents="none"><circle r="8" fill="none" stroke="#f4efcc" strokeOpacity=".45" strokeWidth=".6" /><path d="M0-6 4 5 0 3-4 5Z" fill="#fbf2c8" stroke="#253421" strokeWidth="1" transform={`rotate(${-position.yaw * 180 / Math.PI})`} /></g>
          </svg>
          <div className="atlas-zoom"><button onClick={() => setZoom(value => Math.min(3.5, value + .5))} disabled={zoom >= 3.5} aria-label="Zoom in"><Plus size={15} /></button><span>{zoom.toFixed(1)}x</span><button onClick={() => setZoom(value => Math.max(1, value - .5))} disabled={zoom <= 1} aria-label="Zoom out"><Minus size={15} /></button><i /><button onClick={() => { setZoom(2.5); setCenter(player); }} aria-label="Locate your position"><Crosshair size={14} /></button><button onClick={() => { setZoom(1); setCenter({ x: 320, y: 250 }); }} aria-label="Show entire world"><RotateCcw size={13} /></button></div>
        </div>
        <div className="atlas-map-footer"><span><i className="you-dot" />YOU</span><span><i className="pylon-dot" />EXPEDITION PYLON</span><span>DRAG TO PAN / + - TO ZOOM</span></div>
        <div className="atlas-biome-legend" aria-label="Select a biome">{BIOME_IDS.map(id => <button key={id} onClick={() => { const point = PYLONS.find(site => site.biome === id && site.id !== 'cloudbreak'); if (point) { select(point.id); setQuery(''); } }} className={pylon.biome === id ? 'selected' : ''} aria-pressed={pylon.biome === id}><i style={{ backgroundColor: BIOMES[id].color }} /><span>{BIOMES[id].shortName}</span>{save.visitedBiomes.includes(id) && <Check size={9} />}</button>)}</div>
        <p className="atlas-scale-note">Nearly 120x the original surface area. Streamed in 16 x 16 voxel chunks. Your original settlement is still at the center.</p>
      </div>
      <aside className="atlas-destinations">
        <label className="atlas-search"><Search size={13} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a biome or pylon..." aria-label="Search biomes and pylons" />{query && <button onClick={() => setQuery('')} aria-label="Clear biome search"><X size={12} /></button>}</label>
        <div className="atlas-pylon-list" aria-label="Expedition destinations">{filtered.map(point => <button className={selected === point.id ? 'selected' : ''} key={point.id} onClick={() => select(point.id)}><i style={{ background: BIOMES[point.biome].color }} /><div><span>{point.name}</span><small>{BIOMES[point.biome].shortName}</small></div>{nearby === point.id ? <em>HERE</em> : save.visitedBiomes.includes(point.biome) ? <Check size={12} /> : <ArrowRight size={12} />}</button>)}{!filtered.length && <p className="atlas-empty">No matching destination.<button className="text-button" onClick={() => setQuery('')}>Show all biomes</button></p>}</div>
        <div className="atlas-biome-detail" key={pylon.id}>
          <p className="eyebrow">{save.visitedBiomes.includes(pylon.biome) ? 'SURVEYED REGION' : 'UNEXPLORED REGION'} / {biome.temperature > 0 ? '+' : ''}{biome.temperature} C</p>
          <h3>{biome.name}</h3><p className="atlas-biome-description">{biome.description}</p>
          <dl><div><dt>Resources</dt><dd>{biome.resources}</dd></div><div><dt>Watch for</dt><dd>{biome.danger}</dd></div><div><dt>Distance</dt><dd>{formatDistance(distance)} / ARC {pylon.u} / Z {pylon.z}</dd></div></dl>
          {!unlocked && nearby === selected ? <button className="game-button primary full" onClick={() => onAttune(selected)}>Attune this pylon<Compass size={15} /></button> : <button className="game-button primary full" disabled={!canTravel} onClick={() => onTravel(selected)}>{nearby === selected ? 'You are here' : creative ? 'Survey jump' : !unlocked ? 'Discover this pylon first' : !nearby ? 'Approach an attuned pylon' : 'Travel to this biome'}{canTravel && <ArrowRight size={15} />}</button>}
          <button className={`game-button secondary full ${isWaypoint ? 'waypoint-active' : ''}`} onClick={() => onWaypoint(pylon.id)}>{isWaypoint ? 'Clear walking waypoint' : 'Set walking waypoint'}{isWaypoint ? <X size={14} /> : <MapPin size={14} />}</button>
          <p className="atlas-travel-note">{creative ? 'Creative survey travel is available from anywhere.' : nearby ? `Connected through ${PYLONS.find(point => point.id === nearby)?.name}. Expedition links are pre-attuned.` : 'Travel from a standing stone, or follow a waypoint on foot. Creative mode allows free survey travel.'}</p>
        </div>
      </aside>
    </div>
  </div>;
}