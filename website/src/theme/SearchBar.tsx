import React from 'react';
import { DocSearch } from '@docsearch/react';
import { useHistory } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import '@docsearch/css/dist/style.css';

export default function SearchBar() {
  const { siteConfig } = useDocusaurusContext();
  const history = useHistory();
  const algoliaConfig = siteConfig.themeConfig.algolia as {
    appId: string;
    apiKey: string;
    indexName: string;
    searchParameters?: Record<string, unknown>;
  } | undefined;

  if (!algoliaConfig) {
    return null;
  }

  return (
    <DocSearch
      appId={algoliaConfig.appId}
      apiKey={algoliaConfig.apiKey}
      indexName={algoliaConfig.indexName}
      searchParameters={algoliaConfig.searchParameters}
      navigator={{
        navigate({ itemUrl }) {
          history.push(itemUrl);
        },
      }}
    />
  );
}
