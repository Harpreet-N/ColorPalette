/**
 * The mosaic composition.
 *
 * Tile size is not decorative: it is the share of the photograph that the
 * colour actually occupies, laid out with a squarified treemap so every tile
 * stays close to square no matter how many colours a palette holds. The
 * mosaic is colour only — the photograph lives in the header, so nothing in
 * the composition can be mistaken for a swatch.
 */

export type Cell = {
  /** Index into the palette. */
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: string;
};

type Item = { index: number; value: number };
type Rect = { x: number; y: number; width: number; height: number };

function worstRatio(areas: number[], sum: number, side: number) {
  let max = 0;
  let min = Infinity;
  for (const area of areas) {
    if (area > max) max = area;
    if (area < min) min = area;
  }
  if (min <= 0 || sum <= 0 || side <= 0) return Infinity;
  const squaredSum = sum * sum;
  const squaredSide = side * side;
  return Math.max((squaredSide * max) / squaredSum, squaredSum / (squaredSide * min));
}

function squarify(items: Item[], bounds: Rect): (Rect & { index: number })[] {
  const placed: (Rect & { index: number })[] = [];
  const queue = [...items];
  let free = { ...bounds };
  let remainingValue = queue.reduce((sum, item) => sum + item.value, 0);

  while (queue.length && free.width > 0.01 && free.height > 0.01) {
    const side = Math.min(free.width, free.height);
    const scale = (free.width * free.height) / Math.max(remainingValue, 1e-6);

    const row: Item[] = [];
    let rowArea = 0;
    let bestRatio = Infinity;

    while (queue.length) {
      const candidateArea = rowArea + queue[0].value * scale;
      const areas = [...row.map((item) => item.value * scale), queue[0].value * scale];
      const ratio = worstRatio(areas, candidateArea, side);
      if (row.length && ratio > bestRatio) break;
      row.push(queue.shift() as Item);
      rowArea = candidateArea;
      bestRatio = ratio;
    }

    const thickness = rowArea / Math.max(side, 1e-6);
    if (free.width >= free.height) {
      let y = free.y;
      for (const item of row) {
        const height = (item.value * scale) / Math.max(thickness, 1e-6);
        placed.push({ index: item.index, x: free.x, y, width: thickness, height });
        y += height;
      }
      free = {
        x: free.x + thickness,
        y: free.y,
        width: free.width - thickness,
        height: free.height,
      };
    } else {
      let x = free.x;
      for (const item of row) {
        const width = (item.value * scale) / Math.max(thickness, 1e-6);
        placed.push({ index: item.index, x, y: free.y, width, height: thickness });
        x += width;
      }
      free = {
        x: free.x,
        y: free.y + thickness,
        width: free.width,
        height: free.height - thickness,
      };
    }
    remainingValue -= row.reduce((sum, item) => sum + item.value, 0);
  }

  return placed;
}

/** Stable pseudo-random in [0,1) from a string — same tile, same shape, always. */
function seeded(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 15), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return ((hash ^= hash >>> 16) >>> 0) / 4294967296;
  };
}

/** Four unequal corners, in px, so tiles read as cut paper rather than boxes. */
function organicRadius(seed: string, width: number, height: number) {
  const random = seeded(seed);
  const scale = Math.min(width, height);
  return [0, 1, 2, 3]
    .map(() => {
      const softness = 0.16 + random() * 0.26;
      return `${Math.round(Math.min(44, Math.max(7, scale * softness)))}px`;
    })
    .join(' ');
}

export type MosaicInput = {
  weights: number[];
  seeds: string[];
  width: number;
  height: number;
  /** Gap between tiles, in px. */
  gap?: number;
};

export function composeMosaic({
  weights,
  seeds,
  width,
  height,
  gap = 6,
}: MosaicInput): Cell[] {
  if (!weights.length || width <= 0 || height <= 0) return [];

  const total = weights.reduce((sum, weight) => sum + Math.max(weight, 0.004), 0);
  const items: Item[] = weights.map((weight, index) => ({
    index,
    value: Math.max(weight, 0.004) / total,
  }));

  const ordered = [...items].sort((a, b) => b.value - a.value);

  const inset = gap / 2;
  return squarify(ordered, {
    x: 0,
    y: 0,
    width,
    height,
  }).map((rect) => {
    const tileWidth = Math.max(rect.width - gap, 1);
    const tileHeight = Math.max(rect.height - gap, 1);
    return {
      index: rect.index,
      x: rect.x + inset,
      y: rect.y + inset,
      width: tileWidth,
      height: tileHeight,
      radius: organicRadius(seeds[rect.index] ?? String(rect.index), tileWidth, tileHeight),
    };
  });
}
