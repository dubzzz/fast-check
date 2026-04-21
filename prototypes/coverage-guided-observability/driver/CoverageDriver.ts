// prototypes/coverage-guided-observability/driver/CoverageDriver.ts
// ANGLE A — External driver. Sketches the AFL-style loop that sits on top
// of fast-check's observability hook + Node's NODE_V8_COVERAGE dumps.

import * as fs from 'node:fs';
import * as path from 'node:path';
// In a real driver this would be: import fc from 'fast-check';
// but the prototype keeps it dependency-free.

type CorpusEntry = {
  seed: number;
  replayPath: string;     // fast-check counterexamplePath-style string
  userInputs: unknown[];  // serialised via fc.stringify on the driver side
  edgesSignature: string; // hash of edges reached
  energy: number;         // AFL-style energy assignment
};

export interface CoverageDriverOptions {
  covDir: string;         // points at NODE_V8_COVERAGE dir
  maxCorpus?: number;     // cap retention (default 1024)
  pickStrategy?: 'uniform' | 'rarest-edge' | 'energy';
}

export class CoverageDriver {
  private corpus: CorpusEntry[] = [];
  private globalEdges: Set<string> = new Set();

  constructor(private readonly opts: CoverageDriverOptions) {}

  /** Pick the next seed for fast-check. Returns `undefined` to let fc pick randomly. */
  nextSeed(): number | undefined {
    if (this.corpus.length === 0) return undefined;
    // Naive: pick rarest-edge corpus entry.
    // Real driver would use AFL's FAST power schedule.
    const pick = this.corpus[Math.floor(Math.random() * this.corpus.length)];
    // Mutate seed by XOR'ing a few bits (AFL bit-flip analogue at the seed layer).
    return pick.seed ^ (1 << (Math.random() * 31 | 0));
  }

  /** Called from `onRunEnd`; diffs V8 coverage vs. the corpus. */
  ingestRun(evt: { seed: number; path: string; inputs: unknown[] }): void {
    const snapshot = this.readAndConsumeV8Dump();
    const sig = this.signatureOf(snapshot);
    const newEdges = this.diffEdges(snapshot);
    if (newEdges.size > 0) {
      for (const e of newEdges) this.globalEdges.add(e);
      this.corpus.push({
        seed: evt.seed,
        replayPath: evt.path,
        userInputs: evt.inputs,
        edgesSignature: sig,
        energy: 1,
      });
      // Trim corpus using rarest-edge retention.
      if (this.corpus.length > (this.opts.maxCorpus ?? 1024)) {
        this.corpus.sort((a, b) => a.energy - b.energy);
        this.corpus.length = this.opts.maxCorpus ?? 1024;
      }
    }
  }

  private readAndConsumeV8Dump(): unknown[] {
    const files = fs.readdirSync(this.opts.covDir).filter(f => f.startsWith('coverage-'));
    const out: unknown[] = [];
    for (const f of files) {
      const full = path.join(this.opts.covDir, f);
      out.push(JSON.parse(fs.readFileSync(full, 'utf8')));
      fs.unlinkSync(full); // consume so the next run produces a fresh dump
    }
    return out;
  }

  private signatureOf(snapshot: unknown[]): string {
    // Cheap hash; real driver would use an order-independent rolling hash
    // over (scriptId, functionName, ranges[].startOffset).
    return String(JSON.stringify(snapshot).length);
  }

  private diffEdges(snapshot: unknown[]): Set<string> {
    // Placeholder — real driver parses V8 ScriptCoverage + FunctionCoverage
    // and reduces to a set of "script:func:branchIndex" strings, compares to
    // `this.globalEdges`.
    const edges = new Set<string>();
    for (const s of snapshot) {
      const h = JSON.stringify(s).length;
      if (!this.globalEdges.has(String(h))) edges.add(String(h));
    }
    return edges;
  }
}

// How a user wires this up (pseudocode):
//
//   const driver = new CoverageDriver({ covDir: process.env.NODE_V8_COVERAGE! });
//   const unsub = fc.observe({
//     onRunEnd: (evt) => driver.ingestRun({ seed: evt.seed, path: evt.path, inputs: [] }),
//   });
//   for (let i = 0; i < 10_000; i++) {
//     const seed = driver.nextSeed() ?? Date.now();
//     fc.assert(fc.property(...), { seed, numRuns: 1, observability: true });
//   }
//   unsub();
