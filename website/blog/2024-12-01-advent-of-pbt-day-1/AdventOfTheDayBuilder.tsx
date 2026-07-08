import React, { useEffect, useState } from 'react';
import { isEqual } from 'lodash';
import Admonition from '@theme/Admonition';
import AdventPlayground from './AdventPlayground';

const answerFieldName = 'answer';

type Options = {
  day: number;
  buggyAdvent: (...args: any[]) => unknown;
  snippet: string;
  buggyAdventSurcharged?: (...args: any[]) => unknown;
  referenceAdvent: (...args: any[]) => unknown;
  postAdvent?: (adventOutput: any) => unknown;
  parser: (answer: string) => unknown[] | undefined;
  placeholderForm: string;
  functionName: string;
  signature: string;
  signatureExtras?: string[];
};

export function buildAdventOfTheDay(options: Options) {
  const {
    day,
    buggyAdvent,
    snippet,
    buggyAdventSurcharged,
    referenceAdvent,
    postAdvent = (v) => v,
    parser,
    placeholderForm,
    functionName,
    signature,
    signatureExtras,
  } = options;
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

  let lastError: string | null = null;
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
      const buggyFn = buggyAdventSurcharged ?? buggyAdvent;
      if (isEqual(postAdvent(buggyFn(...inputs)), postAdvent(referenceAdvent(...inputs)))) {
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
      const buggyFn = buggyAdventSurcharged ?? buggyAdvent;
      if (isEqual(postAdvent(buggyFn(...inputs)), postAdvent(referenceAdvent(...inputs)))) {
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
            <p>
              <a
                href={`https://bsky.app/intent/compose?text=${encodeURIComponent(`Just solved the #AdventOfPBT puzzle made by @fast-check.dev · 👉 Join the challenge: ${window.location.href}`)}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                Share your success on Bluesky 🎉
              </a>
            </p>
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
