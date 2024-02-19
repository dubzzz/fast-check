// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const path = require('path');

// eslint-disable-next-line no-undef
const esmWorkerDTSPath = path.join(__dirname, '..', 'lib', 'esm', 'jest-fast-check-worker.d.ts');
const esmWorkerDTSContent = fs.readFileSync(esmWorkerDTSPath).toString();
fs.writeFileSync(esmWorkerDTSPath, esmWorkerDTSContent.replace('=> InitOutput', '=> Promise<InitOutput>'));
