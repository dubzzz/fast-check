// Todo state management
class TodoManager {
  constructor() {
    this.todos = [];
    this.nextId = 1;
  }

  add(text) {
    if (!text || text.trim() === '') {
      throw new Error('Todo text cannot be empty');
    }
    const todo = {
      id: this.nextId++,
      text: text.trim(),
      completed: false,
    };
    this.todos.push(todo);
    return todo;
  }

  toggle(id) {
    const todo = this.todos.find((t) => t.id === id);
    if (!todo) {
      throw new Error(`Todo with id ${id} not found`);
    }
    todo.completed = !todo.completed;
    return todo;
  }

  remove(id) {
    const index = this.todos.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Todo with id ${id} not found`);
    }
    this.todos.splice(index, 1);
  }

  getAll() {
    return [...this.todos];
  }

  getStats() {
    const total = this.todos.length;
    const completed = this.todos.filter((t) => t.completed).length;
    const active = total - completed;
    return { total, active, completed };
  }
}

// DOM interaction (only runs in browser)
if (typeof window !== 'undefined') {
  const manager = new TodoManager();

  function updateUI() {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';

    manager.getAll().forEach((todo) => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (todo.completed ? ' completed' : '');
      li.dataset.todoId = todo.id;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = todo.completed;
      checkbox.addEventListener('change', () => {
        manager.toggle(todo.id);
        updateUI();
      });

      const span = document.createElement('span');
      span.textContent = todo.text;

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => {
        manager.remove(todo.id);
        updateUI();
      });

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteButton);
      list.appendChild(li);
    });

    const stats = manager.getStats();
    document.getElementById('total-count').textContent = stats.total;
    document.getElementById('active-count').textContent = stats.active;
    document.getElementById('completed-count').textContent = stats.completed;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('todo-input');
    const addButton = document.getElementById('add-button');

    const addTodo = () => {
      const text = input.value;
      if (text.trim()) {
        try {
          manager.add(text);
          input.value = '';
          updateUI();
        } catch (error) {
          alert(error.message);
        }
      }
    };

    addButton.addEventListener('click', addTodo);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addTodo();
      }
    });
  });
}

// Export for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TodoManager };
}
