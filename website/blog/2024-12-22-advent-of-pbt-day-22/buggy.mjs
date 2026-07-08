// @ts-check

/** @typedef {"🎄"|"🦌"|"⛄"|"🛷"|"🎈"|"🎀"|"🎅"|"🎁"} Icon */
/** @typedef {[Icon, Icon, Icon, Icon, Icon]} Sequence */

/**
 * @param {Sequence} secretSequence
 * @param {Sequence} guessedSequence
 * @returns {{goodPlacement:number; misplaced: number}}
 */
export default function computeSantaMindScore(secretSequence, guessedSequence) {
  let goodPlacement = 0;
  let misplaced = 0;
  const copiedSecretSequence = [...secretSequence];
  for (let index = 0; index !== guessedSequence.length; ++index) {
    const item = guessedSequence[index];
    const indexInSecret = secretSequence.indexOf(item);
    const indexInCopiedSecret = copiedSecretSequence.indexOf(item);
    if (index === indexInSecret) {
      ++goodPlacement;
      copiedSecretSequence.splice(indexInCopiedSecret, 1);
    } else if (indexInCopiedSecret !== -1) {
      ++misplaced;
      copiedSecretSequence.splice(indexInCopiedSecret, 1);
    }
  }
  return { goodPlacement, misplaced };
}
