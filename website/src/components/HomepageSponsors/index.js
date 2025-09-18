import React from 'react';
import BannerSection from '@site/src/components/BannerSection';
import styles from './styles.module.css';

export default function HomepageSponsors(props) {
  return (
    <BannerSection color={props.color}>
      <h2>They sponsor us…</h2>
      <p>They financially contribute to the fast-check</p>
      <object
        className={styles.allSponsorsWrapper}
        data="/img/sponsors.svg"
        type="image/svg+xml"
        title="Our sponsors"
      ></object>
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
