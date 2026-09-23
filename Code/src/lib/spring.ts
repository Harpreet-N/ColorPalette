/**
 * Fluid motion primitives.
 *
 * Everything the user can touch is driven by a spring rather than a fixed
 * duration, because a spring can be re-targeted mid-flight without a seam:
 * it always continues from the current presentation value and the current
 * velocity. That is what makes a gesture feel grabbable and reversible.
 */

export type SpringConfig = {
  /** 1 = critically damped (settles without overshoot). ~0.8 = a little bounce. */
  damping?: number;
  /** Seconds to approach the target. Not a duration — a spring has none. */
  response?: number;
};

/** Reduced motion removes the travel, not the interaction: a drag still tracks
 *  the finger 1:1, but nothing springs on its own afterwards. */
function stillness() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

const REST_DISTANCE = 0.08;
const REST_VELOCITY = 2;
const MAX_STEP = 1 / 240;

export class Spring {
  value: number;
  velocity = 0;
  target: number;

  private damping: number;
  private response: number;
  private frame = 0;
  private last = 0;
  private readonly emit: (value: number) => void;
  private settle?: () => void;

  constructor(value: number, emit: (value: number) => void, config: SpringConfig = {}) {
    this.value = value;
    this.target = value;
    this.emit = emit;
    this.damping = config.damping ?? 1;
    this.response = config.response ?? 0.4;
  }

  /**
   * Re-target. Velocity is deliberately preserved unless a new one is handed
   * in, so a reversal blends instead of hitting a brick wall.
   */
  to(target: number, options: SpringConfig & { velocity?: number } = {}) {
    if (options.damping !== undefined) this.damping = options.damping;
    if (options.response !== undefined) this.response = options.response;
    if (options.velocity !== undefined) this.velocity = options.velocity;
    this.target = target;
    if (stillness()) {
      this.pause();
      this.value = target;
      this.velocity = 0;
      this.emit(this.value);
      this.settle?.();
      return;
    }
    this.run();
  }

  /** Direct write — used while a finger is tracking the value 1:1. */
  set(value: number, velocity = 0) {
    this.pause();
    this.value = value;
    this.target = value;
    this.velocity = velocity;
    this.emit(value);
  }

  onSettle(callback: () => void) {
    this.settle = callback;
  }

  pause() {
    if (!this.frame) return;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private run() {
    if (this.frame || typeof requestAnimationFrame !== 'function') return;
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.frame = 0;
    const elapsed = Math.min((now - this.last) / 1000, 1 / 30);
    this.last = now;

    const omega = (2 * Math.PI) / this.response;
    const stiffness = omega * omega;
    const friction = 2 * this.damping * omega;
    const steps = Math.max(1, Math.ceil(elapsed / MAX_STEP));
    const step = elapsed / steps;

    for (let i = 0; i < steps; i++) {
      const acceleration =
        -stiffness * (this.value - this.target) - friction * this.velocity;
      this.velocity += acceleration * step;
      this.value += this.velocity * step;
    }

    if (
      Math.abs(this.target - this.value) < REST_DISTANCE &&
      Math.abs(this.velocity) < REST_VELOCITY
    ) {
      this.value = this.target;
      this.velocity = 0;
      this.emit(this.value);
      this.settle?.();
      return;
    }

    this.emit(this.value);
    this.frame = requestAnimationFrame(this.tick);
  };
}

/**
 * Where a flick would come to rest, using scroll-style exponential decay.
 * Snap targets are chosen from the projection, not from the release point —
 * that is what makes a small flick throw the sheet all the way.
 */
export function project(velocity: number, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Progressive resistance past a boundary instead of a dead stop. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  const limit = Math.max(dimension, 1);
  return (overshoot * limit * constant) / (limit + constant * Math.abs(overshoot));
}

export function nearest(value: number, points: number[]) {
  return points.reduce((best, point) =>
    Math.abs(point - value) < Math.abs(best - value) ? point : best,
  );
}

/** Tracks the last few samples so a release carries the finger's real speed. */
export class VelocityTracker {
  private samples: { value: number; time: number }[] = [];

  reset(value: number) {
    this.samples = [{ value, time: performance.now() }];
  }

  add(value: number) {
    this.samples.push({ value, time: performance.now() });
    if (this.samples.length > 6) this.samples.shift();
  }

  /** Units per second. */
  get velocity() {
    if (this.samples.length < 2) return 0;
    const last = this.samples[this.samples.length - 1];
    let first = this.samples[0];
    for (const sample of this.samples) {
      if (last.time - sample.time <= 90) {
        first = sample;
        break;
      }
    }
    const elapsed = last.time - first.time;
    if (elapsed <= 0) return 0;
    return ((last.value - first.value) / elapsed) * 1000;
  }
}

/** A short, purposeful tick. Reserved for commits and snaps, never decoration. */
export function haptic(pattern: number | number[] = 8) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* Haptics are a nicety, never a requirement. */
  }
}
