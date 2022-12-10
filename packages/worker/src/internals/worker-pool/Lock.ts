export type AcquiredLock = { release: () => void };

/**
 * Lock makes sure only one code can access a given section
 * To allow next runner, the first lock has to release itself
 */
export class Lock {
  private _lastAcquired = Promise.resolve();

  async acquire(): Promise<AcquiredLock> {
    const oldLastAcquired = this._lastAcquired;
    let release: () => void = () => void 0;
    this._lastAcquired = new Promise((resolve) => (release = resolve));
    await oldLastAcquired;
    return { release };
  }
}
