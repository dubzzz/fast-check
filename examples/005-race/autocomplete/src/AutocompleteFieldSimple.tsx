import React from 'react';

// Injected as a props because CodeSandbox fails to provide jest.mock
// So it makes such import difficult to test
//// import { search } from './Api';

type Props = {
  enableBugDoNotDiscardOldQueries?: boolean;
  enableBugUnfilteredResults?: boolean;
  search: (query: string, maxResults: number) => Promise<string[]>;
};

export default function AutocompleteField(props: Props) {
  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([] as string[]);

  React.useEffect(() => {
    let canceled = false;
    const runQuery = async () => {
      const results = await props.search(query, 10);
      if (canceled && !props.enableBugDoNotDiscardOldQueries) return;
      setSearchResults(results);
    };
    runQuery();
    return () => {
      canceled = true;
    };
  }, [query, props]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(evt) => {
          const value = (evt.target as any).value;
          setQuery(value);
        }}
      />
      <ul>
        {searchResults
          // FIXED BUG: We don't filter the results we receive
          // As we want to display results as soon as possible, even if our searchResults
          // are related to a past query we want to use them to provide the user with some hints
          .filter((r) => (props.enableBugUnfilteredResults ? true : r.startsWith(query)))
          .map((r) => (
            <li key={r}>{r}</li>
          ))}
      </ul>
    </div>
  );
}
