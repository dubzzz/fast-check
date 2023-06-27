import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { Value } from '../check/arbitrary/definition/Value';
import { Random } from '../random/generator/Random';
import { Stream } from '../stream/Stream';
import { patternsToStringUnmapperFor } from './_internals/mappers/PatternsToString';
import { char } from './char';

const startSymbol = Symbol('start');
const endSymbol = Symbol('end');

// from => { to => weight }
type TransitionMap = Map<string | typeof startSymbol, Map<string | typeof endSymbol, number>>;

function multiFromToSingleFrom(fromMulti: (string | typeof startSymbol)[]): string | typeof startSymbol {
  const nonStart = fromMulti.filter((i) => i !== startSymbol) as string[];
  const startCount = fromMulti.length - nonStart.length;
  return startCount + ':' + nonStart.join('');
}

function incrementInTransitionMap(
  transitionMap: TransitionMap,
  from: string | typeof startSymbol,
  to: string | typeof endSymbol
): void {
  const transitionsFromPrevious = transitionMap.get(from);
  if (transitionsFromPrevious !== undefined) {
    const pastValue = transitionsFromPrevious.get(to) || 0;
    transitionsFromPrevious.set(to, pastValue + 1);
  } else {
    transitionMap.set(from, new Map([[to, 1]]));
  }
}

function addIntoTransitionMap(transitionMap: TransitionMap, tokenizedCorpusItem: string[], depth: number): void {
  const previousItems: (string | typeof startSymbol)[] = Array(depth).fill(startSymbol);
  for (let index = 0; index !== tokenizedCorpusItem.length; ++index) {
    const currentItem = tokenizedCorpusItem[index];
    incrementInTransitionMap(transitionMap, multiFromToSingleFrom(previousItems), currentItem);
    previousItems.shift();
    previousItems.push(currentItem);
  }
  incrementInTransitionMap(transitionMap, multiFromToSingleFrom(previousItems), endSymbol);
}

class FuzzedString extends Arbitrary<string> {
  private readonly transitionMap: TransitionMap;

  constructor(
    corpus: string[],
    private readonly charArb: Arbitrary<string>,
    private readonly strictness: 0 | 1 | 2,
    private readonly depth: number
  ) {
    super();

    const tokenizedCorpus: string[][] = [];
    const unmapper = patternsToStringUnmapperFor(this.charArb, {});
    for (const corpusItem of corpus) {
      const tokenizedCorpusItem = unmapper(corpusItem); // implicit throw
      tokenizedCorpus.push(tokenizedCorpusItem);
    }
    if (tokenizedCorpus.length === 0) {
      throw new Error(`Do not support empty corpus`);
    }

    this.transitionMap = new Map();
    for (let d = 1; d <= this.depth; ++d) {
      for (const tokenizedCorpusItem of tokenizedCorpus) {
        addIntoTransitionMap(this.transitionMap, tokenizedCorpusItem, d);
      }
    }
  }

  private generateInternal(mrng: Random): string {
    const previousItems: (string | typeof startSymbol)[] = Array(this.depth).fill(startSymbol);
    let stringValue = '';

    if (this.strictness !== 2) {
      throw new Error('Strictness not being 2, not implemented');
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const allTransitions: [string | typeof endSymbol, number][] = [];
      for (let d = 1; d <= this.depth; ++d) {
        const transitions = this.transitionMap.get(
          multiFromToSingleFrom(previousItems.slice(previousItems.length - d, previousItems.length))
        );
        if (transitions !== undefined) {
          allTransitions.push(...transitions.entries());
        }
      }
      const totalWeight = allTransitions.reduce((acc, transition) => acc + transition[1], 0);
      const selectedWeight = mrng.nextInt(0, totalWeight - 1);
      let postSelected = 1;
      let totalWeightUpToPostSelected = allTransitions[0][1];
      for (
        ;
        postSelected !== allTransitions.length && totalWeightUpToPostSelected <= selectedWeight;
        totalWeightUpToPostSelected += allTransitions[postSelected][1], ++postSelected
      ) {
        // no-op
      }
      const item = allTransitions[postSelected - 1][0];
      if (item === endSymbol) {
        return stringValue;
      }
      previousItems.shift();
      previousItems.push(item);
      stringValue += item;
    }
  }

  generate(mrng: Random, _biasFactor: number | undefined): Value<string> {
    return new Value(this.generateInternal(mrng), undefined);
  }

  canShrinkWithoutContext(value: unknown): value is string {
    return false;
  }

  shrink(_value: string, _context: unknown): Stream<Value<string>> {
    return Stream.nil();
  }
}

export function fuzzedString(corpus: string[]): Arbitrary<string> {
  return new FuzzedString(corpus, char(), 2, 1);
}

export function fuzzedString10(corpus: string[]): Arbitrary<string> {
  return new FuzzedString(corpus, char(), 2, 10);
}
