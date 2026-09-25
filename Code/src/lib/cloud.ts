'use client';
/**
 * Two-way sync between the local journal and the signed-in account.
 *
 * localStorage stays the working copy at all times, so the app is never
 * waiting on the network to show a journal. The account is a backup that
 * happens to be shared between devices. Where the two disagree, the more
 * recently touched copy wins -- readings are edited rarely and by one person,
 * so this is enough and needs no conflict UI.
 *
 * Photographs never go into Postgres. They are uploaded to the private
 * `readings` bucket under <user id>/<reading id>, which is exactly the shape
 * the storage policies check, and the row keeps only the path.
 */
import type { PaletteEntry } from '@/lib/palette';
import { PHOTO_BUCKET, supabase } from '@/lib/supabase';

/** Signed photo links are re-minted on every load, so this only has to outlast a session. */
const LINK_TTL = 60 * 60 * 8;

type Row = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  image_path: string | null;
  colors: PaletteEntry['colors'];
  pool: PaletteEntry['pool'] | null;
  swatch_count: number | null;
  extra: PaletteEntry['extra'] | null;
  dropped: string[] | null;
  frame: number | null;
};

const stamp = (entry: PaletteEntry) => entry.updatedAt ?? entry.createdAt;

function toRow(entry: PaletteEntry, userId: string, imagePath: string | null) {
  return {
    id: entry.id,
    user_id: userId,
    title: entry.title,
    created_at: entry.createdAt,
    updated_at: stamp(entry),
    image_path: imagePath,
    colors: entry.colors,
    pool: entry.pool ?? null,
    swatch_count: entry.count ?? null,
    extra: entry.extra ?? null,
    dropped: entry.dropped ?? null,
    frame: entry.frame ?? null,
  };
}

function fromRow(row: Row, image: string): PaletteEntry {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    image,
    imagePath: row.image_path ?? undefined,
    colors: row.colors ?? [],
    pool: row.pool ?? undefined,
    count: row.swatch_count ?? undefined,
    extra: row.extra ?? undefined,
    dropped: row.dropped ?? undefined,
    frame: row.frame ?? undefined,
  };
}

function dataUrlToBlob(value: string): Blob | null {
  const match = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(value);
  if (!match) return null;
  const [, type, base64, body] = match;
  try {
    if (!base64) return new Blob([decodeURIComponent(body)], { type });
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type });
  } catch { return null; }
}

const extensionFor = (mime: string) =>
  mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';

/** Mint a signed link for every stored photograph in one round trip. */
async function signAll(paths: string[]): Promise<Map<string, string>> {
  const client = supabase();
  const links = new Map<string, string>();
  if (!client || !paths.length) return links;
  const { data, error } = await client.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, LINK_TTL);
  if (error || !data) return links;
  for (const item of data) {
    if (item.path && item.signedUrl) links.set(item.path, item.signedUrl);
  }
  return links;
}

/** Everything the account holds, newest first, with photographs resolved. */
export async function pull(): Promise<PaletteEntry[]> {
  const client = supabase();
  if (!client) return [];
  const { data, error } = await client
    .from('readings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) throw error ?? new Error('Could not read the journal');

  const rows = data as Row[];
  const links = await signAll(rows.map((row) => row.image_path).filter((p): p is string => !!p));
  return rows.map((row) => fromRow(row, (row.image_path && links.get(row.image_path)) || ''));
}

/**
 * Back one reading up. The photograph is uploaded only the first time; after
 * that the entry already carries its storage path and only the row is written.
 */
export async function push(entry: PaletteEntry, userId: string): Promise<PaletteEntry> {
  const client = supabase();
  if (!client) return entry;

  let imagePath = entry.imagePath ?? null;
  if (!imagePath && entry.image.startsWith('data:')) {
    const blob = dataUrlToBlob(entry.image);
    if (blob) {
      const path = `${userId}/${entry.id}.${extensionFor(blob.type)}`;
      const { error } = await client.storage
        .from(PHOTO_BUCKET)
        .upload(path, blob, { contentType: blob.type, upsert: true });
      // A failed photograph must not cost the reading; the row still goes up.
      if (!error) imagePath = path;
    }
  }

  const { error } = await client.from('readings').upsert(toRow(entry, userId, imagePath));
  if (error) throw error;
  const stored = imagePath ?? undefined;
  return stored === entry.imagePath ? entry : { ...entry, imagePath: stored };
}

export async function remove(entry: PaletteEntry): Promise<void> {
  const client = supabase();
  if (!client) return;
  await client.from('readings').delete().eq('id', entry.id);
  if (entry.imagePath) await client.storage.from(PHOTO_BUCKET).remove([entry.imagePath]);
}

/**
 * Union by id, newest touch wins. A local entry with a data URL keeps it even
 * when the remote copy is chosen, so the photograph stays visible offline.
 */
export function merge(local: PaletteEntry[], remote: PaletteEntry[]): PaletteEntry[] {
  const byId = new Map<string, PaletteEntry>();
  for (const entry of remote) byId.set(entry.id, entry);
  for (const entry of local) {
    const other = byId.get(entry.id);
    if (!other) { byId.set(entry.id, entry); continue; }
    const mine = Date.parse(stamp(entry));
    const theirs = Date.parse(stamp(other));
    const winner = Number.isFinite(mine) && mine > theirs ? entry : other;
    byId.set(entry.id, {
      ...winner,
      image: entry.image.startsWith('data:') ? entry.image : winner.image || entry.image,
      imagePath: winner.imagePath ?? other.imagePath ?? entry.imagePath,
    });
  }
  return [...byId.values()].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}
