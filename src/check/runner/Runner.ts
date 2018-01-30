import Shrinkable from '../arbitrary/definition/Shrinkable'
import { RandomGenerator, skip_n } from '../../random/generator/RandomGenerator'
import IProperty from '../property/IProperty'
import { Property } from '../property/Property'
import { AsyncProperty } from '../property/AsyncProperty'
import toss from './Tosser'
import { Parameters, QualifiedParameters, RunDetails, successFor, failureFor, throwIfFailed } from './utils/utils'

function shrinkIt<Ts>(property: IProperty<Ts>, value: Shrinkable<Ts>, error: string, num_shrinks: number = 0): [Ts, number, string] {
    for (const v of value.shrink()) {
        const out = property.run(v.value) as (string|null);
        if (out != null) {
            return shrinkIt(property, v, out, num_shrinks+1);
        }
    }
    return [value.value, num_shrinks, error];
}
async function asyncShrinkIt<Ts>(property: IProperty<Ts>, value: Shrinkable<Ts>, error: string, num_shrinks: number = 0): Promise<[Ts, number, string]> {
    for (const v of value.shrink()) {
        const out = await property.run(v.value);
        if (out != null) {
            return await asyncShrinkIt(property, v, out, num_shrinks+1);
        }
    }
    return [value.value, num_shrinks, error];
}

function internalCheck<Ts>(property: IProperty<Ts>, params?: Parameters): RunDetails<Ts> {
    const qParams = QualifiedParameters.read(params);
    const generator = toss(property, qParams.seed);
    for (let idx = 0 ; idx < qParams.num_runs ; ++idx) {
        const g = generator.next().value;
        const out = property.run(g.value);
        if (out != null) {
            const [shrinkedValue, numShrinks, error] = shrinkIt(property, g, out as string);
            return failureFor(qParams, idx+1, numShrinks, shrinkedValue, error);
        }
    }
    return successFor<Ts>(qParams);
}
async function asyncInternalCheck<Ts>(property: IProperty<Ts>, params?: Parameters): Promise<RunDetails<Ts>> {
    const qParams = QualifiedParameters.read(params);
    const generator = toss(property, qParams.seed);
    for (let idx = 0 ; idx < qParams.num_runs ; ++idx) {
        const g = generator.next().value;
        const out = await property.run(g.value);
        if (out != null) {
            const [shrinkedValue, numShrinks, error] = await shrinkIt(property, g, out as string);
            return failureFor(qParams, idx+1, numShrinks, shrinkedValue, error);
        }
    }
    return successFor<Ts>(qParams);
}

function check<Ts>(property: AsyncProperty<Ts>, params?: Parameters) : Promise<RunDetails<Ts>>;
function check<Ts>(property: Property<Ts>, params?: Parameters) : RunDetails<Ts>;
function check<Ts>(property: IProperty<Ts>, params?: Parameters) : Promise<RunDetails<Ts>> | RunDetails<Ts>;
function check<Ts>(property: IProperty<Ts>, params?: Parameters) {
    return property.isAsync()
            ? asyncInternalCheck(property, params)
            : internalCheck(property, params);
}

function assert<Ts>(property: AsyncProperty<Ts>, params?: Parameters) : Promise<void>;
function assert<Ts>(property: Property<Ts>, params?: Parameters) : void;
function assert<Ts>(property: IProperty<Ts>, params?: Parameters) : Promise<void> | void;
function assert<Ts>(property: IProperty<Ts>, params?: Parameters) {
    const out = check(property, params);
    return property.isAsync()
            ? (out as Promise<RunDetails<Ts>>).then(throwIfFailed)
            : throwIfFailed(out as RunDetails<Ts>);
}

export { check, assert };