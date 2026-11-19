const fc = require('fast-check');
const { default: dynamic } = await import('fast-check');
export { default as fastCheck } from 'fast-check';
fc.sample(dynamic.integer());
