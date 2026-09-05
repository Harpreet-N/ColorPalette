'use client';
/* oxlint-disable next/no-img-element */

import {
  ArrowLeft, Camera, Check, Clipboard, Download, ImagePlus, Leaf,
  Library, MoreHorizontal, RefreshCw, Share2, Sparkles, Trash2,
} from 'lucide-react';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  extractPalette, imageFromFile, PaletteColor, PaletteEntry, readableInk, suggestedTitle,
} from '@/lib/palette';

type Screen = 'capture' | 'analyzing' | 'palette' | 'journal';

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
  }
}

const STORE_KEY = 'field-palette-journal-v1';
const tileShapes = [
  'tile-wide', 'tile-tall', 'tile-small', 'tile-medium', 'tile-photo-space',
  'tile-tall', 'tile-wide', 'tile-small', 'tile-medium', 'tile-wide', 'tile-small', 'tile-wide',
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
}

function category(color: PaletteColor) {
  const [r, g, b] = color.rgb;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  if (delta < 22) return 'Stone';
  if (g > r * 1.05 && g > b * .95) return 'Moss';
  if (b > r * 1.08) return 'Sky';
  if (r > g * 1.2) return 'Ember';
  return 'Earth';
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [screen, setScreen] = useState<Screen>('capture');
  const [entry, setEntry] = useState<PaletteEntry | null>(null);
  const [entries, setEntries] = useState<PaletteEntry[]>([]);
  const [selected, setSelected] = useState<PaletteColor | null>(null);
  const [toast, setToast] = useState('');
  const [saved, setSaved] = useState(false);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORE_KEY);
      if (stored) queueMicrotask(() => setEntries(JSON.parse(stored)));
    } catch { /* Keep the journal usable if storage is unavailable. */ }
  }, []);

  const persist = useCallback((next: PaletteEntry[]) => {
    setEntries(next);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); }
    catch { setToast('Journal storage is full'); }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool({
        name: 'list_saved_palettes', title: 'List saved palettes',
        description: 'List the nature palettes currently saved in the Field Palette journal.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: (input: unknown) => {
          if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Input must be an empty object.');
          return entries.map((item) => ({ id: item.id, title: item.title, date: item.createdAt, colors: item.colors.map((c) => c.hex) }));
        },
      }, { signal: lifecycle.signal });
      await context.registerTool({
        name: 'open_palette_journal', title: 'Open palette journal',
        description: 'Open the visible Field Palette journal.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input: unknown) => {
          if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Input must be an empty object.');
          setScreen('journal'); return { opened: true, count: entries.length };
        },
      }, { signal: lifecycle.signal });
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, [entries]);

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setScreen('analyzing');
    try {
      const started = Date.now();
      const { image, element } = await imageFromFile(file);
      const colors = extractPalette(element, 12);
      const next: PaletteEntry = {
        id: crypto.randomUUID(), image, colors,
        title: suggestedTitle(colors[0]), createdAt: new Date().toISOString(),
      };
      await new Promise((resolve) => window.setTimeout(resolve, Math.max(0, 850 - (Date.now() - started))));
      setEntry(next); setSelected(colors[0]); setSaved(false); setScreen('palette');
    } catch {
      setError('That image could not be read. Please try a JPG or PNG.');
      setScreen('capture');
    }
  }

  function saveEntry() {
    if (!entry || saved) return;
    persist([entry, ...entries]); setSaved(true); setToast('Kept in your journal');
  }

  function openEntry(item: PaletteEntry) {
    setEntry(item); setSelected(item.colors[0]); setSaved(true); setScreen('palette');
  }

  function removeEntry() {
    if (!entry) return;
    persist(entries.filter((item) => item.id !== entry.id));
    setEntry(null); setSaved(false); setScreen('journal'); setToast('Entry removed');
  }

  async function copyColor(color: PaletteColor) {
    try { await navigator.clipboard.writeText(color.hex); setToast(`${color.hex} copied`); }
    catch { setToast(color.hex); }
  }

  async function createPoster() {
    if (!entry) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 900; canvas.height = 1290;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#F3F1E9'; ctx.fillRect(0, 0, 900, 1290);
    ctx.fillStyle = '#14201A'; ctx.font = '54px Georgia'; ctx.fillText(entry.title, 64, 100);
    ctx.fillStyle = '#687269'; ctx.font = '20px system-ui'; ctx.fillText(formatDate(entry.createdAt).toUpperCase(), 66, 140);
    const total = entry.colors.reduce((sum, c) => sum + c.weight, 0);
    let y = 190;
    entry.colors.forEach((color, index) => {
      const remaining = 950 - (y - 190);
      const h = index === entry.colors.length - 1 ? remaining : Math.max(54, Math.round((color.weight / total) * 950));
      ctx.fillStyle = color.hex; ctx.fillRect(64, y, 772, h + 1);
      ctx.fillStyle = readableInk(color.rgb); ctx.font = '22px ui-monospace, monospace';
      ctx.fillText(color.hex, 88, y + Math.min(h - 16, 40));
      y += h;
    });
    ctx.fillStyle = '#14201A'; ctx.font = '18px system-ui'; ctx.fillText('FIELD PALETTE · COLLECTED FROM THE WORLD', 64, 1218);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  }

  async function exportPoster() {
    const blob = await createPoster(); if (!blob || !entry) return;
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `${entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-palette.png`;
    link.click(); URL.revokeObjectURL(url); setToast('Palette image downloaded');
  }

  async function sharePoster() {
    const blob = await createPoster(); if (!blob || !entry) return;
    const file = new File([blob], 'field-palette.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ title: entry.title, text: 'A palette collected with Field Palette', files: [file] }); } catch { /* Share cancelled. */ }
    } else await exportPoster();
  }

  const filtered = filter === 'All' ? entries : entries.filter((item) => category(item.colors[0]) === filter);

  return (
    <main className={`app-shell screen-${screen}`}>
      <input ref={inputRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={handleImage} aria-label="Take or choose a nature photograph" />

      {screen === 'capture' && (
        <section className="capture-surface" aria-labelledby="capture-title">
          <Header />
          <div className="capture-copy">
            <p className="eyebrow">Notice a place</p>
            <h1 id="capture-title">Keep its colours.</h1>
            <p>Photograph a landscape, leaf, sky, or quiet detail. Field Palette turns the moment into a living mosaic—all on your device.</p>
          </div>
          <div className="viewfinder" aria-hidden="true"><div className="viewfinder-glow" /><span>Ready for the wild</span></div>
          <div className="capture-actions">
            <Button className="primary-action" size="lg" onClick={() => inputRef.current?.click()}><Camera /> Take or choose a photo</Button>
            <p><ImagePlus aria-hidden="true" /> JPG, PNG, HEIC · processed locally</p>
            {error && <p className="error-message" role="alert">{error}</p>}
          </div>
        </section>
      )}

      {screen === 'analyzing' && <Analyzing />}

      {screen === 'palette' && entry && (
        <section className="palette-screen">
          <div className="palette-head">
            <button className="icon-button" type="button" onClick={() => setScreen(saved ? 'journal' : 'capture')} aria-label="Go back"><ArrowLeft /></button>
            <div><input value={entry.title} onChange={(e) => setEntry({ ...entry, title: e.target.value })} aria-label="Palette title" /><p>{formatDate(entry.createdAt)} · {entry.colors.length} colours</p></div>
            {saved ? <button className="icon-button danger" type="button" onClick={removeEntry} aria-label="Delete palette"><Trash2 /></button> : <button className="icon-button" type="button" aria-label="More options"><MoreHorizontal /></button>}
          </div>
          <Mosaic entry={entry} selected={selected} onSelect={setSelected} />
          {selected && (
            <div className="color-inspector" style={{ '--swatch': selected.hex } as React.CSSProperties}>
              <span className="inspector-swatch" />
              <div><strong>{selected.hex}</strong><small>RGB {selected.rgb.join(' · ')}</small></div>
              <button type="button" onClick={() => copyColor(selected)}><Clipboard /><span>Copy</span></button>
            </div>
          )}
          <div className="palette-actions">
            {!saved ? <Button variant="outline" onClick={() => inputRef.current?.click()}><RefreshCw /> Retake</Button> : <Button variant="outline" onClick={exportPoster}><Download /> Export</Button>}
            {!saved ? <Button onClick={saveEntry}><Leaf /> Keep in journal</Button> : <Button onClick={sharePoster}><Share2 /> Share palette</Button>}
          </div>
        </section>
      )}

      {screen === 'journal' && (
        <section className="journal-screen">
          <Header journal />
          <div className="journal-heading"><p className="eyebrow">Collected outside</p><h1>Nature journal</h1><p>{entries.length ? `${entries.length} moment${entries.length === 1 ? '' : 's'} kept on this device.` : 'Your first walk is waiting.'}</p></div>
          {entries.length > 0 && <div className="filters" aria-label="Filter journal">{['All','Moss','Sky','Earth','Ember','Stone'].map((name) => <button key={name} className={filter === name ? 'active' : ''} type="button" onClick={() => setFilter(name)}>{name}</button>)}</div>}
          {filtered.length ? <div className="journal-grid">{filtered.map((item) => <JournalCard key={item.id} entry={item} onClick={() => openEntry(item)} />)}</div> : <div className="empty-journal"><span><Leaf /></span><h2>{entries.length ? 'No colours in this family' : 'Nothing gathered yet'}</h2><p>{entries.length ? 'Try another colour family.' : 'Notice a place, then capture it.'}</p><Button onClick={() => setScreen('capture')}><Camera /> Start a palette</Button></div>}
        </section>
      )}

      {(screen === 'capture' || screen === 'journal') && <BottomNav screen={screen} setScreen={setScreen} />}
      {toast && <output className="toast-message"><Check />{toast}</output>}
    </main>
  );
}

