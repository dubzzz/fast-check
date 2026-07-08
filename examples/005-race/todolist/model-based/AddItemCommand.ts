import { expect } from 'vitest';
import { TodolistCommand, TodolistModel, TodolistReal, listTodos, sortTodos, ExtractedTodoItem } from './Model.js';
import { screen, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

// Copied from https://github.com/testing-library/user-event/issues/586
function escapeKeyboardInput(value: string): string {
  return value.replace(/[{[]/g, '$&$&');
}

export class AddItemCommand implements TodolistCommand {
  constructor(readonly label: string) {}

  async check(m: TodolistModel): Promise<boolean> {
    return true;
  }

  async run(m: TodolistModel, r: TodolistReal): Promise<void> {
    const todosBefore = await listTodos();

    await act(async () => {
      await userEvent.clear(screen.getByTestId('todo-new-item-input'));
      if (this.label.length !== 0) {
        await userEvent.type(screen.getByTestId('todo-new-item-input'), escapeKeyboardInput(this.label));
      }
      await userEvent.click(screen.getByTestId('todo-new-item-button'));
    });
    const todosAfter = await listTodos();

    // We expect the todolist to have a new unchecked item with the added label (withour any specific ordering)
    const expectedTodos = [...todosBefore, { label: this.label, checked: false }];
    expect(sortTodos(todosAfter.map(extractItemData))).toEqual(sortTodos(expectedTodos.map(extractItemData)));
  }

  toString() {
    return `AddItem(${JSON.stringify(this.label)})`;
  }
}

// Helpers

const extractItemData = (todoItem: Pick<ExtractedTodoItem, 'label' | 'checked'>) => {
  return { label: todoItem.label, checked: todoItem.checked };
};
