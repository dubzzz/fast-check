import React, { useState } from 'react';
import { isEqual, set } from 'lodash';
import Admonition from '@theme/Admonition';
import AdventPlayground from './AdventPlayground';

const answerFieldName = 'answer';

type Options = {
  day: number;
  buildBuggyAdvent: () => (...args: unknown[]) => unknown;
  referenceAdvent: (...args: unknown[]) => unknown;
  postAdvent?: (adventOutput: unknown) => unknown;
  parser: (answer: string) => unknown[] | undefined;
  placeholderForm: string;
  functionName: string;
  signature: string;
  signatureExtras?: string[];
};

export function buildAdventOfTheDay(options: Options) {
  const {
    day,
    buildBuggyAdvent,
    referenceAdvent,
    postAdvent = (v) => v,
    parser,
    placeholderForm,
    functionName,
    signature,
    signatureExtras,
  } = options;

  const snippetLinesWithHeadingSpaces = String(buildBuggyAdvent).split('\n').slice(1, -1);
  const spacesCountToDrop = /^( +)/.exec(snippetLinesWithHeadingSpaces[0])[1].length;
  const spacesToDrop = ' '.repeat(spacesCountToDrop);
  const snippet = snippetLinesWithHeadingSpaces
    .map((line) => (line.startsWith(spacesToDrop) ? line.substring(spacesToDrop.length) : line))
    .map((line) => line.replace(/^return /, 'export default '))
    .join('\n');

  function AdventPlaygroundOfTheDay() {
    return (
      <AdventPlayground
        functionName={functionName}
        signature={signature}
        signatureExtras={signatureExtras}
        snippet={snippet}
        day={day}
      />
    );
  }

  let lastError = null;
  const storageKey = `aopbt24-day${day}`;

  function retrievePastAnswerIfSolved(): string | null {
    try {
      const pastAnswer = localStorage.getItem(storageKey);
      if (pastAnswer === null) {
        return null;
      }
      const inputs = parser(pastAnswer);
      if (inputs === undefined) {
        return null;
      }
      const buggyAdvent = buildBuggyAdvent();
      if (isEqual(postAdvent(buggyAdvent(...inputs)), postAdvent(referenceAdvent(...inputs)))) {
        return null;
      }
      return pastAnswer;
    } catch (err) {
      return null;
    }
  }

  function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const answer = extractAnswerFromForm(event);
      const inputs = parser(answer);
      if (inputs === undefined) {
        lastError = 'Malformed inputs provided!';
        return;
      }
      const buggyAdvent = buildBuggyAdvent();
      if (isEqual(postAdvent(buggyAdvent(...inputs)), postAdvent(referenceAdvent(...inputs)))) {
        lastError = 'The input you provided seems to be working well: Santa is looking for a bug!';
        return;
      }
      lastError = null;
      localStorage.setItem(storageKey, answer);
    } catch (err) {
      lastError = `Malformed inputs provided!\n${(err as Error).message}`;
    }
  }

  function FormOfTheDay() {
    const [, setId] = useState(Symbol());
    const pastAnswer = lastError === null ? retrievePastAnswerIfSolved() : null;

    return (
      <>
        {pastAnswer !== null && (
          <Admonition type="tip" icon="🎉" title="Congratulations">
            <p>You solved this puzzle!</p>
          </Admonition>
        )}
        {lastError !== null && (
          <Admonition type="danger">
            <p>{lastError}</p>
          </Admonition>
        )}
        <form
          onSubmit={(e) => {
            onSubmit(e);
            setId(Symbol());
          }}
        >
          <textarea
            name={answerFieldName}
            style={{ width: '100%', ...(pastAnswer !== null ? { backgroundColor: 'lightgreen' } : {}) }}
            rows={5}
            defaultValue={pastAnswer ?? undefined}
            placeholder={`Example of answer:\n${placeholderForm}`}
          ></textarea>
          <br />
          <button type="submit">Submit</button>
        </form>
      </>
    );
  }

  return { AdventPlaygroundOfTheDay, FormOfTheDay };
}

function extractAnswerFromForm(event: React.SyntheticEvent<HTMLFormElement>): string {
  const form = event.currentTarget;
  const formElements = form.elements;
  if (!(answerFieldName in formElements)) {
    throw new Error(`No ${JSON.stringify(answerFieldName)} field attached to the form`);
  }
  const answer = (formElements[answerFieldName] as { value?: unknown }).value;
  if (typeof answer !== 'string') {
    throw new Error(`${JSON.stringify(answerFieldName)} field attached to the form must be of type string`);
  }
  return answer;
}
