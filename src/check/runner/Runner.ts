import Shrinkable from '../arbitrary/definition/Shrinkable'
import IProperty from '../property/IProperty'
import { Property } from '../property/Property'
import { AsyncProperty } from '../property/AsyncProperty'
import { TimeoutProperty } from '../property/TimeoutProperty'
import toss from './Tosser'
import { Parameters, QualifiedParameters, RunDetails, successFor, failureFor, throwIfFailed } from './utils/utils'

class RunExecution<Ts> {
    public pathToFailure?: string;
    public value?: Ts;
    public failure: string;
    
    public fail(value: Ts, id: number, message: string) {
        if (this.pathToFailure == null)
            this.pathToFailure = `${id}`;
        else
            this.pathToFailure += `:${id}`;
        this.value = value;
        this.failure = message;
    }

    private isSuccess = (): boolean => this.pathToFailure == null;
    private firstFailure = (): number => this.pathToFailure ? +this.pathToFailure.split(':')[0] : -1;
    private numShrinks = (): number => this.pathToFailure ? this.pathToFailure.split(':').length : 0;

    public toRunDetails(qParams: QualifiedParameters): RunDetails<Ts> {
        return this.isSuccess()
            ? successFor<Ts>(qParams)
            : failureFor<Ts>(qParams, this.firstFailure() +1, this.numShrinks(), this.value!, this.failure);
    }
}

function runIt<Ts>(property: IProperty<Ts>, initialValues: IterableIterator<Shrinkable<Ts>>): RunExecution<Ts> {
    const runExecution = new RunExecution<Ts>();
    let done = false;
    let values: IterableIterator<Shrinkable<Ts>> = initialValues;
    while (!done) {
        done = true;
        let idx = 0;
        for (const v of values) {
            const out = property.run(v.value) as (string|null);
            if (out != null) {
                runExecution.fail(v.value, idx, out);
                values = v.shrink();
                done = false;
                break;
            }
            ++idx;
        }
    }
    return runExecution;
}
async function asyncRunIt<Ts>(property: IProperty<Ts>, initialValues: IterableIterator<Shrinkable<Ts>>): Promise<RunExecution<Ts>> {
    const runExecution = new RunExecution<Ts>();
    let done = false;
    let values: IterableIterator<Shrinkable<Ts>> = initialValues;
    while (!done) {
        done = true;
        let idx = 0;
        for (const v of values) {
            const out = await property.run(v.value) as (string|null);
            if (out != null) {
                runExecution.fail(v.value, idx, out);
                values = v.shrink();
                done = false;
                break;
            }
            ++idx;
        }
    }
    return runExecution;
}

function check<Ts>(property: AsyncProperty<Ts>, params?: Parameters) : Promise<RunDetails<Ts>>;
function check<Ts>(property: Property<Ts>, params?: Parameters) : RunDetails<Ts>;
function check<Ts>(property: IProperty<Ts>, params?: Parameters) : Promise<RunDetails<Ts>> | RunDetails<Ts>;
function check<Ts>(rawProperty: IProperty<Ts>, params?: Parameters) {
    const qParams = QualifiedParameters.read(params);
    const property = rawProperty.isAsync() && qParams.timeout != null
        ? new TimeoutProperty(rawProperty, qParams.timeout)
        : rawProperty;
    const generator = toss(property, qParams.seed);
    
    function* g() {
        for (let idx = 0 ; idx < qParams.num_runs ; ++idx)
            yield generator.next().value();
    }
    return property.isAsync()
            ? asyncRunIt(property, g()).then(e => e.toRunDetails(qParams))
            : runIt(property, g()).toRunDetails(qParams);
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