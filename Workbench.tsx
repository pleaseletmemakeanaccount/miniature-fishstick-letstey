import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Eye, RotateCcw, Undo2 } from 'lucide-react';
import ObjectPreview from './ObjectPreview';
import { CARVE_MATERIALS, CARVE_TOOLS, ITEMS, type CarveTool, type ItemId, type SaveData } from './model';
import { ItemIcon, SectionHeading } from './ui';

const PROFILES: Record<CarveTool, string[]> = {
  sword: ['00011000', '00011000', '00011000', '00011000', '01111110', '00011000', '00011000', '00111100'],
  pickaxe: ['00111100', '01111110', '11011011', '10011001', '00011000', '00011000', '00011000', '00011000'],
  'hand-axe': ['01110000', '11111000', '11111100', '11011000', '00011000', '00011000', '00011000', '00011000'],
  shovel: ['00111100', '00111100', '00111100', '00011000', '00011000', '00011000', '00011000', '00011000'],
  spear: ['00011000', '00111100', '00111100', '00011000', '00011000', '00011000', '00011000', '00011000'],
  dagger: ['00011000', '00011000', '00111100', '00111100', '00011000', '00111100', '00000000', '00000000'],
  'war-pick': ['10000001', '11000011', '01100110', '00111100', '00011000', '00011000', '00011000', '00011000'],
  hammer: ['01111110', '11111111', '11111111', '00011000', '00011000', '00011000', '00011000', '00111100'],
  machete: ['00000110', '00001110', '00011100', '00111000', '01110000', '11100000', '00110000', '00011000'],
  scythe: ['01111100', '11000110', '00000010', '00011000', '00011000', '00011000', '00011000', '00111000'],
  'ice-axe': ['11100000', '11110000', '00111000', '00011000', '00011000', '00011000', '00011000', '00011000'],
};
const CRAFT_TOOLS = CARVE_TOOLS.filter(t => PROFILES[t.id]);

