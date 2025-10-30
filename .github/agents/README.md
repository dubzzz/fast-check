# GitHub Copilot Agents

This directory contains custom GitHub Copilot agent configurations for the fast-check project.

## Available Agents

### Property-Based Testing Expert

**File**: `property-based-testing-expert.md`

An expert agent specialized in property-based testing using the fast-check library. This agent can help you:

- Design effective property-based tests for your code
- Identify appropriate property patterns (oracle, inverse, idempotency, invariants, etc.)
- Choose the right fast-check arbitraries for your domain
- Write comprehensive test properties that discover edge cases
- Apply best practices for property-based testing

#### When to Use

Use this agent when you need help with:

- Writing property-based tests for algorithms or functions
- Finding good properties to test in your code
- Understanding which fast-check arbitraries to use
- Debugging or improving existing property-based tests
- Learning property-based testing patterns and techniques

#### How to Use

1. In GitHub Copilot, mention or invoke the property-based testing expert agent
2. Describe the function or algorithm you want to test
3. The agent will suggest appropriate properties and provide complete test implementations
4. Review and adapt the suggestions to your specific needs

## About Custom Agents

Custom agents are specialized AI assistants that have domain-specific knowledge and can provide more targeted help than general-purpose assistants. They are defined using markdown files that contain instructions and context for the AI.

For more information about GitHub Copilot custom agents, see the [GitHub Copilot documentation](https://docs.github.com/en/copilot).
