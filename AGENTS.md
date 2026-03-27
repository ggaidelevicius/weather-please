# AGENTS.md

Repository-specific guidance for agents working in this codebase.

## Stack

- Next.js 16 App Router
- React 19 with React Compiler enabled
- TypeScript 6
- Vitest

## Working Style

- Read existing files before editing. Match the patterns already in use.
- Prefer single object parameters for exported functions when it improves
  extensibility.
- Prefer functions over classes. Reserve classes for narrow adapter or error
  cases.
- Prefer pure functions. If mutation is necessary, return the mutated object
  instead of `void`.
- Organize modules top-down: exports before helpers.
- Prefix booleans with `is`, `has`, `can`, or `should`.
- Add comments sparingly. Keep comments for non-obvious intent, complex flow, or
  important constraints.

## TypeScript

- Do not introduce `any`. Use `unknown` and narrow properly.
- Avoid `@ts-ignore` and `@ts-expect-error` unless there is a short explanation.
- Prefer type inference where obvious. Add explicit types for exported
  functions, complex objects, and tricky boundaries.
- Avoid double assertions like `as unknown as T`.

## React

- React Compiler is enabled. Do not add `useMemo`, `useCallback`, or
  `React.memo` by default.
- Write straightforward components and let the compiler handle memoization.
- Return `null` instead of empty fragments when rendering nothing.
- Destructure props in the function signature.
- Use `Readonly<Props>` for component props unless there is a strong reason not
  to.
- Name component-local handlers with the `handle` prefix. Use `on*` for handler
  props.

## Data Validation And Errors

- Use Zod at external boundaries: `FormData`, request payloads, query params,
  localStorage, external APIs, and environment-derived values.
- Do not add Zod mechanically to purely internal data flow that is already typed
  and controlled.
- Handle async failures explicitly. Do not leave promises to fail silently.
- Prefer user-facing errors that are actionable and non-technical.

## Imports And Paths

- Use `import type` for type-only imports.
- Use relative imports instead of path aliases.
- Keep import ordering consistent with nearby files.

## Testing And Verification

- Before handoff, run `pnpm tsc --noEmit`.
- Add or update tests when changing business logic, validation, hooks, or other
  non-trivial server behavior.
- Use `pnpm test` when tests exist for the area you changed or when the change
  materially affects behavior.

## Commands

```bash
pnpm tsc --noEmit  # Required verification before handoff
pnpm test          # Run Vitest once
pnpm test -- --watch
```

`pnpm lint` is a mutating command in this repo. It runs type-checking, Prettier
with `--write`, and ESLint with `--fix`, so do not use it as a neutral
verification step when you want to avoid unrelated file changes.

## Formatting

- Prettier uses tabs and `printWidth: 80`.
- Tailwind classes are sorted by Prettier plugin.

## Security

- Never commit secrets or credentials.
- Treat all external data as untrusted until validated.
