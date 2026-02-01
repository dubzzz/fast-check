import { test, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('Calculator Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the calculator page
    await page.goto(`file://${path.join(__dirname, 'index.html')}`);
  });

  test('should display the calculator interface', async ({ page }) => {
    // Assert
    await expect(page.locator('h1')).toHaveText('Simple Calculator');
    await expect(page.locator('#num1')).toBeVisible();
    await expect(page.locator('#num2')).toBeVisible();
    await expect(page.locator('#add')).toBeVisible();
    await expect(page.locator('#subtract')).toBeVisible();
    await expect(page.locator('#multiply')).toBeVisible();
    await expect(page.locator('#divide')).toBeVisible();
    await expect(page.locator('#result')).toBeVisible();
  });

  test('should add two numbers correctly', async ({ page }) => {
    // Arrange
    await page.fill('#num1', '5');
    await page.fill('#num2', '3');

    // Act
    await page.click('#add');

    // Assert
    await expect(page.locator('#result')).toHaveText('Result: 8');
  });

  test('should subtract two numbers correctly', async ({ page }) => {
    // Arrange
    await page.fill('#num1', '10');
    await page.fill('#num2', '4');

    // Act
    await page.click('#subtract');

    // Assert
    await expect(page.locator('#result')).toHaveText('Result: 6');
  });

  test('should multiply two numbers correctly', async ({ page }) => {
    // Arrange
    await page.fill('#num1', '7');
    await page.fill('#num2', '6');

    // Act
    await page.click('#multiply');

    // Assert
    await expect(page.locator('#result')).toHaveText('Result: 42');
  });

  test('should divide two numbers correctly', async ({ page }) => {
    // Arrange
    await page.fill('#num1', '20');
    await page.fill('#num2', '5');

    // Act
    await page.click('#divide');

    // Assert
    await expect(page.locator('#result')).toHaveText('Result: 4');
  });

  test('should show error when dividing by zero', async ({ page }) => {
    // Arrange
    await page.fill('#num1', '10');
    await page.fill('#num2', '0');

    // Act
    await page.click('#divide');

    // Assert
    await expect(page.locator('#result')).toHaveText('Error: Cannot divide by zero');
  });

  test('should handle negative numbers in addition', async ({ page }) => {
    // Arrange
    await page.fill('#num1', '-5');
    await page.fill('#num2', '3');

    // Act
    await page.click('#add');

    // Assert
    await expect(page.locator('#result')).toHaveText('Result: -2');
  });

  test('should handle decimal numbers', async ({ page }) => {
    // Arrange
    await page.fill('#num1', '5.5');
    await page.fill('#num2', '2.5');

    // Act
    await page.click('#add');

    // Assert
    await expect(page.locator('#result')).toHaveText('Result: 8');
  });

  test('should show error for invalid input', async ({ page }) => {
    // Arrange
    await page.fill('#num1', '');
    await page.fill('#num2', '5');

    // Act
    await page.click('#add');

    // Assert
    await expect(page.locator('#result')).toHaveText('Please enter valid numbers');
  });

  test('should allow multiple operations in sequence', async ({ page }) => {
    // First operation
    await page.fill('#num1', '10');
    await page.fill('#num2', '5');
    await page.click('#add');
    await expect(page.locator('#result')).toHaveText('Result: 15');

    // Second operation
    await page.fill('#num1', '20');
    await page.fill('#num2', '4');
    await page.click('#multiply');
    await expect(page.locator('#result')).toHaveText('Result: 80');

    // Third operation
    await page.fill('#num1', '100');
    await page.fill('#num2', '10');
    await page.click('#divide');
    await expect(page.locator('#result')).toHaveText('Result: 10');
  });
});
