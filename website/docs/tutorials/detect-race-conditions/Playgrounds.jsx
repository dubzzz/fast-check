import React, { useState } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackTests,
  UnstyledOpenInCodeSandboxButton,
} from '@codesandbox/sandpack-react';
import { atomDark } from '@codesandbox/sandpack-themes';
import styles from './Playgrounds.module.css';

// Does not queue at all
const queueCodeV0 = `export function queue(fun) {
  return fun;
}`;

// Only queue after last request
const queueCodeV1 = `export function queue(fun) {
  let lastQuery = Promise.resolve();
  return (...args) => {
    const currentQuery = fun(...args);
    const returnedQuery = lastQuery.then(() => currentQuery);
    lastQuery = currentQuery;
    return returnedQuery;
  };
}`;

// May still not queue enough due to early cleaning
const queueCodeV2 = `export function queue(fun) {
  let pastQueries = [];
  return (...args) => {
    const currentQuery = fun(...args);
    const returnedQuery = Promise.all(pastQueries)
      .finally(() => (pastQueries = []))
      .then(() => currentQuery);
    pastQueries.push(currentQuery);
    return returnedQuery;
  };
}`;

const queueCodeV3 = `export function queue(fun) {
  let pastQueries = [];
  return (...args) => {
    const currentQuery = fun(...args);
    const knownPastQueries = pastQueries;
    const returnedQuery = Promise.all(pastQueries)
      .finally(() => {
        if (knownPastQueries === pastQueries)
          pastQueries = [];
      })
      .then(() => currentQuery);
    pastQueries = [...pastQueries, currentQuery];
    return returnedQuery;
  };
}`;

const queueCodeV4 = `export function queue(fun) {
  let queryId = 0;
  let lastQuery = null;
  return (...args) => {
    const selfQueryId = ++queryId;
    if (lastQuery === null) {
      lastQuery = fun(...args)
        .finally(() => {
          if (queryId === selfQueryId)
            lastQuery = null;
        });
    } else {
      lastQuery = lastQuery
        .then(
          () => fun(...args),
          () => fun(...args),
        )
        .finally(() => {
          if (queryId === selfQueryId)
            lastQuery = null;
        });
    }
    return lastQuery;
  };
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
    const pendingQueries = [];
    const seenAnswers = [];
    const call = jest.fn()
      .mockImplementation(v => Promise.resolve(v));
  
    // Act
    const queued = queue(s.scheduleFunction(call));
    pendingQueries.push(queued(1).then(v => (seenAnswers.push(v))));
    pendingQueries.push(queued(2).then(v => (seenAnswers.push(v))));
    await s.waitFor(Promise.all(pendingQueries));
  
    // Assert
    expect(seenAnswers).toEqual([1, 2]);
  }))
})`;

const queueMoreThan2CallsPBTSpecCode = `import {queue} from './queue.js';
import fc from 'fast-check';

test('should resolve in call order', async () => {
  await fc.assert(fc.asyncProperty(fc.scheduler(), fc.integer({min: 1, max: 10}), async (s, numCalls) => {
    // Arrange
    const pendingQueries = [];
    const seenAnswers = [];
    const expectedAnswers = [];
    const call = jest.fn()
      .mockImplementation(v => Promise.resolve(v));
  
    // Act
    const queued = queue(s.scheduleFunction(call));
    for (let id = 0 ; id !== numCalls ; ++id) {
      expectedAnswers.push(id);
      pendingQueries.push(queued(id).then(v => (seenAnswers.push(v))));
    }
    await s.waitFor(Promise.all(pendingQueries));
  
    // Assert
    expect(seenAnswers).toEqual(expectedAnswers);
  }))
})`;

