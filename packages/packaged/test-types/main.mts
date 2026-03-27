import { computePublishedFiles, removeNonPublishedFiles } from '@fast-check/packaged';

computePublishedFiles('.').then((_publishedFilesRoot) => {
  // not implemented
});
removeNonPublishedFiles('.', { dryRun: false, keep: [] }).then(({ kept: _kept, removed: _removed }) => {
  // not implemented
});
