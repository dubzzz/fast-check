import React, { useState } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackFileExplorer,
  SandpackTests,
  UnstyledOpenInCodeSandboxButton,
} from '@codesandbox/sandpack-react';
import { atomDark } from '@codesandbox/sandpack-themes';
import styles from './Playgrounds.module.css';
import * as snippets from './snippets.mjs';

type Props = {
  startSpecCode: string;
  anwserSpecCode: string;
  fileContent: string;
  fileName: string;
  fileExtension: string;
};
function SetupPlayground(props: Props) {
  const { startSpecCode, anwserSpecCode, fileContent, fileName, fileExtension } = props;
  const [specFile, setSpecFile] = useState({ key: 0, content: startSpecCode });

  return (
    <SandpackProvider
      key={specFile.key}
      theme={atomDark}
      files={{
        [`/${fileName}.${fileExtension}`]: {
          code: fileContent,
          readOnly: true,
          active: false,
          hidden: false,
        },
        [`/${fileName}.spec.${fileExtension}`]: {
          code: specFile.content,
          readOnly: false,
          active: true,
          hidden: false,
        },
      }}
      customSetup={{
        entry: `/${fileName}.${fileExtension}`,
        dependencies: {
          'fast-check': 'latest',
        },
      }}
    >
      <SandpackLayout>
        <SandpackCodeEditor style={{ height: 500 }} />
        <SandpackTests
          actionsChildren={
            <>
              <button onClick={() => setSpecFile((prev) => ({ key: prev.key + 1, content: startSpecCode }))}>
                Reset snippet
              </button>
              {specFile.content !== anwserSpecCode && (
                <button onClick={() => setSpecFile((prev) => ({ key: prev.key + 1, content: anwserSpecCode }))}>
                  Show answer
                </button>
              )}
            </>
          }
          verbose
          style={{ height: 500 }}
        />
      </SandpackLayout>
      <div className={styles.openInCodeSandbox}>
        <UnstyledOpenInCodeSandboxButton>Open in CodeSandbox</UnstyledOpenInCodeSandboxButton>
      </div>
    </SandpackProvider>
  );
}

export function YourFirstRace() {
  return (
    <SetupPlayground
      fileName="queue"
      fileExtension="js"
      fileContent={snippets.queueCodeV0}
      startSpecCode={snippets.queueUnitSpecCode}
      anwserSpecCode={snippets.queueBasicPBTSpecCode}
    />
  );
}

export function OneStepCloserToRealUsages() {
  return (
    <SetupPlayground
      fileName="queue"
      fileExtension="js"
      fileContent={snippets.queueCodeV1}
      startSpecCode={snippets.queueBasicPBTSpecCode}
      anwserSpecCode={snippets.queueMoreThan2CallsPBTSpecCode}
    />
  );
}

export function MultipleBatchesOfCalls() {
  return (
    <SetupPlayground
      fileName="queue"
      fileExtension="js"
      fileContent={snippets.queueCodeV2}
      startSpecCode={snippets.queueMoreThan2CallsPBTSpecCode}
      anwserSpecCode={snippets.queueFromBatchesPBTSpecCode}
    />
  );
}

export function MissingPart() {
  return (
    <SetupPlayground
      fileName="queue"
      fileExtension="js"
      fileContent={snippets.queueCodeV3}
      startSpecCode={snippets.queueFromBatchesPBTSpecCode}
      anwserSpecCode={snippets.missingPartPBTSpecCode}
    />
  );
}

function codeWithComments(code: string, comments: string[]): string {
  return `${comments.map((line) => `// ${line}`).join('\n')}\n\n${code}`;
}
function pastImplementationSnippet(code: string, partName: string): string {
  return codeWithComments(code, ['Implementation used within the part:', '> ' + partName]);
}
function pastTestSnippet(code: string, partName: string, variationName?: string | undefined): string {
  return codeWithComments(code, [
    'Test suggested for the part:',
    '> ' + partName,
    ...(variationName !== undefined ? [variationName] : []),
  ]);
}

