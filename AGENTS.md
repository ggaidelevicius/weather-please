# AGENTS.md

Repository-specific guidance for agents working in this codebase.

## Stack

- Next.js 16: Pages Router for the dashboard/extension; App Router for the
  marketing website and hosted bug form
- React 19 with React Compiler enabled
- TypeScript 7
- Vitest
- Node.js 26+; Chrome 144+ and Firefox 139+ with native Temporal

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
- Use `_` or an underscore-prefixed name for intentionally discarded variables
  and parameters. Oxlint ignores these names throughout the project.

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

## Dates And Time

- Use native Temporal for date and time logic. Use `shared/lib/time.ts` for the
  current clock and system timezone.
- Use `PlainDate` for calendar dates, `Instant` for exact times, and
  `ZonedDateTime` for calendar arithmetic in a timezone.
- Keep persisted timestamps as numbers or ISO strings. Limit legacy Date values
  to external-library boundaries and fake-clock test setup.

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
pnpm test         # Run Vitest once
pnpm exec oxlint .
pnpm exec oxfmt . --check
```

`pnpm lint` runs Oxlint with `--fix`, and `pnpm format` runs Oxfmt with
`--write`. Both commands mutate files; use the direct `pnpm exec` commands above
for read-only verification.

The pre-commit hook runs lint-staged serially before type-checking, a full
read-only Oxlint check, and tests. Keep mutations scoped to staged files, and
preserve lint-staged's default handling of partially staged files and failures.

## Formatting

- Oxfmt uses tabs and `printWidth: 80`.
- Tailwind classes are sorted by Oxfmt.

## README And Docs

The README is the front page for developers who are new to the repo. It should
get them oriented in under a minute. Explanations belong in `docs/`.

- Keep these README sections, in this order: title and one-line description with
  store/demo links, Quick start, Commands, Stack, Layout, Docs, Translations,
  Feedback. Do not add new top-level sections.
- Keep it under about 80 lines. Use tables, lists, and code blocks instead of
  prose paragraphs.
- Commands: one table row per user-facing `package.json` script, with a short
  description. Add or update a row when you add, rename, or remove a script.
- Layout: one line per top-level directory. Update it only when a directory is
  added, moved, or removed.
- Stack: list major dependencies only. Update it only for a major-version bump
  or when a framework or library is added or removed.
- Translations: update the language list when a locale is added or removed.
- Do not put any of these in the README:
  - how the build pipeline or tooling works internally
  - runtime caveats or browser quirks
  - environment variables, OAuth, or database setup
  - caching and coordination behaviour
  - release mechanics
  - changelog entries Put setup, tooling, testing, and release details in
    `docs/development.md`. Put module boundaries, routing, and data flow in
    `docs/architecture.md`.
- Most changes need no README edit. Only touch it when a change affects one of
  the sections above.
- In `docs/`, update the paragraph that covers the behaviour you changed rather
  than appending a new one. Remove statements that are no longer true.

## Security

- Never commit secrets or credentials.
- Treat all external data as untrusted until validated.
