import React from 'react';
import { DocSearch } from '@docsearch/react';
import { useHistory } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import '@docsearch/css/dist/style.css';

export default function SearchBar() {
  const { siteConfig } = useDocusaurusContext();
  const history = useHistory();

  return (
    <DocSearch
      appId={siteConfig.themeConfig.algolia.appId}
      apiKey={siteConfig.themeConfig.algolia.apiKey}
      indexName={siteConfig.themeConfig.algolia.indexName}
      searchParameters={siteConfig.themeConfig.algolia.searchParameters}
      navigator={{
        navigate({ itemUrl }) {
          history.push(itemUrl);
        },
      }}
    />
  );
}
