import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import sdk from '@stackblitz/sdk';
import styles from './Playgrounds.module.css';
import * as snippets from './snippets.mjs';

const defaultPackageJson = JSON.stringify(
  {
    name: 'fast-check-playground',
    private: true,
    scripts: {
      test: 'vitest',
    },
    devDependencies: {
      'fast-check': 'latest',
      vitest: 'latest',
    },
    stackblitz: {
      installDependencies: true,
      startCommand: 'npx vitest --watch --reporter=verbose',
    },
  },
  null,
  2,
);

type EmbedProps = {
  files: Record<string, string>;
  options: {
    openFile: string;
    hideExplorer: boolean;
  };
};

function StackBlitzEmbed({ files, options }: EmbedProps) {
  const rawId = useId();
  const containerId = `stackblitz-${rawId}`;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }
    const mount = async () => {
      await sdk.embedProject(
        container,
        {
          title: 'fast-check playground',
          description: 'Interactive fast-check playground powered by Vitest',
          template: 'node',
          files,
        },
        {
          height: 600,
          view: 'editor',
          openFile: options.openFile,
          hideExplorer: options.hideExplorer,
        },
      );
    };
    mount();
    return () => {
      container.innerHTML = '';
    };
  }, [files, options.openFile, options.hideExplorer]);

  return <div ref={containerRef} id={containerId} />;
}

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

  const files: Record<string, string> = useMemo(
    () => ({
      [`${fileName}.${fileExtension}`]: fileContent,
      [`${fileName}.test.${fileExtension}`]: specFile.content,
      'package.json': defaultPackageJson,
    }),
    [fileName, fileExtension, fileContent, specFile.content],
  );

  return (
    <div key={specFile.key}>
      <StackBlitzEmbed
        files={files}
        options={{
          openFile: `${fileName}.test.${fileExtension}`,
          hideExplorer: true,
        }}
      />
      <div className={styles.playgroundActions}>
        <button onClick={() => setSpecFile((prev) => ({ key: prev.key + 1, content: startSpecCode }))}>
          Reset snippet
        </button>
        <button onClick={() => setSpecFile((prev) => ({ key: prev.key + 1, content: anwserSpecCode }))}>
          Show answer
        </button>
      </div>
    </div>
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

function buildWrapUpFiles() {
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
    'queue.p0.test.js': snippets.queueUnitSpecCode,
    'queue.p1.test.js': pastTestSnippet(snippets.queueBasicPBTSpecCode, 'Your first race condition test'),
    'queue.p1.v2.test.js': pastTestSnippet(
      snippets.queueBasicPBTWaitAllSpecCode,
      'Your first race condition test',
      'With waitAll',
    ),
    'queue.p2.test.js': pastTestSnippet(snippets.queueMoreThan2CallsPBTSpecCode, 'One step close to real usages'),
    'queue.p3.test.js': pastTestSnippet(snippets.queueFromBatchesPBTSpecCode, 'Multiple batches of calls'),
    'queue.p3.v2.test.js': pastTestSnippet(
      snippets.queueBatchesAlternativePBTSpecCode,
      'Multiple batches of calls',
      'With delayed calls (no batches)',
    ),
    'queue.p4.test.js': pastTestSnippet(snippets.missingPartPBTSpecCode, 'The missing part'),
    'queue.pnext.v1.test.js': codeWithComments(snippets.extendedBackToWaitAllPBTSpecCode, [
      'Switch back to waitAll in queue.p4.test',
    ]),
    'queue.pnext.v2.test.js': codeWithComments(snippets.extendedWithExceptionsPBTSpecCode, ['Also cover error cases']),
  };

  const files: Record<string, string> = {};
  for (const [fileName, fileContent] of Object.entries(queueImplementations)) {
    files[`src/${fileName}`] = fileContent;
  }
  for (const [fileName, fileContent] of Object.entries(queueTests)) {
    files[`tests/${fileName}`] = fileContent.replace("'./queue.js'", "'./../src/queue.js'");
  }
  files['src/queue.js'] = `export {queue} from './${defaultQueueImplementation}'`;
  files['package.json'] = defaultPackageJson;
  return files;
}
const wrapUpFiles = buildWrapUpFiles();

export function WrapUpPlaygroundQueue() {
  const [reset, setReset] = useState(0);

  const defaultQueueTest = 'queue.p4.test.js';
  return (
    <div key={reset}>
      <StackBlitzEmbed
        files={wrapUpFiles}
        options={{
          openFile: `tests/${defaultQueueTest}`,
          hideExplorer: false,
        }}
      />
      <div className={styles.playgroundActions}>
        <button onClick={() => setReset((r) => r + 1)}>Reset snippets</button>
      </div>
    </div>
  );
}
