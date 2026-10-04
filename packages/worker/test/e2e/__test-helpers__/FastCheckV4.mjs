import { registerHooks } from 'node:module';

const fastCheckV4Url = import.meta.resolve('fast-check-v4');

// The preload is inherited by workers, so both threads use the published v4 package.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'fast-check') {
      return { url: fastCheckV4Url, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
