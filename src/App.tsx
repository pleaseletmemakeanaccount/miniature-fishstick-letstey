import { useCallback, useEffect, useRef, useState } from 'react';
import { MothMark, PixelLogo } from './components/Brand';
import Game from './game/Game';

/**
 * The title screen deliberately contains exactly one interactive element: START.
 * Everything else on it is static, unobtrusive, and stays out of the way.
 */
const MOTES = Array.from({ length: 24 }, (_, index) => ({
  left: `${(index * 37 + 11) % 100}%`,
  top: `${(index * 61 + 7) % 100}%`,
  animationDelay: `${(index * 1.7) % 18}s`,
  animationDuration: `${13 + index % 7 * 1.8}s`,
}));

const LOADING_DELAY = 900;

export default function App() {
  const [entering, setEntering] = useState(false);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  const start = useCallback(() => {
    if (entering || playing || timer.current !== null) return;
    setEntering(true);
    // Give the title its fade-out before the renderer claims the whole screen.
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setPlaying(true);
      setEntering(false);
    }, LOADING_DELAY);
  }, [entering, playing]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      start();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [start]);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  return (
    <main className={`ernas-app${playing ? ' is-playing' : ''}${entering ? ' is-entering' : ''}`}>
      <div className="world-backdrop" aria-hidden="true">
        <div className="world-mark" />
        <div className="world-image" />
        <div className="world-shade" />
        <div className="world-grain" />
        <div className="world-motes">{MOTES.map((mote, index) => <i key={index} style={mote} />)}</div>
      </div>

      {!playing && (
        <div className="title-screen">
          <header className="title-header">
            <div className="studio-mark"><MothMark /><span>ERNAS / INNER CYLINDER</span></div>
            <div className="build-label"><i />VERTICAL SLICE 0.7 &middot; SINGLE PLAYER &middot; LOCAL SAVE</div>
          </header>

          <div className="title-composition">
            <p className="title-eyebrow">THERE IS NO OUTSIDE</p>
            <h1 className="game-title"><PixelLogo /></h1>
            <p className="title-description">A world to shape. A world to survive.</p>
            <div className="start-group">
              <button className="start-button" onClick={start} autoFocus aria-label="Start the game">
                <i className="start-arrow" />START<i className="start-arrow right" />
              </button>
              <span className="start-hint">PRESS START, OR ENTER</span>
            </div>
          </div>

          <footer className="title-footer">
            <span className="headphone-note">BEST EXPERIENCED WITH SOUND AND A POINTER</span>
            <span className="footer-copyright">GAMEPLAY IS A REAL-TIME PROCEDURAL WORLD</span>
          </footer>
        </div>
      )}

      {entering && <div className="loading-world" role="status"><MothMark /><span>SPINNING UP THE INNER WORLD</span><div className="loading-line"><i /></div></div>}

      {playing && <Game onExit={() => { setPlaying(false); setEntering(false); }} />}
    </main>
  );
}
