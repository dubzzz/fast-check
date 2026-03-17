# Test Design System components {#tldr}

> **⚠️ Scope:** How to test publicly exposed Design System components (buttons, inputs, modals, tooltips…)?

**🔧 Recommended tooling:** `vitest`, `@vitest/browser-playwright`, `@testing-library/*`  
**🔧 Optional tooling:** `fast-check`, `@fast-check/vitest`

## General approach

**✅ Do** test Design System components as a consumer would use them — in an integration and black-box fashion

**❌ Don't** test the internal implementation details of a component (internal state, private methods, implementation-specific class names)

**👍 Prefer** focusing tests on publicly exposed components — they are the contract with consumers and regressions there have the highest impact

**✅ Do** cover every meaningful visual variant (sizes, states, themes) so that unintended regressions are caught early

## Visual regression with screenshot tests

**👍 Prefer** in-browser screenshot tests to guard against visual regressions (layout shifts, styling breakages, theme inconsistencies)

**✅ Do** capture screenshots for each important visual state of the component (default, hover, focused, disabled, error, loading…)

```tsx
// Example with @vitest/browser-playwright
import { page } from '@vitest/browser/context';

it('should render the primary button correctly', async () => {
  // Arrange
  page.render(<Button variant="primary">Click me</Button>);

  // Act — no action, just render

  // Assert
  await expect(page.screenshot()).toMatchScreenshot();
});

it('should render the disabled state correctly', async () => {
  // Arrange
  page.render(<Button variant="primary" disabled>Click me</Button>);

  // Assert
  await expect(page.screenshot()).toMatchScreenshot();
});
```

**✅ Do** fallback to DOM snapshot tests when browser-based screenshot tests are not available

```tsx
// Fallback with testing-library when no browser testing is set up
import { render } from '@testing-library/react';

it('should render the primary button correctly', () => {
  // Arrange / Act
  const { container } = render(<Button variant="primary">Click me</Button>);

  // Assert
  expect(container).toMatchSnapshot();
});
```

## Interactivity checks

**👍 Prefer** browser testing to validate interactivity (clicks, keyboard navigation, focus management)

```tsx
import { page } from '@vitest/browser/context';

it('should call onClick when the button is clicked', async () => {
  // Arrange
  const onClick = vi.fn();
  const screen = page.render(<Button onClick={onClick}>Click me</Button>);

  // Act
  await screen.getByRole('button', { name: 'Click me' }).click();

  // Assert
  expect(onClick).toHaveBeenCalledOnce();
});

it('should open the dropdown on click and close on Escape', async () => {
  // Arrange
  const screen = page.render(<Dropdown items={['A', 'B', 'C']} />);

  // Act
  await screen.getByRole('button').click();

  // Assert
  await expect(screen.getByRole('listbox')).toBeVisible();

  // Act — close
  await page.keyboard.press('Escape');

  // Assert
  await expect(screen.getByRole('listbox')).not.toBeVisible();
});
```

**✅ Do** fallback to testing-library when browser testing is not available

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should call onClick when the button is clicked', async () => {
  // Arrange
  const user = userEvent.setup();
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click me</Button>);

  // Act
  await user.click(screen.getByRole('button', { name: 'Click me' }));

  // Assert
  expect(onClick).toHaveBeenCalledOnce();
});
```

## Accessibility (a11y)

**✅ Do** query elements by their accessible role, label, or text — never by test IDs or CSS selectors when an accessible query exists

**👍 Prefer** `getByRole`, `getByLabelText`, `getByText` over `getByTestId`

```tsx
// ❌ Fragile: relies on implementation detail
screen.getByTestId('submit-btn');
screen.getByClassName('btn-primary');

// ✅ Accessible: mirrors how users and assistive technologies find elements
screen.getByRole('button', { name: 'Submit' });
screen.getByLabelText('Email address');
screen.getByText('Welcome back');
```

**✅ Do** verify that interactive elements have appropriate ARIA attributes

```tsx
it('should have the correct aria-expanded state on the accordion', async () => {
  // Arrange
  const screen = page.render(<Accordion title="Details">Content</Accordion>);

  // Assert — collapsed by default
  expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'false');

  // Act
  await screen.getByRole('button', { name: 'Details' }).click();

  // Assert — expanded after click
  expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'true');
});
```

**✅ Do** check keyboard navigation for interactive components (Tab, Enter, Space, Arrow keys, Escape)

## Notes

> If the component involves asynchronous behavior (lazy loading, debounced inputs, animations…), also refer to [`test-async-code.md`](./test-async-code.md) for guidance on testing async flows.
>
> If the component contains complex synchronous logic (value formatting, validation, transformations…), consider extracting that logic and refer to [`property-based-testing.md`](./property-based-testing.md) for testing it thoroughly.
