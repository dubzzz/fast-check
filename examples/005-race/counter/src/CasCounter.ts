import { DbConnection } from './DbConnection';

export class CasCounter {
  constructor(private readonly db: DbConnection) {}
  async inc(): Promise<void> {
    let done = false;
    while (!done) {
      const count = await this.db.read();
      done = await this.db.write(count + 1, count);
    }
  }
}
