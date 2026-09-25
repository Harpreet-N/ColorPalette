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
  /** Set when a sign-in attempt came back refused or incomplete. */
  trouble: string;
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
  const [trouble, setTrouble] = useState('');

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
   * A sign-in that fails should say so. Google returns its refusals as query
   * parameters, and supabase-js reports exchange failures the same way, so
   * both are read here -- and this effect is deliberately declared BEFORE
   * the cleanup below, because effects run in declaration order and the
   * cleanup removes the very parameters this one needs to read.
   */
  useEffect(() => {
    if (typeof window === 'undefined' || status === 'loading') return;
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const code = params.get('error') ?? hash.get('error');
    if (!code) return;
    const detail = params.get('error_description') ?? hash.get('error_description');
    setTrouble(
      code === 'access_denied'
        ? 'Sign-in was cancelled.'
        : detail ?? 'Sign-in did not complete. Please try again.',
    );
  }, [status]);

  /**
   * Strip the OAuth leftovers, but ONLY once the auth client has settled.
   *
   * This guard is the whole point. The PKCE exchange reads `?code=` from the
   * URL asynchronously -- supabase-js first looks the code verifier up in
   * storage, which means at least one await before it ever touches
   * window.location. An earlier version of this effect ran on the first
   * render, while status was still 'loading', and deleted the query string on
   * a setTimeout(0). That reliably won the race and threw away the
   * authorization code before it could be redeemed, so every Google sign-in
   * came back to a signed-out app with no error anywhere: the redirect
   * worked, the consent worked, and the app simply forgot it had happened.
   *
   * `status` leaves 'loading' only when getSession() resolves, and that call
   * awaits the exchange, so by here the code has been used or has failed.
   */
  useEffect(() => {
    if (typeof window === 'undefined' || status === 'loading') return;
    const { search, hash } = window.location;
    if (!/[?&](code|error)=/.test(search) && !/[#&](access_token|error)=/.test(hash)) return;
    window.history.replaceState({}, '', window.location.pathname);
  }, [status]);

  const signIn = useCallback(async () => {
    const client = supabase();
    if (!client) return { error: 'Accounts are not available in this build.' };
    setTrouble('');
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

  return { status, user, label: nameOf(user), signIn, signOut, trouble };
}
