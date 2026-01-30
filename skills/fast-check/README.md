# fast-check Skills

This folder contains [Agent Skills](https://github.com/anthropics/skills) for fast-check, a property-based testing framework for JavaScript/TypeScript.

## What are Skills?

Skills are folders of instructions, scripts, and resources that AI assistants (like Claude) load dynamically to improve performance on specialized tasks. They teach AI assistants how to complete specific tasks in a repeatable way.

## Available Skills

### fast-check

The main skill for working with fast-check. Use this skill when:

- Writing property-based tests
- Creating arbitraries (random data generators)
- Testing with automatic shrinking
- Integrating with test frameworks (Jest, Vitest, Mocha, etc.)
- Model-based testing
- Detecting race conditions

## Installation

### Claude Code

```
/plugin install fast-check@dubzzz/fast-check
```

### Claude.ai

Upload the skill folder or add the repository URL.

## Structure

```
skills/
└── fast-check/
    ├── SKILL.md           # Main skill instructions
    ├── README.md          # This file
    └── references/        # Detailed reference documentation
        ├── guide-getting-started.md
        ├── core-arbitraries.md
        ├── core-properties.md
        ├── core-runners.md
        ├── core-shrinking.md
        └── guide-debugging.md
```

## Learn More

- [fast-check Documentation](https://fast-check.dev/)
- [Agent Skills Specification](https://github.com/anthropics/skills)
- [What are Skills?](https://support.claude.com/en/articles/12512176-what-are-skills)
