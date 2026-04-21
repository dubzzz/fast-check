import React from 'react';

type Props = {
  search: (query: string, maxResults: number) => Promise<string[]>;
};

export default function AutocompleteField(props: Props) {
  const lastQueryRef = React.useRef('');
  const lastSuccessfulQueryRef = React.useRef('');
  const [query, setQuery] = React.useState(lastQueryRef.current);
  const [searchResults, setSearchResults] = React.useState([] as string[]);

  React.useEffect(() => {
    const runQuery = async () => {
      const results = await props.search(query, 10);

      if (!lastQueryRef.current.startsWith(query)) {
        return;
      }
      if (
        lastQueryRef.current.startsWith(lastSuccessfulQueryRef.current) &&
        lastSuccessfulQueryRef.current.length > query.length
      ) {
        return;
      }

      lastSuccessfulQueryRef.current = query;
      setSearchResults(results);
    };

    runQuery();
  }, [query, props]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(evt) => {
          const value = (evt.target as any).value;
          lastQueryRef.current = value;
          setQuery(value);
        }}
      />
      <ul>
        {searchResults
          .filter((r) => r.startsWith(query))
          .map((r) => (
            <li key={r}>{r}</li>
          ))}
      </ul>
    </div>
  );
}
