/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import TodoList from './src/TodoList';

import { render, act, cleanup } from '@testing-library/react';

import { AddItemCommand } from './model-based/AddItemCommand';
import { ToggleItemCommand } from './model-based/ToggleItemCommand';
import { RemoveItemCommand } from './model-based/RemoveItemCommand';
import { listTodos, sortTodos } from './model-based/Model';

describe('TodoList', () => {
  it('should detect potential issues with the TodoList', async () => {
    await fc.assert(
      fc
        .asyncProperty(
          fc.scheduler(),
          TodoListCommands,
          fc.uniqueArray(fc.record({ id: fc.uuid(), label: fc.string(), checked: fc.boolean() }), {
            selector: (entry) => entry.id,
          }),
          fc.infiniteStream(fc.boolean()),
          async (s, commands, initialTodos, allFailures) => {
            const { mockedApi, expectedTodos } = mockApi(s, initialTodos, allFailures);

            // Execute all the commands
            const wrapper = render(<TodoList {...mockedApi} />);
            await fc.scheduledModelRun(s, () => ({ model: { todos: [], wrapper }, real: {} }), commands);

            // Check the final state (no more items should be loading)
            expect(
              sortTodos((await listTodos()).map((t) => ({ label: t.label, checked: t.checked, loading: t.loading }))),
            ).toEqual(sortTodos(expectedTodos().map((t) => ({ label: t.label, checked: t.checked, loading: false }))));
          },
        )
        .beforeEach(async () => {
          await cleanup();
        }),
    );
  });
});

// Helpers

const TodoListCommands = fc.commands([
  fc.string().map((label) => new AddItemCommand(label)),
  fc.nat().map((pos) => new ToggleItemCommand(pos)),
  fc.nat().map((pos) => new RemoveItemCommand(pos)),
]);

type ApiTodoItem = { id: string; label: string; checked: boolean };

const mockApi = (s: fc.Scheduler, initialTodos: ApiTodoItem[], allFailures: fc.Stream<boolean>) => {
  let lastIdx = 0;
  let allTodos = [...initialTodos];

  const fetchAllTodos = s.scheduleFunction(async function fetchAllTodos(): Promise<{
    status: 'success';
    response: ApiTodoItem[];
  }> {
    return { status: 'success', response: allTodos.slice() };
  }, act);

  const addTodo = s.scheduleFunction(async function addTodo(label: string): Promise<
    | {
        status: 'success';
        response: ApiTodoItem;
      }
    | { status: 'error' }
  > {
    const newTodo = {
      id: `${Math.random().toString(16).substring(2)}-${++lastIdx}`,
      label,
      checked: false,
    };
    if (allFailures.next().value) {
      return { status: 'error' };
    }
    allTodos.push(newTodo);
    return { status: 'success', response: newTodo };
  }, act);

  const toggleTodo = s.scheduleFunction(async function toggleTodo(id: string): Promise<
    | {
        status: 'success';
        response: ApiTodoItem;
      }
    | { status: 'error' }
  > {
    const foundTodo = allTodos.find((t) => t.id === id);
    if (!foundTodo || allFailures.next().value) {
      return { status: 'error' };
    }
    allTodos = allTodos.map((t) => {
      if (t.id !== id) return t;
      return { id, label: t.label, checked: !t.checked };
    });
    return { status: 'success', response: { ...foundTodo, checked: !foundTodo.checked } };
  }, act);

  const removeTodo = s.scheduleFunction(async function removeTodo(id: string): Promise<
    | {
        status: 'success';
        response: ApiTodoItem;
      }
    | { status: 'error' }
  > {
    const foundTodo = allTodos.find((t) => t.id === id);
    if (!foundTodo || allFailures.next().value) {
      return { status: 'error' };
    }
    allTodos = allTodos.filter((t) => {
      if (t.id !== id) return true;
      return false;
    });
    return { status: 'success', response: foundTodo };
  }, act);

  return {
    mockedApi: {
      fetchAllTodos,
      addTodo,
      toggleTodo,
      removeTodo,
    },
    expectedTodos: () => allTodos.slice(),
  };
};
