'use client';

import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { composeMosaic } from '@/lib/mosaic';
import type { PaletteColor } from '@/lib/palette';
import { haptic } from '@/lib/spring';

type MosaicProps = {
  colors: PaletteColor[];
  title: string;
  selected: string | null;
  onSelect: (color: PaletteColor) => void;
  onRemove: () => void;
  canRemove: boolean;
};

export function Mosaic({ colors, title, selected, onSelect, onRemove, canRemove }: MosaicProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setSize({ width: Math.round(box.width), height: Math.round(box.height) });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const cells = useMemo(
    () =>
      composeMosaic({
        weights: colors.map((color) => color.weight),
        seeds: colors.map((color) => color.hex),
        width: size.width,
        height: size.height,
        gap: size.width < 480 ? 5 : 7,
        // Only on narrow screens: a pointer can hit a 20px tile, a thumb cannot.
        minCell: size.width < 600 ? 44 : 0,
      }),
    [colors, size.width, size.height],
  );

  const chosen = cells.find((cell) => colors[cell.index]?.hex === selected);

  return (
    <div className="mosaic" ref={frameRef} aria-label={`Colour mosaic for ${title}`}>
      {cells.map((cell, order) => {
        const color = colors[cell.index];
        if (!color) return null;
        const share = Math.round(color.weight * 100);
        return (
          <button
            key={`${color.hex}-${cell.index}`}
            type="button"
            className="mosaic-tile"
            style={{
              left: `${cell.x}px`,
              top: `${cell.y}px`,
              width: `${cell.width}px`,
              height: `${cell.height}px`,
              borderRadius: cell.radius,
              background: color.hex,
              animationDelay: `${Math.min(order * 34, 460)}ms`,
            }}
            aria-pressed={selected === color.hex}
            aria-label={`${color.hex}, about ${share} per cent of the photograph`}
            onPointerDown={() => {
              // Feedback on press, never on release.
              if (selected !== color.hex) haptic(5);
              onSelect(color);
            }}
          />
        );
      })}

      {/* The way out of a colour sits on the colour itself. */}
      {chosen && canRemove && (
        <button
          type="button"
          className="mosaic-remove"
          style={
            chosen.width < 92 || chosen.height < 92
              ? { left: `${chosen.x + chosen.width / 2 - 21}px`, top: `${chosen.y + chosen.height / 2 - 21}px` }
              : { left: `${chosen.x + chosen.width - 48}px`, top: `${chosen.y + 8}px` }
          }
          onClick={onRemove}
          aria-label={`Remove ${selected} from this reading`}
        >
          <Trash2 aria-hidden="true" />
        </button>
      )}

      <span className="mosaic-grain" aria-hidden="true" />
    </div>
  );
}
