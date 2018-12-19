import { CommandWrapper } from '../../../../../src/check/model/commands/CommandWrapper';
import { Command } from '../../../../../src/check/model/command/Command';
import { AsyncCommand } from '../../../../../src/check/model/command/AsyncCommand';

type Model = {};
type Real = {};

describe('CommandWrapper', () => {
  it('Should show name of the command if it has not run', () => {
    const cmd = new class implements Command<Model, Real> {
      check = (m: Readonly<Model>) => true;
      run = (m: Model, r: Real) => {};
      toString = () => 'sync command';
    }();
    const wrapper = new CommandWrapper(cmd);
    expect(wrapper.toString()).toEqual('sync command');
  });
  it('Should show name of the command if it has run', () => {
    const cmd = new class implements Command<Model, Real> {
      check = (m: Readonly<Model>) => true;
      run = (m: Model, r: Real) => {};
      toString = () => 'sync command';
    }();
    const wrapper = new CommandWrapper(cmd);
    wrapper.run({}, {});
    expect(wrapper.toString()).toEqual('sync command');
  });
  it('Should reset run flag of clone', () => {
    const cmd = new class implements Command<Model, Real> {
      check = (m: Readonly<Model>) => true;
      run = (m: Model, r: Real) => {};
      toString = () => 'sync command';
    }();
    const wrapper = new CommandWrapper(cmd);
    wrapper.run({}, {});
    const wrapper2 = wrapper.clone();
    expect(wrapper.hasRan).toBe(true);
    expect(wrapper2.hasRan).toBe(false);
  });
  it('Should consider a run on success', () => {
    const cmd = new class implements Command<Model, Real> {
      check = (m: Readonly<Model>) => true;
      run = (m: Model, r: Real) => {};
      toString = () => 'sync command';
    }();
    const wrapper = new CommandWrapper(cmd);
    expect(wrapper.hasRan).toBe(false);
    wrapper.run({}, {});
    expect(wrapper.hasRan).toBe(true);
  });
  it('Should consider a run on failure', () => {
    const cmd = new class implements Command<Model, Real> {
      check = (m: Readonly<Model>) => true;
      run = (m: Model, r: Real) => {
        throw 'failure message';
      };
      toString = () => 'sync command';
    }();
    const wrapper = new CommandWrapper(cmd);
    expect(wrapper.hasRan).toBe(false);
    expect(() => wrapper.run({}, {})).toThrowError('failure message');
    expect(wrapper.hasRan).toBe(true);
  });
  it('Should consider a run on asynchronous success', async () => {
    const cmd = new class implements AsyncCommand<Model, Real> {
      check = (m: Readonly<Model>) => true;
      run = async (m: Model, r: Real) => {};
      toString = () => 'async command';
    }();
    const wrapper = new CommandWrapper(cmd);
    expect(wrapper.hasRan).toBe(false);
    await wrapper.run({}, {});
    expect(wrapper.hasRan).toBe(true);
  });
  it('Should consider a run on asynchronous failure', async () => {
    const cmd = new class implements AsyncCommand<Model, Real> {
      check = (m: Readonly<Model>) => true;
      run = async (m: Model, r: Real) => {
        throw 'failure message';
      };
      toString = () => 'async command';
    }();
    const wrapper = new CommandWrapper(cmd);
    expect(wrapper.hasRan).toBe(false);
    await expect(wrapper.run({}, {})).rejects.toMatch('failure message');
    expect(wrapper.hasRan).toBe(true);
  });
});
