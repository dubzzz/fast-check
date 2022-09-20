export class Space {
  constructor(
    readonly dim_x: number,
    readonly dim_y: number,
    private readonly solution_x: number,
    private readonly solution_y: number,
    private current_x: number,
    private current_y: number
  ) {}
  readHint(): string {
    let hint = '';

    if (this.solution_y < this.current_y) hint += 'U';
    else if (this.solution_y > this.current_y) hint += 'D';

    if (this.solution_x < this.current_x) hint += 'L';
    else if (this.solution_x > this.current_x) hint += 'R';

    return hint;
  }
  readPosition(): { x: number; y: number } {
    return { x: this.current_x, y: this.current_y };
  }
  move(x: number, y: number): void {
    this.current_x = x;
    this.current_y = y;
  }
  solved(): boolean {
    return this.current_x === this.solution_x && this.current_y === this.solution_y;
  }
}

export class SpaceBuilder {
  dim_x = 0;
  dim_y = 0;
  solution_x = 0;
  solution_y = 0;
  current_x = 0;
  current_y = 0;
  withDimension(x: number, y: number): SpaceBuilder {
    this.dim_x = x;
    this.dim_y = y;
    return this;
  }
  withSolution(x: number, y: number): SpaceBuilder {
    this.solution_x = x;
    this.solution_y = y;
    return this;
  }
  withCurrent(x: number, y: number): SpaceBuilder {
    this.current_x = x;
    this.current_y = y;
    return this;
  }
  build(): Space {
    return new Space(this.dim_x, this.dim_y, this.solution_x, this.solution_y, this.current_x, this.current_y);
  }
}
