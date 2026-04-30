import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';

// Reporter that records per-file durations and writes them to the path
// pointed to by VITEST_TIMINGS_OUTPUT. The output is consumed by the
// balanced sequencer on subsequent runs to keep shards even.
export default class VitestTimingsReporter {
  constructor() {
    this.timings = {};
    this.root = process.cwd();
  }

  onInit(vitest) {
    if (vitest?.config?.root) {
      this.root = vitest.config.root;
    }
  }

  onTestModuleEnd(testModule) {
    if (!testModule?.moduleId) return;
    const diag = typeof testModule.diagnostic === 'function' ? testModule.diagnostic() : undefined;
    if (!diag) return;
    const total =
      (diag.environmentSetupDuration ?? 0) +
      (diag.prepareDuration ?? 0) +
      (diag.collectDuration ?? 0) +
      (diag.setupDuration ?? 0) +
      (diag.duration ?? 0);
    const projectName = testModule.project?.name ?? '';
    const projectRoot = testModule.project?.config?.root ?? this.root;
    const rel = relative(projectRoot, testModule.moduleId).split('\\').join('/');
    this.timings[`${projectName}:${rel}`] = total;
  }

  onTestRunEnd() {
    const out = process.env.VITEST_TIMINGS_OUTPUT;
    if (!out) return;
    try {
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, JSON.stringify(this.timings, null, 2));
    } catch (err) {
      console.warn(`[vitest-timings-reporter] failed to write ${out}: ${err}`);
    }
  }
}
