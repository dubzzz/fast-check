import Arbitrary from '../arbitrary/definition/Arbitrary';
import Shrinkable from '../arbitrary/definition/Shrinkable';
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator';
import IProperty from './IProperty';

const timeoutAfter = function(timeMs: number) {
    return new Promise<string>(
        (resolve, reject) => setTimeout(() => resolve(`Property timeout: exceeded limit of ${timeMs} milliseconds`), timeMs));
};

export class TimeoutProperty<Ts> implements IProperty<Ts> {
    constructor(readonly property: IProperty<Ts>, readonly timeMs: number) { }
    isAsync = () => true;
    generate(mrng: MutableRandomGenerator): Shrinkable<Ts> {
        return this.property.generate(mrng);
    }
    async run(v: Ts): Promise<string|null> {
        return await Promise.race([
                this.property.run(v),
                timeoutAfter(this.timeMs)
            ]) as string | null;
    }
}
