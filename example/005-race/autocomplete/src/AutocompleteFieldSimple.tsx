import React from 'react';

// Injected as a props because CodeSandbox fails to provide jest.mock
// So it makes such import difficult to test
//// import { search } from './Api';

type Props = {
  bugId?: 1 | 2;
  search: (query: string, maxResults: number) => Promise<string[]>;
};

export default function AutocompleteField(props: Props) {
  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([] as string[]);

  React.useEffect(() => {
    let canceled = false;
    const runQuery = async () => {
      const results = await props.search(query, 10);
      if (canceled && props.bugId !== 1) return;
      setSearchResults(results);
    };
    if (!props.bugId || props.bugId > 2) {
      setSearchResults(r => r.filter(s => s.includes(query)));
    }
    runQuery();
    return () => {
      canceled = true;
    };
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
