// @ts-check

export default function advent(unitPerNumericalOverride) {
  /**
   * @typedef {'\u{2709}\u{fe0f}'|'\u{1f9fa}'|'\u{1f384}'|'\u{1f514}'|'\u{1f56f}\u{fe0f}'|'\u{2b50}'|'\u{1f98c}'|'\u{26c4}'|'\u{1f6f7}'|'\u{2744}\u{fe0f}'|'\u{1f3bf}'|'\u{2728}'|'\u{1f929}'|'\u{1f973}'|'\u{1f388}'|'\u{1fa80}'|'\u{1f3ae}'|'\u{1f3b2}'|'\u{265f}\u{fe0f}'|'\u{1f49d}'|'\u{1f380}'|'\u{1f9e6}'|'\u{1f385}'|'\u{1f936}'|'\u{1f381}'} Unit
   */
  /**
   * @param {Unit[]} barcode
   * @returns {Unit[]}
   */
  return function nextBarcode(barcode) {
    /** @type {Unit[]} */
    const units = [
      '\u{2709}\u{fe0f}',
      '\u{1f9fa}',
      '\u{1f384}',
      '\u{1f514}',
      '\u{1f56f}\u{fe0f}',
      '\u{2b50}',
      '\u{1f98c}',
      '\u{26c4}',
      '\u{1f6f7}',
      '\u{2744}\u{fe0f}',
      '\u{1f3bf}',
      '\u{2728}',
      '\u{1f929}',
      '\u{1f973}',
      '\u{1f388}',
      '\u{1fa80}',
      '\u{1f3ae}',
      '\u{1f3b2}',
      '\u{265f}\u{fe0f}',
      '\u{1f49d}',
      '\u{1f380}',
      '\u{1f9e6}',
      '\u{1f385}',
      '\u{1f936}',
      '\u{1f381}',
    ];
    const base25 = '0123456789abcdefghijklmno';

    const unitPerNumerical = typeof unitPerNumericalOverride !== "undefined" ? unitPerNumericalOverride : 12;
    const maxForNumerical = units.length ** unitPerNumerical;
    const numericalVersion = [];

    // Create numerical value for current
    for (let i = barcode.length; i > 0; i -= unitPerNumerical) {
      const unitsForNumerical = barcode.slice(Math.max(0, i - unitPerNumerical), i);
      let numerical = 0;
      for (const unit of unitsForNumerical) {
        numerical *= units.length;
        numerical += units.indexOf(unit);
      }
      numericalVersion.push(numerical);
    }

    // Compute next numerical value
    let nextNumericalVersion = [...numericalVersion, 0];
    let cursorInNext = 0;
    nextNumericalVersion[cursorInNext] += 1;
    while (nextNumericalVersion[cursorInNext] >= maxForNumerical) {
      nextNumericalVersion[cursorInNext] = 0;
      cursorInNext += 1;
      nextNumericalVersion[cursorInNext] += 1;
    }
    if (nextNumericalVersion[nextNumericalVersion.length - 1] === 0) {
      nextNumericalVersion = nextNumericalVersion.slice(0, nextNumericalVersion.length - 1);
    }
    nextNumericalVersion.reverse();

    // Translate next numerical value into a barcode
    /** @type {Unit[]} */
    const next = [];
    for (let numericalIndex = 0; numericalIndex !== nextNumericalVersion.length; ++numericalIndex) {
      let numericalBase25 = nextNumericalVersion[numericalIndex].toString(25);
      if (numericalIndex !== 0) {
        numericalBase25 = numericalBase25.padStart(unitPerNumerical, '0');
      }
      for (const in25 of numericalBase25) {
        next.push(units[base25.indexOf(in25)]);
      }
    }
    return next;
  };
}
