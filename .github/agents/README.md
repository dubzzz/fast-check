# Custom Agents

This directory contains custom agent configurations for the fast-check repository. These agents are specialized AI assistants designed to help with specific aspects of the project.

## Available Agents

### Property-Based Testing Expert

**File**: `property-based-testing-expert.yml`

An expert agent specialized in property-based testing with deep knowledge of the fast-check library. This agent helps developers:

- Identify and write effective property-based tests
- Apply the five main categories of property patterns
- Use fast-check arbitraries and combinators effectively
- Find properties that catch real bugs

#### Key Capabilities

The agent is trained on five main categories of properties:

1. **Characteristics Independent of the Inputs** - Properties that hold regardless of input values
2. **Characteristics Derived from the Inputs** - Input-output relationships that can be verified
3. **Restricted Set of Inputs with Useful Characteristics** - Edge cases with trivial verification
4. **Characteristics on Combination of Functions** - Round-trip properties and mathematical identities
5. **Comparison with a Simpler Implementation** - Oracle testing against reference implementations

#### When to Use

Use this agent when:
- Writing new property-based tests
- Refactoring existing tests to use properties
- Learning property-based testing patterns
- Debugging or improving existing properties
- Getting suggestions for testing complex algorithms

#### Example Usage

Simply invoke the agent and describe your testing scenario:
- "Help me write property-based tests for a sorting function"
- "What properties can I test for a prime factorization algorithm?"
- "Review my property-based test and suggest improvements"

The agent will provide complete, runnable code examples using fast-check.

## Resources

- [Fast-check Documentation](https://fast-check.dev/)
- [Examples Directory](../../examples/)
- [Introduction to Property-Based Testing](https://medium.com/@nicolasdubien/introduction-to-property-based-testing-f5236229d237)
