import { useState } from 'react';
import { ArrowDownUp, ArrowRight, Check, ChevronRight, Circle, Compass, LockKeyhole, Search, Sparkles, Trash2 } from 'lucide-react';
import { FIELD_NOTES, ITEMS, LIMB_NAMES, LIMBS, sortedInventory, type ItemId, type Limb, type SaveData } from './model';
import { ItemIcon, SectionHeading } from './ui';

export function InventoryPanel({ save, onUse, onEquip, onDrop }: {
  save: SaveData; onUse: (id: ItemId) => void; onEquip: (id: ItemId) => void; onDrop: (id: ItemId) => void;
}) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ItemId>('pickaxe');
  const entries = sortedInventory(save.inventory, filter, search);
  const selectedId = entries.some(([id]) => id === selected) ? selected : entries[0]?.[0];
  const definition = selectedId ? ITEMS[selectedId] : null;
  return (
    <>
      <SectionHeading eyebrow="INVENTORY / EVERYTHING IN ITS PLACE" title="What you carry."><span className="sort-indicator"><ArrowDownUp size={13} />AUTO-SORTED</span></SectionHeading>
      <div className="inventory-toolbar">
        <div className="filter-tabs" aria-label="Filter inventory">{['All', 'Tools', 'Materials', 'Provisions', 'Relics'].map(category => <button key={category} onClick={() => setFilter(category)} className={filter === category ? 'active' : ''} aria-pressed={filter === category}>{category}</button>)}</div>
        <label className="inventory-search"><Search size={14} /><input placeholder="Find an item..." aria-label="Search inventory" value={search} onChange={event => setSearch(event.target.value)} /></label>
      </div>
      <div className="inventory-layout">
        <div>
          <div className="inventory-grid">
            {entries.map(([id, quantity]) => <button key={id} className={`inventory-slot ${selectedId === id ? 'selected' : ''}`} onClick={() => setSelected(id)} aria-label={`${ITEMS[id].name}, ${quantity}`} aria-pressed={selectedId === id}>
              <ItemIcon item={id} size={45} /><span className="slot-name">{ITEMS[id].name}</span><span className="slot-quantity">{quantity}</span>
            </button>)}
            {entries.length > 0 && Array.from({ length: Math.max(0, 15 - entries.length) }, (_, i) => <div className="inventory-slot empty" key={`empty-${i}`} aria-hidden="true"><i /></div>)}
          </div>
          {!entries.length && <div className="empty-inventory"><Search size={24} /><h3>Nothing here. Yet.</h3><p>{search ? 'Try a different name or clear your search.' : `You are not carrying any ${filter.toLowerCase() === 'all' ? 'items' : filter.toLowerCase()}.`}</p></div>}
          <p className="inventory-footnote">Sorted by type, stack size, then name. The world is complicated enough.</p>
        </div>
        <aside className="item-detail">
          {selectedId && definition ? <>
            <div className="item-detail-preview"><ItemIcon item={selectedId} size={85} /></div>
            <p className="eyebrow">{definition.category.toUpperCase()}</p><h3>{definition.name}</h3><p className="item-description">{definition.description}</p>
            <dl className="detail-facts"><div><dt>In your pack</dt><dd>{save.inventory[selectedId]}</dd></div>{(selectedId === 'sword' || selectedId === 'pickaxe') && <div><dt>Tool quality</dt><dd>{Math.round(save.toolQualities[selectedId] * 100)}%</dd></div>}</dl>
            {definition.use && <button className="game-button primary full" onClick={() => definition.use?.startsWith('Equip') ? onEquip(selectedId) : onUse(selectedId)}>{definition.use}<ArrowRight size={15} /></button>}
            {(!definition.use || !definition.use.startsWith('Equip')) && <button className={`game-button full ${!definition.use ? 'primary' : 'secondary'}`} onClick={() => onEquip(selectedId)}>Put in active slot<ArrowRight size={15} /></button>}
            <button className="text-button discard-button" disabled={selectedId === 'chisel'} onClick={() => onDrop(selectedId)}><Trash2 size={12} />Discard one</button>
          </> : <p className="item-description">Select something from your pack to take a closer look.</p>}
        </aside>
      </div>
    </>
  );
}

