// Remark: No tsx to keep setup simple but we might definitely add it
import * as React from 'react';
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

  return React.createElement(
    'div',
    {},
    React.createElement('input', {
      role: 'input',
      value: query,
      onChange: evt => {
        setQuery((evt.target as any).value);
      }
    }),
    React.createElement('ul', {}, searchResults.map(r => React.createElement('li', { key: r }, r)))
  );
}
