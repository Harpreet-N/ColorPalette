'use client';
/* oxlint-disable next/no-img-element */

import { Copy, Trash2 } from 'lucide-react';
import type { PaletteColor, PaletteEntry } from '@/lib/palette';
import { describe, distribution, family, FAMILY_TINT, rank, read } from '@/lib/reading';

export function Wordmark({ line }: { line?: string }) {
  return (
    <header className="wordmark">
      <span className="wordmark-name">ochre</span>
      {line && <span className="wordmark-line">{line}</span>}
    </header>
  );
}

/** The headline measurement: one colour, read out loud. */
export function MeasureCard({ color, index, onCopy, onRemove, canRemove }: {
  color: PaletteColor;
  index: number;
  onCopy: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const detail = describe(color);
  const share = Math.round(color.weight * 100);
  return (
    <div className="measure">
      <div className="measure-top">
        <span className="measure-dot" style={{ background: color.hex }} aria-hidden="true" />
        <span className="measure-rank">{rank(index)}</span>
        <span className="measure-share numeric">{share}%</span>
      </div>
      <div className="measure-value">
        <strong className="numeric">{color.hex}</strong>
        <span className="measure-unit numeric">RGB {color.rgb.join(' ')}</span>
      </div>
      <p className="measure-read">{family(color)} · {detail.phrase}</p>
      <div className="measure-bar" aria-hidden="true">
        <i style={{ width: `${Math.max(share, 2)}%`, background: color.hex }} />
      </div>
      <div className="measure-actions">
        <button type="button" className="glyph glyph-quiet" onClick={onCopy} aria-label={`Copy ${color.hex}`}>
          <Copy aria-hidden="true" />
        </button>
        <button type="button" className="glyph glyph-danger" onClick={onRemove} disabled={!canRemove}
          aria-label={`Remove ${color.hex} from this reading`}>
          <Trash2 aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** One colour in the list — the same card, compressed. */
export function ColourRow({ color, index, selected, onSelect }: {
  color: PaletteColor;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const detail = describe(color);
  const share = Math.round(color.weight * 100);
  return (
    <li>
      <button type="button" className={selected ? 'row is-on' : 'row'} onClick={onSelect} aria-pressed={selected}>
        <span className="row-swatch" style={{ background: color.hex }} aria-hidden="true" />
        <span className="row-copy">
          <span className="row-head">
            <span className="row-rank">{rank(index)}</span>
            <span className="row-share numeric">{share}%</span>
          </span>
          <strong className="numeric">{color.hex}</strong>
          <small>{family(color)} · {detail.phrase}</small>
        </span>
        <span className="row-bar" aria-hidden="true">
          <i style={{ width: `${Math.max(share, 3)}%`, background: color.hex }} />
        </span>
      </button>
    </li>
  );
}

/** A kept place, as a reading. */
export function EntryCard({ entry, onOpen, onForget, featured = false }: {
  entry: PaletteEntry;
  onOpen: () => void;
  onForget?: () => void;
  featured?: boolean;
}) {
  const summary = read(entry);
  const when = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(new Date(entry.createdAt));
  return (
    <li className={featured ? 'entry is-featured' : 'entry'}>
      <button type="button" className="entry-open" onClick={onOpen}>
        <span className="entry-strip" aria-hidden="true">
          {entry.colors.slice(0, 8).map((color, position) => (
            <i key={`${color.hex}-${position}`}
              style={{ background: color.hex, flexGrow: Math.max(color.weight, 0.05) }} />
          ))}
        </span>
        <span className="entry-copy">
          <span className="entry-head">
            <strong>{entry.title}</strong>
            <small className="numeric">{when}</small>
          </span>
          {summary && <span className="entry-value numeric">{summary.dominant.hex}</span>}
          {summary && <small className="entry-read">{summary.sentence}</small>}
          <span className="entry-meta">
            <span className="tag" style={{ ['--tint' as string]: FAMILY_TINT[summary?.family ?? 'Stone'] }}>
              {summary?.family ?? 'Stone'}
            </span>
            <small className="numeric">{entry.colors.length} colours{entry.frame === undefined ? '' : ' · frame'}</small>
          </span>
        </span>
      </button>
      {onForget && (
        <button type="button" className="entry-forget" onClick={onForget}
          aria-label={`Remove ${entry.title} from the journal`}>
          <Trash2 aria-hidden="true" />
        </button>
      )}
    </li>
  );
}

/** How the whole journal leans, as one bar. */
export function FamilyBar({ entries }: { entries: PaletteEntry[] }) {
  const slices = distribution(entries);
  if (!slices.length) return null;
  return (
    <div className="spread">
      <div className="spread-bar" aria-hidden="true">
        {slices.map((slice) => (
          <i key={slice.family} style={{ width: `${slice.share * 100}%`, background: FAMILY_TINT[slice.family] }} />
        ))}
      </div>
      <ul className="spread-key">
        {slices.map((slice) => (
          <li key={slice.family}>
            <span className="spread-dot" style={{ background: FAMILY_TINT[slice.family] }} aria-hidden="true" />
            {slice.family}
            <span className="numeric">{slice.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
