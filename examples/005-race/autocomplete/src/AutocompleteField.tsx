import React from 'react';

// Injected as a props because CodeSandbox fails to provide jest.mock
// So it makes such import difficult to test
//// import { search } from './Api';

type Props = {
  enableBugUnrelatedResults?: boolean;
  enableBugBetterResults?: boolean;
  enableBugUnfilteredResults?: boolean;
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

      if (!lastQueryRef.current.startsWith(query) && !props.enableBugUnrelatedResults) {
        // FIXED BUG:
        // We show results for queries that are unrelated to the latest started query
        // eg.: AZ resolves while we look for QS, we show its results even if totally unrelated
        return;
      }
      if (
        lastQueryRef.current.startsWith(lastSuccessfulQueryRef.current) &&
        lastSuccessfulQueryRef.current.length > query.length &&
        !props.enableBugBetterResults
      ) {
        // FIXED BUG:
        // We might update results while we already received results
        // for a query less strict than the last this one
        // eg.: We receice AZ while we already have results for AZE
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
