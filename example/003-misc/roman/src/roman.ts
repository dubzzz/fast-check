// Implementation inspired from https://github.com/dubzzz/various-algorithms/blob/main/algorithms/numbers/roman-numbers/implem.cpp

export const LettersValue: [number, string][] = [
  [1, 'I'],
  [5, 'V'],
  [10, 'X'],
  [50, 'L'],
  [100, 'C'],
  [500, 'D'],
  [1000, 'M'],
];
export const MaxRoman = 4 * LettersValue[LettersValue.length - 1][0] - 1;
export const NumLetters = LettersValue.length;

const ByLetters: Record<string, number> = LettersValue.reduce((acc, cur) => ({ ...acc, [cur[1]]: cur[0] }), {});

export function toRoman(value: number): string {
  if (value === 0) return '0';
  else if (value < -MaxRoman || value > MaxRoman) return '';
  else if (value < 0) return `-${toRoman(-value)}`;

  const numPairs = 2 * NumLetters - 1;
  let repr = '';
  for (let i = numPairs; i > 0; --i) {
    const isComposite = !(i & 1);
    const idx = i >> 1;
    const idxMinus = idx & 1 ? idx - 1 : idx - 2;
    const charValue = isComposite
      ? LettersValue[idx][0] - LettersValue[idxMinus][0] //IV - IX -...
      : LettersValue[idx][0];

    while (value >= charValue) {
      value -= charValue;
      if (isComposite) {
        repr += LettersValue[idxMinus][1];
      }
      repr += LettersValue[idx][1];
    }
  }
  return repr;
}

export function fromRoman(expr: string): number {
  if (expr[0] === '0') return 0;

  const isPositive = expr[0] !== '-';

  let num = 0;
  let currentValue: number = LettersValue[LettersValue.length - 1][0];
  for (let pos = isPositive ? 0 : 1; pos !== expr.length; ++pos) {
    const prevValue = currentValue;
    currentValue = ByLetters[expr[pos]];
    if (currentValue > prevValue) {
      // // eg.: CIX: 100 then 101 then 1? 101(num) - 2*1(prev_val) + 10(current_val)
      num += currentValue - 2 * prevValue;
    } else {
      num += currentValue;
    }
  }
  return isPositive ? num : -num;
}
