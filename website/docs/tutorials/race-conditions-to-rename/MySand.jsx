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

export function Sand1() {
  const [specFile, setSpecFile] = useState({ key: 0, content: queueUnitSpecCode });

  return (
    <SandpackProvider
      key={specFile.key}
      theme={atomDark}
      files={{
        '/queue.js': {
          code: queueCode,
          readOnly: true,
          active: false,
          hidden: false,
        },
        '/queue.spec.js': {
          code: specFile.content,
          readOnly: false,
          active: true,
          hidden: false,
        },
      }}
      customSetup={{
        entry: '/queue.js',
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
              <button onClick={() => setSpecFile((prev) => ({ key: prev.key + 1, content: queueUnitSpecCode }))}>
                Reset snippet
              </button>
              {specFile.content !== queueBasicPBTSpecCode && (
                <button onClick={() => setSpecFile((prev) => ({ key: prev.key + 1, content: queueBasicPBTSpecCode }))}>
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
