import { computePublishedFiles, removeNonPublishedFiles } from '@fast-check/packaged';

computePublishedFiles('.').then((_publishedFilesRoot) => {
  // not implemented
});
removeNonPublishedFiles('.', { dryRun: false, keepNodeModules: false }).then(({ kept: _kept, removed: _removed }) => {
  // not implemented
});