export function Workbench({ save, onCraft }: { save: SaveData; onCraft: (tool: string, material: string, quality: number) => boolean }) {
  const [tool, setTool] = useState<CarveTool>('sword');
  const [material, setMaterial] = useState<ItemId>('stone');
  const [voxels, setVoxels] = useState<boolean[]>(() => Array(512).fill(true));
  const [history, setHistory] = useState<boolean[][]>([]);
  const [layer, setLayer] = useState(-1);
  const [guide, setGuide] = useState(true);
  const [finished, setFinished] = useState('');
  const dragging = useRef(false);
  const values = useRef(voxels);
  values.current = voxels;
  const profile = PROFILES[tool].join('');
  const quality = useMemo(() => {
    let intersection = 0, union = 0;
    for (let i = 0; i < 512; i++) {
      const target = profile[i % 64] === '1';
      if (voxels[i] && target) intersection++;
      if (voxels[i] || target) union++;
    }
    return union ? intersection / union : 0;
  }, [voxels, profile]);
  const remaining = voxels.filter(Boolean).length;
  const hasMaterials = (save.inventory[material] || 0) >= 3;

  useEffect(() => {
    const stop = () => { dragging.current = false; };
    window.addEventListener('pointerup', stop); window.addEventListener('pointercancel', stop);
    return () => { window.removeEventListener('pointerup', stop); window.removeEventListener('pointercancel', stop); };
  }, []);

  const cut = (index: number) => {
    setFinished('');
    setVoxels(current => {
      const next = [...current];
      if (layer < 0) for (let z = 0; z < 8; z++) next[z * 64 + index] = false;
      else next[layer * 64 + index] = false;
      values.current = next;
      return next;
    });
  };
  const undo = () => {
    if (!history.length) return;
    setVoxels(history[history.length - 1]); setHistory(history.slice(0, -1)); setFinished('');
  };
  const reset = () => { setHistory(current => [...current.slice(-29), [...values.current]]); setVoxels(Array(512).fill(true)); setFinished(''); };

  return <>
    <SectionHeading eyebrow="SHAPING BENCH / 1:8 SUB-VOXEL GRID" title="Find the shape inside."><span className="sort-indicator">{remaining} / 512 VOXELS</span></SectionHeading>
    <div className="workbench-layout">
      <div className="workbench-preview"><ObjectPreview kind="voxels" voxels={voxels} color={ITEMS[material].color} /><div className="material-selector"><ItemIcon item={material} size={30} /><label>RAW MATERIAL<select value={material} onChange={event => setMaterial(event.target.value as ItemId)}>{CARVE_MATERIALS.map(m => <option key={m.id} value={m.id} disabled={(save.inventory[m.id] || 0) < 3}>{m.label} ({save.inventory[m.id] || 0}) / {m.durability} dur</option>)}</select></label><span>3 BLOCKS</span></div></div>
      <div className="chisel-controls">
        <div className="chisel-profile"><span className="eyebrow">SILHOUETTE STUDY</span><div className="profile-options">{CRAFT_TOOLS.map(t => <button className={tool === t.id ? 'active' : ''} onClick={() => { setTool(t.id); setFinished(''); }} key={t.id} aria-pressed={tool === t.id}><ItemIcon item={t.id} size={25} />{t.label}</button>)}</div></div>
        <div className="chisel-grid-heading"><label className="layer-select">DEPTH<select aria-label="Chisel depth" value={layer} onChange={event => setLayer(Number(event.target.value))}><option value={-1}>Through-cut / All 8</option>{Array.from({ length: 8 }, (_, i) => <option value={i} key={i}>Layer {i + 1} of 8</option>)}</select></label><button className={`icon-text ${guide ? 'active' : ''}`} onClick={() => setGuide(!guide)} aria-pressed={guide}><Eye size={13} />GUIDE</button></div>
        <div className="chisel-grid" aria-label="Eight by eight shaping grid. Remove unwanted cells by clicking or dragging." onPointerMove={event => {
          if (!dragging.current) return;
          const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-cell]');
          if (target?.dataset.cell !== undefined) cut(Number(target.dataset.cell));
        }}>
          {Array.from({ length: 64 }, (_, index) => {
            const filled = layer < 0 ? Array.from({ length: 8 }, (_, z) => voxels[z * 64 + index]).some(Boolean) : voxels[layer * 64 + index];
            return <button key={index} data-cell={index} className={`chisel-cell ${filled ? 'filled' : 'cut'} ${guide && profile[index] === '1' ? 'profile' : ''}`} aria-label={`${filled ? 'Chisel' : 'Removed'}, row ${Math.floor(index / 8) + 1}, column ${index % 8 + 1}${profile[index] === '1' ? ', keep for profile' : ''}`} onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); dragging.current = true; setHistory(current => [...current.slice(-29), [...values.current]]); cut(index); }} onClick={event => { if (event.detail === 0) { setHistory(current => [...current.slice(-29), [...values.current]]); cut(index); } }} />;
          })}
        </div>
        <div className="chisel-actions"><span>CHISEL AWAY. LEAVE THE OUTLINED SHAPE.</span><div><button onClick={undo} disabled={!history.length} aria-label="Undo last cut" title="Undo last cut"><Undo2 size={15} /></button><button onClick={reset} disabled={remaining === 512} aria-label="Reset raw material" title="Reset raw material"><RotateCcw size={14} /></button></div></div>
        <div className="accuracy-line"><span>Profile accuracy</span><strong className={quality >= .7 ? 'ready' : ''}>{Math.round(quality * 100)}%</strong></div><div className="accuracy-meter"><i style={{ width: `${quality * 100}%` }} /></div>
        <button className="game-button primary full" disabled={quality < .7 || !hasMaterials} onClick={() => { if (onCraft(tool, material, quality)) { setFinished(`${ITEMS[tool].name} shaped at ${Math.round(quality * 100)}% quality.`); setVoxels(Array(512).fill(true)); setHistory([]); } }}>{!hasMaterials ? 'Requires 3 raw material blocks' : quality < .7 ? 'Reach 70% accuracy to finish' : `Finish ${ITEMS[tool].name.toLowerCase()}`}<ArrowRight size={15} /></button>
        <p className={`chisel-tip ${finished ? 'success' : ''}`}>{finished ? <><Check size={13} />{finished}</> : 'Cuts are free to experiment with. Materials are used only when you finish.'}</p>
      </div>
    </div>
  </>;
}

export function SleepPanel({ onWake }: { onWake: (recovery: number) => void }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const interval = setInterval(() => {
      const next = Math.min(1, (performance.now() - start) / 14000);
      setProgress(next);
      if (next === 1) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, []);
  return <div className="sleep-panel">
    <p className="eyebrow">THE WORLD CAN WAIT A MOMENT</p><h2>{progress < 1 ? 'Let your wings rest.' : 'A new dawn waits.'}</h2><p className="sleep-description">Nothing to build. Nothing to outrun. Just a stone.</p>
    <ObjectPreview kind="rock" />
    <div className="sleep-progress"><span>{progress < 1 ? 'YOUR BODY IS MENDING' : 'SURVIVING LIMBS RESTORED'}</span><span>{progress < 1 ? `${Math.ceil((1 - progress) * 14)}s` : 'REST COMPLETE'}</span><div><i style={{ width: `${progress * 100}%` }} /></div></div>
    <button className={`game-button ${progress === 1 ? 'primary' : 'secondary'}`} onClick={() => onWake(progress)}>{progress < 1 ? 'Wake early' : 'Open your eyes'}<ArrowRight size={15} /></button>
    <p className="muted-note">Lost limbs remain lost. Rest can only mend what is still yours.</p>
  </div>;
}