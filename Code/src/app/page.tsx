'use client';
/* oxlint-disable next/no-img-element */

import {
  ArrowLeft, Camera, Check, Download, Film, HardDrive, Images, Leaf,
  Library, Plus, Share2, Trash2, X,
} from 'lucide-react';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { UserMenu, WelcomeGate } from '@/components/ochre/account';
import { FramePicker } from '@/components/ochre/frame-picker';
import { Mosaic } from '@/components/ochre/mosaic';
import { ColourRow, EntryCard, FamilyBar, MeasureCard, Wordmark } from '@/components/ochre/reading';
import { Sheet } from '@/components/ochre/sheet';
import {
  extractPalette, imageFromDataUrl, imageFromFile, isVideo,
  PaletteColor, PaletteEntry, readableInk, suggestedTitle,
} from '@/lib/palette';
import { useAccount } from '@/lib/account';
import { cloudConfigured } from '@/lib/supabase';
import { merge, pull, push, remove } from '@/lib/cloud';
import { FAMILIES, FAMILY_TINT, family, greeting, read } from '@/lib/reading';
import { haptic } from '@/lib/spring';

type Screen = 'welcome' | 'home' | 'frame' | 'analyzing' | 'reading' | 'journal';
type Toast = { text: string; undo?: () => void };

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
  }
}

const STORE_KEY = 'ochre-journal-v1';
const LEGACY_KEY = 'field-palette-journal-v1';
/** Remembers that the sign-in question has been answered, either way. */
const ASKED_KEY = 'ochre-asked-v1';
const MIN_COLOURS = 3;
const POOL_SIZE = 16;
const DEFAULT_COUNT = 8;

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(date));
}

/**
 * The palette is a view onto one fixed reading of the photograph: the pool is
 * every colour the image gave up, most dominant first, and `count` simply says
 * how many of them to keep.
 */
function recompose(
  base: PaletteEntry,
  change: { count?: number; extra?: PaletteColor[]; dropped?: string[] } = {},
): PaletteEntry {
  const pool = base.pool ?? base.colors;
  const dropped = change.dropped ?? base.dropped ?? [];
  const extra = change.extra ?? base.extra ?? [];
  const available = pool.filter((color) => !dropped.includes(color.hex));
  const count = Math.max(1, Math.min(change.count ?? base.count ?? available.length, available.length));
  const chosen = [...available.slice(0, count), ...extra];
  const total = chosen.reduce((sum, color) => sum + color.weight, 0);
  return {
    ...base, pool, dropped, extra, count,
    colors: chosen.map((color) => ({
      ...color,
      weight: total ? color.weight / total : 1 / chosen.length,
    })),
  };
}

function useCompact() {
  const [compact, setCompact] = useState(true);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 899px)');
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  return compact;
}

