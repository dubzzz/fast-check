import React, { useState, useEffect } from 'react';

type TodoItem = { id: string; label: string; checked: boolean };
type DraftTodoItem = { id: undefined; label: string; checked: boolean };

type QueryAnswerSuccess<TResponse> = Readonly<{
  status: 'success';
  response: TResponse;
}>;
type QueryAnswerError = {
  status: 'error';
};
type QueryAnswer<TResponse> = QueryAnswerSuccess<TResponse> | QueryAnswerError;

type Props = {
  fetchAllTodos: () => Promise<QueryAnswer<TodoItem[]>>;
  addTodo: (label: string) => Promise<QueryAnswer<TodoItem>>; // return the new item
  toggleTodo: (id: string) => Promise<QueryAnswer<TodoItem>>; // return the updated item
  removeTodo: (id: string) => Promise<QueryAnswer<TodoItem>>; // return the deleted item
};

export default function TodoList(props: Props) {
  const { fetchAllTodos, addTodo, toggleTodo, removeTodo } = props;

  const [inputValue, setInputValue] = useState('');
  const [allTodos, setAllTodos] = useState(
    [] as ((TodoItem | DraftTodoItem) & {
      loading: boolean;
    })[]
  );

  useEffect(() => {
    const runQuery = async () => {
      const query = await fetchAllTodos();
      if (query.status === 'error') {
        // Ignore errors
        return;
      }
      setAllTodos((allTodos) => {
        // The call to fetch all the todos might be related to outdated data
        // We want to preserve all our todos that are not in the result of the query
        const knownTodosInQuery = new Set<string | undefined>(query.response.map((todo) => todo.id));
        return [
          ...query.response.map((todo) => ({ ...todo, loading: false })),
          ...allTodos.filter((todo) => !knownTodosInQuery.has(todo.id)),
        ];
      });
    };
    runQuery();
  }, [fetchAllTodos]);

  const addCurrentTodo = async () => {
    setInputValue('');

    // Temporary add the todo in the list as if it was already validated by the back
    const draftTodo = {
      id: undefined,
      label: inputValue,
      checked: false,
      loading: true,
    };
    setAllTodos((allTodos) => [...allTodos, draftTodo]);

    const query = await addTodo(inputValue);
    if (query.status === 'error') {
      // Remove draft todo on error
      setAllTodos((allTodos) => allTodos.filter((todo) => todo !== draftTodo));
      return;
    }
    // Replace draft todo by the final version
    setAllTodos((allTodos) =>
      allTodos.map((todo) => {
        return todo !== draftTodo ? todo : { ...query.response, loading: false };
      })
    );
  };

  const toggleById = async (id: string) => {
    // Temporary toggle the todo (serevr might still reject the toggle)
    setAllTodos((allTodos) =>
      allTodos.map((todo) => (todo.id !== id ? todo : { ...todo, checked: !todo.checked, loading: true }))
    );

    const query = await toggleTodo(id);
    if (query.status === 'error') {
      const toggledTodo = allTodos.find((todo) => todo.id === id);
      if (toggledTodo) {
        setAllTodos((allTodos) => allTodos.map((todo) => (todo.id !== id ? todo : toggledTodo)));
      }
      return;
    }

    setAllTodos((allTodos) => allTodos.map((todo) => (todo.id !== id ? todo : { ...query.response, loading: false })));
  };

  const deleteById = async (id: string) => {
    // Temporary delete the todo (serevr might still reject the delete)
    setAllTodos((allTodos) => allTodos.filter((todo) => todo.id !== id));

    const query = await removeTodo(id);
    if (query.status === 'error') {
      const deletedTodo = allTodos.find((todo) => todo.id === id);
      if (deletedTodo) {
        setAllTodos((allTodos) => [...allTodos, deletedTodo]);
      }
      return;
    }
  };

  return (
    <div>
      <p>Add your todo:</p>
      <input
        data-testid="todo-new-item-input"
        type="text"
        value={inputValue}
        onChange={(evt) => setInputValue(evt.target.value)}
      />
      <button data-testid="todo-new-item-button" onClick={addCurrentTodo}>
        Add
      </button>
      <p>Your todos:</p>
      <div>
        {allTodos.map((todoItem, idx) => {
          return (
            <div key={todoItem.id ? todoItem.id : `draft:${idx}`} data-testid="todo-item">
              <input
                type="checkbox"
                onChange={() => {
                  if (todoItem.id !== undefined) {
                    toggleById(todoItem.id);
                  }
                }}
                checked={todoItem.checked}
                disabled={todoItem.loading}
              />
              <span>{todoItem.label}</span>
              <button
                onClick={() => {
                  if (todoItem.id !== undefined) {
                    deleteById(todoItem.id);
                  }
                }}
                disabled={todoItem.loading}
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
