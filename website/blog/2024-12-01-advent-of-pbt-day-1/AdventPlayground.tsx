import React, { useEffect, useRef } from 'react';
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
  const ref = useRef<HTMLDivElement>(null);

  const adventSpecLines = [
    `import { test, expect } from 'vitest';`,
    `import fc from 'fast-check';`,
    `import ${functionName} from './advent.js';`,
    ``,
    ...signatureExtras.map((extra) => `// declare ${extra}`),
    `// declare ${signature}`,
    `test('helping Santa', () => {`,
    `  fc.assert(fc.property(fc.constant('noop'), (noop) => {`,
    `  }));`,
    `})`,
  ];

  const files: Record<string, string> = {
    'advent.js': snippet,
    'advent.test.ts': adventSpecLines.join('\n'),
    'package.json': JSON.stringify(
      {
        name: 'advent-of-pbt',
        private: true,
        scripts: {
          test: 'vitest',
        },
        dependencies: {
          'fast-check': 'latest',
        },
        devDependencies: {
          vitest: 'latest',
        },
        stackblitz: {
          installDependencies: true,
          startCommand: 'npx vitest --reporter=verbose',
        },
      },
      null,
      2,
    ),
  };

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    sdk.embedProject(
      el,
      {
        title: `Advent of PBT - Day ${day}`,
        description: 'Advent of PBT puzzle powered by Vitest',
        template: 'node',
        files,
      },
      {
        height: 600,
        openFile: 'advent.test.ts',
        hideExplorer: true,
        forceEmbedLayout: true,
      },
    );
    return () => {
      el.innerHTML = '';
    };
  }, []);

  return (
    <>
      <div ref={ref} />
      <Admonition type="note">
        <p>
          Can't access the online playground? Prefer to run it locally?
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
