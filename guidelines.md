# React Coding Guidelines

## General
- Use **functional components only** (no class components).
- Use **TypeScript types or interfaces** for props and state.
- Avoid using `any`.
- Follow **single responsibility principle** per component.
- Component files must use **PascalCase** naming.

## Hooks
- Do not call hooks conditionally.
- Include all dependencies in `useEffect` dependency arrays.
- Avoid unnecessary `useEffect`.

## State & Props
- Do not mutate state directly.
- Prefer controlled components for form inputs.
- Props should be validated via TypeScript.

## Performance
- Avoid inline functions inside JSX when possible.
- Memoize expensive computations using `useMemo`.
- Use `React.memo` for frequently re-rendered components.

## Accessibility (A11y)
- All buttons must have accessible text.
- Inputs must have associated labels.
- Avoid `onClick` handlers on non-interactive elements.

## Security
- Do not use `dangerouslySetInnerHTML`.
- Never trust user input directly.

## Code Quality
- Remove unused variables and imports.
- Avoid console logs in production code.
- Prefer early returns over nested conditions.
