import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Activity, Apple, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Backpack, BookOpen, Check, ChevronLeft, ChevronRight, Compass, Droplets, Heart, Menu, MessageSquare, MousePointer2, Pickaxe, Plus, Send, Settings2, Sparkles, Swords, Thermometer, Volume2, Waypoints, Wind, X } from 'lucide-react';
import { MothMark, PixelLogo } from '../components/Brand';
import { ErnasEngine, type EngineCallbacks, type WorldSnapshot } from './core/engine';
import { BodyPanel, InventoryPanel, JournalPanel } from './panels/Panels';
import WorldAtlas from './panels/Atlas';
import { SleepPanel, Workbench } from './panels/Workbench';
import { Dialog, ItemIcon, Keycap, SectionHeading } from '../components/ui';
import { BIOME_CACHE_ITEMS, CARVE_MATERIALS, CROPS, healthyBody, ITEMS, LIMB_NAMES, LIMBS, loadSave, newSave, PYLONS, storeSave, type BlockKind, type ItemId, type Limb, type Panel, type SaveData, type Settings } from './data/model';
import { BIOMES, BIOME_IDS, BOSSES, formatDistance, type Biome } from './world/biomes';
import { CAVE_COUNT } from './world/caves';
import '../styles/game.css';

interface Notice { id: number; message: string; kind: 'normal' | 'danger' | 'achievement' }
interface ChatMessage { author: string; text: string }

const FIELD_PANELS: Panel[] = ['inventory', 'body', 'chisel', 'journal', 'pylons'];