const queueBatchesAlternativePBTSpecCode = `import {queue} from './queue.js';
import fc from 'fast-check';

test('should resolve in call order', async () => {
  await fc.assert(fc.asyncProperty(fc.scheduler(), fc.integer({min: 1, max: 10}), async (s, numCalls) => {
    // Arrange
    const pendingQueries = [];
    const seenAnswers = [];
    const expectedAnswers = [];
    const call = jest.fn()
      .mockImplementation(v => Promise.resolve(v));
  
    // Act
    const queued = queue(s.scheduleFunction(call));
    for (let id = 0 ; id !== numCalls ; ++id) {
      pendingQueries.push(
        s.schedule(Promise.resolve(\`Fire the call for \${id}\`))
          .then(() => {
            expectedAnswers.push(id);
            return queued(id);
          })
          .then(v => (seenAnswers.push(v)))
      );
    }
    await s.waitFor(Promise.all(pendingQueries));
  
    // Assert
    expect(seenAnswers).toEqual(expectedAnswers);
  }))
})`;

const queueFromBatchesPBTSpecCode = `import {queue} from './queue.js';
import fc from 'fast-check';

test('should resolve in call order', async () => {
  await fc.assert(fc.asyncProperty(fc.scheduler(), fc.array(fc.integer({min: 1, max: 10}), {minLength: 1}), async (s, batches) => {
    // Arrange
    const pendingQueries = [];
    const seenAnswers = [];
    const expectedAnswers = [];
    const call = jest.fn()
      .mockImplementation(v => Promise.resolve(v));
  
    // Act
    const queued = queue(s.scheduleFunction(call));
    let lastId = 0;
    const { task } = s.scheduleSequence(batches.map((batch, index) => {
      return {
        label: \`Fire batch #\${index + 1} (\${batch} calls)\`,
        builder: async () => {
          for (let id = 0 ; id !== batch ; ++id, ++lastId) {
            expectedAnswers.push(lastId);
            pendingQueries.push(queued(lastId).then(v => (seenAnswers.push(v))));
          }
        },
      }
    }));
    await s.waitFor(task);
    await s.waitFor(Promise.all(pendingQueries));
  
    // Assert
    expect(seenAnswers).toEqual(expectedAnswers);
  }))
})`;

const nextPBTSpecCode = `import {queue} from './queue.js';
import fc from 'fast-check';

test('should resolve in call order', async () => {
  await fc.assert(fc.asyncProperty(fc.scheduler(), fc.array(fc.integer({min: 1, max: 10}), {minLength: 1}), async (s, batches) => {
    // Arrange
    const pendingQueries = [];
    const seenAnswers = [];
    const expectedAnswers = [];
    const call = jest.fn()
      .mockImplementation(v => Promise.resolve(v));
    const scheduledCall = s.scheduleFunction(call);
    let concurrentQueriesDetected = false;
    let queryPending = false;
    const monitoredScheduledCall = (...args) => {
      concurrentQueriesDetected ||= queryPending;
      queryPending = true;
      return scheduledCall(...args).finally(() => (queryPending = false));
    };
  
    // Act
    const queued = queue(monitoredScheduledCall);
    let lastId = 0;
    const { task } = s.scheduleSequence(batches.map((batch, index) => {
      return {
        label: \`Fire batch #\${index + 1} (\${batch} calls)\`,
        builder: async () => {
          for (let id = 0 ; id !== batch ; ++id, ++lastId) {
            expectedAnswers.push(lastId);
            pendingQueries.push(queued(lastId).then(v => (seenAnswers.push(v))));
          }
        },
      }
    }));
    await s.waitFor(task);
    await s.waitFor(Promise.all(pendingQueries));
  
    // Assert
    expect(seenAnswers).toEqual(expectedAnswers);
    expect(concurrentQueriesDetected).toBe(false);
  }))
})`;

function SetupPlayground(props) {
  const { startSpecCode, anwserSpecCode, fileContent, fileName, fileExtension, specs = [] } = props;
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
        ...Object.fromEntries(
          specs.map((specContent, index) => {
            return [`./${fileName}.v${index}.spec.${fileExtension}`, specContent];
          })
        ),
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
      anwserSpecCode={nextPBTSpecCode}
    />
  );
}

export function DebugPlaygroundsQueue() {
  return (
    <SetupPlayground
      fileName="queue"
      fileExtension="js"
      fileContent={queueCodeV2}
      startSpecCode={queueUnitSpecCode}
      anwserSpecCode={queueUnitSpecCode}
      specs={[queueUnitSpecCode, queueBasicPBTSpecCode, queueMoreThan2CallsPBTSpecCode, queueFromBatchesPBTSpecCode]}
    />
  );
}
