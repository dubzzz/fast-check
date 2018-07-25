import * as assert from 'assert';

import { CommandWrapper } from '../../../../../src/check/model/commands/CommandWrapper';
import { Command } from '../../../../../src/check/model/command/Command';
import { AsyncCommand } from '../../../../../src/check/model/command/AsyncCommand';

type Model = {};
type Real = {};

describe('CommandWrapper', () => {
  it('Should hide name of the command if it has not run', () => {
    const cmd = new class implements Command<Model, Real> {
      check = (m: Readonly<Model>) => true;
      run = (m: Model, r: Real) => {};
      toString = () => 'sync command';
    }();
    const wrapper = new CommandWrapper(cmd);
    assert.strictEqual(wrapper.toString(), '-');
  });
  it('Should show name of the command if it has run', () => {
    const cmd = new class implements Command<Model, Real> {
      check = (m: Readonly<Model>) => true;
      run = (m: Model, r: Real) => {};
      toString = () => 'sync command';
    }();
    const wrapper = new CommandWrapper(cmd);
    wrapper.run({}, {});
    assert.strictEqual(wrapper.toString(), 'sync command');
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
    assert.ok(wrapper.hasRan);
    assert.ok(!wrapper2.hasRan);
  });
  it('Should consider a run on success', () => {
    const cmd = new class implements Command<Model, Real> {
      check = (m: Readonly<Model>) => true;
      run = (m: Model, r: Real) => {};
      toString = () => 'sync command';
    }();
    const wrapper = new CommandWrapper(cmd);
    assert.ok(!wrapper.hasRan);
    wrapper.run({}, {});
    assert.ok(wrapper.hasRan);
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
    assert.ok(!wrapper.hasRan);
    try {
      wrapper.run({}, {});
      assert.fail('Should have forwarded the exception');
    } catch (err) {
      assert.strictEqual(err, 'failure message');
    }
    assert.ok(wrapper.hasRan);
  });
  it('Should consider a run on asynchronous success', async () => {
    const cmd = new class implements AsyncCommand<Model, Real> {
      check = (m: Readonly<Model>) => true;
      run = async (m: Model, r: Real) => {};
      toString = () => 'async command';
    }();
    const wrapper = new CommandWrapper(cmd);
    assert.ok(!wrapper.hasRan);
    await wrapper.run({}, {});
    assert.ok(wrapper.hasRan);
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
    assert.ok(!wrapper.hasRan);
    try {
      await wrapper.run({}, {});
      assert.fail('Should have forwarded the exception');
    } catch (err) {
      assert.strictEqual(err, 'failure message');
    }
    assert.ok(wrapper.hasRan);
  });
});
