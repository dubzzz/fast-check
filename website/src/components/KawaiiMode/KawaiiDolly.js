import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

// The Tangled "Dolly" mark (CC BY 4.0 — https://tangled.org/brand) already used
// in the navbar, reused here as the silhouette and dressed up with big sparkly
// eyes, rosy blush and a little smile to give fast-check a kawaii buddy.
const DOLLY_PATH =
  'm 16.775491,24.987061 c -0.78517,-0.0064 -1.384202,-0.234614 -2.033994,-0.631295 -0.931792,-0.490188 -1.643475,-1.31368 -2.152014,-2.221647 C 11.781409,23.136647 10.701392,23.744942 9.4922931,24.0886 8.9774725,24.238111 8.0757679,24.389777 6.5811304,23.84827 4.4270703,23.124679 2.8580086,20.883331 3.0363279,18.599583 3.0037061,17.652919 3.3488675,16.723769 3.8381157,15.925061 2.5329485,15.224503 1.4686756,14.048584 1.0611184,12.606459 0.81344502,11.816973 0.82385989,10.966486 0.91519098,10.154906 1.2422711,8.2387903 2.6795811,6.5725716 4.5299585,5.9732484 5.2685364,4.290122 6.8802592,3.0349975 8.706276,2.7794663 c 1.2124148,-0.1688264 2.46744,0.084987 3.52811,0.7011837 1.545426,-1.7139736 4.237779,-2.2205077 6.293579,-1.1676231 1.568222,0.7488935 2.689625,2.3113526 2.961888,4.0151464 1.492195,0.5977882 2.749007,1.8168898 3.242225,3.3644951 0.329805,0.9581836 0.340709,2.0135956 0.127128,2.9974286 -0.381606,1.535184 -1.465322,2.842146 -2.868035,3.556463 0.0034,0.273204 0.901506,2.243045 0.751284,3.729647 -0.03281,1.858525 -1.211631,3.619894 -2.846433,4.475452 -0.953967,0.556812 -2.084452,0.546309 -3.120531,0.535398 z';

/**
 * Cute, reactive fast-check mascot built on top of the Tangled dolly silhouette.
 *
 * @param {object} props
 * @param {number} [props.size] pixel size of the square SVG.
 * @param {string} [props.className]
 */
export default function KawaiiDolly({ size = 96, className, ...rest }) {
  return (
    <svg
      className={clsx(styles.dolly, className)}
      width={size}
      height={size}
      viewBox="0 0 25 25"
      role="img"
      aria-hidden="true"
      {...rest}
    >
      {/* Head — the reused Tangled dolly silhouette, softened to a pastel fill. */}
      <g transform="translate(-0.42924038,-0.87777209)">
        <path className={styles.dollyHead} d={DOLLY_PATH} />
      </g>

      {/* Kawaii face overlay. */}
      <g className={styles.dollyFace}>
        {/* Blush cheeks. */}
        <ellipse className={styles.dollyBlush} cx="7.4" cy="15.4" rx="1.5" ry="1" />
        <ellipse className={styles.dollyBlush} cx="17.4" cy="15.4" rx="1.5" ry="1" />

        {/* Eyes — large, glossy, with a kawaii sparkle. */}
        <g className={styles.dollyEyes}>
          <circle className={styles.dollyEyeWhite} cx="9.4" cy="12.4" r="1.9" />
          <circle className={styles.dollyEyeWhite} cx="15.6" cy="12.4" r="1.9" />
          <circle className={styles.dollyPupil} cx="9.4" cy="12.6" r="1.15" />
          <circle className={styles.dollyPupil} cx="15.6" cy="12.6" r="1.15" />
          <circle className={styles.dollySparkle} cx="8.95" cy="12.0" r="0.45" />
          <circle className={styles.dollySparkle} cx="15.15" cy="12.0" r="0.45" />
        </g>

        {/* Happy little mouth. */}
        <path className={styles.dollyMouth} d="M11 15.4 Q12.5 16.7 14 15.4" />
      </g>
    </svg>
  );
}
