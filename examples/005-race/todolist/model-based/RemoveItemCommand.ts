import { TodolistCommand, TodolistModel, TodolistReal, listTodos, ExtractedTodoItem, prettyDetails } from './Model';

export class RemoveItemCommand implements TodolistCommand {
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
    todosBefore[selectedTodoIndex].actions.remove();
    this.runDetails = prettyDetails(todosBefore[selectedTodoIndex]);

    const todosAfter = await listTodos();

    // We expect the resulting list of todos not to contain the removed todo
    // At least for the moment, if the server request fails then it might re-appear
    expect(todosAfter.map(extractItemDataExtended)).toEqual(
      [...todosBefore.slice(0, selectedTodoIndex), ...todosBefore.slice(selectedTodoIndex + 1)].map(
        extractItemDataExtended
      )
    );
  }

  toString() {
    return `RemoveItem(${this.position})/*${this.runDetails}*/`;
  }
}

// Helpers

const extractItemDataExtended = (todoItem: Pick<ExtractedTodoItem, 'label' | 'checked' | 'loading'>) => {
  return { label: todoItem.label, checked: todoItem.checked, loading: todoItem.loading };
};
