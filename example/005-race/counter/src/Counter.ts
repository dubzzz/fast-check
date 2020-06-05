import { DbConnection } from './DbConnection';

export class Counter {
  constructor(private readonly db: DbConnection) {}
  async inc(): Promise<void> {
    const count = await this.db.read();
    await this.db.write(count + 1);
  }
}
