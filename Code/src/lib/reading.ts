/**
 * A photograph is read the way an instrument reads a body: the dominant colour
 * is the headline measurement, and everything else describes it in plain words.
 */

import type { PaletteColor, PaletteEntry } from '@/lib/palette';

export type Family = 'Moss' | 'Sky' | 'Earth' | 'Ember' | 'Stone';
export const FAMILIES: Family[] = ['Moss', 'Sky', 'Earth', 'Ember', 'Stone'];

/** Tint used for family chips and distribution bars. */
export const FAMILY_TINT: Record<Family, string> = {
  Moss: '#8FA173',
  Sky: '#91AEBD',
  Earth: '#A98C63',
  Ember: '#BE7247',
  Stone: '#9A9A90',
};

function hsl({ rgb }: PaletteColor) {
  const [r, g, b] = rgb.map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  if (hue < 0) hue += 360;
  const lightness = (max + min) / 2;
  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
  return { hue, saturation, lightness };
}

/**
 * Whichever channel leads decides the family. Testing green before blue used to
 * file pale blues like #ACC1CB as moss, because green merely has to beat red.
 */
export function family(color: PaletteColor): Family {
  const [r, g, b] = color.rgb;
  if (Math.max(r, g, b) - Math.min(r, g, b) < 22) return 'Stone';
  if (b >= r && b >= g) return 'Sky';
  if (g >= r && g >= b) return 'Moss';
  return r > g * 1.35 ? 'Ember' : 'Earth';
}

export function isWarm(color: PaletteColor) {
  const { hue, saturation } = hsl(color);
  if (saturation < 0.1) return false;
  return hue < 70 || hue > 300;
}

/** Two plain words for what a colour is like — never jargon, never a number. */
export function describe(color: PaletteColor) {
  const { hue, saturation, lightness } = hsl(color);
  const depth =
    lightness < 0.22 ? 'deep'
    : lightness < 0.42 ? 'shadowed'
    : lightness < 0.68 ? 'soft'
    : lightness < 0.86 ? 'pale'
    : 'near-white';
  const intensity =
    saturation < 0.1 ? 'grey'
    : saturation < 0.26 ? 'muted'
    : saturation < 0.52 ? 'gentle'
    : 'vivid';
  const warmth =
    saturation < 0.1 ? 'neutral'
    : hue < 70 || hue > 300 ? 'warm'
    : hue < 200 ? 'green'
    : 'cool';
  return { depth, intensity, warmth, phrase: `${depth}, ${intensity}` };
}

export function rank(index: number) {
  return ['Dominant', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth'][index]
    ?? `${index + 1}th`;
}

export type Reading = {
  dominant: PaletteColor;
  family: Family;
  /** Share of the frame, 0–1, held by colours that read warm. */
  warmth: number;
  /** Lightest and darkest in the palette. */
  lightest: PaletteColor;
  darkest: PaletteColor;
  /** One sentence a person would actually say about the place. */
  sentence: string;
};

export function read(entry: PaletteEntry): Reading | null {
  const colors = entry.colors;
  if (!colors.length) return null;
  const dominant = colors[0];
  const warmth = colors.reduce((sum, color) => sum + (isWarm(color) ? color.weight : 0), 0);
  const sorted = [...colors].sort((a, b) => hsl(a).lightness - hsl(b).lightness);
  const detail = describe(dominant);
  const balance = warmth > 0.6 ? 'warm throughout' : warmth < 0.25 ? 'cool throughout' : 'warm and cool in balance';
  return {
    dominant,
    family: family(dominant),
    warmth,
    lightest: sorted[sorted.length - 1],
    darkest: sorted[0],
    sentence: `${detail.depth.charAt(0).toUpperCase()}${detail.depth.slice(1)} ${detail.intensity} ${family(dominant).toLowerCase()}, ${balance}.`,
  };
}

/** How the whole journal splits across colour families, largest first. */
export function distribution(entries: PaletteEntry[]) {
  const counts = new Map<Family, number>();
  for (const entry of entries) {
    if (!entry.colors.length) continue;
    const name = family(entry.colors[0]);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const total = entries.length || 1;
  return FAMILIES
    .map((name) => ({ family: name, count: counts.get(name) ?? 0, share: (counts.get(name) ?? 0) / total }))
    .filter((slice) => slice.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
