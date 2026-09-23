'use client';
/* oxlint-disable next/no-img-element */

import { ArrowLeft, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { imageFromVideoFrame, seekTo, thumbnailFromVideoFrame } from '@/lib/palette';
import { haptic } from '@/lib/spring';

type Shot = { time: number; src: string };

type FramePickerProps = {
  file: File;
  onUse: (image: string, time: number) => void;
  onCancel: () => void;
};

const STRIP = 8;
const NUDGE = 1 / 24;

function clock(seconds: number) {
  const whole = Math.max(0, seconds);
  const minutes = Math.floor(whole / 60);
  const rest = whole - minutes * 60;
  return `${minutes}:${rest < 10 ? '0' : ''}${rest.toFixed(1)}`;
}

export function FramePicker({ file, onUse, onCancel }: FramePickerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingRef = useRef<number | null>(null);

  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [shots, setShots] = useState<Shot[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const timeRef = useRef(0);
  const durationRef = useRef(0);
  useEffect(() => { timeRef.current = time; }, [time]);
  useEffect(() => { durationRef.current = duration; }, [duration]);

  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  // A contact sheet, built one frame at a time so the strip fills in as it goes.
  useEffect(() => {
    if (!url || !duration) return;
    let cancelled = false;
    const probe = document.createElement('video');
    probe.src = url;
    probe.muted = true;
    probe.playsInline = true;
    probe.preload = 'auto';

    const build = async () => {
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        probe.addEventListener('loadeddata', done, { once: true });
        probe.addEventListener('error', done, { once: true });
        window.setTimeout(done, 4000);
      });
      for (let index = 0; index < STRIP; index++) {
        if (cancelled) return;
        const at = (duration * (index + 0.5)) / STRIP;
        await seekTo(probe, at);
        if (cancelled) return;
        const src = thumbnailFromVideoFrame(probe);
        if (src) setShots((previous) => [...previous, { time: at, src }]);
      }
    };
    void build().catch(() => undefined);
    return () => {
      cancelled = true;
      probe.removeAttribute('src');
      probe.load();
    };
  }, [url, duration]);

  const scrub = useCallback((next: number) => {
    setTime(next);
    const video = videoRef.current;
    if (!video) return;
    // One seek in flight at a time; the newest request wins when it lands.
    if (video.seeking) { pendingRef.current = next; return; }
    video.currentTime = next;
  }, []);

  const onSeeked = useCallback(() => {
    const video = videoRef.current;
    const pending = pendingRef.current;
    if (!video || pending === null) return;
    pendingRef.current = null;
    video.currentTime = pending;
  }, []);

  const onMeta = useCallback(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    setDuration(video.duration);
    setReady(true);
    // Openings are often black, so start a little way in.
    const start = Math.min(0.6, video.duration * 0.25);
    setTime(start);
    video.currentTime = start;
  }, []);

  const take = useCallback(async () => {
    const video = videoRef.current;
    if (!video || busy) return;
    setBusy(true);
    try {
      const { image } = await imageFromVideoFrame(video);
      haptic([6, 40, 10]);
      onUse(image, video.currentTime);
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }, [busy, onUse]);

  // With a keyboard in reach, the whole picker is operable without the mouse.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName) && target !== document.body) {
        if (event.key !== 'Escape' && event.key !== 'Enter') return;
      }
      if (event.key === 'Escape') { event.preventDefault(); onCancel(); return; }
      if (event.key === 'Enter') { event.preventDefault(); void take(); return; }
      if (event.key === 'ArrowLeft') { event.preventDefault(); scrub(Math.max(0, timeRef.current - NUDGE)); }
      if (event.key === 'ArrowRight') { event.preventDefault(); scrub(Math.min(durationRef.current, timeRef.current + NUDGE)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, scrub, take]);

  const nearest = shots.reduce<Shot | null>(
    (best, shot) => (!best || Math.abs(shot.time - time) < Math.abs(best.time - time) ? shot : best),
    null,
  );

  return (
    <section className="framer">
      <header className="framer-bar">
        <button type="button" className="glyph" onClick={onCancel} aria-label="Choose a different file">
          <ArrowLeft aria-hidden="true" />
        </button>
        <div className="framer-title">
          <strong>Choose a frame</strong>
          <p className="meta numeric">{ready ? `${clock(duration)} long` : 'Opening the video'}</p>
        </div>
        <span className="glyph-spacer" aria-hidden="true" />
      </header>

      <div className="framer-stage">
        <div className="framer-screen">
          {url && (
            <video
              ref={videoRef}
              src={url}
              muted
              playsInline
              preload="auto"
              onLoadedMetadata={onMeta}
              onSeeked={onSeeked}
              onError={() => setFailed(true)}
            />
          )}
        </div>
        {failed && <p className="note note-error" role="alert">That video could not be opened. Try an MP4 or MOV.</p>}
      </div>

      <div className="framer-tools">
        <ul className="strip" aria-label="Frames from across the video">
          {shots.map((shot) => (
            <li key={shot.time}>
              <button
                type="button"
                className={nearest && nearest.time === shot.time ? 'is-on' : ''}
                onClick={() => { haptic(5); scrub(shot.time); }}
                aria-label={`Jump to ${clock(shot.time)}`}
                aria-pressed={nearest?.time === shot.time}
              >
                <img src={shot.src} alt="" />
              </button>
            </li>
          ))}
          {shots.length < STRIP && Array.from({ length: STRIP - shots.length }, (_, index) => (
            <li key={`waiting-${index}`}><span className="strip-waiting" /></li>
          ))}
        </ul>

        <div className="scrub">
          <button type="button" className="glyph glyph-quiet" aria-label="Step back one frame"
            onClick={() => scrub(Math.max(0, time - NUDGE))} disabled={!ready}>
            <ChevronLeft aria-hidden="true" />
          </button>
          <input
            className="dial"
            type="range"
            min={0}
            max={Math.max(duration, 0.01)}
            step={0.01}
            value={time}
            disabled={!ready}
            style={{ '--fill': `${duration ? (time / duration) * 100 : 0}%` } as React.CSSProperties}
            onChange={(event) => scrub(Number(event.target.value))}
            aria-label="Position in the video"
            aria-valuetext={`${clock(time)} of ${clock(duration)}`}
          />
          <button type="button" className="glyph glyph-quiet" aria-label="Step forward one frame"
            onClick={() => scrub(Math.min(duration, time + NUDGE))} disabled={!ready}>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
        <p className="hint numeric">{clock(time)} of {clock(duration)}</p>
        <p className="keys" aria-hidden="true">
          <kbd>←</kbd><kbd>→</kbd> step · <kbd>Enter</kbd> read · <kbd>Esc</kbd> back
        </p>

        <button type="button" className="action action-primary" onClick={take} disabled={!ready || busy}>
          <Check aria-hidden="true" /> Read this frame
        </button>
      </div>
    </section>
  );
}
