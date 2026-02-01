// Calculator logic
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) {
    throw new Error('Cannot divide by zero');
  }
  return a / b;
}

// DOM interaction (only runs in browser)
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const num1Input = document.getElementById('num1');
    const num2Input = document.getElementById('num2');
    const resultDiv = document.getElementById('result');

    function performOperation(operation) {
      const num1 = parseFloat(num1Input.value);
      const num2 = parseFloat(num2Input.value);

      if (isNaN(num1) || isNaN(num2)) {
        resultDiv.textContent = 'Please enter valid numbers';
        return;
      }

      try {
        const result = operation(num1, num2);
        resultDiv.textContent = `Result: ${result}`;
      } catch (error) {
        resultDiv.textContent = `Error: ${error.message}`;
      }
    }

    document.getElementById('add').addEventListener('click', () => {
      performOperation(add);
    });

    document.getElementById('subtract').addEventListener('click', () => {
      performOperation(subtract);
    });

    document.getElementById('multiply').addEventListener('click', () => {
      performOperation(multiply);
    });

    document.getElementById('divide').addEventListener('click', () => {
      performOperation(divide);
    });
  });
}

// Export for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { add, subtract, multiply, divide };
}
