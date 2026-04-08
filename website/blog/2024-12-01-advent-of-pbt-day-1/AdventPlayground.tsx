import React, { useEffect, useId, useRef } from 'react';
import sdk from '@stackblitz/sdk';
import Admonition from '@theme/Admonition';

type Props = {
  functionName: string;
  signature: string;
  signatureExtras?: string[];
  snippet: string;
  day: number;
};

export default function AdventPlayground(props: Props) {
  const { functionName, signature, signatureExtras, snippet, day } = props;
  const rawId = useId();
  const containerId = `stackblitz-${rawId}`;
  const containerRef = useRef<HTMLDivElement>(null);

  const snippetDTS = [
    ...(signatureExtras ?? []).map((extra) => `declare ${extra}`),
    `declare function ${signature}`,
    `export default ${functionName}`,
  ].join('\n');
  const spec = [
    `import { test, expect } from 'vitest';`,
    `import fc from 'fast-check';`,
    `import ${functionName} from './advent.js';`,
    ``,
    ...(signatureExtras ?? []).map((extra) => `// declare ${extra}`),
    `// declare function ${signature}`,
    `test('helping Santa', () => {`,
    `  fc.assert(fc.property(fc.constant('noop'), (noop) => {`,
    `  }));`,
    `})`,
  ].join('\n');

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }
    const mount = async () => {
      const packageJsonContent = {
        name: `advent-of-pbt-day${day}`,
        private: true,
        scripts: { test: 'vitest' },
        devDependencies: { 'fast-check': 'latest', typescript: 'latest', vitest: 'latest' },
        stackblitz: { installDependencies: true, startCommand: 'npx vitest --watch --reporter=verbose' },
      };
      await sdk.embedProject(
        container,
        {
          title: `Advent of PBT - Day ${day}`,
          description: 'Advent of PBT puzzle powered by Vitest',
          template: 'node',
          files: {
            'advent.js': snippet,
            'advent.d.ts': snippetDTS,
            'advent.test.ts': spec,
            'package.json': JSON.stringify(packageJsonContent, null, 2),
          },
        },
        { height: 600, openFile: 'advent.test.ts', hideExplorer: true, view: 'editor' },
      );
    };
    mount();
    return () => {
      container.innerHTML = '';
    };
  }, [snippet, snippetDTS, spec, day]);

  return (
    <>
      <div ref={containerRef} id={containerId} />
      <Admonition type="note">
        <p>
          Can’t access the online playground? Prefer to run it locally?
          <br />
          No problem! You can download the source file{' '}
          <a
            download={`advent-day-${String(day).padStart(2, '0')}.mjs`}
            href={`data:application/octet-stream;base64,${btoa(snippet)}`}
          >
            here
          </a>
          .
        </p>
      </Admonition>
    </>
  );
}
