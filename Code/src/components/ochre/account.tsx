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
import { BookOpen, LogIn, LogOut, ShieldCheck, Trash2, TriangleAlert, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { User as Account } from '@supabase/supabase-js';

/* ------------------------------------------------------------------ *
 * The sign-in screen.
 * ------------------------------------------------------------------ */

export function WelcomeGate({ onGoogle, onSkip, busy, trouble }: {
  onGoogle: () => void;
  onSkip: () => void;
  busy: boolean;
  trouble?: string;
}) {
  // The official mark may not have been added to /public yet; swapping on the
  // error event keeps the button usable either way.
  const [markMissing, setMarkMissing] = useState(false);

  return (
    <section className="gate">
      <div className="gate-body">
        <span className="wordmark-name gate-mark">ochre</span>

        <h1 className="gate-title">Save your palettes?</h1>
        <p className="gate-copy">
          Signing in does one thing: it saves the palettes you make, so they are
          still here next time and on your other devices.
        </p>
        <ul className="gate-facts">
          <li>Ochre only ever sees your name and email address.</li>
          <li>There is no password to create, and nothing to pay.</li>
          <li>You can sign out or ask for your account to be deleted at any time.</li>
        </ul>

        {trouble && <p className="gate-trouble" role="alert">{trouble}</p>}

        <div className="gate-actions">
          {/*
            Google's own branding guidelines govern this button: white
            surface, hairline border, Roboto-ish label, and THEIR mark --
            never a redrawn one. The file below is the official asset,
            self-hosted so that opening Ochre still contacts no one. If it is
            missing the button degrades to a neutral icon rather than
            breaking, and it is still a valid sign-in control.
          */}
          <button type="button" className="gate-google" onClick={onGoogle} disabled={busy}>
            <span className="gate-google-mark" aria-hidden="true">
              {markMissing
                ? <LogIn className="gate-google-fallback" />
                /* eslint-disable-next-line @next/next/no-img-element */
                : <img src="/google.svg" alt="" width={18} height={18}
                    onError={() => setMarkMissing(true)} />}
            </span>
            Continue with Google
          </button>

          <button type="button" className="gate-skip" onClick={onSkip} disabled={busy}>
            Skip
          </button>
          <p className="gate-hint">
            Skipping is fine — the app works exactly the same. You just have to
            download each palette to keep it, because nothing is saved for you.
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

export function UserMenu({
  user, label, signedIn, count, onJournal, onSignIn, onSignOut, onEraseAll, onDeleteAccount,
}: {
  user: Account | null;
  label: string;
  signedIn: boolean;
  /** How many palettes are about to be destroyed, so the warning is specific. */
  count: number;
  onJournal: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onEraseAll: () => void;
  onDeleteAccount: () => void;
}) {
  const [open, setOpen] = useState(false);
  /** Destructive actions arm first and fire second; nothing here is one tap. */
  const [arming, setArming] = useState<'none' | 'erase' | 'account'>('none');
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) { setOpen(false); setArming('none'); }
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); setArming('none'); }
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  const danger = (
    <>
      {arming === 'erase' ? (
        <div className="usermenu-confirm">
          <p>
            <TriangleAlert aria-hidden="true" />
            Erase {count} palette{count === 1 ? '' : 's'}? This cannot be undone.
          </p>
          <div>
            <button type="button" onClick={() => setArming('none')}>Keep them</button>
            <button type="button" className="usermenu-go"
              onClick={() => { setArming('none'); setOpen(false); onEraseAll(); }}>
              Erase
            </button>
          </div>
        </div>
      ) : (
        <button type="button" role="menuitem" className="usermenu-danger"
          onClick={() => setArming('erase')} disabled={!count}>
          <Trash2 aria-hidden="true" /> Erase all palettes
        </button>
      )}

      {signedIn && (arming === 'account' ? (
        <div className="usermenu-confirm">
          <p>
            <TriangleAlert aria-hidden="true" />
            Delete your account, and every palette in it, permanently?
          </p>
          <div>
            <button type="button" onClick={() => setArming('none')}>Cancel</button>
            <button type="button" className="usermenu-go"
              onClick={() => { setArming('none'); setOpen(false); onDeleteAccount(); }}>
              Delete account
            </button>
          </div>
        </div>
      ) : (
        <button type="button" role="menuitem" className="usermenu-danger"
          onClick={() => setArming('account')}>
          <TriangleAlert aria-hidden="true" /> Delete account
        </button>
      ))}
    </>
  );

  // Signed out there is no account, but there is still local data to clear.
  if (!signedIn) {
    return (
      <div className="usermenu" ref={wrap}>
        <button type="button" className="avatar avatar-out"
          onClick={() => setOpen((was) => !was)}
          aria-haspopup="menu" aria-expanded={open} aria-label="Settings">
          <User aria-hidden="true" />
        </button>
        {open && (
          <div className="usermenu-pop" role="menu">
            <div className="usermenu-who">
              <strong>Not signed in</strong>
              <span className="usermenu-state">Palettes are kept in this browser only.</span>
            </div>
            <button type="button" role="menuitem"
              onClick={() => { setOpen(false); onSignIn(); }}>
              <LogIn aria-hidden="true" /> Sign in to save them
            </button>
            <a role="menuitem" href="/storage" onClick={() => setOpen(false)}>
              <ShieldCheck aria-hidden="true" /> What is stored
            </a>
            {danger}
          </div>
        )}
      </div>
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
          {danger}
        </div>
      )}
    </div>
  );
}