function formatTime(elapsed: number) {
  const totalMinutes = Math.floor(elapsed % 720 / 720 * 1440);
  return `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;
}

function ControlsPanel({ onBack }: { onBack: () => void }) {
  const controls = [
    ['W A S D', 'Move around the expanded inner wall'], ['MOUSE', 'Look around. Click to capture, or drag.'], ['LEFT CLICK', 'Mine / attack / reflect a stone'], ['RIGHT CLICK', 'Place the selected material'], ['SPACE', 'Jump, use wings, or swim toward the surface'], ['SHIFT', 'Sprint / descend in creative flight'], ['CTRL', 'Dive underwater / descend in flight'], ['F / Q', 'Creative flight toggle / hold for fast cruise'], ['R', 'Interact / collect supplies / refill water'], ['1 - 6', 'Select a hotbar slot'], ['E / B', 'Inventory / body integrity'], ['C', 'Sub-voxel shaping bench'], ['M / P', 'World atlas, biomes, and pylon travel'], ['J / T', 'Field notes / local chat'], ['ESC', 'Pause / close a field panel'],
  ];
  return <>
    <button className="back-link" onClick={onBack}><ChevronLeft size={14} />BACK TO PAUSE</button>
    <SectionHeading eyebrow="A FEW THINGS TO KNOW" title="Find your footing." />
    <div className="controls-list">{controls.map(([key, description]) => <div key={key}><Keycap>{key}</Keycap><span>{description}</span></div>)}</div>
    <p className="controls-note">On a touchscreen, drag the world to look and use the on-screen movement and action controls. On desktop, arrow keys also move and turn. If your browser blocks mouse capture, click and drag to look instead.</p>
  </>;
}

function SettingsPanel({ save, onChange, onMode, onBack }: { save: SaveData; onChange: (settings: Partial<Settings>) => void; onMode: (mode: SaveData['mode']) => void; onBack: () => void }) {
  return <>
    <button className="back-link" onClick={onBack}><ChevronLeft size={14} />BACK TO PAUSE</button>
    <SectionHeading eyebrow="MAKE YOURSELF AT HOME" title="A matter of feeling." />
    <div className="settings-list">
      <div className="setting-row"><div><h3>World mode</h3><p>Survive as a fragile moth, or build without limits.</p></div><div className="segmented-control">{(['survival', 'creative'] as const).map(mode => <button key={mode} className={save.mode === mode ? 'active' : ''} onClick={() => onMode(mode)} aria-pressed={save.mode === mode}>{mode}</button>)}</div></div>
      <div className="setting-row"><div><h3>Atmosphere volume</h3><p>The quiet hum of an impossible place.</p></div><label className="slider-setting"><Volume2 size={15} /><input type="range" min="0" max="100" value={save.settings.volume} aria-label="Atmosphere volume" onChange={event => onChange({ volume: Number(event.target.value) })} /><span>{save.settings.volume}%</span></label></div>
      <div className="setting-row"><div><h3>Look sensitivity</h3><p>How quickly the world turns around you.</p></div><label className="slider-setting"><input type="range" min="1" max="100" value={save.settings.sensitivity} aria-label="Look sensitivity" onChange={event => onChange({ sensitivity: Number(event.target.value) })} /><span>{save.settings.sensitivity}%</span></label></div>
      <div className="setting-row"><div><h3>Rendering detail</h3><p>High extends detailed chunk distance and pixel density. Distant terrain remains visible in both modes.</p></div><div className="segmented-control">{(['balanced', 'high'] as const).map(quality => <button key={quality} className={save.settings.quality === quality ? 'active' : ''} onClick={() => onChange({ quality })} aria-pressed={save.settings.quality === quality}>{quality}</button>)}</div></div>
      <div className="setting-row"><div><h3>Reduce motion</h3><p>Still the clouds and remove walking camera motion.</p></div><button className={`toggle-switch ${save.settings.reducedMotion ? 'on' : ''}`} role="switch" aria-checked={save.settings.reducedMotion} aria-label="Reduce motion" onClick={() => onChange({ reducedMotion: !save.settings.reducedMotion })}><i /></button></div>
    </div><p className="muted-note settings-saved"><Check size={12} />Preferences are included in your local world save.</p>
  </>;
}

function BossPanel({ save, onSummon }: { save: SaveData; onSummon: (id: string) => void }) {
  return <>
    <SectionHeading eyebrow="CREATIVE ENCOUNTERS / CHIEF BOSS PHASES" title="Choose your disturbance."><span className="sort-indicator">{save.defeatedBosses.length} / {BOSSES.length} FELLED</span></SectionHeading>
    <p className="boss-panel-note">Creative only. Each boss manifests in front of you. Strike it with a weapon, or reflect its attacks back into it. Traveling or summoning another clears the current one.</p>
    <div className="boss-grid">
      {BOSSES.map(boss => {
        const felled = save.defeatedBosses.includes(boss.id);
        return <button key={boss.id} className="boss-card" onClick={() => onSummon(boss.id)} style={{ '--boss-accent': boss.color } as React.CSSProperties}>
          <div className="boss-card-head"><span className="boss-order" style={{ background: boss.color }}>{boss.order}</span><div><span>{boss.subtitle}</span><h3>{boss.name}</h3></div>{felled && <Check size={15} />}</div>
          <p>{boss.hint}</p>
          <span className="boss-card-cta"><Swords size={13} />{felled ? 'Summon again' : 'Summon encounter'}<ArrowRight size={13} /></span>
        </button>;
      })}
    </div>
  </>;
}

function PausePanel({ save, onResume, onPanel, onExit, onReset }: { save: SaveData; onResume: () => void; onPanel: (panel: Panel) => void; onExit: () => void; onReset: () => void }) {
  const [confirmReset, setConfirmReset] = useState(false);
  return <div className="pause-panel"><PixelLogo /><p className="eyebrow">THE WORLD IS STILL HERE.</p><h2>{confirmReset ? 'Leave this world behind?' : 'Take a breath.'}</h2>
    {confirmReset ? <><p className="reset-warning">This will erase your current world, structures, inventory, and scars from this browser. A new world will begin at the Hearth.</p><button className="game-button danger full" onClick={onReset}>Erase and begin again<ArrowRight size={15} /></button><button className="game-button secondary full" onClick={() => setConfirmReset(false)}>Keep this world</button></> : <>
      <button className="game-button primary full" onClick={onResume}>Return to the world<ArrowRight size={16} /></button>
      <button className="pause-menu-item" onClick={() => onPanel('settings')}><Settings2 size={16} /><span>Settings</span><ChevronRight size={14} /></button>
      <button className="pause-menu-item" onClick={() => onPanel('controls')}><MousePointer2 size={16} /><span>How to play</span><ChevronRight size={14} /></button>
      <button className="pause-menu-item" onClick={() => onPanel('journal')}><BookOpen size={16} /><span>Field notes</span><ChevronRight size={14} /></button>
      <button className="pause-menu-item" onClick={() => onPanel('pylons')}><Compass size={16} /><span>Explore the biomes</span><ChevronRight size={14} /></button>
      {save.mode === 'creative' && <button className="pause-menu-item" onClick={() => onPanel('bosses')}><Swords size={16} /><span>Summon an encounter</span><ChevronRight size={14} /></button>}
      <button className="pause-menu-item exit" onClick={onExit}><span>Save & return to title</span><ArrowRight size={14} /></button>
      <div className="pause-save-info"><i />{save.mode.toUpperCase()} / SAVED ON THIS DEVICE</div>
      <button className="text-button new-world-button" onClick={() => setConfirmReset(true)}>Begin a new world</button>
    </>}
  </div>;
}

export default function Game({ onExit }: { onExit: () => void }) {
  const [save, setSave] = useState<SaveData>(loadSave);
  const saveRef = useRef(save);
  const [snapshot, setSnapshot] = useState<WorldSnapshot | null>(null);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const panelRef = useRef<Panel>(null);
  const [dead, setDead] = useState(save.body.head === 0 || save.body.torso === 0);
  const deadRef = useRef(dead);
  const [deathCause, setDeathCause] = useState('The world was less forgiving than you hoped.');
  const [damageFlash, setDamageFlash] = useState(0);
  const [hotbar, setHotbar] = useState<ItemId[]>(['pickaxe', 'stone', 'wood', 'water', 'berries', 'chisel']);
  const [activeSlot, setActiveSlot] = useState(0);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [introVisible, setIntroVisible] = useState(true);
  const [discovery, setDiscovery] = useState<{ biome: Biome; id: number } | null>(null);
  const [caveFind, setCaveFind] = useState<{ name: string; id: number; count: number } | null>(null);
  const [traveling, setTraveling] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([{ author: 'WORLD', text: 'The inner wall listens. Sometimes a simple "hey" is enough.' }]);
  const [savedAt, setSavedAt] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<ErnasEngine | null>(null);
  const callbacks = useRef<EngineCallbacks | null>(null);
  const noticeId = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const chatEnd = useRef<HTMLDivElement>(null);
  const selectedItem = hotbar[activeSlot];
  panelRef.current = panel;
  deadRef.current = dead;

  const later = useCallback((action: () => void, delay: number) => {
    const timer = setTimeout(() => { timers.current.delete(timer); action(); }, delay);
    timers.current.add(timer);
    return timer;
  }, []);

  const notify = useCallback((message: string, kind: Notice['kind'] = 'normal') => {
    const id = ++noticeId.current;
    setNotices(current => [...current.slice(-2), { id, message, kind }]);
    later(() => setNotices(current => current.filter(notice => notice.id !== id)), kind === 'achievement' ? 9000 : 5000);
  }, [later]);

  const updateSave = useCallback((update: (current: SaveData) => SaveData) => {
    const next = update(saveRef.current);
    saveRef.current = next;
    setSave(next);
  }, []);

  const openPanel = useCallback((next: Panel) => {
    if (deadRef.current) return;
    panelRef.current = next;
    engine.current?.setEnabled(next === null);
    setPanel(next);
    setIntroVisible(false);
  }, []);

  const closePanel = useCallback(() => {
    panelRef.current = null;
    setPanel(null);
    if (!deadRef.current) { engine.current?.setEnabled(true); engine.current?.lock(); }
  }, []);

  const saveWorld = useCallback((silent = true) => {
    const world = engine.current?.snapshot();
    const current = { ...saveRef.current, ...world };
    const success = storeSave(current);
    if (success) {
      saveRef.current = current;
      setSave(current);
      setSavedAt(true);
      later(() => setSavedAt(false), 1800);
      if (!silent) notify('Your world is saved on this device.');
    } else notify('This browser could not store your world. Free local storage or allow site storage before leaving.', 'danger');
    return success;
  }, [later, notify]);

  const damage = useCallback((limb: Limb, amount: number, cause: string) => {
    const current = saveRef.current;
    if (current.mode === 'creative' || deadRef.current || current.body[limb] === 0) return;
    const body = { ...current.body, [limb]: Math.max(0, current.body[limb] - amount) };
    updateSave(previous => ({ ...previous, body }));
    setDamageFlash(value => value + 1);
    if (body[limb] === 0) notify(`${LIMB_NAMES[limb]} lost. The damage is permanent in this life.`, 'danger');
    if (body.head === 0 || body.torso === 0) {
      deadRef.current = true; setDead(true); setDeathCause(cause); setPanel(null); panelRef.current = null;
      engine.current?.setEnabled(false);
    }
  }, [notify, updateSave]);

  const bandage = useCallback((limb?: Limb) => {
    const current = saveRef.current;
    const target = limb || [...LIMBS].filter(id => current.body[id] > 0 && current.body[id] < 100).sort((a, b) => current.body[a] - current.body[b])[0];
    if (!current.inventory.cloth) { notify('You need mothsilk cloth to bind a wound.'); return; }
    if (!target || current.body[target] === 0 || current.body[target] >= 100) { notify('There is no repairable injury to bind.'); return; }
    updateSave(previous => ({ ...previous, body: { ...previous.body, [target]: Math.min(100, previous.body[target] + 35) }, inventory: { ...previous.inventory, cloth: (previous.inventory.cloth || 0) - 1 } }));
    notify(`${LIMB_NAMES[target]} bound. 35 integrity restored.`);
  }, [notify, updateSave]);

  const useItem = useCallback((id: ItemId) => {
    const current = saveRef.current;
    if (!current.inventory[id]) { notify(`You are not carrying any ${ITEMS[id].name.toLowerCase()}.`); return; }
    if (id === 'chisel') { openPanel('chisel'); return; }
    if (id === 'cloth') { bandage(); return; }
    const restore = ITEMS[id].restore;
    if (restore) {
      if (restore.hunger && restore.hunger > 0 && current.hunger >= 100 && !restore.poison) { notify('You are not hungry. Save it for later.'); return; }
      if (restore.thirst && restore.thirst > 0 && !restore.hunger && current.thirst >= 100) { notify('You are already fully hydrated.'); return; }
      updateSave(previous => {
        const body = { ...previous.body };
        if (restore.heal) { const target = LIMBS.filter(l => body[l] > 0 && body[l] < 100).sort((a, b) => body[a] - body[b])[0]; if (target) body[target] = Math.min(100, body[target] + restore.heal); }
        return {
          ...previous, body,
          hunger: Math.max(0, Math.min(100, previous.hunger + (restore.hunger || 0))),
          thirst: Math.max(0, Math.min(100, previous.thirst + (restore.thirst || 0))),
          poison: restore.poison ? restore.poison < 0 ? Math.max(0, previous.poison + restore.poison) : Math.min(45, previous.poison + restore.poison) : previous.poison,
          inventory: { ...previous.inventory, [id]: (previous.inventory[id] || 0) - 1 },
        };
      });
      const bad = !!restore.poison && restore.poison > 0;
      notify(bad ? `${ITEMS[id].name}. Something is wrong; you have been poisoned.` : `${ITEMS[id].name}. ${[restore.hunger && `+${restore.hunger} hunger`, restore.thirst && `${restore.thirst > 0 ? '+' : ''}${restore.thirst} thirst`, restore.poison && restore.poison < 0 && 'poison cleared'].filter(Boolean).join(', ')}.`, bad ? 'danger' : 'normal');
    }
  }, [bandage, notify, openPanel, updateSave]);

  const attune = useCallback((id: string) => {
    if (saveRef.current.unlockedPylons.includes(id)) return;
    updateSave(current => ({ ...current, unlockedPylons: [...current.unlockedPylons, id] }));
    notify(`${PYLONS.find(p => p.id === id)?.name} is now part of your pylon network.`);
  }, [notify, updateSave]);

  const interact = useCallback((interaction: string) => {
    if (interaction.startsWith('pylon:')) { attune(interaction.split(':')[1]); openPanel('pylons'); }
    else if (interaction.startsWith('cache:')) {
      const site = PYLONS.find(pylon => `cache:${pylon.id}` === interaction);
      if (!site) return;
      if (saveRef.current.claimedCaches.includes(interaction)) { notify('This cache is empty. Its supplies are already in your pack.'); return; }
      const supplies: Partial<Record<ItemId, number>> = { water: 3, berries: 4, cloth: 2, ...BIOME_CACHE_ITEMS[site.biome] };
      updateSave(current => {
        const inventory = { ...current.inventory };
        for (const [id, count] of Object.entries(supplies) as [ItemId, number][]) inventory[id] = (inventory[id] || 0) + count;
        return { ...current, inventory, claimedCaches: [...current.claimedCaches, interaction] };
      });
      notify(`${site.name} cache recovered. Water, food, cloth, and local materials added to your pack.`);
    }
    else if (interaction === 'sleep') openPanel('sleep');
    else if (interaction === 'plug' || interaction === 'socket') {
      const current = saveRef.current;
      if (current.circuitDone) { notify('The circuit is complete. The Threshold hums with a new frequency.'); return; }
      const next = Math.min(100, current.circuit + 10);
      updateSave(previous => ({ ...previous, circuit: next, circuitDone: next >= 100, unlockedPylons: next >= 100 ? [...new Set([...previous.unlockedPylons, 'threshold'])] : previous.unlockedPylons, inventory: next >= 100 ? { ...previous.inventory, 'plug-core': (previous.inventory['plug-core'] || 0) + 1, 'socket-key': (previous.inventory['socket-key'] || 0) + 1 } : previous.inventory }));
      if (next >= 100) notify('The Plug seats into the Socket. The outer circuit closes, and the Threshold answers.', 'achievement');
      else notify(`You haul the Plug toward the Socket. Circuit ${next}% complete. Keep at it.`);
    }
    else if (interaction === 'blood') {
      if ((saveRef.current.inventory.blood || 0) >= 64) { notify('Your blood containers are full.'); return; }
      updateSave(current => ({ ...current, inventory: { ...current.inventory, blood: Math.min(64, (current.inventory.blood || 0) + 3) } }));
      notify('Three measures of liquid blood collected. This is not drinking water.');
    }
    else if (interaction === 'water') {
      if ((saveRef.current.inventory.water || 0) >= 10) { notify('Your ten water flasks are already full.'); return; }
      updateSave(current => ({ ...current, inventory: { ...current.inventory, water: Math.min(10, (current.inventory.water || 0) + 3) } }));
      notify('Three flasks filled from the inner river.');
    } else if (interaction === 'steam') {
      const current = saveRef.current;
      if (!current.inventory['raw-meat'] || !current.inventory.water) { notify('Steaming needs one raw pork and one flask of water.'); return; }
      updateSave(previous => ({ ...previous, inventory: { ...previous.inventory, 'raw-meat': (previous.inventory['raw-meat'] || 0) - 1, water: (previous.inventory.water || 0) - 1, 'cooked-meat': (previous.inventory['cooked-meat'] || 0) + 1 }, achievement: true, aurora: previous.achievement ? previous.aurora : true }));
      if (!current.achievement) notify('AN ALBANY EXPRESSION. Pork is steamed. The sky will never be quite the same.', 'achievement');
      else notify('One steamed pork added to your pack.');
    }
  }, [attune, notify, openPanel, updateSave]);

  callbacks.current = {
    getSave: () => saveRef.current,
    onSnapshot: setSnapshot,
    onMine: (kind: BlockKind) => {
      updateSave(current => ({ ...current, mined: current.mined + 1, inventory: { ...current.inventory, [kind]: (current.inventory[kind] || 0) + 1 } }));
      notify(`+1 ${ITEMS[kind].name}`);
    },
    onPlace: (kind: BlockKind) => {
      const current = saveRef.current;
      if (current.mode === 'creative') return true;
      if (!current.inventory[kind]) { notify(`No ${ITEMS[kind].name.toLowerCase()} left in your pack.`); return false; }
      updateSave(previous => ({ ...previous, inventory: { ...previous.inventory, [kind]: (previous.inventory[kind] || 0) - 1 } }));
      return true;
    },
    onUse: useItem, onDamage: damage, onMessage: notify, onInteract: interact,
    onKill: (name: string) => {
      updateSave(current => ({ ...current, kills: [...current.kills, name], inventory: { ...current.inventory, stone: (current.inventory.stone || 0) + 2 } }));
      notify(`${name} falls. +2 weathered stone.`);
    },
    onCreatureKill: (_id: string, name: string, drop: string, count: number) => {
      const dropId = drop as ItemId;
      const valid = count > 0 && !!ITEMS[dropId];
      updateSave(current => ({ ...current, kills: [...current.kills, name], inventory: valid ? { ...current.inventory, [dropId]: (current.inventory[dropId] || 0) + count } : current.inventory }));
      notify(valid ? `${name} falls. +${count} ${ITEMS[dropId].name.toLowerCase()}.` : `${name} falls.`);
    },
    onBossDefeated: () => {
      updateSave(current => ({ ...current, bossDefeated: true, kills: [...current.kills, 'OBIL'], defeatedBosses: [...new Set([...current.defeatedBosses, 'obil'])], unlockedPylons: [...new Set([...current.unlockedPylons, 'fracture'])], inventory: { ...current.inventory, 'pylon-shard': (current.inventory['pylon-shard'] || 0) + 1, gold: (current.inventory.gold || 0) + 8 } }));
      notify('The first disturbance is over. Obelisk fragment and 8 native gold recovered.');
    },
    onBossKill: (id: string, reward: string) => {
      const rewardId = { obil: 'pylon-shard', warper: 'warper-flesh', scruncle: 'scruncle-hat', farbreaker: 'farbreaker-eye', moonholder: 'moonholder-tear' }[id] as ItemId | undefined;
      updateSave(current => ({ ...current, bossDefeated: current.bossDefeated || id === 'obil', kills: [...current.kills, id.toUpperCase()], defeatedBosses: [...new Set([...current.defeatedBosses, id])], inventory: { ...current.inventory, gold: (current.inventory.gold || 0) + 6, ...(rewardId ? { [rewardId]: (current.inventory[rewardId] || 0) + 1 } : {}) } }));
      notify(`${id.toUpperCase()} defeated. ${reward} and 6 native gold recovered.`, 'achievement');
    },
    onCircuit: () => undefined,
    onToolWear: (tool: string, amount: number) => {
      const current = saveRef.current;
      if (current.mode === 'creative' || !current.toolMax[tool]) return;
      const next = Math.max(0, (current.toolDurability[tool] ?? current.toolMax[tool]) - amount);
      if (next <= 0) {
        const inventory = { ...current.inventory }; inventory[tool as ItemId] = Math.max(0, (inventory[tool as ItemId] || 1) - 1);
        const { [tool]: _d, ...durability } = current.toolDurability; const { [tool]: _m, ...max } = current.toolMax; const { [tool]: _t, ...materials } = current.toolMaterials;
        updateSave(previous => ({ ...previous, inventory, toolDurability: durability, toolMax: max, toolMaterials: materials }));
        notify(`Your ${ITEMS[tool as ItemId].name.toLowerCase()} shatters from wear. Carve another at the bench.`, 'danger');
      } else updateSave(previous => ({ ...previous, toolDurability: { ...previous.toolDurability, [tool]: next } }));
    },
    onPlant: (crop: string, u: number, z: number, h: number) => {
      const current = saveRef.current, definition = CROPS[crop];
      const seed = definition?.seed;
      if (!definition || !seed) return false;
      if (current.mode !== 'creative' && !current.inventory[seed]) { notify(`No ${ITEMS[seed].name.toLowerCase()} left to plant.`); return false; }
      const id = (current.farms.reduce((m, f) => Math.max(m, f.id), 0) || 0) + 1;
      updateSave(previous => ({ ...previous, farms: [...previous.farms, { id, u, z, h, crop, planted: engine.current?.elapsed || previous.elapsed, watered: 0 }], inventory: current.mode === 'creative' ? previous.inventory : { ...previous.inventory, [seed]: (previous.inventory[seed] || 0) - 1 } }));
      notify(`${definition.name} planted. It will be ready to harvest in time.`);
      return true;
    },
    onHarvest: (id: number) => {
      const current = saveRef.current, plot = current.farms.find(f => f.id === id);
      if (!plot) return;
      const definition = CROPS[plot.crop]; if (!definition) return;
      const elapsed = engine.current?.elapsed || current.elapsed;
      if (elapsed - plot.planted < definition.growTime) { notify(`${definition.name} is not ripe yet. Give it time, or water it.`); return; }
      updateSave(previous => ({ ...previous, farms: previous.farms.filter(f => f.id !== id), inventory: { ...previous.inventory, [definition.produce]: (previous.inventory[definition.produce] || 0) + definition.produceCount, [definition.seed]: (previous.inventory[definition.seed] || 0) + 1 } }));
      notify(`Harvested ${definition.produceCount} ${ITEMS[definition.produce].name.toLowerCase()} and a seed.`);
    },
    onUnlock: () => { if (!panelRef.current && !deadRef.current) openPanel('pause'); },
    onDiscover: (biome: Biome) => {
      if (saveRef.current.visitedBiomes.includes(biome)) return;
      updateSave(current => ({ ...current, visitedBiomes: [...current.visitedBiomes, biome] }));
      const id = Date.now(); setDiscovery({ biome, id }); setIntroVisible(false);
      later(() => setDiscovery(current => current?.id === id ? null : current), 6500);
    },
    onDiscoverCave: (cave: string, name: string) => {
      if (saveRef.current.visitedCaves.includes(cave)) return;
      updateSave(current => ({ ...current, visitedCaves: [...current.visitedCaves, cave] }));
      const id = Date.now(); setCaveFind({ name, id, count: saveRef.current.visitedCaves.length + 1 }); setIntroVisible(false);
      later(() => setCaveFind(current => current?.id === id ? null : current), 6000);
    },
  };

  useEffect(() => {
    let instance: ErnasEngine | null = null;
    let active = true;
    const timer = setTimeout(() => {
      if (!host.current || !active) return;
      try {
        instance = new ErnasEngine(host.current, {
          getSave: () => saveRef.current,
          onSnapshot: value => { if (active) callbacks.current?.onSnapshot(value); },
          onMine: kind => callbacks.current?.onMine(kind),
          onPlace: kind => callbacks.current?.onPlace(kind) || false,
          onUse: id => callbacks.current?.onUse(id),
          onDamage: (limb, amount, cause) => callbacks.current?.onDamage(limb, amount, cause),
          onMessage: message => callbacks.current?.onMessage(message),
          onInteract: interaction => callbacks.current?.onInteract(interaction),
          onKill: name => callbacks.current?.onKill(name),
          onCreatureKill: (id, name, drop, count) => callbacks.current?.onCreatureKill(id, name, drop, count),
          onBossDefeated: () => callbacks.current?.onBossDefeated(),
          onBossKill: (id, reward) => callbacks.current?.onBossKill(id, reward),
          onCircuit: progress => callbacks.current?.onCircuit(progress),
          onToolWear: (tool, amount) => callbacks.current?.onToolWear(tool, amount),
          onPlant: (crop, u, z, h) => callbacks.current?.onPlant(crop, u, z, h) || false,
          onHarvest: id => callbacks.current?.onHarvest(id),
          onUnlock: () => callbacks.current?.onUnlock(),
          onDiscover: biome => callbacks.current?.onDiscover(biome),
          onDiscoverCave: (cave, name) => callbacks.current?.onDiscoverCave(cave, name),
        });
        engine.current = instance;
        instance.setEnabled(!deadRef.current && !panelRef.current);
        setReady(true);
      } catch (reason) {
        console.error('ERNAS renderer initialization:', reason);
        host.current?.querySelectorAll('canvas').forEach(canvas => {
          canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
          canvas.remove();
        });
        setError('Your browser could not initialize the 3D world. ERNAS needs WebGL 2 and hardware acceleration.');
      }
    }, 80);
    return () => { active = false; clearTimeout(timer); instance?.dispose(); if (engine.current === instance) engine.current = null; };
  }, [attempt]);

  useEffect(() => {
    if (engine.current) engine.current.selectedItem = selectedItem;
  }, [selectedItem, ready]);

  useEffect(() => {
    if (!ready) return;
    const introTimer = later(() => setIntroVisible(false), 9000);
    return () => { clearTimeout(introTimer); timers.current.delete(introTimer); };
  }, [ready, later]);

  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => { saveWorld(); }, 10000);
    const leaving = () => { if (engine.current) storeSave({ ...saveRef.current, ...engine.current.snapshot() }); };
    const visibility = () => {
      if (document.hidden) {
        if (!panelRef.current && !deadRef.current) openPanel('pause');
        leaving();
      }
    };
    window.addEventListener('beforeunload', leaving);
    document.addEventListener('visibilitychange', visibility);
    return () => { clearInterval(interval); window.removeEventListener('beforeunload', leaving); document.removeEventListener('visibilitychange', visibility); };
  }, [ready, saveWorld, openPanel]);

  useEffect(() => {
    const metabolism = setInterval(() => {
      if (!engine.current?.enabled || deadRef.current || saveRef.current.mode !== 'survival') return;
      const poison = saveRef.current.poison;
      const biome = snapshotRef.current?.biome;
      const heat = biome === 'desert' ? 2 : biome === 'blood' || biome === 'spiked' ? 1.5 : 1;
      updateSave(current => ({ ...current, hunger: Math.max(0, current.hunger - .22 - (poison > 0 ? .5 : 0)), thirst: Math.max(0, current.thirst - .36 * heat), poison: Math.max(0, current.poison - 5) }));
      if (poison > 0) damage('torso', 2, 'The sickness takes hold.');
      if (saveRef.current.hunger === 0 || saveRef.current.thirst === 0) damage('torso', 3, 'Even a moth needs food and water.');
    }, 5000);
    return () => clearInterval(metabolism);
  }, [damage, updateSave]);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (!ready || event.repeat) return;
      const editable = event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);
      if (event.code === 'Escape') {
        event.preventDefault();
        if (panelRef.current === 'sleep' || deadRef.current) return;
        if (panelRef.current) closePanel(); else openPanel('pause');
        return;
      }
      if (editable || deadRef.current || panelRef.current === 'sleep') return;
      const shortcuts: Record<string, Panel> = { KeyE: 'inventory', KeyB: 'body', KeyC: 'chisel', KeyM: 'pylons', KeyP: 'pylons', KeyJ: 'journal', KeyT: 'chat' };
      if (shortcuts[event.code]) {
        event.preventDefault();
        if (panelRef.current === shortcuts[event.code]) closePanel(); else openPanel(shortcuts[event.code]);
      } else if (!panelRef.current) {
        if (/^Digit[1-6]$/.test(event.code)) setActiveSlot(Number(event.code.slice(-1)) - 1);
        if (event.code === 'KeyR') { event.preventDefault(); engine.current?.interact(); }
      }
    };
    window.addEventListener('keydown', keyDown);
    return () => window.removeEventListener('keydown', keyDown);
  }, [closePanel, openPanel, ready]);

  useEffect(() => { if (panel === 'chat') chatEnd.current?.scrollIntoView({ block: 'nearest' }); }, [messages, panel]);
  useEffect(() => () => { timers.current.forEach(timer => clearTimeout(timer)); }, []);

  const equip = (id: ItemId) => {
    setHotbar(current => current.map((item, index) => index === activeSlot ? id : item));
    notify(`${ITEMS[id].name} equipped in slot ${activeSlot + 1}.`);
    closePanel();
  };

  const craft = (tool: string, material: string, quality: number) => {
    const carve = CARVE_MATERIALS.find(m => m.id === material) || CARVE_MATERIALS[0];
    if ((saveRef.current.inventory[material as ItemId] || 0) < 3 || quality < .7) { notify('Your shape or materials are not ready yet.'); return false; }
    const max = Math.round(carve.durability * (.6 + quality * .6));
    updateSave(current => ({
      ...current, crafted: current.crafted + 1, toolQuality: quality,
      toolQualities: { ...current.toolQualities, [tool]: quality },
      toolDurability: { ...current.toolDurability, [tool]: max },
      toolMax: { ...current.toolMax, [tool]: max },
      toolMaterials: { ...current.toolMaterials, [tool]: material },
      inventory: { ...current.inventory, [material]: (current.inventory[material as ItemId] || 0) - 3, [tool]: (current.inventory[tool as ItemId] || 0) + 1 },
    }));
    setHotbar(current => current.map((id, index) => index === activeSlot ? tool as ItemId : id));
    notify(`A ${carve.label.toLowerCase()} ${ITEMS[tool as ItemId].name.toLowerCase()} at ${Math.round(quality * 100)}% accuracy. Durability ${max}.`);
    return true;
  };

  const travel = (id: string) => {
    if (traveling) return;
    const destination = PYLONS.find(pylon => pylon.id === id);
    if (!destination || !engine.current) return;
    if (saveRef.current.mode !== 'creative' && (!snapshot?.nearPylon || !saveRef.current.unlockedPylons.includes(id) || !saveRef.current.unlockedPylons.includes(snapshot.nearPylon))) return;
    setTraveling(true);
    later(() => {
      engine.current?.teleport(destination.u, destination.z);
      closePanel(); notify(`The distance folds. ${destination.name}.`);
      later(() => setTraveling(false), 600);
    }, 450);
  };

  const wake = (recovery: number) => {
    const body = { ...saveRef.current.body };
    LIMBS.forEach(limb => { if (body[limb] > 0) body[limb] = Math.min(100, body[limb] + recovery * 100); });
    const elapsed = engine.current?.elapsed || saveRef.current.elapsed;
    const nextTime = recovery >= .99 ? (Math.floor(elapsed / 720) + 1) * 720 + 190 : elapsed + recovery * 90;
    updateSave(current => ({ ...current, body, elapsed: nextTime, hunger: Math.max(0, current.hunger - recovery * 8), thirst: Math.max(0, current.thirst - recovery * 10), poison: recovery >= .99 ? 0 : Math.max(0, current.poison - recovery * 30) }));
    engine.current?.rest(recovery, nextTime);
    closePanel(); notify(recovery >= .99 ? 'A new day. The parts of you that remain are whole again.' : 'You open your eyes before dawn. Some of the damage has mended.');
  };

  const sendChat = (event: FormEvent) => {
    event.preventDefault();
    const text = chatInput.trim(); if (!text) return;
    const command = text.toLowerCase();
    setMessages(current => [...current.slice(-49), { author: 'YOU', text }]); setChatInput('');
    let reply = '', author = 'CHILL :]';
    if (command === 'hey') {
      engine.current?.summonChill();
      updateSave(current => ({ ...current, companion: true }));
      reply = 'hey. strange place, huh? i know a few things. ask me about crafting, cheese, pylons, or steam.';
      notify('A small, square kindness has joined you.');
    } else if (command === '/help') {
      author = 'WORLD'; reply = 'Say "hey" to meet a friend. Ask about crafting, creatures, cheese, pylons, or steam. Say "nyc" to Chill to quiet the aurora.';
    } else if (saveRef.current.companion) {
      if (command === 'nyc') { updateSave(current => ({ ...current, aurora: false })); reply = 'fine. the sky can be quiet again. still a good expression, though.'; }
      else if (/craft|sword|pickaxe|chisel/.test(command)) reply = '3 stone or iron. an 8 by 8 by 8 block. cut away what is not a tool. the guide is just a suggestion, but 70% accuracy is a good start. press C.';
      else if (/cheese|frog/.test(command)) reply = 'cheese is milk that waited. frogs love it. a frog with enough ambition becomes The FORG. no, that part is not a joke. those creatures live beyond this fragment.';
      else if (/pylon|travel|map|atlas/.test(command)) reply = 'the world is much bigger now. press M. twelve expedition pylons are already talking, so you can visit every biome from a standing stone. in creative mode, survey-jump from anywhere. the Fracture still wants a hello in person.';
      else if (/biome|desert|coral|ocean|crystal|forest|cloud|storm|cave|grove/.test(command)) reply = 'twelve kinds of unfamiliar. snow and sinkholes. mountains and cloud nests. coral and the abyss. broken stone, green crystals, storms, dunes, red water, and trees big enough for cities. the atlas has coordinates, hazards, and walking waypoints. check the supply caches, too.';
      else if (/dive|swim|air|pressure/.test(command)) reply = 'Space goes up, Ctrl goes down. your air comes back at the surface. the deep ocean squeezes harder below 28 blocks. i would rather stay on a dry, square rock.';
      else if (/steam|pork|albany|aurora/.test(command)) reply = 'one raw pork. one water. stand next to the campfire at the Hearth and press R. a little steam makes an excellent meal. and a very particular expression.';
      else if (/creature|creatures|animal|beast|bestiary|species|bird|fish|monster/.test(command)) reply = 'ninety of them now, in every country and every stratum. some graze, some scatter, some hunt you by sound. the whole roster is written down in your field notes. press J, then open everything that moves.';
      else if (/obil|boss|fight/.test(command)) reply = 'it throws its own stones at you. rude. hit them back when they get close. three returns, one very quiet obelisk.';
      else if (/hello|hi|thanks|thank/.test(command)) reply = 'you are welcome here. at least, with me.';
      else reply = 'i am more of a making-things cube. ask about crafting, cheese, pylons, steam, or OBIL. sometimes it is enough just to be here.';
    } else { author = 'WORLD'; reply = 'Your words disappear into the pines. Try saying "hey".'; }
    later(() => setMessages(current => [...current.slice(-49), { author, text: reply }]), 300);
  };

  const changeSettings = (settings: Partial<Settings>) => {
    updateSave(current => ({ ...current, settings: { ...current.settings, ...settings } }));
    if (settings.volume !== undefined) engine.current?.audio.setVolume(settings.volume);
  };

  const respawn = () => {
    const scars = [...new Set([...saveRef.current.scars, ...LIMBS.filter(limb => saveRef.current.body[limb] < 80)])];
    updateSave(current => ({ ...current, body: healthyBody(), scars, hunger: 85, thirst: 85, poison: 0 }));
    engine.current?.respawn(); deadRef.current = false; setDead(false); closePanel();
    notify('Another body. The same world. Your scars remember.');
  };

  const touchKey = (code: string) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); engine.current?.input(code, true); },
    onPointerUp: () => engine.current?.input(code, false),
    onPointerCancel: () => engine.current?.input(code, false),
    onLostPointerCapture: () => engine.current?.input(code, false),
  });

  const elapsed = snapshot?.elapsed ?? save.elapsed;
  const bodyIntegrity = Math.round(LIMBS.reduce((sum, limb) => sum + save.body[limb], 0) / LIMBS.length);
  const heading = Math.round((((snapshot?.position.yaw || 0) * -180 / Math.PI) + 36000) % 360);
  const cardinal = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(heading / 45) % 8];
  const canSleep = !!snapshot?.interaction?.includes('bed');
  const currentBiome = BIOMES[snapshot?.biome || 'taiga'];

  return <div className={`game-shell ${save.settings.reducedMotion ? 'reduced-motion' : ''} ${snapshot?.submerged ? 'is-submerged' : ''} ${snapshot?.cave ? 'is-underground' : ''}`} style={{ '--current-biome': snapshot?.cave?.color || currentBiome.color } as React.CSSProperties}>
    <div className="game-canvas" ref={host} />
    <div className="game-vignette" aria-hidden="true" />
    {save.body.leftEye === 0 && <div className="eye-occlusion left" aria-label="Left eye permanently lost" />}
    {save.body.rightEye === 0 && <div className="eye-occlusion right" aria-label="Right eye permanently lost" />}
    {damageFlash > 0 && <div key={damageFlash} className="damage-flash" aria-hidden="true" />}

    {!ready && !error && <div className="loading-world" role="status"><MothMark /><span>A MUCH LARGER UNFAMILIAR</span><div className="loading-line"><i /></div><small>Charting 12 biomes. Streaming the inner wall, one piece at a time.</small></div>}
    {error && <div className="renderer-error" role="alert"><MothMark /><h2>The world could not wake.</h2><p>{error}</p><button className="game-button primary" onClick={() => { setError(''); setReady(false); setAttempt(value => value + 1); }}>Try again<ArrowRight size={15} /></button><button className="text-button" onClick={onExit}>Return to title</button></div>}

    {ready && !dead && <div className={`game-hud ${panel ? 'hud-dimmed' : ''}`}>
      <header className="hud-header">
        <div className="world-location"><MothMark /><div><span>{(snapshot?.cave?.name || currentBiome.name).toUpperCase()}</span><small>{snapshot?.cave ? `STRATUM ${snapshot.cave.stratum} / ${snapshot.depthBelow}m BELOW` : `RING 01 / ${currentBiome.shortName.toUpperCase()}`}</small></div></div>
        <div className="world-compass"><span>{['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][(Math.round(heading / 45) + 7) % 8]}</span><div><i /><strong>{cardinal}</strong><small>{heading.toString().padStart(3, '0')}</small></div><span>{['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][(Math.round(heading / 45) + 1) % 8]}</span></div>
        <div className="world-clock"><div><span>DAY {String(Math.floor(elapsed / 720) + 1).padStart(2, '0')}</span><small>{formatTime(elapsed)} / {save.mode.toUpperCase()}</small></div><button className="hud-menu" onClick={() => openPanel('pause')} aria-label="Pause game" title="Pause / Esc"><Menu size={21} /></button></div>
      </header>

      {introVisible && !panel && <div className="world-introduction"><p>THE WORLD HAS GROWN.</p><h2>Twelve kinds of unfamiliar.</h2><span>Press M to open the atlas. Every biome is a pylon away.</span></div>}
      {discovery && !panel && <div className="biome-discovery" key={discovery.id}><p>NEW FIELD RECORD / {String(save.visitedBiomes.length).padStart(2, '0')} OF {BIOME_IDS.length}</p><h2>{BIOMES[discovery.biome].name}</h2><span>{BIOMES[discovery.biome].subtitle}</span></div>}
      {caveFind && !panel && <div className="biome-discovery cave-discovery" key={caveFind.id}><p>SUBTERRANEAN RECORD / {String(caveFind.count).padStart(2, '0')} OF {CAVE_COUNT}</p><h2>{caveFind.name}</h2><span>{snapshot?.cave?.subtitle || 'DEEP BENEATH THE INNER WALL'}</span></div>}
      <div className="environment-readout">{snapshot?.cave
        ? <><span style={{ color: snapshot.cave.color }}>UNDERGROUND</span><span>{snapshot.cave.resources.toUpperCase()}</span><span>{save.visitedCaves.length} / {CAVE_COUNT} CAVES</span></>
        : <><span><Thermometer size={11} />{snapshot?.temperature ?? currentBiome.temperature} C</span><span>{currentBiome.weather.toUpperCase()}</span></>}
        {snapshot?.hazard && <strong><Activity size={11} />{snapshot.hazard}</strong>}
        {snapshot?.cave && <strong style={{ color: '#c8b58f' }}><Activity size={11} />{snapshot.cave.danger.toUpperCase()}</strong>}
      </div>
      {snapshot?.waypoint && <button className="waypoint-hud" onClick={() => openPanel('pylons')} title="Open your route in the atlas"><ArrowUp size={15} style={{ transform: `rotate(${snapshot.waypoint.bearing}rad)` }} /><span>{snapshot.waypoint.name}<small>{snapshot.waypoint.arrived ? 'YOU HAVE ARRIVED' : formatDistance(snapshot.waypoint.distance)}</small></span></button>}
      {!snapshot?.locked && !snapshot?.waypoint && !panel && <button className="capture-hint" onClick={() => engine.current?.lock()}><MousePointer2 size={13} /><span>CLICK OR DRAG TO LOOK / WASD TO MOVE</span></button>}

      <div className={`crosshair ${snapshot?.target ? 'has-target' : ''}`} aria-hidden="true"><i /><i /></div>
      {snapshot?.target && !panel && <div className="target-label">{snapshot.target}</div>}
      {snapshot?.interaction && !panel && <button className="interaction-prompt" onClick={() => engine.current?.interact()}><Keycap>R</Keycap><span>{snapshot.interaction}</span></button>}

      {snapshot?.boss && <div className="boss-hud"><span>{snapshot.boss.subtitle}</span><h2>{snapshot.boss.name}</h2><div><i style={{ width: `${snapshot.boss.health}%` }} /></div><p>{snapshot.boss.reflectReady ? 'STRIKE NOW. RETURN THE ATTACK.' : snapshot.boss.hint}</p></div>}

      <nav className="hud-tools" aria-label="World tools">
        {([{ id: 'inventory', name: 'Inventory', key: 'E', icon: Backpack }, { id: 'body', name: 'Body integrity', key: 'B', icon: Activity }, { id: 'chisel', name: 'Shaping bench', key: 'C', icon: Pickaxe }, { id: 'pylons', name: 'World atlas and biomes', key: 'M', icon: Waypoints }, { id: 'journal', name: 'Field notes', key: 'J', icon: BookOpen }, { id: 'chat', name: 'Chat with the world', key: 'T', icon: MessageSquare }] as const).map(tool => <button key={tool.id} onClick={() => openPanel(tool.id)} aria-label={`${tool.name} (${tool.key})`} title={`${tool.name} / ${tool.key}`}><tool.icon size={18} strokeWidth={1.4} /><span>{tool.key}</span></button>)}
      </nav>

      <div className="vitals">
        {[{ label: 'INTEGRITY', value: bodyIntegrity, icon: Heart, type: 'health' }, { label: 'HUNGER', value: save.hunger, icon: Apple, type: 'hunger' }, { label: 'THIRST', value: save.thirst, icon: Droplets, type: 'thirst' }].map(vital => <div className={`vital ${vital.type}`} key={vital.label}><vital.icon size={15} strokeWidth={1.6} /><div><span>{vital.label}<b>{Math.ceil(vital.value)}</b></span><div className="vital-bar"><i style={{ width: `${vital.value}%` }} /></div></div></div>)}
        {save.poison > 0 && <span className="poison-status">POISONED / {Math.ceil(save.poison)}s</span>}
      </div>

      <div className="hotbar-wrap">
        {snapshot && (snapshot.submerged || snapshot.oxygen < 99) ? <div className={`breath-meter ${snapshot.oxygen < 25 ? 'low' : ''}`}><Wind size={14} /><div><span>AIR / {Math.round(snapshot.depth)}m DEPTH</span><div><i style={{ width: `${snapshot.oxygen}%` }} /></div></div><strong>{Math.ceil(snapshot.oxygen)}%</strong></div> : snapshot && (snapshot.stamina < 98 || snapshot.flying) && <div className="wing-stamina"><MothMark /><div><i style={{ width: `${snapshot.stamina}%` }} /></div><span>{Math.round(snapshot.stamina)}%</span></div>}
        <p className="selected-item-name">{ITEMS[selectedItem].name}</p>
        <div className="hotbar" aria-label="Quick inventory">{hotbar.map((id, index) => <button key={index} className={`${index === activeSlot ? 'selected' : ''} ${!save.inventory[id] ? 'depleted' : ''}`} onClick={() => setActiveSlot(index)} onDoubleClick={() => useItem(id)} aria-label={`Slot ${index + 1}: ${ITEMS[id].name}, ${save.inventory[id] || 0}`} aria-pressed={index === activeSlot}><span className="hotbar-key">{index + 1}</span><ItemIcon item={id} size={37} /><span className="hotbar-quantity">{ITEMS[id].category !== 'Tools' ? save.inventory[id] || 0 : ''}</span></button>)}</div>
        <div className="hotbar-hint"><span>LEFT CLICK <b>MINE</b></span><i /><span>RIGHT CLICK <b>PLACE</b></span></div>
      </div>

      <div className="world-coordinates"><span>ARC {Math.round(snapshot?.position.u ?? 13)} / Z {Math.round(snapshot?.position.z ?? 22)} / H {Math.round(snapshot?.position.h ?? 4)}</span><small>{savedAt ? <><Check size={10} />WORLD SAVED</> : <><i />{snapshot?.chunks || 0} CHUNKS / {snapshot?.pendingChunks ? 'STREAMING' : 'WORLD READY'}</>}</small></div>
      <div className="touch-controls"><div className="touch-dpad"><button className="touch-up" aria-label="Move forward" {...touchKey('KeyW')}><ArrowUp size={22} /></button><button className="touch-left" aria-label="Move left" {...touchKey('KeyA')}><ArrowLeft size={22} /></button><button className="touch-down" aria-label="Move backward" {...touchKey('KeyS')}><ArrowDown size={22} /></button><button className="touch-right" aria-label="Move right" {...touchKey('KeyD')}><ArrowRight size={22} /></button></div><div className="touch-actions"><button aria-label="Mine or attack" onClick={() => engine.current?.primaryAction()}><Pickaxe size={20} /><span>MINE</span></button><button aria-label="Place block" onClick={() => engine.current?.place()}><Plus size={20} /><span>PLACE</span></button><button aria-label="Jump or fly" {...touchKey('Space')}><MothMark /><span>WINGS</span></button></div></div>
      {(snapshot?.swimming || save.mode === 'creative') && <div className="touch-extra-controls">
        {(snapshot?.swimming || snapshot?.flying) && <button aria-label={snapshot?.swimming ? 'Dive underwater' : 'Descend'} {...touchKey('ControlLeft')}><ArrowDown size={16} /><span>{snapshot?.swimming ? 'DIVE' : 'DOWN'}</span></button>}
        {save.mode === 'creative' && <button aria-label="Toggle creative flight" onClick={() => engine.current?.toggleFlight()}><MothMark /><span>FLIGHT</span></button>}
        {save.mode === 'creative' && snapshot?.flying && <button aria-label="Hold for faster flight" {...touchKey('KeyQ')}><Wind size={16} /><span>CRUISE</span></button>}
      </div>}
    </div>}

    <div className="world-notices" aria-live="polite" aria-atomic="false">{notices.map(notice => <div key={notice.id} className={`world-notice ${notice.kind}`}>{notice.kind === 'achievement' ? <Sparkles size={17} /> : notice.kind === 'danger' ? <Activity size={15} /> : <span className="notice-square" />}<p>{notice.message}</p><button onClick={() => setNotices(current => current.filter(item => item.id !== notice.id))} aria-label="Dismiss notification"><X size={12} /></button></div>)}</div>

    {panel && ready && !dead && <Dialog label={panel === 'chat' ? 'Local world chat' : `ERNAS ${panel}`} onClose={closePanel} panel={panel} onPanel={FIELD_PANELS.includes(panel) ? openPanel : undefined} noClose={panel === 'sleep'} className={`${FIELD_PANELS.includes(panel) ? 'field-dialog' : ''} ${panel}-dialog`}>
      {panel === 'inventory' && <InventoryPanel save={save} onUse={useItem} onEquip={equip} onDrop={id => { if (!saveRef.current.inventory[id] || id === 'chisel') return; updateSave(current => ({ ...current, inventory: { ...current.inventory, [id]: (current.inventory[id] || 0) - 1 } })); notify(`One ${ITEMS[id].name.toLowerCase()} discarded.`); }} />}
      {panel === 'body' && <BodyPanel save={save} onBandage={bandage} onSleep={() => openPanel('sleep')} canSleep={canSleep} />}
      {panel === 'journal' && <JournalPanel save={save} />}
      {panel === 'chisel' && <Workbench save={save} onCraft={craft} />}
      {panel === 'pylons' && <WorldAtlas save={save} snapshot={snapshot} onTravel={travel} onAttune={id => { if (snapshot?.nearPylon === id) attune(id); }} onWaypoint={id => { updateSave(current => ({ ...current, waypoint: current.waypoint === id ? null : id })); }} />}
      {panel === 'sleep' && <SleepPanel onWake={wake} />}
      {panel === 'pause' && <PausePanel save={save} onResume={closePanel} onPanel={openPanel} onExit={() => { if (saveWorld()) onExit(); }} onReset={() => { if (storeSave(newSave())) onExit(); else notify('Could not reset local storage. Your existing world is unchanged.', 'danger'); }} />}
      {panel === 'controls' && <ControlsPanel onBack={() => openPanel('pause')} />}
      {panel === 'settings' && <SettingsPanel save={save} onChange={changeSettings} onMode={mode => { updateSave(current => ({ ...current, mode, unlockedPylons: mode === 'creative' ? PYLONS.map(pylon => pylon.id) : current.unlockedPylons })); notify(mode === 'creative' ? 'Creative mode. All pylons unlocked. Press F to fly, and summon any boss from the pause menu.' : 'Survival mode. Gravity and hunger are yours again.'); }} onBack={() => openPanel('pause')} />}
      {panel === 'bosses' && <BossPanel save={save} onSummon={id => { closePanel(); engine.current?.summonBoss(id); }} />}
      {panel === 'chat' && <div className="chat-panel"><SectionHeading eyebrow="LOCAL WORLD / A VOICE IN THE PINES" title="Is anyone there?" /><div className="chat-messages" role="log" aria-live="polite">{messages.map((message, index) => <div className={`chat-message ${message.author === 'YOU' ? 'you' : message.author.startsWith('CHILL') ? 'chill' : 'world'}`} key={index}><span>{message.author}</span><p>{message.text}</p></div>)}<div ref={chatEnd} /></div><form className="chat-input" onSubmit={sendChat}><span>&gt;</span><input data-autofocus value={chatInput} onChange={event => setChatInput(event.target.value)} placeholder={save.companion ? 'Ask Chill about the unfamiliar...' : 'Try saying "hey"...'} maxLength={240} aria-label="Chat message" autoComplete="off" /><button type="submit" aria-label="Send message" disabled={!chatInput.trim()}><Send size={17} /></button></form><p className="chat-caption">A LOCAL CONVERSATION / ENTER TO SEND / ESC TO RETURN</p></div>}
    </Dialog>}

    {dead && ready && <Dialog label="You have died" onClose={() => undefined} noClose className="death-dialog"><div className="death-panel"><MothMark /><p className="eyebrow">THE END OF THIS PARTICULAR BODY</p><h2>The wall remembers.</h2><p>{deathCause}</p><span>Your next life carries the scars of this one.<br />Your world, and what you built, remain.</span><button className="game-button primary" onClick={respawn}>Wake again<ArrowRight size={16} /></button><button className="text-button" onClick={() => { if (saveWorld()) onExit(); }}>Save & return to title</button></div></Dialog>}
    {traveling && <div className="travel-transition" aria-live="polite"><MothMark /><span>FOLDING THE DISTANCE</span></div>}
    <div className="game-build-mark" aria-hidden="true">ERNAS / WORLD EXPANSION 0.2</div>
  </div>;
}