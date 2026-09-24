import { beforeEach, describe, it, expect, vi } from 'vitest';
import { nil } from '../../utils/iterator.js';
import { decorateProperty } from './DecorateProperty.js';
import type { Property } from '../property/types/Property.js';
import { Value } from '../arbitrary/definition/Value.js';

// Mocks
import { TimeoutProperty } from '../property/plugins/TimeoutProperty.js';
vi.mock('../property/plugins/TimeoutProperty.js');

function buildProperty() {
  return {
    generate: () => new Value({}, undefined),
    shrink: () => nil,
    runBeforeEach: () => {},
    run: () => null,
    runAfterEach: () => {},
  } satisfies Property<any>;
}

describe('decorateProperty', () => {
  beforeEach(() => {
    (TimeoutProperty as any).mockClear();
  });
  it('Should enable none when needed', () => {
    decorateProperty(buildProperty(), { timeout: undefined });
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable TimeoutProperty on timeout', () => {
    decorateProperty(buildProperty(), { timeout: 1 });
    expect(TimeoutProperty).toHaveBeenCalledTimes(1);
  });
});
