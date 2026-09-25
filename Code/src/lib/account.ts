'use client';
/**
 * Sign-in is optional and exists for exactly one reason: to let a journal
 * outlive the browser it was made in. Nothing in the reading flow depends on
 * it, so every state below has a sensible signed-out answer.
 */
import type { Session, User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { cloudConfigured, supabase } from '@/lib/supabase';

export type AccountStatus = 'unavailable' | 'loading' | 'out' | 'in';

export type Account = {
  status: AccountStatus;
  user: User | null;
  /** Display name from the Google profile, falling back to the email. */
  label: string;
  signIn: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

function nameOf(user: User | null): string {
  if (!user) return '';
  const meta = user.user_metadata ?? {};
  const named = typeof meta.full_name === 'string' ? meta.full_name : '';
  const given = typeof meta.name === 'string' ? meta.name : '';
  return named || given || user.email || 'Signed in';
}

export function useAccount(): Account {
  const [status, setStatus] = useState<AccountStatus>(
    cloudConfigured ? 'loading' : 'unavailable',
  );
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const client = supabase();
    if (!client) { setStatus('unavailable'); return; }

    let alive = true;
    const settle = (session: Session | null) => {
      if (!alive) return;
      setUser(session?.user ?? null);
      setStatus(session?.user ? 'in' : 'out');
    };

    client.auth.getSession().then(({ data }) => settle(data.session));
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => settle(session));

    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  /**
   * Strip the OAuth leftovers once supabase-js has consumed them, so a reload
   * or a shared link never carries a code or token fragment around.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { search, hash } = window.location;
    if (!/[?&](code|error)=/.test(search) && !/[#&](access_token|error)=/.test(hash)) return;
    const clean = window.location.pathname;
    window.setTimeout(() => window.history.replaceState({}, '', clean), 0);
  }, [status]);

  const signIn = useCallback(async () => {
    const client = supabase();
    if (!client) return { error: 'Accounts are not available in this build.' };
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    });
    return error ? { error: error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    const client = supabase();
    if (!client) return;
    await client.auth.signOut();
  }, []);

  return { status, user, label: nameOf(user), signIn, signOut };
}
