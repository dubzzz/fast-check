import { Arbitrary } from './definition/Arbitrary';
import { constant } from './ConstantArbitrary';
import { oneof } from './OneOfArbitrary';

export function scenario<TModel, TAction>(
  initialModel: TModel,
  modelUpdater: (model: TModel, action: TAction) => TModel,
  eligibleActions: (model: TModel) => Arbitrary<TAction>[],
  scenarioLength?: number
): Arbitrary<TAction[]> {
  const finalScenarioLength = typeof scenarioLength === 'number' ? scenarioLength : 10;

  const extendScenario = (current: {
    model: TModel;
    scenario: TAction[];
  }): Arbitrary<{ model: TModel; scenario: TAction[] }> => {
    // Extract eligible actions
    const actions = scenario.length < finalScenarioLength ? eligibleActions(current.model) : [];
    if (actions.length === 0) return constant(current);
    return oneof(...eligibleActions(current.model)).chain(a =>
      extendScenario({ model: modelUpdater(current.model, a), scenario: [...current.scenario, a] })
    );
  };

  return constant({ model: initialModel, scenario: [] as TAction[] })
    .chain(extendScenario)
    .map(({ scenario }) => scenario);
}

/*const myScenarioArb = scenarioArb(
  [],
  (m, a) => {
    // simplified reducer
    switch (a.type) {
      case 'add':
        return [...m, a.value];
      case 'removeAll':
        return m.filter(v => v !== a.value);
      case 'clear':
        return [];
    }
  },
  m => {
    const eligible = [
      fc.record({ type: fc.constant('add'), value: fc.hexa() }),
      fc.record({ type: fc.constant('clear') })
    ];
    if (m.length > 0) eligible.push(fc.record({ type: fc.constant('removeAll'), value: fc.constantFrom(...m) }));
    return eligible;
  }
);

fc.sample(myScenarioArb, 1);*/
