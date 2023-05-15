import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import logoDataUri from '@site/static/img/logo.png';
import jestLogo from '@site/static/img/logos/jest-128.png';
import jasmineLogo from '@site/static/img/logos/jasmine-128.png';
import fpTsLogo from '@site/static/img/logos/fp-ts-128.png';
import ramdaLogo from '@site/static/img/logos/ramda-128.png';
import allContributors from './all-contributors.json';

import styles from './index.module.css';

function QuoteBlock(props) {
  return (
    <div className={styles.quoteBlock}>
      <div className={styles.quoteBlockMessage}>
        <a href={props.messageUrl} target="_blank" rel="noopener">
          {props.message}
        </a>
      </div>
      <div className={styles.quoteBlockAuthor}>
        <a className={styles.avatar} href={props.profileUrl} target="_blank" rel="noopener noreferrer">
          <img src={props.avatarUrl} alt={props.name} width={64} height={64} loading="lazy" />
          <div className={styles.quoteBlockAuthorDetails}>
            <div>{props.name}</div>
            <div>{props.jobDescription}</div>
          </div>
        </a>
      </div>
    </div>
  );
}

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className={clsx('hero__title', styles.mainTitle)}>
          <img src={logoDataUri} alt={siteConfig.title} className={styles.mainTitleLogo} width="570px" />
        </h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/tutorials/quick-start/">
            Quick Start - 5min ⏱️
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} official documentation`}
      description="Property-based testing for JavaScript and TypeScript"
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <section className={styles.blueBanner}>
          <div className={clsx('container', styles.subsectionContainer)}>
            <h2>They trust us…</h2>
            <p>These projects have been using fast-check for some time now and have found some issues thanks to it!</p>
            <div className={styles.trustUsLogos}>
              <a className={styles.trustUsSingleLogo} href="https://jestjs.io/" target="_blank" rel="noopener">
                <img src={jestLogo} alt="Jest Logo" />
                <span>Jest</span>
              </a>
              <a className={styles.trustUsSingleLogo} href="https://jasmine.github.io/" target="_blank" rel="noopener">
                <img src={jasmineLogo} alt="Jasmine Logo" />
                <span>Jasmine</span>
              </a>
              <a
                className={styles.trustUsSingleLogo}
                href="https://gcanti.github.io/fp-ts/"
                target="_blank"
                rel="noopener"
              >
                <img src={fpTsLogo} alt="fp-ts Logo" />
                <span>fp-ts</span>
              </a>
              <a className={styles.trustUsSingleLogo} href="https://ramdajs.com/" target="_blank" rel="noopener">
                <img src={ramdaLogo} alt="Ramda Logo" />
                <span>Ramda</span>
              </a>
            </div>
          </div>
        </section>
        {/*
        https://twitter.com/andhaveaniceday/status/1643468822752677888?s=20
        https://twitter.com/ssalbdivad/status/1643617544475901952?s=20
        https://twitter.com/AndaristRake/status/1652267691472822273?s=20
        https://twitter.com/ssalbdivad/status/1652672718381146114?s=20
        https://twitter.com/calebjasik/status/1657527810766798852?s=20
        */}
        <section className={styles.whiteBanner}>
          <div className={clsx('container', styles.subsectionContainer)}>
            <h2>They spread their love…</h2>
            <p>Kind messages spreading love around fast-check</p>
            <div className={styles.allQuotes}>
              <QuoteBlock
                avatarUrl="https://github.com/TomerAberbach.png"
                profileUrl="https://twitter.com/TomerAberbach"
                name="Tomer Aberbach"
                jobDescription={
                  <>
                    Working on <b>@Google Docs</b>
                  </>
                }
                messageUrl="https://twitter.com/TomerAberbach/status/1350560547058675713"
                message={'fast-check is too good!'}
              />
              <QuoteBlock
                avatarUrl="https://github.com/ssalbdivad.png"
                profileUrl="https://twitter.com/ssalbdivad"
                name="David Blass"
                jobDescription={
                  <>
                    Full-time open source dev and author of <b>@arktypeio</b>, TypeScript's 1:1 validator optimized from
                    editor to runtime⛵
                  </>
                }
                messageUrl="https://twitter.com/ssalbdivad/status/1652672718381146114?s=20"
                message={'Can attest, it is awesome!🔥'}
              />
              <QuoteBlock
                avatarUrl="https://github.com/abrgr.png"
                profileUrl="https://twitter.com/abrgrBuilds"
                name="Adam Berger"
                jobDescription={'Founder & CEO, Team Pando'}
                messageUrl="https://twitter.com/abrgrBuilds/status/1587817599001411592"
                message={
                  <>
                    Wrote one property based test with <b>@ndubien</b>'s fast check and immediately found & fixed 3
                    bugs. How is generative testing not mainstream yet?
                  </>
                }
              />
              <QuoteBlock
                avatarUrl="https://github.com/emilianbold.png"
                profileUrl="https://twitter.com/emilianbold"
                name="Emilian Bold"
                jobDescription={'Software engineer'}
                messageUrl="https://twitter.com/emilianbold/status/1623036880555020300"
                message={"@ndubien's fast-check is unit testing on steroids."}
              />
              <QuoteBlock
                avatarUrl="https://github.com/jakebailey.png"
                profileUrl="https://twitter.com/andhaveaniceday"
                name="Jake Bailey"
                jobDescription={
                  <>
                    Senior Software Engineer at Microsoft working on <b>@typescript</b>
                  </>
                }
                messageUrl="https://twitter.com/andhaveaniceday/status/1643468822752677888?s=20"
                message={
                  <>
                    So, TypeScript has had a small epidemic of crashes (both my fault 😅), both were very annoying to
                    find and minimize.
                    <br />
                    <br />I added a fast-check unittest to fuzz the parser and in seconds it found the same bug.
                  </>
                }
              />
              <QuoteBlock
                avatarUrl="https://github.com/Andarist.png"
                profileUrl="https://twitter.com/AndaristRake"
                name="Mateusz Burzyński"
                jobDescription={
                  <>
                    programmer but also a little bit of code-poet wannabe, maintaining XState, Emotion, redux-saga &
                    more, OSS enthusiast, working at <b>@statelyai</b>
                  </>
                }
                messageUrl="https://twitter.com/AndaristRake/status/1652267691472822273?s=20"
                message={'Looks awesome, i need to finally try this out in practice'}
              />
            </div>
          </div>
        </section>
        <section className={styles.blueBanner}>
          <div className={clsx('container', styles.subsectionContainer)}>
            <h2>They contribute to the project…</h2>
            <p>People involved at some point in the development of fast-check</p>
            <div className={styles.avatarSection}>
              {allContributors.contributors.map((contributor) => (
                <a
                  className={styles.avatar}
                  href={contributor.profile}
                  title={`${contributor.name} (${contributor.login})`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={contributor.avatar_url}
                    alt={`Avatar for ${contributor.name} (${contributor.login})`}
                    width={64}
                    height={64}
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          </div>
        </section>
        <section className={styles.whiteBanner}>
          <div className={clsx('container', styles.subsectionContainer)}>
            <h2>They sponsor us…</h2>
            <p>They financially contribute to the fast-check</p>
            <a
              href="https://github.com/sponsors/dubzzz"
              target="_blank"
              rel="noopener"
              className={styles.allSponsorsWrapper}
            >
              <img
                align="center"
                src="https://raw.githubusercontent.com/dubzzz/sponsors-svg/main/sponsorkit/sponsors.svg"
                alt="all sponsors"
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
          </div>
        </section>
      </main>
    </Layout>
  );
}
