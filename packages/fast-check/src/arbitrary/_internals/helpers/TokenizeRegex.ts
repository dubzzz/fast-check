import { readFrom } from './ReadRegex';

/**
 * Pop the last pushed token and return it,
 * Throw if unable to pop it.
 */
function safePop(tokens: RegexToken[]): RegexToken {
  const previous = tokens.pop();
  if (previous === undefined) {
    throw new Error('Unable to extract token preceeding the currently parsed one');
  }
  return previous;
}

type CharRegexToken = {
  type: 'Char';
  kind: 'meta' | 'simple' | 'decimal' | 'hex' | 'unicode';
  symbol: string | undefined;
  value: string;
  codePoint: number;
  escaped?: true;
};
type RepetitionRegexToken = {
  type: 'Repetition';
  expression: RegexToken;
  quantifier: QuantifierRegexToken;
};
type QuantifierRegexToken =
  | {
      type: 'Quantifier';
      kind: '+' | '*' | '?';
      greedy: boolean;
    }
  | {
      type: 'Quantifier';
      kind: 'Range';
      greedy: boolean;
      from: number;
      to: number | undefined; // probably not that undefined
    };
type AlternativeRegexToken = {
  type: 'Alternative';
  expressions: RegexToken[];
};
type CharacterClassRegexToken = {
  type: 'CharacterClass';
  expressions: RegexToken[];
};

type RegexToken =
  | CharRegexToken
  | RepetitionRegexToken
  | QuantifierRegexToken
  | AlternativeRegexToken
  | CharacterClassRegexToken;

/**
 * Create a simple char token
 */
function simpleChar(char: string, escaped?: true): CharRegexToken {
  return {
    type: 'Char',
    kind: 'simple',
    symbol: char,
    value: char,
    codePoint: char.codePointAt(0) || -1,
    escaped,
  };
}

/**
 * Create a meta char token corresponding to things such as \t, \n...
 */
function metaEscapedChar(block: string, symbol: string): CharRegexToken {
  return {
    type: 'Char',
    kind: 'meta',
    symbol, // eg.: \t
    value: block, // eg.: \\t
    codePoint: symbol.codePointAt(0) || -1,
  };
}

/**
 * Internal helper checking if a character is a decimal one, ie: 0-9
 */
function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

/**
 * Build tokens corresponding to the received regex and push them into the passed array of tokens
 */
function pushTokens(tokens: RegexToken[], regexSource: string, unicodeMode: boolean): void {
  for (
    let index = 0, block = readFrom(regexSource, index, unicodeMode);
    index !== regexSource.length;
    index += block.length, block = readFrom(regexSource, index, unicodeMode)
  ) {
    const firstInBlock = block[0];
    switch (firstInBlock) {
      case '.': {
        tokens.push({ type: 'Char', kind: 'meta', symbol: block, value: block, codePoint: Number.NaN });
        break;
      }
      case '*':
      case '+': {
        const previous = safePop(tokens);
        tokens.push({
          type: 'Repetition',
          expression: previous,
          quantifier: { type: 'Quantifier', kind: firstInBlock, greedy: true },
        });
        break;
      }
      case '?': {
        const previous = safePop(tokens);
        if (previous.type === 'Repetition') {
          previous.quantifier.greedy = false;
          tokens.push(previous);
        } else {
          tokens.push({
            type: 'Repetition',
            expression: previous,
            quantifier: { type: 'Quantifier', kind: firstInBlock, greedy: true },
          });
        }
        break;
      }
      case '{': {
        if (block === '{') {
          tokens.push(simpleChar(block));
          break;
        }
        const previous = safePop(tokens);
        const quantifierText = block.substring(1, block.length - 1);
        const quantifierTokens = quantifierText.split(','); // at that point quantifierTokens.length is either 1 or 2 by construct
        const from = Number(quantifierTokens[0]);
        const to =
          quantifierTokens.length === 1
            ? from // to = from, only {from} characters accepted, not less not more
            : quantifierTokens[1].length !== 0
            ? Number(quantifierTokens[1]) // from and to may diverge
            : undefined; // to is accepting anything >=from
        tokens.push({
          type: 'Repetition',
          expression: previous,
          quantifier: { type: 'Quantifier', kind: 'Range', greedy: true, from, to },
        });
        break;
      }
      case '[': {
        const subTokens: RegexToken[] = [];
        pushTokens(subTokens, block.substring(1, block.length - 1), unicodeMode);
        tokens.push({ type: 'CharacterClass', expressions: subTokens });
        break;
      }
      case '\\': {
        const next = block[1];
        switch (next) {
          case 'x': {
            const allDigits = block.substring(2);
            const codePoint = Number.parseInt(allDigits, 16);
            const symbol = String.fromCodePoint(codePoint);
            tokens.push({ type: 'Char', kind: 'hex', symbol, value: block, codePoint });
            break;
          }
          case 'u': {
            if (block === '\\u') {
              tokens.push(simpleChar('u', true));
              break;
            }
            const allDigits = block[2] === '{' ? block.substring(3, block.length - 1) : block.substring(2);
            const codePoint = Number.parseInt(allDigits, 16);
            const symbol = String.fromCodePoint(codePoint);
            tokens.push({ type: 'Char', kind: 'unicode', symbol, value: block, codePoint });
            break;
          }

          case '0': {
            tokens.push(metaEscapedChar(block, '\0'));
            break;
          }
          case 'n': {
            tokens.push(metaEscapedChar(block, '\n'));
            break;
          }
          case 'f': {
            tokens.push(metaEscapedChar(block, '\f'));
            break;
          }
          case 'r': {
            tokens.push(metaEscapedChar(block, '\r'));
            break;
          }
          case 't': {
            tokens.push(metaEscapedChar(block, '\t'));
            break;
          }
          case 'v': {
            tokens.push(metaEscapedChar(block, '\v'));
            break;
          }
          case 'w':
          case 'W':
          case 'd':
          case 'D':
          case 's':
          case 'S':
          case 'b':
          case 'B': {
            tokens.push({ type: 'Char', kind: 'meta', symbol: undefined, value: block, codePoint: Number.NaN });
            break;
          }
          default: {
            if (isDigit(next)) {
              const allDigits = block.substring(1);
              const codePoint = Number(allDigits);
              const symbol = String.fromCodePoint(codePoint);
              tokens.push({
                type: 'Char',
                kind: 'decimal',
                symbol,
                value: block,
                codePoint,
              });
              break;
            }
            const char = block.substring(1); // TODO - Properly handle unicode
            tokens.push(simpleChar(char, true));
            break;
          }
        }
        break;
      }
      default: {
        tokens.push(simpleChar(block));
        break;
      }
    }
  }
}

/**
 * Build the AST corresponding to the passed instance of RegExp
 */
export function tokenizeRegex(regex: RegExp): RegexToken {
  const unicodeMode = regex.flags.includes('u');
  const regexSource = regex.source;
  const tokens: RegexToken[] = [];
  pushTokens(tokens, regexSource, unicodeMode);
  if (tokens.length > 1) {
    return {
      type: 'Alternative',
      expressions: tokens,
    };
  }
  return tokens[0];
}
