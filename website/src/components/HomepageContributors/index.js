import React from 'react';
import BannerSection from '@site/src/components/BannerSection';
import allContributors from './all-contributors.json';
import styles from './styles.module.css';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function HomepageContributors(props) {
  return (
    <BannerSection color={props.color}>
      <h2>They contribute to the project…</h2>
      <p>People involved at some point in the development of fast-check</p>
      <div className={styles.avatarSection}>
        {allContributors.contributors.map((contributor) => (
          <a
            key={contributor.login}
            className={styles.avatar}
            href={contributor.profile}
            title={`${contributor.name} (${contributor.login})`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={useBaseUrl(`/img/_/avatar_64_${contributor.login}.jpg`)}
              alt={`Avatar for ${contributor.name} (${contributor.login})`}
              width={64}
              height={64}
              loading="lazy"
            />
          </a>
        ))}
      </div>
    </BannerSection>
  );
}
