# CLAUDE.md

## Overview
This document outlines the guidelines, workflow, and coding standards for this Astro project.

## Development Workflow

### Branching Strategy
- Use feature branches for all new work: `feature/description`
- Use bug fix branches: `bugfix/description`
- Use release branches for version releases: `release/vX.Y.Z`
- Hotfix branches for production issues: `hotfix/description`

### Pull Request Process
1. Create a feature branch from `main`
2. Make commits with descriptive messages
3. Push branch to remote
4. Open a pull request against `main`
5. Request review from at least one team member
6. Address review feedback
7. Squash and merge upon approval
8. Delete feature branch after merge

### Commit Message Convention
- Use imperative mood: "Add feature" not "Added feature"
- Format: `type(scope): description`
- Types: feat, fix, docs, style, refactor, perf, test, chore
- Example: `feat(auth): add login functionality`

### Code Review Guidelines
- Review for correctness, readability, and maintainability
- Check for adherence to coding standards
- Ensure adequate test coverage
- Look for potential security issues
- Provide constructive, specific feedback

## Coding Standards

### General Principles
- Write clear, readable code
- Prefer simplicity over cleverness
- Follow the principle of least astonishment
- DRY (Don't Repeat Yourself) but don't over-abstraction
- Comment why, not what

### Language-Specific Standards
*(Add language-specific guidelines here as needed)*

### Formatting
- Use consistent indentation (2 spaces or tabs, choose one and stick with it)
- Limit line length to 80-120 characters
- Use meaningful variable and function names
- Keep functions small and focused (single responsibility principle)

### Error Handling
- Handle errors appropriately, don't ignore them
- Use consistent error handling patterns throughout the codebase
- Log errors with sufficient context for debugging
- Fail fast when encountering unrecoverable states

## Testing
- Write tests for new functionality
- Maintain or improve test coverage
- Write unit tests that are fast, isolated, and repeatable
- Integration tests should test critical user flows
- Test both positive and negative cases

## Documentation
- Keep documentation up-to-date with code changes
- Document public APIs and complex algorithms
- Use clear, concise language in comments
- Update README when significant changes occur

## Security
- Never commit secrets or credentials to the repository
- Validate and sanitize all user inputs
- Use environment variables for configuration
- Follow the principle of least privilege
- Regularly update dependencies

## Performance
- Consider performance implications of changes
- Avoid premature optimization but don't ignore obvious inefficiencies
- Profile and measure before optimizing
- Cache appropriately when beneficial

---
*This is a living document. Update it as practices evolve.*