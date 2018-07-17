import * as assert from 'assert';
import * as fc from '../../../../lib/fast-check';

import { AsyncCommand } from '../../../../src/check/model/command/AsyncCommand';
import { Command } from '../../../../src/check/model/command/Command';
import { modelRun, asyncModelRun } from '../../../../src/check/model/ModelRunner';

describe('ModelRunner', () => {
  describe('modelRunner', () => {
    it('Should run in order and skip unchecked', () =>
      fc.assert(
        fc.property(fc.array(fc.boolean()), runOrNot => {
          const setupData = { model: {}, real: {} };
          const startedRuns: number[] = [];
          const expectedRuns = runOrNot.map((v, idx) => (v === true ? idx : -1)).filter(v => v >= 0);
          const commands = runOrNot.map((v, idx) => {
            return new class implements Command<{}, {}> {
              name = 'Command';
              check = (m: {}) => {
                assert.ok(m === setupData.model);
                return v;
              };
              run = (m: {}, r: {}) => {
                assert.ok(m === setupData.model);
                assert.ok(r === setupData.real);
                startedRuns.push(idx);
              };
            }();
          });
          modelRun(() => setupData, commands);
          assert.deepEqual(startedRuns, expectedRuns);
        })
      ));
  });
  describe('asyncModelRunner', () => {
    it('Should run in order and skip unchecked', async () =>
      await fc.assert(
        fc.asyncProperty(fc.array(fc.boolean()), async runOrNot => {
          const setupData = { model: {}, real: null };
          const startedRuns: number[] = [];
          const expectedRuns = runOrNot.map((v, idx) => (v === true ? idx : -1)).filter(v => v >= 0);
          const commands = runOrNot.map((v, idx) => {
            return new class implements AsyncCommand<{}, {}> {
              name = 'AsyncCommand';
              check = (m: {}) => {
                assert.ok(m === setupData.model);
                return v;
              };
              run = async (m: {}, r: {}) => {
                assert.ok(m === setupData.model);
                assert.ok(r === setupData.real);
                startedRuns.push(idx);
              };
            }();
          });
          await asyncModelRun(() => setupData, commands);
          assert.deepEqual(startedRuns, expectedRuns);
        })
      ));
  });
});
