import React, { useEffect, useState } from 'react';

type Props = {
  suggestionsFor: (query: string) => Promise<string[]>; // Unable to mock imports in CodeSandbox
  bug?: boolean;
};

export default function DebouncedAutocomplete(props: Props) {
  const { bug, suggestionsFor } = props;
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([] as string[]);

  useEffect(() => {
    let canceled = false;
    if (query === '') {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(
      () =>
        suggestionsFor(query).then((suggestions) => {
          if (!canceled || bug) {
            setSuggestions(suggestions);
          }
        }),
      500
    );
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div>
      <label htmlFor="autocomplete-field">Select a package: </label>
      <input type="text" id="autocomplete-field" value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul role="list">
        {suggestions.map((s) => (
          <li key={s} role="listitem">
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
