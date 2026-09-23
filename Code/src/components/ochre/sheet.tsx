'use client';

import { ChevronUp } from 'lucide-react';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { haptic, nearest, project, rubberband, Spring, VelocityTracker } from '@/lib/spring';

type SheetProps = {
  /** Always-visible summary. Doubles as a drag surface. */
  peek: ReactNode;
  children: ReactNode;
  label: string;
  /** Below the desktop breakpoint the sheet is a gesture surface; above it, a panel. */
  interactive: boolean;
  onOpenChange?: (open: boolean) => void;
};

const CLOSED = 0;
const OPEN = 1;

export function Sheet({ peek, children, label, interactive, onOpenChange }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const springRef = useRef<Spring | null>(null);
  const detentsRef = useRef<number[]>([220, 420]);
  const expandedRef = useRef(false);
  const gestureRef = useRef({
    active: false, pending: false, startY: 0, startHeight: 0,
    pointer: -1, moved: 0, fromGrip: false,
  });
  const tapRef = useRef(0);
  const tracker = useRef(new VelocityTracker());
  const hintedRef = useRef(false);

  const [detents, setDetents] = useState<[number, number]>([220, 420]);
  const [expanded, setExpanded] = useState(false);

  // Detents come from real content, so the peek is never a guessed height.
  useEffect(() => {
    if (!interactive) return;
    const measure = () => {
      const head = headRef.current?.offsetHeight ?? 0;
      const body = bodyRef.current?.scrollHeight ?? 0;
      const viewport = window.innerHeight;
      const collapsed = Math.min(head, viewport * 0.6);
      const open = Math.max(Math.min(head + body, viewport * 0.82), collapsed + 1);
      detentsRef.current = [collapsed, open];
      // The mosaic reads this so no tile is ever hidden under the collapsed sheet.
      document.documentElement.style.setProperty('--sheet-peek', `${Math.round(collapsed)}px`);
      setDetents([collapsed, open]);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (headRef.current) observer.observe(headRef.current);
    if (bodyRef.current) observer.observe(bodyRef.current);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      document.documentElement.style.removeProperty('--sheet-peek');
    };
  }, [interactive]);

  // One spring owns the sheet height for its whole life, so a gesture can grab
  // it mid-flight and the motion simply continues from where it is.
  useEffect(() => {
    if (!interactive) return;
    const element = sheetRef.current;
    if (!element) return;
    const spring = new Spring(detentsRef.current[CLOSED], (value) => {
      const [collapsed, open] = detentsRef.current;
      element.style.transform = `translate3d(0, ${Math.round(open - value)}px, 0)`;
      const span = Math.max(open - collapsed, 1);
      element.style.setProperty(
        '--sheet-progress',
        String(Math.min(1, Math.max(0, (value - collapsed) / span))),
      );
    }, { damping: 1, response: 0.34 });
    springRef.current = spring;
    return () => {
      spring.pause();
      springRef.current = null;
    };
  }, [interactive]);

  useEffect(() => {
    detentsRef.current = detents;
    const spring = springRef.current;
    if (!spring) return;
    spring.to(detents[expanded ? OPEN : CLOSED], { damping: 1, response: 0.34 });
  }, [detents, expanded]);

  useEffect(() => {
    onOpenChange?.(expanded);
  }, [expanded, onOpenChange]);

  // Nudge once, in the direction of the gesture, so the menu announces itself.
  useEffect(() => {
    if (!interactive || hintedRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lift = window.setTimeout(() => {
      const spring = springRef.current;
      if (!spring || hintedRef.current || gestureRef.current.active || expandedRef.current) return;
      hintedRef.current = true;
      spring.to(detentsRef.current[CLOSED] + 30, { damping: 0.8, response: 0.34 });
      window.setTimeout(() => {
        const settled = springRef.current;
        if (!settled || gestureRef.current.active || expandedRef.current) return;
        settled.to(detentsRef.current[CLOSED], { damping: 1, response: 0.4 });
      }, 460);
    }, 900);
    return () => window.clearTimeout(lift);
  }, [interactive]);

  const settle = useCallback((height: number, velocity: number) => {
    const [collapsed, open] = detentsRef.current;
    // Land where the flick is going, not where the finger let go.
    const projected = height + project(velocity);
    const target = nearest(projected, [collapsed, open]);
    const spring = springRef.current;
    const nowExpanded = target === open;
    if (spring) {
      // A little bounce is only earned because a real flick preceded it.
      spring.to(target, { velocity, damping: 0.82, response: 0.3 });
    }
    if (expandedRef.current !== nowExpanded) haptic(6);
    expandedRef.current = nowExpanded;
    setExpanded(nowExpanded);
  }, []);

  const claim = useCallback((surface: HTMLElement, pointerId: number, startY: number, fromGrip: boolean) => {
    const spring = springRef.current;
    if (!spring) return;
    spring.pause();
    gestureRef.current = {
      active: true, pending: false,
      startY, startHeight: spring.value, pointer: pointerId, moved: 0, fromGrip,
    };
    tracker.current.reset(spring.value);
    surface.setPointerCapture(pointerId);
  }, []);

  /**
   * Only the handle drags the sheet. A scrollable list cannot share a vertical
   * gesture with it: once the browser claims a touch for scrolling it sends
   * pointercancel, so a sheet drag started in the list either steals the scroll
   * or dies half way. One surface owns the gesture, and it is the labelled one.
   */
  const startDrag = useCallback((event: React.PointerEvent) => {
    if (!interactive) return;
    const target = event.target as HTMLElement;
    // The grip is itself a button — it must stay draggable.
    if (!target.closest('.sheet-grip') && target.closest('button, a, input, label, [data-no-drag]')) return;
    if (!springRef.current) return;
    claim(event.currentTarget as HTMLElement, event.pointerId, event.clientY, true);
  }, [claim, interactive]);

  const moveDrag = useCallback((event: React.PointerEvent) => {
    const gesture = gestureRef.current;
    const spring = springRef.current;
    if (gesture.pointer !== event.pointerId || !spring || !gesture.active) return;
    const [collapsed, open] = detentsRef.current;
    gesture.moved = Math.max(gesture.moved, Math.abs(event.clientY - gesture.startY));
    let height = gesture.startHeight + (gesture.startY - event.clientY);
    // Soft walls: resistance grows past the ends instead of a dead stop.
    if (height > open) height = open + rubberband(height - open, window.innerHeight);
    if (height < collapsed) height = collapsed - rubberband(collapsed - height, window.innerHeight);
    spring.set(height);
    tracker.current.add(height);
  }, []);

  const toggle = useCallback(() => {
    haptic(6);
    expandedRef.current = !expandedRef.current;
    setExpanded(expandedRef.current);
  }, []);

  const endDrag = useCallback((event: React.PointerEvent) => {
    const gesture = gestureRef.current;
    if (!gesture.active || gesture.pointer !== event.pointerId) return;
    gesture.active = false;
    const spring = springRef.current;
    if (!spring) return;
    // Capturing the pointer swallows the handle's click, so a tap is resolved
    // here rather than waiting for an event that never arrives.
    if (gesture.fromGrip && gesture.moved < 8) {
      tapRef.current = Date.now();
      toggle();
      return;
    }
    settle(spring.value, tracker.current.velocity);
  }, [settle, toggle]);

  const activate = useCallback(() => {
    // Keyboard only: a pointer tap has already been handled by endDrag.
    if (Date.now() - tapRef.current < 500) return;
    toggle();
  }, [toggle]);

  if (!interactive) {
    return (
      <aside className="sheet sheet-static" aria-label={label}>
        <div className="sheet-head">{peek}</div>
        <div className="sheet-body">{children}</div>
      </aside>
    );
  }

  return (
    <section
      ref={sheetRef}
      className="sheet"
      aria-label={label}
      style={{ height: detents[OPEN], transform: `translate3d(0, ${detents[OPEN] - detents[CLOSED]}px, 0)` }}
    >
      <div
        ref={headRef}
        className="sheet-head"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <button
          type="button"
          className="sheet-grip"
          onClick={activate}
          aria-expanded={expanded}
        >
          <span className="grip-bar" aria-hidden="true" />
          <span className="grip-label">
            {label}
            <ChevronUp className="grip-chevron" aria-hidden="true" />
          </span>
        </button>
        {peek}
      </div>
      <div ref={bodyRef} className="sheet-body">
        {children}
      </div>
    </section>
  );
}
