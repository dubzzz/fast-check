import fc from 'fast-check';
import { RenderResult, fireEvent, screen } from '@testing-library/react';

export type TodolistModel = {
  todos: { label: string; checked: boolean }[];
};

export type TodolistReal = {};

export type TodolistCommand = fc.AsyncCommand<TodolistModel, TodolistReal, true>;

export type ExtractedTodoItem = {
  actions: {
    toggle: () => void;
    remove: () => void;
  };
  loading: boolean;
  checked: boolean;
  label: string;
};

export const listTodos = async (): Promise<ExtractedTodoItem[]> => {
  const allTodoDomItems = await screen.queryAllByTestId('todo-item');
  return allTodoDomItems.map((dom) => {
    const toggleHtmlElement = dom.getElementsByTagName('input')[0];
    const removeHtmlElement = dom.getElementsByTagName('button')[0];
    const toggle = () => {
      fireEvent.click(toggleHtmlElement);
    };
    const remove = () => {
      fireEvent.click(removeHtmlElement);
    };
    return {
      actions: { toggle, remove },
      loading: !!toggleHtmlElement.disabled,
      checked: !!toggleHtmlElement.checked,
      label: dom.getElementsByTagName('span')[0].textContent!,
    };
  });
};

export const sortTodos = (todos: (Pick<ExtractedTodoItem, 'label'> & Partial<ExtractedTodoItem>)[]) => {
  return todos.sort((todoA, todoB) => {
    if (todoA === todoB) {
      return 0;
    }
    if (todoA.label !== todoB.label) {
      return todoA.label.localeCompare(todoB.label);
    }
    if (todoA.checked !== todoB.checked) {
      return Number(todoA.checked) - Number(todoB.checked);
    }
    return Number(todoA.loading) - Number(todoB.loading);
  });
};

export const prettyDetails = (todo: ExtractedTodoItem) =>
  `label:${JSON.stringify(todo.label)},checked:${todo.checked},loading:${todo.loading}`;
