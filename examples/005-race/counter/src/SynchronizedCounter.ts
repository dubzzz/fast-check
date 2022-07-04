import { DbConnection } from './DbConnection';

export class SynchronizedCounter {
  // Hacky trick to avoid using compare-and-swap
  // Does not work when two counters are instantiated separately
  private lock: Promise<void> = Promise.resolve();
  constructor(private readonly db: DbConnection) {}
  async inc(): Promise<void> {
    await this.synchronized(async () => {
      const count = await this.db.read();
      await this.db.write(count + 1);
    });
  }
  private async synchronized(next: () => Promise<void>): Promise<void> {
    this.lock = this.lock.then(next);
    return this.lock;
  }
}
