import { IProperty } from '../../../../src/check/property/IProperty';
import { SkipAfterProperty } from '../../../../src/check/property/SkipAfterProperty';

// Mocks
import { Random } from '../../../../src/random/generator/Random';
jest.mock('../../../../src/random/generator/Random');

function buildProperty() {
  const mocks = {
    isAsync: jest.fn(),
    generate: jest.fn(),
    run: jest.fn()
  };
  return { mocks, property: mocks as IProperty<any> };
}

function buildRandom() {
  return new Random({} as any);
}

const startTimeMs = 200;
const timeLimitMs = 100;

describe('SkipAfterProperty', () => {
  beforeEach(() => {
    (Random as any).mockClear();
  });
  it('Should call timer at construction', async () => {
    const timerMock = jest.fn();
    new SkipAfterProperty(buildProperty().property, timerMock, 0);
    expect(timerMock.mock.calls.length).toBe(1);
  });
  it('Should not call timer on isAsync but forward call', async () => {
    const timerMock = jest.fn();
    const { mocks: propertyMock, property } = buildProperty();

    const p = new SkipAfterProperty(property, timerMock, 0);
    p.isAsync();

    expect(timerMock.mock.calls.length).toBe(1);
    expect(propertyMock.isAsync.mock.calls.length).toBe(1);
    expect(propertyMock.generate.mock.calls.length).toBe(0);
    expect(propertyMock.run.mock.calls.length).toBe(0);
  });
  it('Should not call timer on generate but forward call', async () => {
    const timerMock = jest.fn();
    const { mocks: propertyMock, property } = buildProperty();

    const p = new SkipAfterProperty(property, timerMock, 0);
    p.generate(buildRandom());

    expect(timerMock.mock.calls.length).toBe(1);
    expect(propertyMock.isAsync.mock.calls.length).toBe(0);
    expect(propertyMock.generate.mock.calls.length).toBe(1);
    expect(propertyMock.run.mock.calls.length).toBe(0);
  });
  it('Should call timer on run and forward call if ok', async () => {
    const timerMock = jest.fn();
    timerMock.mockReturnValueOnce(startTimeMs).mockReturnValueOnce(startTimeMs + timeLimitMs - 1);
    const { mocks: propertyMock, property } = buildProperty();

    const p = new SkipAfterProperty(property, timerMock, startTimeMs);
    p.run({});

    expect(timerMock.mock.calls.length).toBe(2);
    expect(propertyMock.isAsync.mock.calls.length).toBe(0);
    expect(propertyMock.generate.mock.calls.length).toBe(0);
    expect(propertyMock.run.mock.calls.length).toBe(1);
  });
  it('Should call timer on run and fail after time limit', async () => {
    const timerMock = jest.fn();
    timerMock.mockReturnValueOnce(startTimeMs).mockReturnValueOnce(startTimeMs + timeLimitMs);
    const { mocks: propertyMock, property } = buildProperty();

    const p = new SkipAfterProperty(property, timerMock, timeLimitMs);
    expect(() => p.run({})).toThrowError();

    expect(timerMock.mock.calls.length).toBe(2);
    expect(propertyMock.isAsync.mock.calls.length).toBe(0);
    expect(propertyMock.generate.mock.calls.length).toBe(0);
    expect(propertyMock.run.mock.calls.length).toBe(0);
  });
});
