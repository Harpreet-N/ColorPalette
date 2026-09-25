/**
 * The browser Supabase client.
 *
 * Both values are public by design: the publishable key reaches only what Row
 * Level Security allows, and every `readings` row and storage object is scoped
 * to `auth.uid()`. If the variables are missing the app still runs -- it simply
 * has no account layer, and the journal stays in localStorage. That is the same
 * state a signed-out visitor is in, so there is no separate code path for it.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null | undefined;

export function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  if (!url || !key || typeof window === 'undefined') {
    client = null;
    return client;
  }
  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Ochre signs in by redirect, so the session arrives back in the URL.
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
  return client;
}

/** Whether an account is even possible in this deployment. */
export const cloudConfigured = Boolean(url && key);

export const PHOTO_BUCKET = 'readings';
