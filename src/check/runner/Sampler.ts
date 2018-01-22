import Arbitrary from '../arbitrary/definition/Arbitrary'
import { stream } from '../../stream/Stream'
import IProperty from '../property/IProperty'
import { Parameters, QualifiedParameters } from './utils/utils'
import toss from './Tosser'

function sample<Ts>(generator: (IProperty<Ts> | Arbitrary<Ts>), params?: (Parameters|number)): Ts[] {
    const qParams = QualifiedParameters.read_or_num_runs(params);
    return [...stream(toss(generator, qParams.seed)).take(qParams.num_runs).map(s => s.value)];
}

export { sample };
