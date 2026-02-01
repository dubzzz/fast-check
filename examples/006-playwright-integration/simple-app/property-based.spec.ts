import { test, expect } from '@playwright/test';
import * as fc from 'fast-check';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Property-based tests using Playwright and fast-check
 * 
 * These tests demonstrate how to combine Playwright's browser automation
 * with fast-check's property-based testing to verify UI behaviors across
 * a wide range of inputs.
 */
test.describe('Calculator Property-Based Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`file://${path.join(__dirname, 'index.html')}`);
  });

  test('addition should be commutative in the UI', async ({ page }) => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: -1000, max: 1000 }),
        async (a, b) => {
          // Arrange - Test a + b
          await page.fill('#num1', String(a));
          await page.fill('#num2', String(b));
          await page.click('#add');
          const result1 = await page.locator('#result').textContent();

          // Arrange - Test b + a
          await page.fill('#num1', String(b));
          await page.fill('#num2', String(a));
          await page.click('#add');
          const result2 = await page.locator('#result').textContent();

          // Assert - Both should produce the same result
          expect(result1).toBe(result2);
        }
      ),
      { numRuns: 10 } // Run 10 times for faster execution in integration tests
    );
  });

  test('multiplication by zero should always result in zero', async ({ page }) => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: -1000, max: 1000 }), async (a) => {
        // Arrange
        await page.fill('#num1', String(a));
        await page.fill('#num2', '0');

        // Act
        await page.click('#multiply');

        // Assert
        const result = await page.locator('#result').textContent();
        expect(result).toBe('Result: 0');
      }),
      { numRuns: 10 }
    );
  });

  test('subtraction should be the inverse of addition', async ({ page }) => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: -500, max: 500 }),
        fc.integer({ min: -500, max: 500 }),
        async (a, b) => {
          // Arrange - First add
          await page.fill('#num1', String(a));
          await page.fill('#num2', String(b));
          await page.click('#add');
          const addResult = await page.locator('#result').textContent();
          const sum = parseFloat(addResult!.replace('Result: ', ''));

          // Act - Then subtract
          await page.fill('#num1', String(sum));
          await page.fill('#num2', String(b));
          await page.click('#subtract');
          const subtractResult = await page.locator('#result').textContent();
          const difference = parseFloat(subtractResult!.replace('Result: ', ''));

          // Assert - Should get back to original number
          expect(difference).toBe(a);
        }
      ),
      { numRuns: 10 }
    );
  });

  test('division by non-zero should never throw error', async ({ page }) => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        async (a, b) => {
          // Arrange
          await page.fill('#num1', String(a));
          await page.fill('#num2', String(b));

          // Act
          await page.click('#divide');

          // Assert - Should show a result, not an error
          const result = await page.locator('#result').textContent();
          expect(result).toMatch(/^Result:/);
          expect(result).not.toContain('Error');
        }
      ),
      { numRuns: 10 }
    );
  });

  test('division by zero should always show error', async ({ page }) => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: -1000, max: 1000 }), async (a) => {
        // Arrange
        await page.fill('#num1', String(a));
        await page.fill('#num2', '0');

        // Act
        await page.click('#divide');

        // Assert
        const result = await page.locator('#result').textContent();
        expect(result).toBe('Error: Cannot divide by zero');
      }),
      { numRuns: 10 }
    );
  });

  test('all operations should handle the result being displayed', async ({ page }) => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: -100, max: 100 }),
        fc.integer({ min: -100, max: 100 }),
        fc.constantFrom('add', 'subtract', 'multiply'),
        async (a, b, operation) => {
          // Arrange
          await page.fill('#num1', String(a));
          await page.fill('#num2', String(b));

          // Act
          await page.click(`#${operation}`);

          // Assert - Result should be visible and contain "Result:"
          const result = await page.locator('#result').textContent();
          expect(result).toBeTruthy();
          expect(result).toMatch(/^Result:/);
        }
      ),
      { numRuns: 15 }
    );
  });
});
