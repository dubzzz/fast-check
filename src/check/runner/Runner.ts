import Shrinkable from '../arbitrary/definition/Shrinkable'
import IProperty from '../property/IProperty'
import { Property } from '../property/Property'
import { AsyncProperty } from '../property/AsyncProperty'
import { TimeoutProperty } from '../property/TimeoutProperty'
import toss from './Tosser'
import { Parameters, QualifiedParameters, RunDetails, successFor, failureFor, throwIfFailed } from './utils/utils'

type ShrinkDetails<Ts> = [Ts, number, string];

function shrinkIt<Ts>(property: IProperty<Ts>, value: Shrinkable<Ts>, error: string): ShrinkDetails<Ts> {
    let details: ShrinkDetails<Ts> = [value.value, 0, error];
    let currentValue: Shrinkable<Ts> = value;
    let stopShrinking = false;
    while (!stopShrinking) {
        stopShrinking = true;
        for (const v of currentValue.shrink()) {
            const out = property.run(v.value) as (string|null);
            if (out != null) {
                stopShrinking = false;
                details = [v.value, details[1] +1, out];
                currentValue = v;
                break;
            }
        }
    }
    return details;
}
async function asyncShrinkIt<Ts>(property: IProperty<Ts>, value: Shrinkable<Ts>, error: string): Promise<ShrinkDetails<Ts>> {
    let details: ShrinkDetails<Ts> = [value.value, 0, error];
    let currentValue: Shrinkable<Ts> = value;
    let stopShrinking = false;
    while (!stopShrinking) {
        stopShrinking = true;
        for (const v of currentValue.shrink()) {
            const out = await property.run(v.value) as (string|null);
            if (out != null) {
                stopShrinking = false;
                details = [v.value, details[1] +1, out];
                currentValue = v;
                break;
            }
        }
    }
    return details;
}

function internalCheck<Ts>(property: IProperty<Ts>, params?: Parameters): RunDetails<Ts> {
    const qParams = QualifiedParameters.read(params);
    const generator = toss(property, qParams.seed);
    for (let idx = 0 ; idx < qParams.num_runs ; ++idx) {
        const g = generator.next().value();
        const out = property.run(g.value);
        if (out != null) {
            const [shrinkedValue, numShrinks, error] = shrinkIt(property, g, out as string);
            return failureFor(qParams, idx+1, numShrinks, shrinkedValue, error);
        }
    }
    return successFor<Ts>(qParams);
}
async function asyncInternalCheck<Ts>(rawProperty: IProperty<Ts>, params?: Parameters): Promise<RunDetails<Ts>> {
    const qParams = QualifiedParameters.read(params);
    const property = qParams.timeout == null ? rawProperty : new TimeoutProperty(rawProperty, qParams.timeout);
    const generator = toss(property, qParams.seed);
    for (let idx = 0 ; idx < qParams.num_runs ; ++idx) {
        const g = generator.next().value();
        const out = await property.run(g.value);
        if (out != null) {
            const [shrinkedValue, numShrinks, error] = await asyncShrinkIt(property, g, out as string);
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