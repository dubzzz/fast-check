# Blog Post Tagging Guide

This guide helps maintain consistent and useful tags across all fast-check blog posts.

## Tagging Principles

Good tags should be:
- **Predictable**: Users should be able to guess them
- **Specific**: Describe the actual content or feature
- **Discoverable**: Match what users would search for
- **Consistent**: Follow clear patterns across posts

## Tag Categories

### 1. Post Type Tags

Use one of these to categorize the post type:

- `release` - Release announcements and "What's new" posts
- `tutorial` - Step-by-step guides and how-tos
- `case-study` - Real-world usage examples and investigations
- `retrospective` - Reflections on project decisions and history
- `advent-of-pbt` - Advent of PBT series posts

### 2. Feature/Topic Tags

Use specific feature names or topics:

- **Feature names**: `entityGraph`, `scheduler`, `infiniteStream`, etc.
- **Data structures**: `graphs`, `maps`, `sets`, `arrays`, etc.
- **Concepts**: `race-conditions`, `async-testing`, `shrinking`, etc.
- **Testing types**: `property-based-testing`, `fuzzing`, `model-based-testing`

### 3. Technical Domain Tags

Add 1-2 tags describing the technical domain:

- `data-modeling` - Generating complex data structures
- `concurrency` - Async/parallel execution topics
- `performance` - Performance improvements or benchmarks
- `memory` - Memory-related features or optimizations
- `security` - Security-related content (CVEs, vulnerabilities)
- `integration` - Integration with other tools/frameworks
- `reliability` - Reliability and correctness improvements

### 4. Ecosystem Tags

For posts about specific integrations or tools:

- Framework names: `vitest`, `jest`, `ava`, etc.
- Tool names: `faker`, `docusaurus`, etc.

## Examples

### Release Post About New Arbitrary

**Bad**: `tags: [what's new, arbitrary, relational]`
- "what's new" is vague
- "arbitrary" is too generic
- "relational" is too technical

**Good**: `tags: [release, entityGraph, graphs, data-modeling]`
- "release" is predictable
- "entityGraph" is the specific feature
- "graphs" is what users search for
- "data-modeling" describes the use case

### Performance Improvement Post

**Bad**: `tags: [what's new, performance, arbitrary]`

**Good**: `tags: [release, performance, shrinking]`
- Specific about what was improved

### Security/Vulnerability Post

**Good**: `tags: [security, case-study, prototype-pollution]`
- Clear about the topic
- Specific vulnerability type

### Integration Post

**Good**: `tags: [tutorial, integration, faker, data-generation]`
- Clear it's a tutorial
- Shows which tools are integrated
- Describes the purpose

## Tag Naming Conventions

- Use lowercase with hyphens for multi-word tags: `data-modeling`, not `DataModeling`
- Use plural for general topics: `graphs`, `strings`, `numbers`
- Use singular for specific features: `entityGraph`, `scheduler`, `ulid`
- Be specific over generic: `maps` and `sets` over just `collections`

## How Many Tags?

- Aim for 3-4 tags per post
- Always include one post type tag
- Include 1-2 specific feature/topic tags
- Add 1 technical domain tag if relevant

## Reviewing Existing Tags

When reviewing old posts, ask:
1. Would a user searching for this topic use these tags?
2. Are the tags specific enough to be useful?
3. Do they follow the current conventions?
