export type PaletteColor = {
  hex: string;
  rgb: [number, number, number];
  weight: number;
};

export type PaletteEntry = {
  id: string;
  title: string;
  createdAt: string;
  /** A data URL while the reading is local; a signed URL once it is in an account. */
  image: string;
  /** Where the photograph lives in Storage, once it has been backed up. */
  imagePath?: string;
  /** Last local change, used to settle local-versus-remote conflicts. */
  updatedAt?: string;
  /** What the palette currently shows, weights renormalised to sum to 1. */
  colors: PaletteColor[];
  /** Everything the photograph gave up, most dominant first. */
  pool?: PaletteColor[];
  /** How many of the dominant colours to keep. */
  count?: number;
  /** Colours the person mixed in themselves. */
  extra?: PaletteColor[];
  /** Colours from the photograph the person threw away. */
  dropped?: string[];
  /** Seconds into the video this still was taken from, when it came from one. */
  frame?: number;
};

type LabPoint = { lab: [number, number, number]; rgb: [number, number, number] };

const toLinear = (v: number) => {
  const n = v / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
};

function rgbToOklab(rgb: [number, number, number]): [number, number, number] {
  const [r, g, b] = rgb.map(toLinear);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l3 = Math.cbrt(l), m3 = Math.cbrt(m), s3 = Math.cbrt(s);
  return [
    0.2104542553 * l3 + 0.793617785 * m3 - 0.0040720468 * s3,
    1.9779984951 * l3 - 2.428592205 * m3 + 0.4505937099 * s3,
    0.0259040371 * l3 + 0.7827717662 * m3 - 0.808675766 * s3,
  ];
}

const distance = (a: [number, number, number], b: [number, number, number]) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

const hex = ([r, g, b]: [number, number, number]) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

const MAX_EDGE = 720;

/** Draw any drawable source down to a modest JPEG the journal can hold. */
function encode(source: CanvasImageSource, width: number, height: number, quality = 0.78) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas is unavailable.');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function imageFromDataUrl(image: string) {
  const element = new Image();
  element.decoding = 'async';
  element.src = image;
  await element.decode();
  return { image, element };
}

export function isVideo(file: File) {
  return file.type.startsWith('video/') || /\.(mp4|m4v|mov|webm|ogv|avi|mkv)$/i.test(file.name);
}

export async function imageFromFile(file: File): Promise<{ image: string; element: HTMLImageElement }> {
  const source = URL.createObjectURL(file);
  const element = new Image();
  element.decoding = 'async';
  element.src = source;
  try {
    await element.decode();
  } finally {
    // Freed whether or not the file turned out to be readable.
    queueMicrotask(() => URL.revokeObjectURL(source));
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(element.naturalWidth, element.naturalHeight));
  return imageFromDataUrl(encode(element, element.naturalWidth * scale, element.naturalHeight * scale));
}

/** The still sitting under the playhead right now. */
export async function imageFromVideoFrame(video: HTMLVideoElement) {
  const { videoWidth: width, videoHeight: height } = video;
  if (!width || !height) throw new Error('That frame is not ready yet.');
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  return imageFromDataUrl(encode(video, width * scale, height * scale));
}

/** A small, cheap still for the filmstrip. */
export function thumbnailFromVideoFrame(video: HTMLVideoElement) {
  const { videoWidth: width, videoHeight: height } = video;
  if (!width || !height) return '';
  const scale = Math.min(1, 220 / Math.max(width, height));
  return encode(video, width * scale, height * scale, 0.6);
}

/** Park the playhead and wait for the picture to actually arrive. */
export function seekTo(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve) => {
    const done = () => {
      video.removeEventListener('seeked', done);
      window.clearTimeout(guard);
      resolve();
    };
    const guard = window.setTimeout(done, 2000);
    video.addEventListener('seeked', done);
    try {
      video.currentTime = Math.max(0, Math.min(time, Math.max(0, video.duration - 0.02)));
    } catch {
      done();
    }
  });
}

export function extractPalette(image: HTMLImageElement, count = 12): PaletteColor[] {
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 128 / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
  if (!ctx) throw new Error('Canvas is unavailable.');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const points: LabPoint[] = [];
  const stride = Math.max(1, Math.floor((canvas.width * canvas.height) / 9000));

  for (let i = 0; i < pixels.length; i += 4 * stride) {
    if (pixels[i + 3] < 220) continue;
    const rgb: [number, number, number] = [pixels[i], pixels[i + 1], pixels[i + 2]];
    points.push({ rgb, lab: rgbToOklab(rgb) });
  }
  if (!points.length) throw new Error('No readable colours were found.');

  const centroids: [number, number, number][] = [points[Math.floor(points.length / 2)].lab];
  while (centroids.length < Math.min(count, points.length)) {
    let farthest = points[0];
    let best = -1;
    for (const point of points) {
      const nearest = Math.min(...centroids.map((c) => distance(point.lab, c)));
      if (nearest > best) { best = nearest; farthest = point; }
    }
    centroids.push([...farthest.lab]);
  }

  let groups: LabPoint[][] = [];
  for (let iteration = 0; iteration < 10; iteration++) {
    groups = Array.from({ length: centroids.length }, () => []);
    for (const point of points) {
      let nearest = 0;
      let nearestDistance = Infinity;
      centroids.forEach((center, index) => {
        const d = distance(point.lab, center);
        if (d < nearestDistance) { nearestDistance = d; nearest = index; }
      });
      groups[nearest].push(point);
    }
    groups.forEach((group, index) => {
      if (!group.length) return;
      centroids[index] = [0, 1, 2].map((channel) =>
        group.reduce((sum, p) => sum + p.lab[channel], 0) / group.length,
      ) as [number, number, number];
    });
  }

  return groups
    .filter((group) => group.length > points.length * 0.006)
    .map((group) => {
      const rgb = [0, 1, 2].map((channel) =>
        Math.round(group.reduce((sum, p) => sum + p.rgb[channel], 0) / group.length),
      ) as [number, number, number];
      return { rgb, hex: hex(rgb), weight: group.length / points.length };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, count);
}

export function suggestedTitle(color: PaletteColor): string {
  const [r, g, b] = color.rgb.map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  if (hue < 0) hue += 360;
  const light = (max + min) / 2;
  const saturation = delta ? delta / (1 - Math.abs(2 * light - 1)) : 0;
  if (light < .24) return 'Forest After Rain';
  if (saturation < .12) return light > .7 ? 'Cloud Study' : 'Stone & Mist';
  if (hue < 35 || hue >= 345) return 'Last Light';
  if (hue < 70) return 'Sunlit Meadow';
  if (hue < 165) return light > .55 ? 'Young Ferns' : 'Deep Woodland';
  if (hue < 250) return light > .58 ? 'Open Sky' : 'Mountain Water';
  return 'Wild Bloom';
}

export function readableInk(rgb: [number, number, number]) {
  const [r, g, b] = rgb.map((v) => {
    const n = v / 255;
    return n <= .03928 ? n / 12.92 : Math.pow((n + .055) / 1.055, 2.4);
  });
  return .2126 * r + .7152 * g + .0722 * b > .42 ? '#14201A' : '#FFFFFF';
}
