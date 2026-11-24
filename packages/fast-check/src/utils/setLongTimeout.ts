const safeSetTimeout = setTimeout;
const safeClearTimeout = clearTimeout;
const safePerformanceNow = performance.now.bind(performance);
const maxTimerDelay = 0x7fffffff;

/** Schedule a callback and return a function that cancels the pending timer. */
export function setLongTimeout(callback: () => void, delay: number): () => void {
  if (delay === Infinity) return () => undefined;

  let timer: ReturnType<typeof setTimeout>;
  if (delay > maxTimerDelay) {
    const start = safePerformanceNow();
    const onChunkEnd = () => {
      // A timer may wake up late, so count the actual time spent waiting.
      const remaining = delay - (safePerformanceNow() - start);
      if (remaining > maxTimerDelay) {
        timer = safeSetTimeout(onChunkEnd, maxTimerDelay);
      } else if (remaining > 0) {
        timer = safeSetTimeout(callback, remaining);
      } else {
        callback();
      }
    };
    timer = safeSetTimeout(onChunkEnd, maxTimerDelay);
  } else {
    timer = safeSetTimeout(callback, delay);
  }
  return () => safeClearTimeout(timer);
}
