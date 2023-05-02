import React, { useState } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackTests,
  UnstyledOpenInCodeSandboxButton,
} from '@codesandbox/sandpack-react';
import { atomDark } from '@codesandbox/sandpack-themes';

const queueCode = `export function queue(fun) {
  return fun;
}`;

const queueUnitSpecCode = `import {queue} from './queue.js';

test('should resolve in call order', async () => {
  // Arrange
  const seenAnswers = [];
  const call = jest.fn()
    .mockImplementation(v => Promise.resolve(v));

  // Act
  const queued = queue(call);
  await Promise.all([
    queued(1).then(v => (seenAnswers.push(v))),
    queued(2).then(v => (seenAnswers.push(v))),
  ]);

  // Assert
  expect(seenAnswers).toEqual([1, 2]);
})`;

const queueBasicPBTSpecCode = `import {queue} from './queue.js';
import fc from 'fast-check';

test('should resolve in call order', async () => {
  await fc.assert(fc.asyncProperty(fc.scheduler(), async (s) => {
    // Arrange
    const seenAnswers = [];
    const call = jest.fn()
      .mockImplementation(v => Promise.resolve(v));
  
    // Act
    const queued = queue(s.scheduleFunction(call));
    queued(1).then(v => (seenAnswers.push(v)));
    queued(2).then(v => (seenAnswers.push(v)));
    await s.waitAll();
  
    // Assert
    expect(seenAnswers).toEqual([1, 2]);
  }))
})`;

function SetupSandbox(props) {
  const { startCode, anwserCode, fileName, fileExtension } = props;
  const [specFile, setSpecFile] = useState({ key: 0, content: startCode });

  return (
    <SandpackProvider
      key={specFile.key}
      theme={atomDark}
      files={{
        [`/${fileName}.${fileExtension}`]: {
          code: queueCode,
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
              <button onClick={() => setSpecFile((prev) => ({ key: prev.key + 1, content: startCode }))}>
                Reset snippet
              </button>
              {specFile.content !== queueBasicPBTSpecCode && (
                <button onClick={() => setSpecFile((prev) => ({ key: prev.key + 1, content: anwserCode }))}>
                  Show answer
                </button>
              )}
            </>
          }
          verbose
          style={{ height: 500 }}
        />
      </SandpackLayout>
      <UnstyledOpenInCodeSandboxButton>Open in CodeSandbox</UnstyledOpenInCodeSandboxButton>
    </SandpackProvider>
  );
}

export function Sand1() {
  return (
    <SetupSandbox
      fileName="queue"
      fileExtension="js"
      startCode={queueUnitSpecCode}
      anwserCode={queueBasicPBTSpecCode}
    />
  );
}
