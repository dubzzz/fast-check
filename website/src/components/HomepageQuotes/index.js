import React from 'react';
import BannerSection from '@site/src/components/BannerSection';
import styles from './styles.module.css';
import useBaseUrl from '@docusaurus/useBaseUrl';

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

export default function HomepageQuotes(props) {
  return (
    <BannerSection color={props.color}>
      <h2>They spread their love…</h2>
      <p>Kind messages spreading love around fast-check</p>
      <div className={styles.allQuotes}>
        <QuoteBlock
          avatarUrl={useBaseUrl('/img/_/avatar_64_TomerAberbach.jpg')}
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
          avatarUrl={useBaseUrl('/img/_/avatar_64_ssalbdivad.jpg')}
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
          avatarUrl={useBaseUrl('/img/_/avatar_64_abrgr.jpg')}
          profileUrl="https://twitter.com/abrgrBuilds"
          name="Adam Berger"
          jobDescription={
            '♥️ Helping product teams build amazing products with Team Pando: your collaborative space for product requierments'
          }
          messageUrl="https://twitter.com/abrgrBuilds/status/1587817599001411592"
          message={
            <>
              Wrote one property based test with <b>@ndubien</b>'s fast check and immediately found & fixed 3 bugs. How
              is generative testing not mainstream yet?
            </>
          }
        />
        <QuoteBlock
          avatarUrl={useBaseUrl('/img/_/avatar_64_emilianbold.jpg')}
          profileUrl="https://twitter.com/emilianbold"
          name="Emilian Bold"
          jobDescription={'Software engineer'}
          messageUrl="https://twitter.com/emilianbold/status/1623036880555020300"
          message={
            <>
              <b>@ndubien</b>'s fast-check is unit testing on steroids.
            </>
          }
        />
        <QuoteBlock
          avatarUrl={useBaseUrl('/img/_/avatar_64_jakebailey.jpg')}
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
              So, TypeScript has had a small epidemic of crashes (both my fault 😅), both were very annoying to find and
              minimize.
              <br />
              <br />I added a fast-check unittest to fuzz the parser and in seconds it found the same bug.
            </>
          }
        />
        <QuoteBlock
          avatarUrl={useBaseUrl('/img/_/avatar_64_Andarist.jpg')}
          profileUrl="https://twitter.com/AndaristRake"
          name="Mateusz Burzyński"
          jobDescription={
            <>
              programmer but also a little bit of code-poet wannabe, maintaining XState, Emotion, redux-saga & more, OSS
              enthusiast, working at <b>@statelyai</b>
            </>
          }
          messageUrl="https://twitter.com/AndaristRake/status/1652267691472822273?s=20"
          message={'Looks awesome, i need to finally try this out in practice'}
        />
      </div>
    </BannerSection>
  );
}
