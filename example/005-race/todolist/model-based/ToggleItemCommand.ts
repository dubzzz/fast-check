import { TodolistCommand, TodolistModel, TodolistReal, listTodos, ExtractedTodoItem, prettyDetails } from './Model';

export class ToggleItemCommand implements TodolistCommand {
  private runDetails = '';
  constructor(readonly position: number) {}

  async check(m: TodolistModel) {
    // Only non loading todos can be edited
    const todos = await listTodos();
    return !todos.every((t) => t.loading);
  }

  async run(m: TodolistModel, _r: TodolistReal) {
    const todosBefore = await listTodos();

    const nonLoadingTodos = todosBefore.filter((t) => !t.loading);
    const selectedTodoIndex = todosBefore.indexOf(nonLoadingTodos[this.position % nonLoadingTodos.length]);
    todosBefore[selectedTodoIndex].actions.toggle();
    this.runDetails = prettyDetails(todosBefore[selectedTodoIndex]);

    const todosAfter = await listTodos();

    // We expect the checked to have switched from checked to unchecked (or the opposite)
    const expectedNewStateAtIndex = {
      label: todosBefore[selectedTodoIndex].label,
      checked: !todosBefore[selectedTodoIndex].checked,
    };
    expect(extractItemData(todosAfter[selectedTodoIndex])).toEqual(expectedNewStateAtIndex);

    // We expect other items not to have been impacted
    expect(
      [...todosAfter.slice(0, selectedTodoIndex), ...todosAfter.slice(selectedTodoIndex + 1)].map(
        extractItemDataExtended
      )
    ).toEqual(
      [...todosBefore.slice(0, selectedTodoIndex), ...todosBefore.slice(selectedTodoIndex + 1)].map(
        extractItemDataExtended
      )
    );
  }

  toString() {
    return `ToggleItem(${this.position})/*${this.runDetails}*/`;
  }
}

// Helpers

const extractItemData = (todoItem: Pick<ExtractedTodoItem, 'label' | 'checked'>) => {
  return { label: todoItem.label, checked: todoItem.checked };
};
const extractItemDataExtended = (todoItem: Pick<ExtractedTodoItem, 'label' | 'checked' | 'loading'>) => {
  return { label: todoItem.label, checked: todoItem.checked, loading: todoItem.loading };
};
