import React from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackTests,
  UnstyledOpenInCodeSandboxButton,
} from '@codesandbox/sandpack-react';
import { atomDark } from '@codesandbox/sandpack-themes';
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
  const styleCodeEditor = { height: 400 };
  const styleTests = { height: 200 };

  const adventSpecLines = [
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

  return (
    <>
      <SandpackProvider
        theme={atomDark}
        files={{
          [`/advent.js`]: {
            code: snippet,
            readOnly: true,
            active: false,
            hidden: true,
          },
          [`/advent.spec.ts`]: {
            code: adventSpecLines.join('\n'),
            readOnly: false,
            active: true,
            hidden: false,
          },
          'package.json': {
            code: JSON.stringify({ main: `src/advent.js` }),
            readOnly: true,
            active: false,
            hidden: true,
          },
        }}
        customSetup={{
          entry: `/advent.js`,
          dependencies: {
            'fast-check': 'latest',
          },
        }}
      >
        <SandpackLayout>
          <SandpackCodeEditor style={styleCodeEditor} />
        </SandpackLayout>
        <SandpackLayout>
          <SandpackTests verbose style={styleTests} />
        </SandpackLayout>
        <p>
          <UnstyledOpenInCodeSandboxButton>
            Open in CodeSandbox for more options: including typings...
          </UnstyledOpenInCodeSandboxButton>
        </p>
      </SandpackProvider>
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
