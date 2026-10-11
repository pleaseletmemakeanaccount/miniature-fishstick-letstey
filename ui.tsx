import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { MothMark } from '../components/Brand';
import { ITEMS, type ItemId, type Panel } from './model';

export function Keycap({ children }: { children: ReactNode }) {
  return <kbd>{children}</kbd>;
}

export function ItemIcon({ item, size = 42 }: { item: ItemId; size?: number }) {
  const color = ITEMS[item].color;
  if (item === 'pickaxe' || item === 'chisel' || item === 'sword') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" shapeRendering="crispEdges" className="item-pixel" aria-hidden="true">
        {item === 'pickaxe' ? <>
          <path d="M3 15h2v-2h2v-2h2V9h2v2H9v2H7v2H5v2H3z" fill="#9f865c" />
          <path d="M7 3h6v2h3v2h2v5h-2V8h-3V6H9v1H7z" fill={color} />
          <path d="M8 3h5v1h3v1h-6v1H8z" fill="#d4d4b7" />
        </> : item === 'sword' ? <>
          <path d="M4 14h2v2H4zM2 16h2v2H2zM3 13h2v2h2v2H5v-2H3z" fill="#a58f54" />
          <path d="M6 11h2V9h2V7h2V5h2V3h4v4h-2v2h-2v2h-2v2h-2v2H8v-2H6z" fill={color} />
          <path d="M7 11h2V9h2V7h2V5h2V3h2v2h-2v2h-2v2h-2v2H9v2H7z" fill="#e5e5d0" />
        </> : <>
          <path d="M3 14h2v-2h2v-2h2v2H7v2H5v2H3z" fill="#9a8059" />
          <path d="M8 8h2V6h2V4h4v2h-2v2h-2v2h-2v2H8z" fill={color} />
          <path d="M11 6h2V4h3v1h-3v2h-2z" fill="#e1e0cd" />
        </>}
      </svg>
    );
  }
  if (item === 'water' || item === 'blood') return (
    <svg width={size} height={size} viewBox="0 0 20 20" shapeRendering="crispEdges" className="item-pixel" aria-hidden="true">
      <path d="M8 2h5v2h-1v3h2v2h2v8h-2v1H6v-1H4V9h2V7h2V4H7V2z" fill="#b0bfac" />
      <path d="M6 10h8v6H6zM8 8h4v2H8z" fill={color} />
      <path d="M7 10h2v5H7z" fill="#d2e5d3" opacity=".55" />
      <path d="M8 2h5v2H8z" fill="#9a805d" />
    </svg>
  );
  if (item === 'berries') return (
    <svg width={size} height={size} viewBox="0 0 20 20" shapeRendering="crispEdges" className="item-pixel" aria-hidden="true">
      <path d="M10 3h2v5h-2zM5 4h4v2H5zM12 4h4v2h-4z" fill="#85966a" />
      <path d="M5 8h4v2h2v4H9v2H5v-2H3v-4h2zM12 7h3v2h2v4h-2v2h-3v-2h-2V9h2z" fill={color} />
      <path d="M5 9h2v2H5zM12 9h2v2h-2z" fill="#e4d2d4" />
    </svg>
  );
  if (item === 'raw-meat' || item === 'cooked-meat' || item === 'cheese') return (
    <svg width={size} height={size} viewBox="0 0 20 20" shapeRendering="crispEdges" className="item-pixel" aria-hidden="true">
      <path d="M7 4h7v2h3v7h-2v3H5v-2H3V9h2V6h2z" fill={color} />
      <path d="M7 4h7v2h3v2H7v3H5v3H3V9h2V6h2z" fill="#ecceae" opacity=".5" />
      {item === 'cheese' ? <path d="M9 7h2v2H9zM12 12h2v2h-2zM6 12h2v2H6z" fill="#9f904f" /> : <path d="M10 8h3v2h2v2h-2v2h-3v-2H8v-2h2z" fill="#dcc5a8" />}
    </svg>
  );
  if (item === 'cloth') return (
    <svg width={size} height={size} viewBox="0 0 20 20" shapeRendering="crispEdges" className="item-pixel" aria-hidden="true">
      <path d="M4 4h12v3h1v9h-3v1H4z" fill={color} /><path d="M4 4h3v10h9v2H4z" fill="#9b9f88" /><path d="M8 6h6v1H8zM8 9h6v1H8zM8 12h6v1H8z" fill="#e9e5cd" />
    </svg>
  );
  if (item === 'pylon-shard') return (
    <svg width={size} height={size} viewBox="0 0 20 20" shapeRendering="crispEdges" className="item-pixel" aria-hidden="true">
      <path d="M9 2h3v3h2v3h2v4h-2v3h-2v3H9v-3H7v-3H5V8h2V5h2z" fill={color} /><path d="M9 2h2v16H9v-3H7v-3H5V8h2V5h2z" fill="#e3e6bb" /><path d="M10 5h1v10h-1z" fill="#fffbdc" />
    </svg>
  );
  const definition = ITEMS[item];
  if (definition.seed) return (
    <svg width={size} height={size} viewBox="0 0 20 20" shapeRendering="crispEdges" className="item-pixel" aria-hidden="true">
      <path d="M9 10h2v7H9z" fill="#6f8a52" />
      <path d="M9 3h3v3h-3zM6 6h4v3H6z" fill={color} /><path d="M13 5h3v3h-3zM11 8h3v3h-3z" fill={color} />
      <path d="M8 16h4v2H8z" fill="#5a4632" />
    </svg>
  );
  if (definition.category === 'Tools') return (
    <svg width={size} height={size} viewBox="0 0 20 20" shapeRendering="crispEdges" className="item-pixel" aria-hidden="true">
      <path d="M4 13h2v-2h2V9h2v2H8v2H6v3H4z" fill="#8a7350" />
      <path d="M9 3h4v2h2v2h2v3h-3V8h-2V6h-3z" fill={color} />
      <path d="M9 3h3v1h3v1h-3v1h-3z" fill="#ffffff" opacity=".3" />
    </svg>
  );
  if (definition.category === 'Provisions') return (
    <svg width={size} height={size} viewBox="0 0 20 20" shapeRendering="crispEdges" className="item-pixel" aria-hidden="true">
      <path d="M6 6h8v2h2v6h-2v2H4v-2H2V8h2V6z" fill={color} />
      <path d="M6 6h8v2H6zM4 8h2v6H4z" fill="#ffffff" opacity=".2" />
      <path d="M8 10h4v3H8z" fill="#000000" opacity=".12" />
    </svg>
  );
  if (definition.category === 'Relics') return (
    <svg width={size} height={size} viewBox="0 0 20 20" shapeRendering="crispEdges" className="item-pixel" aria-hidden="true">
      <path d="M10 2l2 3 3 1-2 3 2 3-3 1-2 3-2-3-3-1 2-3-2-3 3-1z" fill={color} />
      <path d="M10 5l1 2 2 .5-1 2 .5 2-2.5-1-2.5 1 .5-2-1-2 2-.5z" fill="#ffffff" opacity=".3" />
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="item-pixel" aria-hidden="true">
      <path d="m12 3 9 5v10l-9 5-9-5V8z" fill={color} />
      <path d="m12 3 9 5-9 5-9-5z" fill="#ffffff" opacity=".16" />
      <path d="M12 13v10l9-5V8z" fill="#172011" opacity=".25" />
      {item === 'wood' ? <path d="m5 10 2 1v7l-2-1zm4 2 1 .5v7L9 19zm5 2 2-1v7l-2 1zm4-2 1-.5v7l-1 .5z" fill="#382e1e" opacity=".45" /> : <>
        <path d="m6 11 2 1v2l-2-1zm3 6 2 1v2l-2-1zm6-3 2-1v2l-2 1zm3 2 2-1v2l-2 1z" fill="#e3e4bc" opacity=".24" />
        <path d="m8 6 3-1 2 1-3 2zm7 2 2-1 2 1-2 1z" fill="#ffffff" opacity=".15" />
      </>}
    </svg>
  );
}

