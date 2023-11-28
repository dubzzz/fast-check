import { expect } from "vitest";

export async function expectThrowWithCause(
  promise: Promise<unknown>,
  errorCause: string | RegExp | Error,
): Promise<void> {
  await expect(
    promise.catch((err) => {
      throw (err as any).cause;
    }),
  ).rejects.toThrowError(errorCause);
}
