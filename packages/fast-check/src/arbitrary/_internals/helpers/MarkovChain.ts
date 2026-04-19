export const START_TOKEN: unique symbol = Symbol('start-token');
export const END_TOKEN: unique symbol = Symbol('end-token');

type PreviousToken = string | typeof START_TOKEN;
type NextToken = string | typeof END_TOKEN;

type PossibleValue = { token: NextToken; count: number };

export class MarkovChain {
  private values = new Map<NextToken, number>();
  private nodes = new Map<PreviousToken, MarkovChain>();

  add(word: string): void {
    // For word "abcd" we register:
    //  - END_TOKEN after d>c>b>a>start,
    //  - d after c>b>a>start,
    //  - c after b>a>start,
    //  - b after a>start,
    //  - a after start
    // Contexts are stored in reverse order so that lookups can progressively
    // descend to more specific contexts (variable-order / backoff behavior).
    const ancestors: PreviousToken[] = [START_TOKEN];
    for (const c of word) {
      this.push(c, ancestors);
      ancestors.push(c);
    }
    this.push(END_TOKEN, ancestors);
  }
  private push(value: NextToken, ancestors: PreviousToken[]) {
    // oxlint-disable-next-line typescript/no-this-alias
    let currentNode: MarkovChain = this;
    for (let index = ancestors.length - 1; index >= 0; --index) {
      let token = ancestors[index];
      let nextNode = currentNode.nodes.get(token);
      if (nextNode === undefined) {
        nextNode = new MarkovChain();
        currentNode.nodes.set(token, nextNode);
      }
      currentNode = nextNode;
      const count = currentNode.values.get(value) ?? 0;
      currentNode.values.set(value, count + 1);
    }
  }

  next(token: PreviousToken): MarkovChain | undefined {
    return this.nodes.get(token);
  }

  listPossibleValues(): PossibleValue[] {
    const values: PossibleValue[] = [];
    for (const [token, count] of this.values) {
      values.push({ token, count });
    }
    return values;
  }
}
