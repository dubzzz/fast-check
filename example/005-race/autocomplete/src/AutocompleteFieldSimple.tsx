import React from 'react';
import { search } from './Api';

type Props = {
  bugId?: 1;
};

export default function AutocompleteField(props: Props) {
  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([] as string[]);

  React.useEffect(() => {
    let canceled = false;
    const runQuery = async () => {
      const results = await search(query, 10);
      if (canceled && props.bugId !== 1) return;
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