interface DialogProps {
  children: ReactNode;
  label: string;
  onClose: () => void;
  className?: string;
  panel?: Panel;
  onPanel?: (panel: Panel) => void;
  noClose?: boolean;
}

export function Dialog({ children, label, onClose, className = '', panel, onPanel, noClose = false }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const firstFocus = ref.current?.querySelector<HTMLElement>('[data-autofocus]') || ref.current?.querySelector<HTMLElement>('button:not([disabled]), input');
    (firstFocus || ref.current)?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !ref.current) return;
      const elements = Array.from(ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select, [tabindex="0"]')).filter(element => element.offsetParent !== null);
      if (!elements.length) { event.preventDefault(); return; }
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', trap);
    return () => { window.removeEventListener('keydown', trap); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [panel]);

  return (
    <div className={`dialog-backdrop ${className}`}>
      <div className="game-dialog" ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        <header className="dialog-header">
          <div className="dialog-mark"><MothMark /><span>ERNAS / FIELD INTERFACE</span></div>
          {!noClose && <button className="close-button" onClick={onClose} aria-label="Close panel"><span>ESC</span><X size={17} /></button>}
        </header>
        {onPanel && <nav className="panel-tabs" aria-label="Field interface">
          {([['inventory', 'Inventory', 'E'], ['body', 'Body', 'B'], ['chisel', 'Shaping', 'C'], ['pylons', 'World atlas', 'M'], ['journal', 'Field notes', 'J']] as [Panel, string, string][]).map(([id, name, key]) => (
            <button key={id} className={panel === id ? 'active' : ''} onClick={() => onPanel(id)} aria-current={panel === id ? 'page' : undefined}>{name}<span>{key}</span></button>
          ))}
        </nav>}
        <div className="dialog-content">{children}</div>
      </div>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{children}</div>;
}