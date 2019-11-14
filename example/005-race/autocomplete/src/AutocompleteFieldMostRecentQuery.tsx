import React from 'react';

// Injected as a props because CodeSandbox fails to provide jest.mock
// So it makes such import difficult to test
//// import { search } from './Api';

type Props = {
  search: (query: string, maxResults: number) => Promise<string[]>;
};

export default function AutocompleteField(props: Props) {
  // Contrary to the other implementation of AutocompleteField
  // This one shows last available answer cominng from the api
  // Which is basically not what we expect from an autocomplete field (check it with the test suite)

  const lastQueryIdRef = React.useRef(0);
  const lastSuccessfulQueryIdRef = React.useRef(lastQueryIdRef.current);
  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([] as string[]);

  React.useEffect(() => {
    const queryId = ++lastQueryIdRef.current;
    const runQuery = async () => {
      const results = await props.search(query, 10);

      if (lastSuccessfulQueryIdRef.current > queryId) {
        // If a more recent query already succeeded
        // Then we discard this query
        return;
      }

      lastSuccessfulQueryIdRef.current = queryId;
      setSearchResults(results);
    };
    runQuery();
  }, [query, props]);

  return (
    <div>
      <input
        role="input"
        value={query}
        onChange={evt => {
          const value = (evt.target as any).value;
          setQuery(value);
        }}
      />
      <ul>
        {searchResults.map(r => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
