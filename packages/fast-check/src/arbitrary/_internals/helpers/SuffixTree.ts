export const START_TOKEN: unique symbol = Symbol('start-token');
export const END_TOKEN: unique symbol = Symbol('end-token');

type PreviousToken = string | typeof START_TOKEN;
type NextToken = string | typeof END_TOKEN;

type PossibleValue = { token: NextToken; count: number };

export class SuffixTree {
  private values = new Map<NextToken, number>();
  private nodes = new Map<PreviousToken, SuffixTree>();

  add(word: string): void {
    // for word "abcd" we have to put:
    //  - end at d>c>b>a>start,
    //  - d at c>b>a>start,
    //  - c at b>a>start,
    //  - b at a>start,
    //  - a at start
    // in the suffix-tree
    const ancestors: PreviousToken[] = [START_TOKEN];
    for (const c of word) {
      this.push(c, ancestors);
      ancestors.push(c);
    }
    this.push(END_TOKEN, ancestors);
  }
  private push(value: NextToken, ancestors: PreviousToken[]) {
    // oxlint-disable-next-line typescript/no-this-alias
    let currentNode: SuffixTree = this;
    for (let index = ancestors.length - 1; index >= 0; --index) {
      let token = ancestors[index];
      let nextNode = currentNode.nodes.get(token);
      if (nextNode === undefined) {
        nextNode = new SuffixTree();
        currentNode.nodes.set(token, nextNode);
      }
      currentNode = nextNode;
      const count = currentNode.values.get(value) ?? 0;
      currentNode.values.set(value, count + 1);
    }
  }

  next(token: PreviousToken): SuffixTree | undefined {
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
