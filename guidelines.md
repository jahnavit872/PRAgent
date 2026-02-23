# Coding Guidelines

Use this file at repository root (e.g. copy to `CODING_GUIDELINES.md` or `GUIDELINES.md`) to enable **guidelines-based review**. The PR agent will compare code against these rules.

---

## Naming

- **Variables and functions:** camelCase (e.g. `getUserData`, `isValidInput`)
- **Classes:** PascalCase (e.g. `UserService`, `DataProcessor`)
- **Constants:** UPPER_SNAKE_CASE (e.g. `API_BASE_URL`, `MAX_RETRY`)

## JavaScript/TypeScript

- Use **single quotes** for strings
- **Semicolons required** at end of statements
- Maximum line length: **100 characters**
- No `eval()` or string-based code execution with user input
- No hardcoded secrets (API keys, tokens, passwords); use environment variables

## Security

- Never build SQL with string concatenation and user input; use parameterized queries
- Never pass user input to `eval()`, `Function()`, or similar
- Do not commit API keys, tokens, or passwords

## Imports

- Prefer explicit imports; resolve paths relative to project root
- Do not import from non-existent modules (will cause build/runtime failure)
