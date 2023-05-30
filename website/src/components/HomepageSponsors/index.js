import React from 'react';
import BannerSection from '@site/src/components/BannerSection';
import styles from './styles.module.css';

export default function HomepageSponsors(props) {
  return (
    <BannerSection color={props.color}>
      <h2>They sponsor us…</h2>
      <p>They financially contribute to the fast-check</p>
      <a href="https://github.com/sponsors/dubzzz" target="_blank" rel="noopener" className={styles.allSponsorsWrapper}>
        <img
          align="center"
          src="https://raw.githubusercontent.com/dubzzz/sponsors-svg/main/sponsorkit/sponsors.svg"
          alt="all sponsors"
          loading="lazy"
        />
      </a>
      <p>
        You can also become one of them by contributing via{' '}
        <a href="https://github.com/sponsors/dubzzz" target="_blank" rel="noopener">
          GitHub Sponsors
        </a>{' '}
        or{' '}
        <a href="https://opencollective.com/fast-check/contribute" target="_blank" rel="noopener">
          OpenCollective
        </a>
        .
      </p>
    </BannerSection>
  );
}