function Header({ journal = false }: { journal?: boolean }) {
  return <header className="brand-row"><div className="wordmark"><Leaf /><span>Field Palette</span></div><span className="today-label">{journal ? new Date().toLocaleDateString('en', { day:'2-digit', month:'short' }).toUpperCase() : 'Nature colour journal'}</span></header>;
}

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (screen: Screen) => void }) {
  return <nav className="bottom-nav" aria-label="Primary navigation"><button className={screen === 'capture' ? 'active' : ''} type="button" onClick={() => setScreen('capture')}><Camera /><span>Capture</span></button><button className={screen === 'journal' ? 'active' : ''} type="button" onClick={() => setScreen('journal')}><Library /><span>Journal</span></button></nav>;
}

function Analyzing() {
  return <section className="analysis-screen" aria-live="polite"><div className="analysis-mosaic">{Array.from({ length: 15 }, (_, i) => <i key={i} />)}</div><div className="analysis-copy"><span><Sparkles /></span><p>Reading the frame</p><h1>Separating the colours</h1><div className="analysis-line"><b /></div></div></section>;
}

function Mosaic({ entry, selected, onSelect }: { entry: PaletteEntry; selected: PaletteColor | null; onSelect: (color: PaletteColor) => void }) {
  return <div className="mosaic" aria-label={`Colour mosaic for ${entry.title}`}>{entry.colors.map((color, index) => <button key={`${color.hex}-${index}`} className={`${tileShapes[index % tileShapes.length]} ${selected?.hex === color.hex ? 'selected' : ''}`} style={{ background: color.hex, animationDelay: `${index * 45}ms` }} type="button" onClick={() => onSelect(color)} aria-label={`Select ${color.hex}`} />)}<div className="source-photo"><img src={entry.image} alt="Source nature photograph" /></div></div>;
}

function JournalCard({ entry, onClick }: { entry: PaletteEntry; onClick: () => void }) {
  return <button className="journal-card" type="button" onClick={onClick}><div className="card-mosaic">{entry.colors.slice(0, 8).map((color, index) => <i key={`${color.hex}-${index}`} style={{ background: color.hex }} />)}<img src={entry.image} alt="" /></div><div className="card-copy"><div><h2>{entry.title}</h2><p>{formatDate(entry.createdAt)} · {entry.colors.length} colours</p></div><span>{category(entry.colors[0])}</span></div></button>;
}
