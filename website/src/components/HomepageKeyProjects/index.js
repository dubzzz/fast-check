import React from 'react';
import BannerSection from '@site/src/components/BannerSection';
import jestLogo from '@site/static/img/logos/jest-128.png';
import jasmineLogo from '@site/static/img/logos/jasmine-128.png';
import fpTsLogo from '@site/static/img/logos/fp-ts-128.png';
import ramdaLogo from '@site/static/img/logos/ramda-128.png';
import styles from './styles.module.css';

export default function HomepageKeyProjects(props) {
  return (
    <BannerSection color={props.color}>
      <h2>They trust us…</h2>
      <p>These projects have been using fast-check for some time now and have found some issues thanks to it!</p>
      <div className={styles.trustUsLogos}>
        <a className={styles.trustUsSingleLogo} href="https://jestjs.io/" target="_blank" rel="noopener">
          <img src={jestLogo} alt="Jest Logo" width={128} height={128} loading="lazy" />
          <span>Jest</span>
        </a>
        <a className={styles.trustUsSingleLogo} href="https://jasmine.github.io/" target="_blank" rel="noopener">
          <img src={jasmineLogo} alt="Jasmine Logo" width={128} height={128} loading="lazy" />
          <span>Jasmine</span>
        </a>
        <a className={styles.trustUsSingleLogo} href="https://gcanti.github.io/fp-ts/" target="_blank" rel="noopener">
          <img src={fpTsLogo} alt="fp-ts Logo" width={128} height={128} loading="lazy" />
          <span>fp-ts</span>
        </a>
        <a className={styles.trustUsSingleLogo} href="https://ramdajs.com/" target="_blank" rel="noopener">
          <img src={ramdaLogo} alt="Ramda Logo" width={128} height={128} loading="lazy" />
          <span>Ramda</span>
        </a>
      </div>
    </BannerSection>
  );
}
