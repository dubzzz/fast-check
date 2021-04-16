import { array } from '../../arbitrary/array';
import { constant } from '../../arbitrary/constant';
import { Arbitrary } from './definition/Arbitrary';
import { frequency } from '../../arbitrary/frequency';

/**
 * Constraints to be applied on {@link lorem}
 * @remarks Since 2.5.0
 * @public
 */
export interface LoremConstraints {
  /**
   * Maximal number of entities:
   * - maximal number of words in case mode is 'words'
   * - maximal number of sentences in case mode is 'sentences'
   *
   * @defaultValue 5
   *
   * @remarks Since 2.5.0
   */
  maxCount?: number;
  /**
   * Type of strings that should be produced by {@link lorem}:
   * - words: multiple words
   * - sentences: multiple sentences
   *
   * @defaultValue 'words'
   *
   * @remarks Since 2.5.0
   */
  mode?: 'words' | 'sentences';
}

/**
 * Helper function responsible to build the entries for frequency
 * @internal
 */
const h = (v: string, w: number) => {
  return { arbitrary: constant(v), weight: w };
};

/**
 * Number of occurences extracted from the lorem ipsum:
 * {@link https://fr.wikipedia.org/wiki/Faux-texte#Lorem_ipsum_(version_populaire)}
 *
 * Code generated using:
 * >  Object.entries(
 * >    text
 * >      .replace(/[\r\n]/g, ' ')
 * >      .split(' ')
 * >      .filter(w => w.length > 0)
 * >      .map(w => w.toLowerCase())
 * >      .map(w => w[w.length-1] === '.' ? w.substr(0, w.length -1) : w)
 * >      .reduce((acc, cur) => { acc[cur] = (acc[cur] || 0) + 1; return acc; }, {})
 * >  )
 * >  .sort(([w1, n1], [w2, n2]) => n2 - n1)
 * >  .reduce((acc, [w, n]) => acc.concat([`h(${JSON.stringify(w)}, ${n})`]), [])
 * >  .join(',')
 *
 * @internal
 */
const loremWord = () =>
  frequency(
    h('non', 6),
    h('adipiscing', 5),
    h('ligula', 5),
    h('enim', 5),
    h('pellentesque', 5),
    h('in', 5),
    h('augue', 5),
    h('et', 5),
    h('nulla', 5),
    h('lorem', 4),
    h('sit', 4),
    h('sed', 4),
    h('diam', 4),
    h('fermentum', 4),
    h('ut', 4),
    h('eu', 4),
    h('aliquam', 4),
    h('mauris', 4),
    h('vitae', 4),
    h('felis', 4),
    h('ipsum', 3),
    h('dolor', 3),
    h('amet,', 3),
    h('elit', 3),
    h('euismod', 3),
    h('mi', 3),
    h('orci', 3),
    h('erat', 3),
    h('praesent', 3),
    h('egestas', 3),
    h('leo', 3),
    h('vel', 3),
    h('sapien', 3),
    h('integer', 3),
    h('curabitur', 3),
    h('convallis', 3),
    h('purus', 3),
    h('risus', 2),
    h('suspendisse', 2),
    h('lectus', 2),
    h('nec,', 2),
    h('ultricies', 2),
    h('sed,', 2),
    h('cras', 2),
    h('elementum', 2),
    h('ultrices', 2),
    h('maecenas', 2),
    h('massa,', 2),
    h('varius', 2),
    h('a,', 2),
    h('semper', 2),
    h('proin', 2),
    h('nec', 2),
    h('nisl', 2),
    h('amet', 2),
    h('duis', 2),
    h('congue', 2),
    h('libero', 2),
    h('vestibulum', 2),
    h('pede', 2),
    h('blandit', 2),
    h('sodales', 2),
    h('ante', 2),
    h('nibh', 2),
    h('ac', 2),
    h('aenean', 2),
    h('massa', 2),
    h('suscipit', 2),
    h('sollicitudin', 2),
    h('fusce', 2),
    h('tempus', 2),
    h('aliquam,', 2),
    h('nunc', 2),
    h('ullamcorper', 2),
    h('rhoncus', 2),
    h('metus', 2),
    h('faucibus,', 2),
    h('justo', 2),
    h('magna', 2),
    h('at', 2),
    h('tincidunt', 2),
    h('consectetur', 1),
    h('tortor,', 1),
    h('dignissim', 1),
    h('congue,', 1),
    h('non,', 1),
    h('porttitor,', 1),
    h('nonummy', 1),
    h('molestie,', 1),
    h('est', 1),
    h('eleifend', 1),
    h('mi,', 1),
    h('arcu', 1),
    h('scelerisque', 1),
    h('vitae,', 1),
    h('consequat', 1),
    h('in,', 1),
    h('pretium', 1),
    h('volutpat', 1),
    h('pharetra', 1),
    h('tempor', 1),
    h('bibendum', 1),
    h('odio', 1),
    h('dui', 1),
    h('primis', 1),
    h('faucibus', 1),
    h('luctus', 1),
    h('posuere', 1),
    h('cubilia', 1),
    h('curae,', 1),
    h('hendrerit', 1),
    h('velit', 1),
    h('mauris,', 1),
    h('gravida', 1),
    h('ornare', 1),
    h('ut,', 1),
    h('pulvinar', 1),
    h('varius,', 1),
    h('turpis', 1),
    h('nibh,', 1),
    h('eros', 1),
    h('id', 1),
    h('aliquet', 1),
    h('quis', 1),
    h('lobortis', 1),
    h('consectetuer', 1),
    h('morbi', 1),
    h('vehicula', 1),
    h('tortor', 1),
    h('tellus,', 1),
    h('id,', 1),
    h('eu,', 1),
    h('quam', 1),
    h('feugiat,', 1),
    h('posuere,', 1),
    h('iaculis', 1),
    h('lectus,', 1),
    h('tristique', 1),
    h('mollis,', 1),
    h('nisl,', 1),
    h('vulputate', 1),
    h('sem', 1),
    h('vivamus', 1),
    h('placerat', 1),
    h('imperdiet', 1),
    h('cursus', 1),
    h('rutrum', 1),
    h('iaculis,', 1),
    h('augue,', 1),
    h('lacus', 1)
  );

