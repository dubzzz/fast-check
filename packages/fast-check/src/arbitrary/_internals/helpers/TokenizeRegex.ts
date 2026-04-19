import { safeIndexOf } from '../../../utils/globals.js';
import { TokenizerBlockMode, readFrom } from './ReadRegex.js';
import type { ResolvedUnicodeProperty } from './UnicodePropertyData.js';
import { resolveUnicodeProperty } from './UnicodePropertyData.js';

const safeStringFromCodePoint = String.fromCodePoint;

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

/**
 * Internal helper checking if a character is a decimal one, ie: 0-9
 */
function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
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
  negative?: true;
};
type ClassRangeRegexToken = {
  type: 'ClassRange';
  from: CharRegexToken;
  to: CharRegexToken;
};
type GroupRegexToken =
  | {
      type: 'Group';
      capturing: true;
      number: number;
      expression: RegexToken;
    }
  | {
      type: 'Group';
      capturing: true;
      nameRaw: string;
      name: string;
      number: number;
      expression: RegexToken;
    }
  | {
      type: 'Group';
      capturing: false;
      expression: RegexToken;
    };
type DisjunctionRegexToken = {
  type: 'Disjunction';
  left: RegexToken | null;
  right: RegexToken | null;
};
type AssertionRegexToken =
  | {
      type: 'Assertion';
      kind: '^' | '$';
      negative?: true;
    }
  | {
      type: 'Assertion';
      kind: 'Lookahead' | 'Lookbehind';
      negative?: true;
      assertion: RegexToken;
    };
type BackreferenceRegexToken =
  | {
      type: 'Backreference';
      kind: 'number';
      number: number;
      reference: number;
    }
  | {
      type: 'Backreference';
      kind: 'name';
      number: number;
      referenceRaw: string;
      reference: string;
    };
type UnicodePropertyRegexToken = ResolvedUnicodeProperty;

/**
 * Only emitted when parsing a regex carrying the ES2024 `v` flag.
 * Represents the `\q{ab|cd|ef}` class-strings construct that can only appear
 * inside a character class.
 * @internal
 */
type ClassStringsRegexToken = {
  type: 'ClassStrings';
  value: string;
  strings: string[];
};

/**
 * Only emitted when parsing a regex carrying the ES2024 `v` flag.
 * Represents the `[left && right]` class-intersection operator.
 * @internal
 */
type ClassIntersectionRegexToken = {
  type: 'ClassIntersection';
  left: RegexToken;
  right: RegexToken;
};

/**
 * Only emitted when parsing a regex carrying the ES2024 `v` flag.
 * Represents the `[left -- right]` class-subtraction operator.
 * @internal
 */
type ClassSubtractionRegexToken = {
  type: 'ClassSubtraction';
  left: RegexToken;
  right: RegexToken;
};

export type RegexToken =
  | CharRegexToken
  | RepetitionRegexToken
  | QuantifierRegexToken
  | AlternativeRegexToken
  | CharacterClassRegexToken
  | ClassRangeRegexToken
  | GroupRegexToken
  | DisjunctionRegexToken
  | AssertionRegexToken
  | BackreferenceRegexToken
  | UnicodePropertyRegexToken
  | ClassStringsRegexToken
  | ClassIntersectionRegexToken
  | ClassSubtractionRegexToken;

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

function toSingleToken(tokens: RegexToken[], allowEmpty?: false): RegexToken;
function toSingleToken(tokens: RegexToken[], allowEmpty: true): RegexToken | undefined;
function toSingleToken(tokens: RegexToken[], allowEmpty?: boolean): RegexToken | undefined {
  if (tokens.length > 1) {
    return {
      type: 'Alternative',
      expressions: tokens,
    };
  }
  if (!allowEmpty && tokens.length === 0) {
    throw new Error(`Unsupported no token`);
  }
  return tokens[0];
}

/**
 * Create a character token based on a full block.
 * This function does not check the block itself, only call it with valid blocks.
 */
