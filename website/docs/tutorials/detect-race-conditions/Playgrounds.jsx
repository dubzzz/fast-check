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
import {
  queueCodeV0,
  queueCodeV1,
  queueCodeV2,
  queueCodeV3,
  queueCodeV4,
  queueCodeV5,
  queueUnitSpecCode,
  queueBasicPBTSpecCode,
  queueBasicPBTWaitAllSpecCode,
  queueMoreThan2CallsPBTSpecCode,
  queueFromBatchesPBTSpecCode,
  queueBatchesAlternativePBTSpecCode,
  missingPartPBTSpecCode,
  extendedBackToWaitAllPBTSpecCode,
  extendedWithExceptionsPBTSpecCode,
} from './snippets.mjs';

function SetupPlayground(props) {
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
      fileContent={queueCodeV0}
      startSpecCode={queueUnitSpecCode}
      anwserSpecCode={queueBasicPBTSpecCode}
    />
  );
}

export function OneStepCloserToRealUsages() {
  return (
    <SetupPlayground
      fileName="queue"
      fileExtension="js"
      fileContent={queueCodeV1}
      startSpecCode={queueBasicPBTSpecCode}
      anwserSpecCode={queueMoreThan2CallsPBTSpecCode}
    />
  );
}

export function MultipleBatchesOfCalls() {
  return (
    <SetupPlayground
      fileName="queue"
      fileExtension="js"
      fileContent={queueCodeV2}
      startSpecCode={queueMoreThan2CallsPBTSpecCode}
      anwserSpecCode={queueFromBatchesPBTSpecCode}
    />
  );
}

export function MissingPart() {
  return (
    <SetupPlayground
      fileName="queue"
      fileExtension="js"
      fileContent={queueCodeV3}
      startSpecCode={queueFromBatchesPBTSpecCode}
      anwserSpecCode={missingPartPBTSpecCode}
    />
  );
}

function codeWithComments(code, comments) {
  return `${comments.map((line) => `// ${line}`).join('\n')}\n\n${code}`;
}
function pastImplementationSnippet(code, partName) {
  return codeWithComments(code, ['Implementation used within the part:', '> ' + partName]);
}
function pastTestSnippet(code, partName, variationName) {
  return codeWithComments(code, [
    'Test suggested for the part:',
    '> ' + partName,
    ...(variationName !== undefined ? [variationName] : []),
  ]);
}

export function WrapUpPlaygroundQueue() {
  const [reset, setReset] = useState(0);
  const queueImplementations = {
    'queue.v0.js': pastImplementationSnippet(queueCodeV0, 'Your first race condition test'),
    'queue.v1.js': pastImplementationSnippet(queueCodeV1, 'One step close to real usages'),
    'queue.v2.js': pastImplementationSnippet(queueCodeV2, 'Multiple batches of calls'),
    'queue.v3.js': pastImplementationSnippet(queueCodeV3, 'The missing part'),
    'queue.v4.js': codeWithComments(queueCodeV4, ['Pass all the tests of the tutorial']),
    'queue.v5.js': codeWithComments(queueCodeV5, ['Pass all the tests']),
  };
  const defaultQueueImplementation = 'queue.v5.js';
  const queueTests = {
    'queue.p0.spec.js': queueUnitSpecCode,
    'queue.p1.spec.js': pastTestSnippet(queueBasicPBTSpecCode, 'Your first race condition test'),
    'queue.p1.v2.spec.js': pastTestSnippet(
      queueBasicPBTWaitAllSpecCode,
      'Your first race condition test',
      'With waitAll'
    ),
    'queue.p2.spec.js': pastTestSnippet(queueMoreThan2CallsPBTSpecCode, 'One step close to real usages'),
    'queue.p3.spec.js': pastTestSnippet(queueFromBatchesPBTSpecCode, 'Multiple batches of calls'),
    'queue.p3.v2.spec.js': pastTestSnippet(
      queueBatchesAlternativePBTSpecCode,
      'Multiple batches of calls',
      'With delayed calls (no batches)'
    ),
    'queue.p4.spec.js': pastTestSnippet(missingPartPBTSpecCode, 'The missing part'),
    'queue.pnext.v1.spec.js': codeWithComments(extendedBackToWaitAllPBTSpecCode, [
      'Switch back to waitAll in queue.p4.spec',
    ]),
    'queue.pnext.v2.spec.js': codeWithComments(extendedWithExceptionsPBTSpecCode, ['Also cover error cases']),
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
          })
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
          })
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