/**
 * For lorem ipsum strings of words
 * @remarks Since 0.0.1
 * @public
 */
function lorem(): Arbitrary<string>;
/**
 * For lorem ipsum string of words with maximal number of words
 *
 * @param maxWordsCount - Upper bound of the number of words allowed
 *
 * @deprecated
 * Superceded by `fc.lorem({maxCount})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.1
 * @public
 */
function lorem(maxWordsCount: number): Arbitrary<string>;
/**
 * For lorem ipsum string of words or sentences with maximal number of words or sentences
 *
 * @param maxWordsCount - Upper bound of the number of words/sentences allowed
 * @param sentencesMode - If enabled, multiple sentences might be generated
 *
 * @deprecated
 * Superceded by `fc.lorem({maxCount, mode})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.1
 * @public
 */
function lorem(maxWordsCount: number, sentencesMode: boolean): Arbitrary<string>;
/**
 * For lorem ipsum string of words or sentences with maximal number of words or sentences
 *
 * @param constraints - Constraints to be applied onto the generated value
 *
 * @remarks Since 2.5.0
 * @public
 */
function lorem(constraints: LoremConstraints): Arbitrary<string>;
function lorem(...args: [] | [number] | [number, boolean] | [LoremConstraints]): Arbitrary<string> {
  const maxWordsCount = typeof args[0] === 'object' ? args[0].maxCount : args[0];
  const sentencesMode = typeof args[0] === 'object' ? args[0].mode === 'sentences' : args[1];
  const maxCount = maxWordsCount || 5;
  if (maxCount < 1) throw new Error(`lorem has to produce at least one word/sentence`);
  if (sentencesMode) {
    const sentence = array(loremWord(), { minLength: 1 })
      .map((words) => words.join(' '))
      .map((s) => (s[s.length - 1] === ',' ? s.substr(0, s.length - 1) : s))
      .map((s) => s[0].toUpperCase() + s.substring(1) + '.');
    return array(sentence, { minLength: 1, maxLength: maxCount }).map((sentences) => sentences.join(' '));
  } else {
    return array(loremWord(), { minLength: 1, maxLength: maxCount }).map((words) =>
      words.map((w) => (w[w.length - 1] === ',' ? w.substr(0, w.length - 1) : w)).join(' ')
    );
  }
}

export { lorem };
