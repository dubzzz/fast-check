import * as fc from 'fast-check';

import { AsyncCommand } from '../../../../src/check/model/command/AsyncCommand';
import { Command } from '../../../../src/check/model/command/Command';
import { modelRun, asyncModelRun } from '../../../../src/check/model/ModelRunner';

type Model = Record<string, unknown>;
type Real = unknown;

describe('ModelRunner', () => {
  describe('modelRunner', () => {
    it('Should run in order and skip unchecked', () =>
      fc.assert(
        fc.property(fc.array(fc.boolean()), (runOrNot) => {
          const setupData = { model: {}, real: {} };
          const startedRuns: number[] = [];
          const expectedRuns = runOrNot.map((v, idx) => (v === true ? idx : -1)).filter((v) => v >= 0);
          const commands = runOrNot.map((v, idx) => {
            return new (class implements Command<Model, Real> {
              name = 'Command';
              check = (m: Model) => {
                expect(m).toBe(setupData.model);
                return v;
              };
              run = (m: Model, r: Real) => {
                expect(m).toBe(setupData.model);
                expect(r).toBe(setupData.real);
                startedRuns.push(idx);
              };
            })();
          });
          modelRun(() => setupData, commands);
          expect(startedRuns).toEqual(expectedRuns);
        })
      ));
  });
  describe('asyncModelRunner', () => {
    it('Should run in order and skip unchecked', async () =>
      await fc.assert(
        fc.asyncProperty(fc.array(fc.boolean()), fc.boolean(), async (runOrNot, asyncSetup) => {
          const setupData = { model: {}, real: null };
          const startedRuns: number[] = [];
          const expectedRuns = runOrNot.map((v, idx) => (v === true ? idx : -1)).filter((v) => v >= 0);
          const commands = runOrNot.map((v, idx) => {
            return new (class implements AsyncCommand<Model, Real, true> {
              name = 'AsyncCommand';
              check = async (m: Model) => {
                return new Promise<boolean>((resolve) => {
                  setTimeout(() => {
                    expect(m).toBe(setupData.model);
                    resolve(v);
                  }, 0);
                });
              };
              run = async (m: Model, r: Real) => {
                return new Promise<void>((resolve) => {
                  expect(m).toBe(setupData.model);
                  expect(r).toBe(setupData.real);
                  startedRuns.push(idx);
                  resolve();
                });
              };
            })();
          });
          const setup = asyncSetup ? async () => setupData : () => setupData;
          await asyncModelRun(setup, commands);
          expect(startedRuns).toEqual(expectedRuns);
        })
      ));
    it('Should wait setup before launching commands', async () => {
      let calledBeforeDataReady = false;
      let setupDataReady = false;
      const setupData = { model: {}, real: null };
      const command = new (class implements AsyncCommand<Model, Real> {
        name = 'AsyncCommand';
        check = () => {
          calledBeforeDataReady = calledBeforeDataReady || !setupDataReady;
          return true;
        };
        run = async (_m: Model, _r: Real) => {
          calledBeforeDataReady = calledBeforeDataReady || !setupDataReady;
        };
      })();
      const setup = () =>
        new Promise<typeof setupData>((resolve) => {
          setTimeout(() => {
            setupDataReady = true;
            resolve(setupData);
          }, 0);
        });
      await asyncModelRun(setup, [command]);
      expect(setupDataReady).toBe(true);
      expect(calledBeforeDataReady).toBe(false);
    });
  });
});
