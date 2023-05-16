import React from 'react';
import BannerSection from '@site/src/components/BannerSection';
import allContributors from './all-contributors.json';
import styles from './styles.module.css';

export default function HomepageContributors(props) {
  return (
    <BannerSection color={props.color}>
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
    </BannerSection>
  );
}
