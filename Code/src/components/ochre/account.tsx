'use client';
/**
 * Two pieces of account surface, and deliberately only two.
 *
 * `WelcomeGate` is a real sign-in screen: one question, two answers, nothing
 * else on it. `UserMenu` is the small control in the top corner that says who
 * you are and gets out of the way. Everything in between -- banners, inline
 * prompts, nudges on the journal -- was removed, because an optional account
 * should be asked about once and then stop talking.
 */
import { BookOpen, LogIn, LogOut, ShieldCheck, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { User as Account } from '@supabase/supabase-js';

/* ------------------------------------------------------------------ *
 * The sign-in screen.
 * ------------------------------------------------------------------ */

export function WelcomeGate({ onGoogle, onSkip, busy }: {
  onGoogle: () => void;
  onSkip: () => void;
  busy: boolean;
}) {
  return (
    <section className="gate">
      <div className="gate-body">
        <span className="wordmark-name gate-mark">ochre</span>

        <h1 className="gate-title">Keep what you find.</h1>
        <p className="gate-copy">
          Sign in and your readings are saved to your account, so they are still
          here tomorrow and on whatever device you open Ochre with next.
        </p>

        <div className="gate-actions">
          <button type="button" className="action action-primary gate-primary"
            onClick={onGoogle} disabled={busy}>
            <LogIn aria-hidden="true" /> Continue with Google
          </button>

          <button type="button" className="gate-skip" onClick={onSkip} disabled={busy}>
            Skip
          </button>
          <p className="gate-hint">
            Ochre works exactly the same without an account — but nothing is saved.
            Readings stay in this browser, and clearing your browsing data erases them.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The corner control.
 * ------------------------------------------------------------------ */

function initials(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return trimmed[0].toUpperCase();
}

export function UserMenu({ user, label, signedIn, onJournal, onSignIn, onSignOut }: {
  user: Account | null;
  label: string;
  signedIn: boolean;
  onJournal: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  // Signed out, the corner is a way back in rather than a menu.
  if (!signedIn) {
    return (
      <button type="button" className="avatar avatar-out" onClick={onSignIn}
        aria-label="Sign in">
        <User aria-hidden="true" />
      </button>
    );
  }

  const picture = typeof user?.user_metadata?.avatar_url === 'string'
    ? user.user_metadata.avatar_url as string
    : '';
  const email = user?.email ?? '';

  return (
    <div className="usermenu" ref={wrap}>
      <button type="button" className="avatar" onClick={() => setOpen((was) => !was)}
        aria-haspopup="menu" aria-expanded={open} aria-label={`Account — ${label}`}>
        {picture
          /* eslint-disable-next-line @next/next/no-img-element */
          ? <img src={picture} alt="" referrerPolicy="no-referrer" />
          : <span aria-hidden="true">{initials(label)}</span>}
      </button>

      {open && (
        <div className="usermenu-pop" role="menu">
          <div className="usermenu-who">
            <strong>{label}</strong>
            {email && email !== label && <span>{email}</span>}
            <span className="usermenu-state">Your journal is saved to this account.</span>
          </div>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onJournal(); }}>
            <BookOpen aria-hidden="true" /> My journal
          </button>
          <a role="menuitem" href="/storage" onClick={() => setOpen(false)}>
            <ShieldCheck aria-hidden="true" /> What is stored
          </a>
          <button type="button" role="menuitem" className="usermenu-out"
            onClick={() => { setOpen(false); onSignOut(); }}>
            <LogOut aria-hidden="true" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