export default function Home() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const compact = useCompact();

  const [screen, setScreen] = useState<Screen>('home');
  const [entry, setEntry] = useState<PaletteEntry | null>(null);
  const [entries, setEntries] = useState<PaletteEntry[]>([]);
  const [selected, setSelected] = useState<PaletteColor | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [toastLeaving, setToastLeaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [filter, setFilter] = useState<string>('All');
  const [error, setError] = useState('');
  const [custom, setCustom] = useState('#C4873A');
  const [viewingPhoto, setViewingPhoto] = useState(false);
  const [photoOrigin, setPhotoOrigin] = useState('50% 50%');
  const [video, setVideo] = useState<File | null>(null);
  const [stored, setStored] = useState(0);
  /**
   * `/` is prerendered at build time, so any greeting baked into the HTML is
   * the build machine's hour in its own timezone -- wrong for most visitors,
   * most of the day, and a genuine hydration mismatch rather than cosmetic.
   * The first paint keeps whatever the build produced so the headline is
   * never empty, and the correct greeting is set the moment we are on the
   * client and know the real local time.
   */
  const [hello, setHello] = useState(() => greeting());
  useEffect(() => { setHello(greeting()); }, []);
  const account = useAccount();
  const [sync, setSync] = useState<'idle' | 'working' | 'error'>('idle');
  const [asked, setAsked] = useState<boolean | null>(null);
  const signedIn = account.status === 'in';

  useEffect(() => {
    try {
      // Journals kept under the old name come across once, untouched.
      const raw = localStorage.getItem(STORE_KEY) ?? localStorage.getItem(LEGACY_KEY);
      if (raw) queueMicrotask(() => setEntries(JSON.parse(raw)));
    } catch { /* Keep the journal usable if storage is unavailable. */ }
  }, []);

  useEffect(() => {
    try { setAsked(localStorage.getItem(ASKED_KEY) === 'yes'); }
    catch { setAsked(true); }
  }, []);

  const settleAsked = useCallback(() => {
    setAsked(true);
    try { localStorage.setItem(ASKED_KEY, 'yes'); } catch { /* nothing to remember with */ }
  }, []);

  /**
   * The sign-in question is asked once, on first arrival, as its own screen --
   * and never again, whichever way it was answered. Signing in later is always
   * possible from the corner control, so skipping is not a one-way door.
   */
  useEffect(() => {
    if (asked !== false || !cloudConfigured) return;
    if (account.status === 'loading' || account.status === 'unavailable') return;
    if (account.status === 'in') { settleAsked(); return; }
    setScreen((current) => (current === 'home' ? 'welcome' : current));
  }, [asked, account.status, settleAsked]);

  // :active feedback needs a touch listener to fire on iOS.
  useEffect(() => {
    const noop = () => undefined;
    document.body.addEventListener('touchstart', noop, { passive: true });
    return () => document.body.removeEventListener('touchstart', noop);
  }, []);

  const persist = useCallback((next: PaletteEntry[]) => {
    setEntries(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
      localStorage.removeItem(LEGACY_KEY);
    } catch { setToast({ text: 'Journal storage is full' }); }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY) ?? '';
      setStored(new Blob([raw]).size);
    } catch { setStored(0); }
  }, [entries]);

  /**
   * Signing in is a merge, not a takeover: whatever is already on this device
   * joins whatever the account holds, and anything the account has not seen
   * yet is uploaded. Readings made before signing in therefore survive, which
   * is the whole point of letting people work signed out.
   */
  const syncedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!signedIn || !account.user) { syncedFor.current = null; return; }
    const uid = account.user.id;
    if (syncedFor.current === uid) return;
    syncedFor.current = uid;

    let alive = true;
    void (async () => {
      setSync('working');
      try {
        const remote = await pull();
        let local: PaletteEntry[] = [];
        try { local = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]'); } catch { /* start clean */ }

        const merged = merge(local, remote);
        const known = new Set(remote.map((item) => item.id));
        const settled: PaletteEntry[] = [];
        for (const item of merged) {
          if (known.has(item.id) && item.imagePath) { settled.push(item); continue; }
          try { settled.push(await push(item, uid)); }
          catch { settled.push(item); }
        }
        if (!alive) return;
        persist(settled);
        setSync('idle');
      } catch {
        if (alive) setSync('error');
      }
    })();
    return () => { alive = false; };
  }, [signedIn, account.user, persist]);

  /** Back one reading up, leaving the local copy authoritative either way. */
  const backUp = useCallback(async (item: PaletteEntry) => {
    if (!signedIn || !account.user) return;
    setSync('working');
    try {
      const saved = await push(item, account.user.id);
      setEntries((current) => {
        const next = current.map((one) =>
          (one.id === saved.id ? { ...one, imagePath: saved.imagePath } : one));
        try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch { /* full */ }
        return next;
      });
      setSync('idle');
    } catch { setSync('error'); }
  }, [signedIn, account.user]);

  const dropRemote = useCallback(async (item: PaletteEntry) => {
    if (!signedIn) return;
    try { await remove(item); } catch { setSync('error'); }
  }, [signedIn]);

  useEffect(() => {
    if (!toast) return;
    setToastLeaving(false);
    const life = toast.undo ? 5200 : 2400;
    const leave = window.setTimeout(() => setToastLeaving(true), life);
    const clear = window.setTimeout(() => setToast(null), life + 220);
    return () => { window.clearTimeout(leave); window.clearTimeout(clear); };
  }, [toast]);

  useEffect(() => {
    if (!viewingPhoto) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setViewingPhoto(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [viewingPhoto]);

  // With a keyboard in reach, the reading is fully operable without a pointer.
  useEffect(() => {
    if (screen !== 'reading' || !entry || !selected || viewingPhoto) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const index = entry.colors.findIndex((color) => color.hex === selected.hex);
      const step = (by: number) => {
        event.preventDefault();
        setSelected(entry.colors[(index + by + entry.colors.length) % entry.colors.length]);
        haptic(4);
      };
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') step(1);
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') step(-1);
      else if (event.key === 'c' || event.key === 'C') void copyColor(selected);
      else if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); removeSelected(); }
      else if (event.key === 'Escape') setScreen(saved ? 'journal' : 'home');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool({
        name: 'list_saved_readings', title: 'List saved readings',
        description: 'List the colour readings currently saved in the Ochre journal.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: (input: unknown) => {
          if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Input must be an empty object.');
          return entries.map((item) => ({ id: item.id, title: item.title, date: item.createdAt, colors: item.colors.map((color) => color.hex) }));
        },
      }, { signal: lifecycle.signal });
      await context.registerTool({
        name: 'open_journal', title: 'Open the journal',
        description: 'Open the visible Ochre journal.',
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

  async function readImage(source: () => Promise<{ image: string; element: HTMLImageElement }>, frame?: number) {
    setError('');
    setScreen('analyzing');
    try {
      const started = Date.now();
      const { image, element } = await source();
      const pool = extractPalette(element, POOL_SIZE);
      const next = recompose(
        {
          id: crypto.randomUUID(), image, pool, colors: pool, frame,
          title: suggestedTitle(pool[0]), createdAt: new Date().toISOString(),
        },
        { count: Math.min(DEFAULT_COUNT, pool.length), extra: [], dropped: [] },
      );
      // Just long enough not to flash — latency on the input path is not decoration.
      await new Promise((resolve) => window.setTimeout(resolve, Math.max(0, 320 - (Date.now() - started))));
      setVideo(null);
      setEntry(next); setSelected(next.colors[0]); setSaved(false); setScreen('reading');
      haptic([6, 40, 10]);
    } catch {
      setError('That file could not be read. Try a JPG, PNG, HEIC, MP4 or MOV.');
      setScreen('home');
    }
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    // A video is just a great many candidate frames — pick one first.
    if (isVideo(file)) { setVideo(file); setScreen('frame'); return; }
    void readImage(() => imageFromFile(file));
  }

  function updateEntry(next: PaletteEntry) {
    const touched = { ...next, updatedAt: new Date().toISOString() };
    setEntry(touched);
    if (saved) {
      persist(entries.map((item) => (item.id === touched.id ? touched : item)));
      void backUp(touched);
    }
  }

  function showCount(next: number, commit = false) {
    if (!entry) return;
    const recomposed = recompose(entry, { count: next });
    setEntry(recomposed);
    if (commit && saved) {
      const touched = { ...recomposed, updatedAt: new Date().toISOString() };
      persist(entries.map((item) => (item.id === touched.id ? touched : item)));
      void backUp(touched);
    }
    if (!recomposed.colors.some((color) => color.hex === selected?.hex)) {
      setSelected(recomposed.colors[recomposed.colors.length - 1]);
    }
  }

  function saveEntry() {
    if (!entry || saved) return;
    const kept = { ...entry, updatedAt: new Date().toISOString() };
    persist([kept, ...entries]);
    setEntry(kept);
    setSaved(true);
    haptic(10);
    setScreen('journal');
    void backUp(kept);
    setToast({
      text: signedIn
        ? `${kept.title} kept in your journal`
        : `${kept.title} kept on this device`,
    });
  }

  function openEntry(item: PaletteEntry) {
    setEntry(item); setSelected(item.colors[0]); setSaved(true); setScreen('reading');
  }

  function eraseEverything() {
    const previous = entries;
    if (!previous.length) return;
    persist([]);
    haptic([10, 40, 10]);
    setEntry(null); setSaved(false);
    for (const item of previous) void dropRemote(item);
    setToast({
      text: signedIn
        ? `${previous.length} reading${previous.length === 1 ? '' : 's'} erased from this device and your account`
        : `${previous.length} reading${previous.length === 1 ? '' : 's'} erased from this device`,
      undo: () => {
        persist(previous);
        for (const item of previous) void backUp(item);
      },
    });
  }

  function forget(item: PaletteEntry, thenGoToJournal = false) {
    const previous = entries;
    persist(entries.filter((kept) => kept.id !== item.id));
    haptic(10);
    if (thenGoToJournal) { setEntry(null); setSaved(false); setScreen('journal'); }
    void dropRemote(item);
    setToast({
      text: `${item.title} removed`,
      // Undo has to put it back in the account too, not just on the device.
      undo: () => { persist(previous); void backUp(item); },
    });
  }

  function removeSelected() {
    if (!entry || !selected) return;
    if (entry.colors.length <= MIN_COLOURS) {
      setToast({ text: `A reading keeps at least ${MIN_COLOURS} colours` });
      return;
    }
    const index = entry.colors.findIndex((color) => color.hex === selected.hex);
    const extra = entry.extra ?? [];
    const mine = extra.some((color) => color.hex === selected.hex);
    const next = mine
      ? recompose(entry, { extra: extra.filter((color) => color.hex !== selected.hex) })
      : recompose(entry, {
          dropped: [...(entry.dropped ?? []), selected.hex],
          count: (entry.count ?? entry.colors.length) - 1,
        });
    updateEntry(next);
    setSelected(next.colors[Math.min(Math.max(index, 0), next.colors.length - 1)]);
    haptic(8);
    setToast({ text: `${selected.hex} removed` });
  }

  function addCustom() {
    if (!entry) return;
    const value = custom.trim().toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(value)) { setToast({ text: 'Enter a six-digit HEX colour' }); return; }
    if (entry.colors.length >= POOL_SIZE) { setToast({ text: `A reading holds up to ${POOL_SIZE} colours` }); return; }
    if (entry.colors.some((color) => color.hex === value)) { setToast({ text: `${value} is already here` }); return; }
    const rgb = [1, 3, 5].map((index) => parseInt(value.slice(index, index + 2), 16)) as [number, number, number];
    const smallest = Math.min(...entry.colors.map((color) => color.weight));
    const next = recompose(entry, {
      extra: [...(entry.extra ?? []), { hex: value, rgb, weight: Math.max(0.03, smallest * 0.8) }],
    });
    updateEntry(next);
    setSelected(next.colors[next.colors.length - 1]);
    haptic(8);
    setToast({ text: `${value} added` });
  }

  async function copyColor(color: PaletteColor) {
    try { await navigator.clipboard.writeText(color.hex); haptic(8); setToast({ text: `${color.hex} copied` }); }
    catch { setToast({ text: color.hex }); }
  }

  async function createPoster() {
    if (!entry) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 900; canvas.height = 1290;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#F6F2E8'; ctx.fillRect(0, 0, 900, 1290);
    ctx.fillStyle = '#17251D'; ctx.font = '54px Georgia'; ctx.fillText(entry.title, 64, 100);
    ctx.fillStyle = '#7D857B'; ctx.font = '20px system-ui'; ctx.fillText(formatDate(entry.createdAt).toUpperCase(), 66, 140);
    const top = 190, band = 950, minimum = 46;
    const total = entry.colors.reduce((sum, color) => sum + color.weight, 0);
    const flexible = Math.max(0, band - minimum * entry.colors.length);
    const heights = entry.colors.map((color) => minimum + Math.floor((color.weight / total) * flexible));
    let spare = band - heights.reduce((sum, height) => sum + height, 0);
    for (let index = 0; spare > 0; index = (index + 1) % heights.length) { heights[index] += 1; spare -= 1; }
    let y = top;
    entry.colors.forEach((color, index) => {
      const height = heights[index];
      ctx.fillStyle = color.hex; ctx.fillRect(64, y, 772, height + 1);
      ctx.fillStyle = readableInk(color.rgb); ctx.font = '22px ui-monospace, monospace';
      ctx.fillText(color.hex, 88, y + Math.min(height - 14, 34));
      y += height;
    });
    ctx.fillStyle = '#17251D'; ctx.font = '18px system-ui';
    ctx.fillText('OCHRE · COLOUR, TAKEN FROM THE GROUND', 64, 1218);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  }

  async function exportPoster() {
    const blob = await createPoster();
    if (!blob || !entry) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-ochre.png`;
    link.click();
    URL.revokeObjectURL(url);
    setToast({ text: 'Reading downloaded as an image' });
  }

  async function sharePoster() {
    const blob = await createPoster();
    if (!blob || !entry) return;
    const file = new File([blob], 'ochre.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ title: entry.title, text: 'A colour reading taken with Ochre', files: [file] }); }
      catch { /* Share cancelled. */ }
    } else await exportPoster();
  }

  const visible = filter === 'All' ? entries : entries.filter((item) => family(item.colors[0]) === filter);
  const pool = entry?.pool ?? entry?.colors ?? [];
  const available = pool.filter((color) => !(entry?.dropped ?? []).includes(color.hex));
  const maxCount = Math.max(1, available.length);
  const minCount = Math.min(MIN_COLOURS, maxCount);
  const shownCount = Math.min(entry?.count ?? entry?.colors.length ?? 0, maxCount);
  const selectedIndex = entry && selected ? entry.colors.findIndex((color) => color.hex === selected.hex) : 0;
  const latest = entries[0];

  const corner = (
    <UserMenu
      user={account.user}
      label={account.label}
      signedIn={signedIn}
      onJournal={() => setScreen('journal')}
      onSignIn={() => setScreen('welcome')}
      onSignOut={() => {
        void account.signOut();
        setToast({ text: 'Signed out — this journal stays on this device' });
      }}
    />
  );

  const pickers = (
    <div className="pickers">
      <button type="button" className="action action-primary" onClick={() => cameraRef.current?.click()}>
        <Camera aria-hidden="true" /> Take a photograph
      </button>
      <button type="button" className="action action-quiet" onClick={() => libraryRef.current?.click()}>
        <Images aria-hidden="true" /> Photo or video
      </button>
    </div>
  );

  return (
    <main className={`app-shell screen-${screen}`}>
      <input ref={cameraRef} className="sr-only" type="file" accept="image/*" capture="environment"
        onChange={handleFile} aria-label="Take a photograph" />
      <input ref={libraryRef} className="sr-only" type="file" accept="image/*,video/*"
        onChange={handleFile} aria-label="Choose a photograph or video from your library" />

      {screen === 'welcome' && (
        <WelcomeGate
          busy={account.status === 'loading'}
          onGoogle={() => { settleAsked(); void account.signIn(); }}
          onSkip={() => { settleAsked(); setScreen('home'); }}
        />
      )}

      {screen === 'home' && (
        <section className="home">
          <Wordmark line="colour, taken from the ground" action={cloudConfigured ? corner : null} />
          <h1 className="hello" suppressHydrationWarning>{hello}.</h1>

          {pickers}
          {error
            ? <p className="note note-error" role="alert">{error}</p>
            : <p className="note">
                {signedIn
                  ? 'Read on this device · kept in your account'
                  : 'Read on this device · nothing is uploaded'}
              </p>}

          {latest ? (
            <>
              <section className="block">
                <h2 className="block-title">Latest reading</h2>
                <ul className="entries">
                  <EntryCard entry={latest} featured onOpen={() => openEntry(latest)} />
                </ul>
              </section>

              <section className="block">
                <div className="block-head">
                  <h2 className="block-title">Where your colour comes from</h2>
                  <span className="block-count numeric">{entries.length}</span>
                </div>
                <div className="panel-card">
                  <FamilyBar entries={entries} />
                </div>
              </section>

              {entries.length > 1 && (
                <section className="block">
                  <div className="block-head">
                    <h2 className="block-title">Earlier</h2>
                    <button type="button" className="linky" onClick={() => setScreen('journal')}>
                      All {entries.length}
                    </button>
                  </div>
                  <ul className="entries">
                    {entries.slice(1, 4).map((item) => (
                      <EntryCard key={item.id} entry={item} onOpen={() => openEntry(item)} />
                    ))}
                  </ul>
                </section>
              )}
            </>
          ) : (
            <div className="invite">
              <span className="invite-art" aria-hidden="true">
                <i style={{ background: FAMILY_TINT.Sky }} />
                <i style={{ background: FAMILY_TINT.Moss }} />
                <i style={{ background: FAMILY_TINT.Earth }} />
                <i style={{ background: FAMILY_TINT.Ember }} />
                <i style={{ background: FAMILY_TINT.Stone }} />
              </span>
              <h2>Ochre came out of the ground long before it came out of a tube.</h2>
              <p>Photograph a place — a hillside, a leaf, a sky, or a frame from a video — and keep the colour it was made of.</p>
            </div>
          )}
        </section>
      )}

      {screen === 'frame' && video && (
        <FramePicker
          file={video}
          onCancel={() => { setVideo(null); setScreen('home'); }}
          onUse={(image, at) => void readImage(() => imageFromDataUrl(image), at)}
        />
      )}

      {screen === 'analyzing' && (
        <section className="analysis" aria-live="polite">
          <div className="analysis-field" aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => <i key={index} style={{ animationDelay: `${index * 55}ms` }} />)}
          </div>
          <div className="analysis-copy">
            <p className="eyebrow">Reading the frame</p>
            <h1>Separating the colours</h1>
            <div className="analysis-line"><b /></div>
          </div>
        </section>
      )}

      {screen === 'reading' && entry && selected && (
        <section className="reading">
          <header className="reading-bar">
            <button type="button" className="glyph" onClick={() => setScreen(saved ? 'journal' : 'home')} aria-label="Go back">
              <ArrowLeft aria-hidden="true" />
            </button>
            <div className="reading-heading">
              <button type="button" className="thumb" onClick={(event) => {
                  const box = event.currentTarget.getBoundingClientRect();
                  setPhotoOrigin(
                    `${((box.left + box.width / 2) / window.innerWidth) * 100}% ` +
                    `${((box.top + box.height / 2) / window.innerHeight) * 100}%`,
                  );
                  setViewingPhoto(true);
                }}
                aria-label={entry.frame === undefined
                  ? 'View the original photograph'
                  : 'View the frame this reading came from'}>
                <img src={entry.image} alt="" />
                {entry.frame !== undefined && (
                  <span className="thumb-badge" aria-hidden="true"><Film /></span>
                )}
              </button>
              <div className="reading-title">
                <input value={entry.title} onChange={(event) => updateEntry({ ...entry, title: event.target.value })}
                  aria-label="Reading title" spellCheck={false} />
                <p className="meta numeric">
                  {formatDate(entry.createdAt)} · {entry.colors.length} colours
                </p>
              </div>
            </div>
            <button type="button" className="glyph" onClick={() => libraryRef.current?.click()} aria-label="Start a new reading">
              <Camera aria-hidden="true" />
            </button>
          </header>

          <div className="reading-canvas">
            <Mosaic key={entry.id} colors={entry.colors}
              title={entry.title} selected={selected.hex} onSelect={setSelected}
              onRemove={removeSelected} canRemove={entry.colors.length > MIN_COLOURS} />
          </div>

          <Sheet
            interactive={compact}
            label="Reading details"
            peek={
              <>
              <MeasureCard color={selected} index={Math.max(selectedIndex, 0)}
                onCopy={() => copyColor(selected)} onRemove={removeSelected}
                canRemove={entry.colors.length > MIN_COLOURS} />
              <p className="keys" aria-hidden="true">
                <kbd>←</kbd><kbd>→</kbd> colour · <kbd>C</kbd> copy · <kbd>⌫</kbd> remove · <kbd>Esc</kbd> back
              </p>
              </>
            }
          >
            <section className="block">
              <div className="block-head">
                <h2 className="block-title">Every colour</h2>
                <span className="block-count numeric">{entry.colors.length}</span>
              </div>
              <ul className="rows">
                {entry.colors.map((color, index) => (
                  <ColourRow key={color.hex} color={color} index={index}
                    selected={color.hex === selected.hex} onSelect={() => setSelected(color)} />
                ))}
              </ul>
            </section>

            <section className="block">
              <div className="block-head">
                <h2 className="block-title">How many colours</h2>
                <span className="block-count numeric">{shownCount}</span>
              </div>
              <input
                className="dial"
                type="range"
                min={minCount}
                max={maxCount}
                step={1}
                value={shownCount}
                style={{
                  '--fill': `${maxCount > minCount ? ((shownCount - minCount) / (maxCount - minCount)) * 100 : 100}%`,
                } as React.CSSProperties}
                onChange={(event) => showCount(Number(event.target.value))}
                onPointerUp={(event) => showCount(Number((event.target as HTMLInputElement).value), true)}
                onKeyUp={(event) => showCount(Number((event.target as HTMLInputElement).value), true)}
                aria-label="How many of the photograph's dominant colours to keep"
                aria-valuetext={`${shownCount} of ${maxCount} colours`}
              />
              <p className="hint">
                Keeping the <span className="numeric">{shownCount}</span> colours that fill most of
                the frame, out of <span className="numeric">{maxCount}</span> this photograph gave up
              </p>
            </section>

            <section className="block">
              <h2 className="block-title">Add a colour of your own</h2>
              <div className="mixer">
                <label className="well" style={{ background: custom }} aria-label="Pick a colour">
                  <input type="color" value={custom} onChange={(event) => setCustom(event.target.value.toUpperCase())} />
                  <span aria-hidden="true" />
                </label>
                <input className="hex numeric" value={custom} maxLength={7} spellCheck={false}
                  onChange={(event) => setCustom(event.target.value.toUpperCase())} aria-label="Custom HEX colour" />
                <button type="button" className="action action-quiet action-add" onClick={addCustom}>
                  <Plus aria-hidden="true" /> Add
                </button>
              </div>
            </section>

            <section className="block block-last">
              <h2 className="block-title">Keep and share</h2>
              <div className="stack">
                <button type="button" className="action action-quiet" onClick={exportPoster}>
                  <Download aria-hidden="true" /> Export as an image
                </button>
                {saved && (
                  <button type="button" className="action action-quiet" onClick={sharePoster}>
                    <Share2 aria-hidden="true" /> Share this reading
                  </button>
                )}
                {saved ? (
                  <button type="button" className="action action-danger" onClick={() => forget(entry, true)}>
                    <Trash2 aria-hidden="true" /> Remove from journal
                  </button>
                ) : (
                  <button type="button" className="action action-primary" onClick={saveEntry}>
                    <Leaf aria-hidden="true" /> Keep in journal
                  </button>
                )}
              </div>
            </section>
          </Sheet>

          {viewingPhoto && (
            <div className="viewer" role="dialog" aria-modal="true" aria-label="The original photograph"
              onClick={() => setViewingPhoto(false)}>
              <img src={entry.image} alt={`The photograph behind ${entry.title}`}
                style={{ transformOrigin: photoOrigin }} />
              <button type="button" className="glyph viewer-close" aria-label="Close the photograph">
                <X aria-hidden="true" />
              </button>
            </div>
          )}
        </section>
      )}

      {screen === 'journal' && (
        <section className="journal">
          <Wordmark action={cloudConfigured ? corner : null} />
          <h1 className="hello">Journal</h1>
          <p className="note note-left">
            {entries.length
              ? `${entries.length} place${entries.length === 1 ? '' : 's'} kept ${signedIn ? 'in your account' : 'on this device'}`
              : 'Nothing kept yet'}
          </p>

          {pickers}

          {entries.length > 0 && (
            <div className="chips" role="group" aria-label="Filter by colour family">
              {['All', ...FAMILIES].map((name) => (
                <button key={name} type="button" className={filter === name ? 'chip is-on' : 'chip'}
                  aria-pressed={filter === name} onClick={() => setFilter(name)}>{name}</button>
              ))}
            </div>
          )}

          {visible.length ? (
            <ul className="entries">
              {visible.map((item) => (
                <EntryCard key={item.id} entry={item}
                  onOpen={() => openEntry(item)} onForget={() => forget(item)} />
              ))}
            </ul>
          ) : (
            <div className="invite invite-small">
              <h2>{entries.length ? 'Nothing in this family' : 'Your first walk is waiting'}</h2>
              <p>{entries.length ? 'Try another colour family.' : 'Photograph a place and keep its colour.'}</p>
            </div>
          )}

          {entries.length > 0 && (
            <section className="vault" aria-labelledby="vault-title">
              <div className="vault-read">
                <span className="vault-glyph" aria-hidden="true"><HardDrive /></span>
                <div>
                  <h2 id="vault-title">On this device only</h2>
                  <p className="numeric">
                    {entries.length} reading{entries.length === 1 ? '' : 's'} ·{' '}
                    {stored < 1024 * 1024
                      ? `${Math.max(1, Math.round(stored / 1024))} KB`
                      : `${(stored / 1024 / 1024).toFixed(1)} MB`} in this browser
                  </p>
                </div>
              </div>
              <p className="vault-note">
                Ochre keeps no copy. Nothing is uploaded, and no one else can reach this —
                which also means erasing it here cannot be undone later.
              </p>
              <button type="button" className="action action-danger" onClick={eraseEverything}>
                <Trash2 aria-hidden="true" /> Erase everything
              </button>
            </section>
          )}
        </section>
      )}

      {(screen === 'home' || screen === 'journal') && (
        <nav className="tabbar" aria-label="Primary">
          <button type="button" className={screen === 'home' ? 'is-on' : ''} aria-current={screen === 'home'}
            onClick={() => setScreen('home')}>
            <Camera aria-hidden="true" /><span>Read</span>
          </button>
          <button type="button" className={screen === 'journal' ? 'is-on' : ''} aria-current={screen === 'journal'}
            onClick={() => setScreen('journal')}>
            <Library aria-hidden="true" /><span>Journal</span>
          </button>
        </nav>
      )}

      {toast && (
        <output className={toastLeaving ? 'toast is-leaving' : 'toast'}>
          <Check aria-hidden="true" />
          <span>{toast.text}</span>
          {toast.undo && (
            <button type="button" className="toast-undo" onClick={() => { toast.undo?.(); setToast(null); }}>
              Undo
            </button>
          )}
        </output>
      )}
    </main>
  );
}
