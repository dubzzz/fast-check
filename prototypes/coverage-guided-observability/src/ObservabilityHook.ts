// prototypes/coverage-guided-observability/src/ObservabilityHook.ts
// ANGLE A — Observability hook. Prototype only, not production code.

export interface DrawEvent {
  /** Arbitrary label (e.g. "integer", "string") — prototype: string only. */
  readonly label: string;
  /** Monotonic index within the current run. */
  readonly drawIndex: number;
  /** The generated value, cheaply serialised by the caller. */
  readonly value: unknown;
  /** The seed/path that produced this run (for replay). */
  readonly seed: number;
  readonly path: string;
}

export interface RunStartEvent {
  readonly runIndex: number;
  readonly seed: number;
  readonly path: string;
}

export interface RunEndEvent {
  readonly runIndex: number;
  readonly seed: number;
  readonly path: string;
  readonly status: 'success' | 'failure' | 'skipped';
  readonly durationMs: number;
  /** Arbitrary user-supplied feedback — e.g. coverage signature for this run. */
  readonly userMeta?: Record<string, unknown>;
}

export interface ObservabilityListener {
  onDraw?(evt: DrawEvent): void;
  onRunStart?(evt: RunStartEvent): void;
  onRunEnd?(evt: RunEndEvent): void;
}

// The singleton bus. `observe()` adds listeners; `emit*` is called by the runner
// when `observability: true` is passed to fc.assert. Fast-path: if listeners is
// empty, runner skips the call entirely.
const listeners: Set<ObservabilityListener> = new Set();

export function observe(listener: ObservabilityListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasObservers(): boolean {
  return listeners.size !== 0;
}

/** @internal — called by Tosser/RunnerIterator when observability flag is on. */
export function emitDraw(evt: DrawEvent): void {
  for (const l of listeners) l.onDraw?.(evt);
}
export function emitRunStart(evt: RunStartEvent): void {
  for (const l of listeners) l.onRunStart?.(evt);
}
export function emitRunEnd(evt: RunEndEvent): void {
  for (const l of listeners) l.onRunEnd?.(evt);
}

// Intended Tosser integration (pseudo-diff, not applied):
//
//   function* toss(...) {
//     for (let idx = 0, rng = random(seed); ; ++idx) {
//       if (observabilityOn && hasObservers()) {
//         emitRunStart({ runIndex: idx, seed, path: String(idx) });
//       }
//       rng.jump();
//       yield tossNext(generator, rng, idx);
//     }
//   }
//
// `onDraw` would be plumbed through Random by wrapping nextInt/nextBigInt
// to emit per-draw events — or, more cheaply, only when the Arbitrary
// itself calls a new `Random#observeDraw(label, value)` helper.
