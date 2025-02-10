import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import logoDataUri from '@site/static/img/logo.png';

import styles from './styles.module.css';

export default function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className={clsx('hero__title', styles.mainTitle)}>
          <img src={logoDataUri} alt={siteConfig.title} className={styles.mainTitleLogo} width="570px" height="103px" />
        </h1>
        <div className={clsx('hero__subtitle', styles.subTitle)}>
          Property-based testing for JavaScript and TypeScript
          <div className={styles.taglineBadges}>
            <a href="https://www.npmjs.com/package/fast-check" target="_blank" rel="noopener">
              <img src="https://badge.fury.io/js/fast-check.svg" alt="npm version" width={133} height={20} />
            </a>
            <a href="https://www.npmjs.com/package/fast-check" target="_blank" rel="noopener">
              <img src="https://img.shields.io/npm/dm/fast-check" alt="monthly downloads" width={146} height={20} />
            </a>
            <a href="https://github.com/dubzzz/fast-check/stargazers" target="_blank" rel="noopener">
              <img
                src="https://img.shields.io/github/stars/dubzzz/fast-check?style=social"
                alt="number of stars"
                width={90}
                height={20}
              />
            </a>
          </div>
        </div>
        <div>
          <div className={styles.quickNavigationButtons}>
            <Link className="button button--secondary button--lg" to="/docs/tutorials/quick-start/">
              Quick Start – 5min ⏱️
            </Link>
            <Link
              className={clsx('button', 'button--secondary', 'button--lg', styles.adventButton)}
              to="/blog/tags/advent-of-pbt-2024/"
            >
              Save Christmas – Play! 🎄
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