export function WrapUpPlaygroundQueue() {
  const [reset, setReset] = useState(0);
  const queueImplementations = {
    'queue.v0.js': pastImplementationSnippet(snippets.queueCodeV0, 'Your first race condition test'),
    'queue.v1.js': pastImplementationSnippet(snippets.queueCodeV1, 'One step close to real usages'),
    'queue.v2.js': pastImplementationSnippet(snippets.queueCodeV2, 'Multiple batches of calls'),
    'queue.v3.js': pastImplementationSnippet(snippets.queueCodeV3, 'The missing part'),
    'queue.v4.js': codeWithComments(snippets.queueCodeV4, ['Pass all the tests of the tutorial']),
    'queue.v5.js': codeWithComments(snippets.queueCodeV5, ['Pass all the tests']),
  };
  const defaultQueueImplementation = 'queue.v5.js';
  const queueTests = {
    'queue.p0.spec.js': snippets.queueUnitSpecCode,
    'queue.p1.spec.js': pastTestSnippet(snippets.queueBasicPBTSpecCode, 'Your first race condition test'),
    'queue.p1.v2.spec.js': pastTestSnippet(
      snippets.queueBasicPBTWaitAllSpecCode,
      'Your first race condition test',
      'With waitAll',
    ),
    'queue.p2.spec.js': pastTestSnippet(snippets.queueMoreThan2CallsPBTSpecCode, 'One step close to real usages'),
    'queue.p3.spec.js': pastTestSnippet(snippets.queueFromBatchesPBTSpecCode, 'Multiple batches of calls'),
    'queue.p3.v2.spec.js': pastTestSnippet(
      snippets.queueBatchesAlternativePBTSpecCode,
      'Multiple batches of calls',
      'With delayed calls (no batches)',
    ),
    'queue.p4.spec.js': pastTestSnippet(snippets.missingPartPBTSpecCode, 'The missing part'),
    'queue.pnext.v1.spec.js': codeWithComments(snippets.extendedBackToWaitAllPBTSpecCode, [
      'Switch back to waitAll in queue.p4.spec',
    ]),
    'queue.pnext.v2.spec.js': codeWithComments(snippets.extendedWithExceptionsPBTSpecCode, ['Also cover error cases']),
  };
  const defaultQueueTest = 'queue.p4.spec.js';
  return (
    <SandpackProvider
      key={reset}
      theme={atomDark}
      files={{
        ...Object.fromEntries(
          Object.entries(queueImplementations).map(([fileName, fileContent]) => {
            return [
              `src/${fileName}`,
              {
                code: fileContent,
                readOnly: false,
                active: false,
                hidden: true,
              },
            ];
          }),
        ),
        ...Object.fromEntries(
          Object.entries(queueTests).map(([fileName, fileContent]) => {
            return [
              `tests/${fileName}`,
              {
                code: fileContent.replace('./queue.js', './../src/queue.js'),
                readOnly: false,
                active: fileName === defaultQueueTest,
                hidden: fileName !== defaultQueueTest,
              },
            ];
          }),
        ),
        'src/queue.js': {
          code: `export {queue} from './${defaultQueueImplementation}'`,
          readOnly: false,
          active: false,
          hidden: false,
        },
        'package.json': {
          code: JSON.stringify({ main: `src/queue.js` }),
          readOnly: true,
          active: false,
          hidden: true,
        },
      }}
      customSetup={{
        entry: `src/queue.js`,
        dependencies: {
          'fast-check': 'latest',
        },
      }}
    >
      <SandpackLayout>
        <SandpackFileExplorer style={{ height: 500 }} />
        <SandpackCodeEditor style={{ height: 500 }} />
        <SandpackTests
          actionsChildren={<button onClick={() => setReset((r) => r + 1)}>Reset snippets</button>}
          verbose
          style={{ height: 500 }}
        />
      </SandpackLayout>
      <div className={styles.openInCodeSandbox}>
        <UnstyledOpenInCodeSandboxButton>Open in CodeSandbox</UnstyledOpenInCodeSandboxButton>
      </div>
    </SandpackProvider>
  );
}
