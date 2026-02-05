# Test complex UI workflows {#tldr}

> **⚠️ Scope:** How to test large, composed UI screens — multi-step forms, dashboards, page-level layouts — that assemble many smaller components together?

**🔧 Recommended tooling:** `vitest`, `@vitest/browser-playwright`, `@testing-library/*`, `fast-check`  
**🔧 Optional tooling:** `@fast-check/vitest`

## General approach

**✅ Do** extract as much logic as possible out of the component into dedicated, independently testable functions

Why? Pure functions (validation, formatting, state reducers, data transformations) are far easier to test in isolation and benefit most from property-based testing.

```tsx
// ❌ Problematic: logic embedded in the component, hard to test
function CheckoutPage() {
  const [items, setItems] = useState([]);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = total > 100 ? total * 0.1 : 0;
  const shipping = total - discount > 50 ? 0 : 5.99;
  // ...renders UI
}

// ✅ Good: logic extracted, easy to test independently
function computeOrderSummary(items) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = total > 100 ? total * 0.1 : 0;
  const shipping = total - discount > 50 ? 0 : 5.99;
  return { total, discount, shipping };
}

function CheckoutPage() {
  const [items, setItems] = useState([]);
  const { total, discount, shipping } = computeOrderSummary(items);
  // ...renders UI
}
```

**✅ Do** test the extracted logic with property-based testing when applicable — see [`property-based-testing.md`](./property-based-testing.md)

```ts
import fc from 'fast-check';

it('should always compute a non-negative total', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({ price: fc.double({ min: 0, noNaN: true }), quantity: fc.nat() })),
      (items) => {
        // Act
        const { total } = computeOrderSummary(items);

        // Assert
        expect(total).toBeGreaterThanOrEqual(0);
      },
    ),
  );
});
```

## Visual regression with screenshot tests

**👍 Prefer** screenshot tests to prevent visual regressions on the overall assembled page or section

Why? At the macro-component level, the primary concern is that the final visual result is correct. Asserting on individual DOM nodes becomes brittle and misses layout-level issues.

```tsx
import { page } from '@vitest/browser/context';

it('should render the checkout page correctly with items', async () => {
  // Arrange
  const screen = page.render(<CheckoutPage items={sampleItems} />);

  // Assert
  await expect(page.screenshot()).toMatchScreenshot();
});

it('should render the empty state correctly', async () => {
  // Arrange
  const screen = page.render(<CheckoutPage items={[]} />);

  // Assert
  await expect(page.screenshot()).toMatchScreenshot();
});
```

**✅ Do** capture the most meaningful states rather than every possible combination — empty state, loading state, populated state, error state

## Interactivity testing

**👍 Prefer** browser testing for validating user workflows across the assembled UI

```tsx
import { page } from '@vitest/browser/context';

it('should navigate through the multi-step form', async () => {
  // Arrange
  const screen = page.render(<MultiStepForm />);

  // Act — step 1
  await screen.getByRole('textbox', { name: 'Name' }).fill('Alice');
  await screen.getByRole('button', { name: 'Next' }).click();

  // Assert — step 2 visible
  await expect(screen.getByRole('textbox', { name: 'Email' })).toBeVisible();

  // Act — step 2
  await screen.getByRole('textbox', { name: 'Email' }).fill('alice@example.com');
  await screen.getByRole('button', { name: 'Submit' }).click();

  // Assert — confirmation shown
  await expect(screen.getByText('Thank you, Alice!')).toBeVisible();
});
```

**✅ Do** fallback to testing-library when browser testing is not available

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should navigate through the multi-step form', async () => {
  // Arrange
  const user = userEvent.setup();
  render(<MultiStepForm />);

  // Act — step 1
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Alice');
  await user.click(screen.getByRole('button', { name: 'Next' }));

  // Assert — step 2 visible
  expect(screen.getByRole('textbox', { name: 'Email' })).toBeVisible();
});
```

## Model-based testing for complex stateful UIs

When a UI has many possible states and transitions (multi-step wizards, drag-and-drop dashboards, real-time collaborative editors…), consider model-based testing with fast-check to explore a wide range of user interaction sequences.

Model-based testing works by:

1. Defining a simplified **model** of the UI state
2. Defining **commands** that represent user actions (click, type, navigate, drag…)
3. Letting fast-check generate random sequences of commands and verifying the UI matches the model after each step

See the full model-based testing guide: https://fast-check.dev/docs/advanced/model-based-testing/

```ts
import fc from 'fast-check';

// 1. Define the model — a simplified representation of the UI state
type TodoModel = { items: string[] };

// 2. Define commands — each command maps to a user action
class AddTodoCommand implements fc.ICommand<TodoModel, TodoApp> {
  constructor(readonly text: string) {}
  check() {
    return true;
  }
  run(model: TodoModel, real: TodoApp) {
    // Update the model
    model.items.push(this.text);
    // Perform the action on the real UI
    real.addItem(this.text);
    // Assert the real UI matches the model
    expect(real.getItems()).toEqual(model.items);
  }
  toString() {
    return `AddTodo(${this.text})`;
  }
}

class RemoveTodoCommand implements fc.ICommand<TodoModel, TodoApp> {
  constructor(readonly index: number) {}
  check(model: TodoModel) {
    return model.items.length > 0;
  }
  run(model: TodoModel, real: TodoApp) {
    const idx = this.index % model.items.length;
    model.items.splice(idx, 1);
    real.removeItem(idx);
    expect(real.getItems()).toEqual(model.items);
  }
  toString() {
    return `RemoveTodo(${this.index})`;
  }
}

// 3. Run model-based tests
it('should handle any sequence of add and remove operations', () => {
  fc.assert(
    fc.property(
      fc.commands([
        fc.string().map((text) => new AddTodoCommand(text)),
        fc.nat().map((index) => new RemoveTodoCommand(index)),
      ]),
      (cmds) => {
        const model: TodoModel = { items: [] };
        const real = new TodoApp();
        fc.modelRun(() => ({ model, real }), cmds);
      },
    ),
  );
});
```

**👍 Prefer** model-based testing when the number of possible interaction paths is large and manual enumeration would be impractical

**❌ Don't** use model-based testing for simple, linear workflows — a few example-based tests are clearer and sufficient

## Notes

> If the UI involves asynchronous behavior (API calls, animations, lazy-loaded sections…), also refer to [`test-async-code.md`](./test-async-code.md) for guidance on handling async flows in tests.
>
> If the UI is primarily glue code wiring components together with little added logic, refer to [`test-glue-code.md`](./test-glue-code.md) for a lighter testing approach.
