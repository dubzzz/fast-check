import { safeApply } from '../../../src/utils/apply';

describe('safeApply', () => {
  it('should apply if no poisoning', () => {
    // Arrange
    class Nominal {
      constructor(private initialValue: number) {}
      doStuff(v1: number, v2: number): number {
        return this.initialValue + v1 + v2;
      }
    }
    const n = new Nominal(5);

    // Act
    const out = safeApply(Nominal.prototype.doStuff, n, [3, 10]);

    // Assert
    expect(out).toBe(5 + 3 + 10);
  });

  it('should apply if poisoning of f.apply', () => {
    // Arrange
    class Nominal {
      constructor(private initialValue: number) {}
      doStuff(v1: number, v2: number): number {
        return this.initialValue + v1 + v2;
      }
    }
    const n = new Nominal(5);
    const poisoned = jest.fn();
    Nominal.prototype.doStuff.apply = poisoned;

    // Act
    const out = safeApply(Nominal.prototype.doStuff, n, [3, 10]);

    // Assert
    expect(poisoned).not.toHaveBeenCalled();
    expect(out).toBe(5 + 3 + 10);
  });

  it('should apply if poisoning of Function.prototype.apply', () => {
    // Arrange
    class Nominal {
      constructor(private initialValue: number) {}
      doStuff(v1: number, v2: number): number {
        return this.initialValue + v1 + v2;
      }
    }
    const n = new Nominal(5);
    const poisoned = jest.fn();
    const sourceFunctionApply = Function.prototype.apply;
    Function.prototype.apply = poisoned;

    try {
      // Act
      const out = safeApply(Nominal.prototype.doStuff, n, [3, 10]);

      // Assert
      expect(poisoned).not.toHaveBeenCalled();
      expect(out).toBe(5 + 3 + 10);
    } finally {
      Function.prototype.apply = sourceFunctionApply;
    }
  });

  it('should apply if throwing poisoning of f.apply', () => {
    // Arrange
    class Nominal {
      constructor(private initialValue: number) {}
      doStuff(v1: number, v2: number): number {
        return this.initialValue + v1 + v2;
      }
    }
    const n = new Nominal(5);
    Object.defineProperty(Nominal.prototype.doStuff, 'apply', {
      get: () => {
        throw new Error('evil code');
      },
    });

    // Act
    const out = safeApply(Nominal.prototype.doStuff, n, [3, 10]);

    // Assert
    expect(out).toBe(5 + 3 + 10);
  });

  it('should apply if throwing poisoning of Function.prototype.apply', () => {
    // Arrange
    class Nominal {
      constructor(private initialValue: number) {}
      doStuff(v1: number, v2: number): number {
        return this.initialValue + v1 + v2;
      }
    }
    const n = new Nominal(5);
    const originalApplyDescriptor = Object.getOwnPropertyDescriptor(Function.prototype, 'apply');
    // eslint-disable-next-line @typescript-eslint/ban-types
    delete (Function.prototype as Partial<Function['prototype']>).apply;
    Object.defineProperty(Function.prototype, 'apply', {
      configurable: true, // so that we can revert the change
      get: () => {
        throw new Error('evil code');
      },
    });

    try {
      // Act
      const out = safeApply(Nominal.prototype.doStuff, n, [3, 10]);

      // Assert
      expect(out).toBe(5 + 3 + 10);
    } finally {
      Object.defineProperty(Function.prototype, 'apply', originalApplyDescriptor!);
    }
  });
});
