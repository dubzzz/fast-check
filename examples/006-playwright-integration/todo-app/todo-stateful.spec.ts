import { test, expect } from '@playwright/test';
import * as fc from 'fast-check';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Advanced property-based tests for Todo app using Playwright and fast-check
 * 
 * This demonstrates testing stateful UI interactions with property-based testing.
 */
test.describe('Todo App - Property-Based Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`file://${path.join(__dirname, 'index.html')}`);
  });

  test('stats should always reflect the actual todo count', async ({ page }) => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0), { maxLength: 10 }),
        async (todoTexts) => {
          // Arrange - Reload page to reset state
          await page.reload();

          // Act - Add all todos
          for (const text of todoTexts) {
            await page.fill('#todo-input', text);
            await page.click('#add-button');
          }

          // Assert - Total count should match number of todos added
          const totalCount = await page.locator('#total-count').textContent();
          expect(parseInt(totalCount!)).toBe(todoTexts.length);

          // Assert - Active count should equal total (none completed yet)
          const activeCount = await page.locator('#active-count').textContent();
          expect(parseInt(activeCount!)).toBe(todoTexts.length);

          // Assert - Completed count should be zero
          const completedCount = await page.locator('#completed-count').textContent();
          expect(parseInt(completedCount!)).toBe(0);
        }
      ),
      { numRuns: 5 }
    );
  });

  test('completing todos should update stats correctly', async ({ page }) => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0), {
          minLength: 1,
          maxLength: 5,
        }),
        fc.integer({ min: 0, max: 4 }),
        async (todoTexts, numToComplete) => {
          // Arrange - Reload page and add todos
          await page.reload();

          for (const text of todoTexts) {
            await page.fill('#todo-input', text);
            await page.click('#add-button');
          }

          const actualNumToComplete = Math.min(numToComplete, todoTexts.length);

          // Act - Complete some todos
          const checkboxes = page.locator('.todo-item input[type="checkbox"]');
          for (let i = 0; i < actualNumToComplete; i++) {
            await checkboxes.nth(i).check();
          }

          // Assert - Stats should reflect completed todos
          const totalCount = await page.locator('#total-count').textContent();
          const activeCount = await page.locator('#active-count').textContent();
          const completedCount = await page.locator('#completed-count').textContent();

          expect(parseInt(totalCount!)).toBe(todoTexts.length);
          expect(parseInt(activeCount!)).toBe(todoTexts.length - actualNumToComplete);
          expect(parseInt(completedCount!)).toBe(actualNumToComplete);
        }
      ),
      { numRuns: 5 }
    );
  });

  test('deleting todos should update the list correctly', async ({ page }) => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0), {
          minLength: 2,
          maxLength: 5,
        }),
        async (todoTexts) => {
          // Arrange - Reload page and add todos
          await page.reload();

          for (const text of todoTexts) {
            await page.fill('#todo-input', text);
            await page.click('#add-button');
          }

          const initialCount = todoTexts.length;

          // Act - Delete the first todo
          await page.locator('.todo-item button').first().click();

          // Assert - Total count should decrease by 1
          const totalCount = await page.locator('#total-count').textContent();
          expect(parseInt(totalCount!)).toBe(initialCount - 1);

          // Assert - Number of todo items in DOM should match
          const itemCount = await page.locator('.todo-item').count();
          expect(itemCount).toBe(initialCount - 1);
        }
      ),
      { numRuns: 5 }
    );
  });

  test('UI should handle a sequence of random operations correctly', async ({ page }) => {
    type Operation =
      | { type: 'add'; text: string }
      | { type: 'toggle'; index: number }
      | { type: 'delete'; index: number };

    const operationArbitrary = fc.oneof(
      fc.record({
        type: fc.constant('add' as const),
        text: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
      }),
      fc.record({ type: fc.constant('toggle' as const), index: fc.nat({ max: 9 }) }),
      fc.record({ type: fc.constant('delete' as const), index: fc.nat({ max: 9 }) })
    );

    await fc.assert(
      fc.asyncProperty(fc.array(operationArbitrary, { maxLength: 10 }), async (operations) => {
        // Arrange - Reload page to reset state
        await page.reload();
        
        let expectedCount = 0;
        let expectedCompleted = 0;

        for (const op of operations) {
          if (op.type === 'add') {
            await page.fill('#todo-input', op.text);
            await page.click('#add-button');
            expectedCount++;
          } else if (op.type === 'toggle') {
            const count = await page.locator('.todo-item').count();
            if (count > 0 && op.index < count) {
              const checkbox = page.locator('.todo-item input[type="checkbox"]').nth(op.index);
              const wasChecked = await checkbox.isChecked();
              await checkbox.click();
              expectedCompleted += wasChecked ? -1 : 1;
            }
          } else if (op.type === 'delete') {
            const count = await page.locator('.todo-item').count();
            if (count > 0 && op.index < count) {
              const wasCompleted = await page
                .locator('.todo-item')
                .nth(op.index)
                .locator('input[type="checkbox"]')
                .isChecked();
              await page.locator('.todo-item button').nth(op.index).click();
              expectedCount--;
              if (wasCompleted) {
                expectedCompleted--;
              }
            }
          }
        }

        // Assert - Final state should be consistent
        const totalCount = await page.locator('#total-count').textContent();
        const activeCount = await page.locator('#active-count').textContent();
        const completedCount = await page.locator('#completed-count').textContent();

        expect(parseInt(totalCount!)).toBe(expectedCount);
        expect(parseInt(completedCount!)).toBe(expectedCompleted);
        expect(parseInt(activeCount!)).toBe(expectedCount - expectedCompleted);
      }),
      { numRuns: 5 }
    );
  });
});