function MothAnatomy({ save, selected, onSelect }: { save: SaveData; selected: Limb; onSelect: (limb: Limb) => void }) {
  const tone = (limb: Limb) => save.body[limb] === 0 ? '#343c2e' : save.body[limb] < 35 ? '#af8770' : selected === limb ? '#e6e6c5' : '#a6b18b';
  const interactive = (limb: Limb) => ({
    onClick: () => onSelect(limb), onKeyDown: (event: React.KeyboardEvent<SVGGElement>) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(limb); } },
    role: 'button', tabIndex: 0, 'aria-label': `${LIMB_NAMES[limb]}, ${Math.round(save.body[limb])}% integrity`, className: 'anatomy-part',
  });
  return (
    <svg className="moth-anatomy" viewBox="0 0 100 120" shapeRendering="crispEdges" aria-label="Moth anatomy. Select a body part to inspect it.">
      <path d="M49 0h2v120h-2zM0 57h100v1H0z" fill="#a3b281" opacity=".09" />
      <path d="M34 8h3v4h4v5h3v4h-3v-3h-4v-5h-3zM66 8h-3v4h-4v5h-3v4h3v-3h4v-5h3z" fill="#b4bd94" />
      <g {...interactive('leftWing')} fill={tone('leftWing')}><path d="M8 25h8v5h9v6h7v7h10v27H32v-5H22v-6H15v-8H8zM15 69h10v5h16v13H29v8H19V83h-4z" /><path d="M12 33h5v6h8v6h7v8h7v4H28v-7h-7v-7h-9zM23 78h9v5h-9z" fill="#47573d" opacity=".5" /></g>
      <g {...interactive('rightWing')} fill={tone('rightWing')}><path d="M92 25h-8v5h-9v6h-7v7H58v27h10v-5h10v-6h7v-8h7zM85 69H75v5H59v13h12v8h10V83h4z" /><path d="M88 33h-5v6h-8v6h-7v8h-7v4h11v-7h7v-7h9zM77 78h-9v5h9z" fill="#47573d" opacity=".5" /></g>
      <g {...interactive('leftLeg')} fill={tone('leftLeg')}><path d="M41 80h7v25h-3v7h-8v-5h4z" /></g>
      <g {...interactive('rightLeg')} fill={tone('rightLeg')}><path d="M59 80h-7v25h3v7h8v-5h-4z" /></g>
      <g {...interactive('torso')} fill={tone('torso')}><path d="M42 42h16v36h-3v10H45V78h-3z" /><path d="M45 48h10v3H45zM45 58h10v3H45zM45 68h10v3H45z" fill="#455139" opacity=".5" /></g>
      <g {...interactive('head')} fill={tone('head')}><path d="M42 21h16v4h4v14h-4v5H42v-5h-4V25h4z" /><path d="M46 38h8v2h-8z" fill="#3b4932" /></g>
      <g {...interactive('leftEye')}><path d="M40 27h8v8h-8z" fill={save.body.leftEye === 0 ? '#1d241a' : '#394a31'} /><path d="M41 28h3v3h-3z" fill={save.body.leftEye === 0 ? '#765d4e' : '#d4dbb5'} /></g>
      <g {...interactive('rightEye')}><path d="M52 27h8v8h-8z" fill={save.body.rightEye === 0 ? '#1d241a' : '#394a31'} /><path d="M53 28h3v3h-3z" fill={save.body.rightEye === 0 ? '#765d4e' : '#d4dbb5'} /></g>
      {save.scars.includes('torso') && <path d="M50 52h4v2h-2v3h-3v-2h1z" fill="#7a6651" />}
      {save.scars.includes('leftEye') && <path d="M40 27h8v2h-2v2h-2v2h-2v2h-2z" fill="#766a51" />}
      {save.scars.includes('rightEye') && <path d="M52 27h8v2h-2v2h-2v2h-2v2h-2z" fill="#766a51" />}
      {save.scars.includes('leftWing') && <path d="M21 51h3v3h3v3h3v3h-3v-3h-3v-3h-3z" fill="#657552" />}
      {save.scars.includes('rightWing') && <path d="M79 51h-3v3h-3v3h-3v3h3v-3h3v-3h3z" fill="#657552" />}
    </svg>
  );
}