function blockToCharToken(block: string): CharRegexToken | UnicodePropertyRegexToken {
  if (block[0] === '\\') {
    const next = block[1];
    switch (next) {
      case 'x': {
        const allDigits = block.substring(2);
        const codePoint = Number.parseInt(allDigits, 16);
        const symbol = safeStringFromCodePoint(codePoint);
        return { type: 'Char', kind: 'hex', symbol, value: block, codePoint };
      }
      case 'u': {
        if (block === '\\u') {
          return simpleChar('u', true);
        }
        const allDigits = block[2] === '{' ? block.substring(3, block.length - 1) : block.substring(2);
        const codePoint = Number.parseInt(allDigits, 16);
        const symbol = safeStringFromCodePoint(codePoint);
        return { type: 'Char', kind: 'unicode', symbol, value: block, codePoint };
      }

      case '0': {
        return metaEscapedChar(block, '\0');
      }
      case 'n': {
        return metaEscapedChar(block, '\n');
      }
      case 'f': {
        return metaEscapedChar(block, '\f');
      }
      case 'r': {
        return metaEscapedChar(block, '\r');
      }
      case 't': {
        return metaEscapedChar(block, '\t');
      }
      case 'v': {
        return metaEscapedChar(block, '\v');
      }
      case 'w':
      case 'W':
      case 'd':
      case 'D':
      case 's':
      case 'S':
      case 'b':
      case 'B': {
        return { type: 'Char', kind: 'meta', symbol: undefined, value: block, codePoint: Number.NaN };
      }
      default: {
        if (isDigit(next)) {
          const allDigits = block.substring(1);
          const codePoint = Number(allDigits);
          const symbol = safeStringFromCodePoint(codePoint);
          return { type: 'Char', kind: 'decimal', symbol, value: block, codePoint };
        }
        if (block.length > 2 && (next === 'p' || next === 'P')) {
          const negative = next === 'P';
          const propertySpec = block.substring(3, block.length - 1);
          return resolveUnicodeProperty(propertySpec, negative);
        }
        const char = block.substring(1); // TODO - Properly handle unicode
        return simpleChar(char, true);
      }
    }
  }
  return simpleChar(block);
}

/**
 * Parse the content of a `\q{...}` block (ES2024 `v` flag only) into a list of
 * literal-string alternatives.
 *
 * The body of `\q{...}` accepts plain characters, escape sequences, and the
 * alternation operator `|`. Nothing else is allowed there by the spec.
 */
