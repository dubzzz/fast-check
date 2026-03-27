import React, { useEffect, useId, useRef } from 'react';
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
  const iframeName = `stackblitz${rawId.replace(/:/g, '-')}`;
  const formRef = useRef<HTMLFormElement>(null);

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
          startCommand: 'npx vitest --watch --reporter=verbose',
        },
      },
      null,
      2,
    ),
  };

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <>
      <iframe
        name={iframeName}
        title={`Advent of PBT - Day ${day}`}
        style={{ width: '100%', height: 600, border: 0 }}
      />
      <form
        ref={formRef}
        action={`https://stackblitz.com/run?file=advent.test.ts&hideExplorer=1`}
        method="POST"
        target={iframeName}
        style={{ display: 'none' }}
      >
        <input type="hidden" name="project[title]" value={`Advent of PBT - Day ${day}`} />
        <input type="hidden" name="project[description]" value="Advent of PBT puzzle powered by Vitest" />
        <input type="hidden" name="project[template]" value="node" />
        {Object.entries(files).map(([path, content]) => (
          <input key={path} type="hidden" name={`project[files][${path}]`} value={content} />
        ))}
      </form>
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
