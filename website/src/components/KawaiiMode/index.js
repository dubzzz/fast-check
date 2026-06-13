import React, { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import KawaiiDolly from './KawaiiDolly';
import styles from './styles.module.css';

const STORAGE_KEY = 'fc-kawaii-mode';

/**
 * Opt-in "kawaii mode" easter egg.
 *
 * Renders a small floating dolly button. Toggling it flips a soft pastel skin
 * on the homepage (driven entirely by the `data-kawaii="on"` attribute on the
 * <html> element and CSS variables), and pops out a cheerful dolly mascot.
 *
 * Everything is reversible and the preference is remembered in localStorage.
 * When nothing is toggled, the default fast-check brand is left untouched.
 */
export default function KawaiiMode() {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  // Restore the saved preference once we're on the client.
  useEffect(() => {
    const saved = typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === 'on';
    setEnabled(saved);
    setReady(true);
  }, []);

  // Reflect the state onto <html> so the scoped pastel CSS can react to it, and
  // make sure we clean the attribute up when leaving the page.
  useEffect(() => {
    if (!ready || typeof document === 'undefined') return undefined;
    const root = document.documentElement;
    if (enabled) {
      root.setAttribute('data-kawaii', 'on');
    } else {
      root.removeAttribute('data-kawaii');
    }
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    return () => root.removeAttribute('data-kawaii');
  }, [enabled, ready]);

  const toggle = useCallback(() => setEnabled((value) => !value), []);

  return (
    <div className={styles.kawaiiRoot}>
      {enabled && (
        <div className={styles.mascot} aria-hidden="true">
          <div className={styles.speechBubble}>Let&apos;s fuzz~ ✨</div>
          <KawaiiDolly size={104} className={styles.mascotDolly} />
        </div>
      )}
      <button
        type="button"
        className={clsx(styles.toggle, enabled && styles.toggleOn)}
        onClick={toggle}
        aria-pressed={enabled}
        title={enabled ? 'Turn off kawaii mode' : 'Turn on kawaii mode'}
      >
        <KawaiiDolly size={34} className={styles.toggleDolly} />
        <span className={styles.toggleLabel}>{enabled ? 'kawaii on' : 'kawaii?'}</span>
      </button>
    </div>
  );
}