function parseClassStringsBody(block: string): ClassStringsRegexToken {
  // `block` is exactly `\q{...}` — strip the wrapping.
  const body = block.substring(3, block.length - 1);
  const strings: string[] = [];
  let current = '';
  for (let index = 0; index < body.length; ++index) {
    const ch = body[index];
    if (ch === '\\') {
      const next = body[index + 1];
      if (next === undefined) {
        throw new Error(`Invalid \\q{...} body: dangling escape`);
      }
      if (next === 'n') {
        current += '\n';
      } else if (next === 'r') {
        current += '\r';
      } else if (next === 't') {
        current += '\t';
      } else if (next === 'f') {
        current += '\f';
      } else if (next === 'v') {
        current += '\v';
      } else if (next === '0') {
        current += '\0';
      } else {
        current += next;
      }
      index += 1;
    } else if (ch === '|') {
      strings.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  strings.push(current);
  return { type: 'ClassStrings', value: block, strings };
}

/**
 * Tokenize the interior of a character class.
 *
 * In non-v mode this produces a flat list of {Char | ClassRange | UnicodeProperty}.
 * In v mode it may additionally produce nested CharacterClass, ClassStrings,
 * and split into ClassIntersection / ClassSubtraction when it encounters the
 * `&&` / `--` set operators.
 *
 * Returns the root token to place inside the outer `[` ... `]` wrapper, after
 * applying the outer `negative` flag at the call site.
 */
function tokenizeCharacterClassInterior(
  blockContent: string,
  unicodeMode: boolean,
  unicodeSetsMode: boolean,
): { expressions: RegexToken[]; setOperator: '&&' | '--' | null; operandBreaks: number[] } {
  const subTokens: RegexToken[] = [];
  // In v mode we may detect a `&&` or `--` set operator; we remember where
  // the breaks happened so the caller can fold the operands into the right
  // ClassIntersection / ClassSubtraction tree.
  let setOperator: '&&' | '--' | null = null;
  const operandBreaks: number[] = [];
  let previousWasSimpleDash = false;
  for (
    let subIndex = 0,
      subBlock = readFrom(blockContent, subIndex, unicodeMode, unicodeSetsMode, TokenizerBlockMode.Character);
    subIndex !== blockContent.length;
    subIndex += subBlock.length,
      subBlock = readFrom(blockContent, subIndex, unicodeMode, unicodeSetsMode, TokenizerBlockMode.Character)
  ) {
    // v-mode: recognize set operators as sub-block-level tokens.
    if (unicodeSetsMode && (subBlock === '&&' || subBlock === '--')) {
      if (setOperator !== null && setOperator !== subBlock) {
        throw new Error(`Mixing set operators '${setOperator}' and '${subBlock}' inside the same character class`);
      }
      setOperator = subBlock;
      operandBreaks.push(subTokens.length);
      previousWasSimpleDash = false;
      continue;
    }
    // v-mode: a nested character class opens with `[`.
    if (unicodeSetsMode && subBlock[0] === '[' && subBlock.length > 1 && subBlock[subBlock.length - 1] === ']') {
      const nestedInner = subBlock.substring(1, subBlock.length - 1);
      let nestedNegative: true | undefined = undefined;
      let nestedStartOffset = 0;
      if (nestedInner[0] === '^') {
        nestedNegative = true;
        nestedStartOffset = 1;
      }
      const nestedBody = nestedInner.substring(nestedStartOffset);
      const nestedTokenized = tokenizeCharacterClassInterior(nestedBody, unicodeMode, unicodeSetsMode);
      const nestedNode = buildClassNodeFromTokenized(nestedTokenized, nestedNegative);
      subTokens.push(nestedNode);
      previousWasSimpleDash = false;
      continue;
    }
    // v-mode: \q{...} string literal.
    if (unicodeSetsMode && subBlock[0] === '\\' && subBlock[1] === 'q') {
      subTokens.push(parseClassStringsBody(subBlock));
      previousWasSimpleDash = false;
      continue;
    }
    const newToken = blockToCharToken(subBlock);
    if (subBlock === '-') {
      subTokens.push(newToken);
      previousWasSimpleDash = true;
    } else {
      const operand1Token = subTokens.length >= 2 ? subTokens[subTokens.length - 2] : undefined;
      if (
        previousWasSimpleDash &&
        operand1Token !== undefined &&
        operand1Token.type === 'Char' &&
        newToken.type === 'Char' // Always true for unicode regexes: JavaScript engines forbids /[a-\p{Letter}]/u
      ) {
        subTokens.pop(); // dash
        subTokens.pop(); // operator 1
        subTokens.push({ type: 'ClassRange', from: operand1Token, to: newToken });
      } else {
        subTokens.push(newToken);
      }
      previousWasSimpleDash = false;
    }
  }
  return { expressions: subTokens, setOperator, operandBreaks };
}

/**
 * Given a tokenized class interior and the outer negation flag, build the single
 * token that represents the class.
 */
function buildClassNodeFromTokenized(
  tokenized: { expressions: RegexToken[]; setOperator: '&&' | '--' | null; operandBreaks: number[] },
  negative: true | undefined,
): RegexToken {
  const { expressions, setOperator, operandBreaks } = tokenized;
  if (setOperator === null) {
    return { type: 'CharacterClass', expressions, negative };
  }
  // Partition `expressions` by `operandBreaks` into operands.
  const operands: RegexToken[] = [];
  let lastBreak = 0;
  for (const at of operandBreaks) {
    operands.push({ type: 'CharacterClass', expressions: expressions.slice(lastBreak, at) });
    lastBreak = at;
  }
  operands.push({ type: 'CharacterClass', expressions: expressions.slice(lastBreak) });
  // Left-associate: (((a op b) op c) op d).
  let accumulator: RegexToken = operands[0];
  for (let i = 1; i < operands.length; ++i) {
    if (setOperator === '&&') {
      accumulator = { type: 'ClassIntersection', left: accumulator, right: operands[i] };
    } else {
      accumulator = { type: 'ClassSubtraction', left: accumulator, right: operands[i] };
    }
  }
  if (negative) {
    // Wrap the operator tree in a negated CharacterClass. The outer `[^...]`
    // with set operators is represented as a negative CharacterClass whose
    // single expression is the operator tree — that preserves negation while
    // keeping the CharacterClass-is-the-outer-wrapper invariant for consumers.
    return { type: 'CharacterClass', expressions: [accumulator], negative: true };
  }
  return accumulator;
}

/**
 * Build tokens corresponding to the received regex and push them into the passed array of tokens
 */
function pushTokens(
  tokens: RegexToken[],
  regexSource: string,
  unicodeMode: boolean,
  unicodeSetsMode: boolean,
  groups: { lastIndex: number; named: Map<string, number> },
): void {
  let disjunctions: (RegexToken | null)[] | null = null;
  for (
    let index = 0, block = readFrom(regexSource, index, unicodeMode, unicodeSetsMode, TokenizerBlockMode.Full);
    index !== regexSource.length;
    index += block.length, block = readFrom(regexSource, index, unicodeMode, unicodeSetsMode, TokenizerBlockMode.Full)
  ) {
    const firstInBlock = block[0];
    switch (firstInBlock) {
      case '|': {
        if (disjunctions === null) {
          disjunctions = [];
        }
        disjunctions.push(toSingleToken(tokens.splice(0), true) || null);
        break;
      }
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
        const blockContent = block.substring(1, block.length - 1);
        let negative: true | undefined = undefined;
        let interior = blockContent;
        if (blockContent[0] === '^') {
          negative = true;
          interior = blockContent.substring(1);
        }
        const tokenized = tokenizeCharacterClassInterior(interior, unicodeMode, unicodeSetsMode);
        tokens.push(buildClassNodeFromTokenized(tokenized, negative));
        break;
      }
      case '(': {
        const blockContent = block.substring(1, block.length - 1);
        const subTokens: RegexToken[] = [];
        if (blockContent[0] === '?') {
          if (blockContent[1] === ':') {
            pushTokens(subTokens, blockContent.substring(2), unicodeMode, unicodeSetsMode, groups);
            tokens.push({
              type: 'Group',
              capturing: false,
              expression: toSingleToken(subTokens),
            });
          } else if (blockContent[1] === '=' || blockContent[1] === '!') {
            pushTokens(subTokens, blockContent.substring(2), unicodeMode, unicodeSetsMode, groups);
            tokens.push({
              type: 'Assertion',
              kind: 'Lookahead',
              negative: blockContent[1] === '!' ? true : undefined,
              assertion: toSingleToken(subTokens),
            });
          } else if (blockContent[1] === '<' && (blockContent[2] === '=' || blockContent[2] === '!')) {
            pushTokens(subTokens, blockContent.substring(3), unicodeMode, unicodeSetsMode, groups);
            tokens.push({
              type: 'Assertion',
              kind: 'Lookbehind',
              negative: blockContent[2] === '!' ? true : undefined,
              assertion: toSingleToken(subTokens),
            });
          } else {
            const chunks = blockContent.split('>');
            if (chunks.length < 2 || chunks[0][1] !== '<') {
              throw new Error(`Unsupported regex content found at ${JSON.stringify(block)}`);
            }
            const groupIndex = ++groups.lastIndex;
            const nameRaw = chunks[0].substring(2);
            groups.named.set(nameRaw, groupIndex);
            pushTokens(subTokens, chunks.slice(1).join('>'), unicodeMode, unicodeSetsMode, groups);
            tokens.push({
              type: 'Group',
              capturing: true,
              nameRaw,
              name: nameRaw,
              number: groupIndex,
              expression: toSingleToken(subTokens),
            });
          }
        } else {
          const groupIndex = ++groups.lastIndex;
          pushTokens(subTokens, blockContent, unicodeMode, unicodeSetsMode, groups);
          tokens.push({
            type: 'Group',
            capturing: true,
            number: groupIndex,
            expression: toSingleToken(subTokens),
          });
        }
        break;
      }
      default: {
        if (block === '^') {
          tokens.push({ type: 'Assertion', kind: block });
        } else if (block === '$') {
          tokens.push({ type: 'Assertion', kind: block });
        } else if (block[0] === '\\' && isDigit(block[1])) {
          const reference = Number(block.substring(1));
          if (unicodeMode || unicodeSetsMode || reference <= groups.lastIndex) {
            tokens.push({ type: 'Backreference', kind: 'number', number: reference, reference });
          } else {
            tokens.push(blockToCharToken(block));
          }
        } else if (block[0] === '\\' && block[1] === 'k' && block.length !== 2) {
          const referenceRaw = block.substring(3, block.length - 1);
          tokens.push({
            type: 'Backreference',
            kind: 'name',
            number: groups.named.get(referenceRaw) || 0,
            referenceRaw,
            reference: referenceRaw,
          });
        } else {
          tokens.push(blockToCharToken(block));
        }
        break;
      }
    }
  }
  if (disjunctions !== null) {
    disjunctions.push(toSingleToken(tokens.splice(0), true) || null);
    let currentDisjunction: DisjunctionRegexToken = {
      type: 'Disjunction',
      left: disjunctions[0],
      right: disjunctions[1],
    };
    for (let index = 2; index < disjunctions.length; ++index) {
      currentDisjunction = {
        type: 'Disjunction',
        left: currentDisjunction,
        right: disjunctions[index],
      };
    }
    tokens.push(currentDisjunction);
  }
}

/**
 * Build the AST corresponding to the passed instance of RegExp
 */
export function tokenizeRegex(regex: RegExp): RegexToken {
  const flags = [...regex.flags];
  const unicodeMode = safeIndexOf(flags, 'u') !== -1;
  const unicodeSetsMode = safeIndexOf(flags, 'v') !== -1;
  const regexSource = regex.source;
  const tokens: RegexToken[] = [];
  pushTokens(tokens, regexSource, unicodeMode, unicodeSetsMode, { lastIndex: 0, named: new Map<string, number>() });
  return toSingleToken(tokens);
}
