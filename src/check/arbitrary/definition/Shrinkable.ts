import Stream from '../../../stream/Stream'

export default class Shrinkable<T> {
    constructor(readonly value: T, readonly shrink: () => Stream<Shrinkable<T>> = () => Stream.nil<Shrinkable<T>>()) {
    }//need to save the stream content to replay it
    map<U>(mapper: (t: T) => U): Shrinkable<U> {
        return new Shrinkable<U>(
            mapper(this.value),
            () => this.shrink().map(v => v.map<U>(mapper))
        );
    }
    filter(predicate: (t: T) => boolean): Shrinkable<T> {
        return new Shrinkable<T>(
            this.value,
            () => this.shrink().filter(v => predicate(v.value))
        );
    }
}
