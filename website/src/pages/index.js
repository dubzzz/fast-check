import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageContributors from '@site/src/components/HomepageContributors';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import HomepageHeader from '@site/src/components/HomepageHeader';
import HomepageKeyProjects from '@site/src/components/HomepageKeyProjects';
import HomepageQuotes from '@site/src/components/HomepageQuotes';
import HomepageSponsors from '@site/src/components/HomepageSponsors';

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={`${siteConfig.title} official documentation`} description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <HomepageKeyProjects color="blue" />
        <HomepageQuotes color="white" />
        <HomepageContributors color="blue" />
        <HomepageSponsors color="white" />
      </main>
    </Layout>
  );
}
