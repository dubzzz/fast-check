export default class Stream<T> implements IterableIterator<T> {
    readonly g: IterableIterator<T>;

    constructor(g: IterableIterator<T>) {
        this.g = g;
    }

    next(value?: any): IteratorResult<T> {
        return this.g.next();
    }
    [Symbol.iterator](): IterableIterator<T> {
        return this.g;
    }

    map<U>(f: (v: T) => U): Stream<U> {
        function* helper(v: T): IterableIterator<U> {
            yield f(v);
        }
        return this.flatMap(helper);
    }
    flatMap<U>(f: (v: T) => IterableIterator<U>): Stream<U> {
        function* helper(g: IterableIterator<T>): IterableIterator<U> {
            for (const v of g) {
                yield* f(v);
            }
        }
        return new Stream(helper(this.g));
    }
    
    dropWhile(f: (v: T) => boolean): Stream<T> {
        let foundEligible: boolean = false;
        function* helper(v: T): IterableIterator<T> {
            if (foundEligible || !f(v)) {
                foundEligible = true;
                yield v;
            }
        }
        return this.flatMap(helper);
    }
    drop(n: number): Stream<T> {
        let idx = 0;
        function helper(v: T): boolean {
            return idx++ < n;
        }
        return this.dropWhile(helper);
    }
    takeWhile(f: (v: T) => boolean): Stream<T> {
        function* helper(g: IterableIterator<T>): IterableIterator<T> {
            let cur = g.next();
            while (!cur.done && f(cur.value)) {
                yield cur.value;
                cur = g.next();
            }
        }
        return new Stream<T>(helper(this.g));
    }
    take(n: number): Stream<T> {
        let idx = 0;
        function helper(v: T): boolean {
            return idx++ < n;
        }
        return this.takeWhile(helper);
    }
}

function stream<T>(g: IterableIterator<T>): Stream<T> {
    return new Stream<T>(g);
}

export { stream, Stream };