export function BodyPanel({ save, onBandage, onSleep, canSleep }: { save: SaveData; onBandage: (limb: Limb) => void; onSleep: () => void; canSleep: boolean }) {
  const [selected, setSelected] = useState<Limb>('torso');
  const health = save.body[selected];
  const wingPower = Math.round((save.body.leftWing + save.body.rightWing) / 2);
  return <>
    <SectionHeading eyebrow="MOTH PHYSIOLOGY / RUN INTEGRITY" title="A fragile, living thing."><span className={`body-status ${save.poison > 0 ? 'poisoned' : ''}`}><i />{save.poison > 0 ? `POISONED / ${Math.ceil(save.poison)}s` : 'VITAL SIGNS PRESENT'}</span></SectionHeading>
    <div className="body-layout">
      <div className="body-limb-list">{LIMBS.map(limb => <button className={`limb-row ${selected === limb ? 'active' : ''}`} key={limb} onClick={() => setSelected(limb)}><span>{LIMB_NAMES[limb]}<small>{save.body[limb] === 0 ? 'PERMANENTLY LOST' : save.body[limb] < 100 ? 'INJURED' : 'INTACT'}</small></span><div className="limb-level"><span>{Math.round(save.body[limb])}<small>%</small></span><i style={{ '--value': `${save.body[limb]}%` } as React.CSSProperties} /></div></button>)}</div>
      <div className="anatomy-wrap"><MothAnatomy save={save} selected={selected} onSelect={setSelected} /><span>SPECIMEN 001 / LEPIDOPTERA</span>{save.scars.length > 0 && <small>{save.scars.length} SCAR{save.scars.length !== 1 ? 'S' : ''} FROM ANOTHER LIFE</small>}</div>
      <aside className="body-inspection"><p className="eyebrow">STRUCTURAL NODE</p><h3>{LIMB_NAMES[selected]}</h3><div className="large-integrity">{Math.round(health)}<span>/ 100</span></div><p>{health === 0 ? 'This part of you is gone. No amount of rest can bring it back during this life.' : health < 100 ? 'The damage can still be repaired. Bind the injury or find a bed and rest.' : 'Unbroken. For now. Take care of the things that carry you.'}</p><dl className="detail-facts"><div><dt>Flight capacity</dt><dd>{wingPower}%</dd></div><div><dt>Bandages</dt><dd>{save.inventory.cloth || 0}</dd></div></dl>
        <button className="game-button primary full" disabled={health === 0 || health === 100 || !save.inventory.cloth} onClick={() => onBandage(selected)}>Bind this wound<ArrowRight size={14} /></button>
        <button className="game-button secondary full" disabled={!canSleep} onClick={onSleep}>Rest in nearby bed</button><small className="muted-note">{canSleep ? 'Rest repairs surviving limbs.' : 'Return to the mothsilk bed at the Hearth.'}</small>
      </aside>
    </div>
  </>;
}

export function JournalPanel({ save }: { save: SaveData }) {
  const [selected, setSelected] = useState('world');
  const note = FIELD_NOTES.find(entry => entry.id === selected)!;
  const goals = [
    { title: 'Leave a mark on the world', done: save.mined >= 5, detail: `${Math.min(save.mined, 5)} / 5 blocks gathered` },
    { title: 'Find the shape inside', done: save.crafted > 0, detail: 'Chisel your first tool' },
    { title: 'Say something kind', done: save.companion, detail: 'Meet the Chill Entity' },
    { title: 'Return what was thrown', done: save.bossDefeated, detail: 'Break the core of OBIL' },
  ];
  return <>
    <SectionHeading eyebrow="FIELD NOTES / A RECORD OF THE UNFAMILIAR" title="Things worth remembering." />
    <div className="journal-layout">
      <nav className="journal-index" aria-label="Field notes">{FIELD_NOTES.map(entry => <button className={selected === entry.id ? 'active' : ''} onClick={() => setSelected(entry.id)} key={entry.id}><span>{entry.number}</span><div><small>{entry.subtitle.split(' / ')[0]}</small>{entry.title}</div><ChevronRight size={14} /></button>)}</nav>
      <article className="journal-page" key={selected}><p className="eyebrow">OBSERVATION {note.number}</p><h3>{note.title}</h3><p>{note.text}</p><div className="field-hint"><Compass size={18} /><p>{note.hint}</p></div><h4>A SMALL BEGINNING</h4><ul className="field-goals">{goals.map(goal => <li key={goal.title} className={goal.done ? 'complete' : ''}>{goal.done ? <Check size={15} /> : <Circle size={13} />}<span>{goal.title}<small>{goal.detail}</small></span></li>)}</ul><div className={`sole-achievement ${save.achievement ? 'unlocked' : ''}`}><Sparkles size={18} /><div><span>AN ALBANY EXPRESSION</span><small>{save.achievement ? 'Steamed pork. An aurora. The only achievement.' : 'The only achievement. Something to do with steam.'}</small></div>{save.achievement ? <Check size={16} /> : <LockKeyhole size={14} />}</div></article>
    </div>
  </>;
}
