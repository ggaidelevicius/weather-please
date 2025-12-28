# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Development

### Coding Patterns and Best Practices

- Prefer single object parameters (improves backwards-compatibility)
- Prefer functions over classes (classes only for errors/adapters)
- Prefer pure functions; when mutation is unavoidable, return the mutated object
  instead of void.
- Organize functions top-down: exports before helpers
- Use JSDoc for complex functions; add tags only when justified beyond type
  signature
- Use `import type` for types, regular `import` for values, separate statements
  even from same module
- Prefix booleans with `is`/`has`/`can`/`should` (e.g., `isValid`, `hasData`)
  for clarity
- Wrap all async operations in try-catch
- Validate all FormData and user inputs with zod
- No `any`, use proper types
- Don't manually use useCallback or useMemo as React Compiler takes care of this
  for us
- Where possible, use server actions over api routes
- Ensure that any new server-side functionality has corresponding tests written
- Prior to handing over any completed work, run `pnpm tsc` to ensure there are
  no type errors
- Don't create prisma migrations on the user's behalf - always prompt the user
  to create a migration using the prisma CLI
- Commenting Guidelines
  - Execution flow: Skip comments when code is self-documenting. Keep for
    complex logic, non-obvious "why", multi-line context, or if following a
    documented, multi-step flow.
  - Top of file/module: Use sparingly; only for non-obvious purpose/context or
    an overview of complex logic.
  - Type definitions: Property/interface documentation is always acceptable.

---

## General Principles

1. **Read before writing.** Always read existing files before modifying them.
   Understand the patterns already in use.
2. **Match existing style.** Follow the conventions already established in the
   codebase for formatting, naming, and structure.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router + Pages Router hybrid)
- **Language:** TypeScript 5.9 (strict mode)
- **UI:** React 19, Tailwind CSS 4, Headless UI, Framer Motion
- **State:** React Query for server state, React hooks for local state
- **Validation:** Zod
- **i18n:** Lingui
- **Testing:** Vitest, React Testing Library
- **Database:** Prisma with PostgreSQL

---

## React Compiler

This project uses the **React Compiler** (babel-plugin-react-compiler). This has
important implications:

### You do NOT need to manually use:

- `useMemo()`
- `useCallback()`
- `React.memo()`

The React Compiler automatically optimizes re-renders. Manual memoization is
unnecessary and adds noise.

### What you SHOULD do instead:

- Write straightforward code without manual memoization
- Trust the compiler to handle performance optimization
- Only consider manual optimization if profiling reveals an actual issue the
  compiler missed (rare)

### Example - WRONG:

```tsx
// DON'T DO THIS - unnecessary with React Compiler
const handleClick = useCallback(() => {
	doSomething(value)
}, [value])

const expensiveValue = useMemo(() => computeExpensive(data), [data])
```

### Example - CORRECT:

```tsx
// DO THIS - let the compiler handle it
const handleClick = () => {
	doSomething(value)
}

const expensiveValue = computeExpensive(data)
```

---

## TypeScript Standards

### Strict typing

- No `any` types. Use `unknown` and narrow appropriately.
- No `// @ts-ignore` or `// @ts-expect-error` without a comment explaining why
  it's necessary.
- Prefer type inference where obvious; add explicit types for function
  signatures and complex objects.

### Type assertions

- Avoid `as` casts where possible. Use type guards instead.
- Never use `as unknown as T` double casts. This indicates a type design problem
  that should be fixed properly.

### Zod for runtime validation

- Use Zod schemas for validating external data (API responses, localStorage,
  user input).
- Derive TypeScript types from Zod schemas using `z.infer<>`.

---

## Component Standards

### Props

- Use `Readonly<Props>` for component props to ensure immutability.
- Destructure props in the function signature.

```tsx
// CORRECT
const MyComponent = ({ value, onChange }: Readonly<Props>) => { ... }

// WRONG
const MyComponent = (props: Props) => { ... }
```

### Return values

- Return `null` instead of empty fragments `<></>` when rendering nothing.

```tsx
// CORRECT
if (!data) return null

// WRONG
if (!data) return <></>
```

### Event handlers

- Name handlers with `handle` prefix: `handleClick`, `handleSubmit`,
  `handleChange`.
- For props that accept handlers, use `on` prefix: `onClick`, `onSubmit`,
  `onChange`.

---

## State Management

### localStorage

- Use `localStorage.getItem()` and `localStorage.setItem()` methods, not direct
  property access.
- Always wrap in try/catch when parsing JSON from localStorage.
- Validate data from localStorage with Zod before using.

```tsx
// CORRECT
const data = localStorage.getItem('key')
if (data) {
	try {
		const parsed = schema.parse(JSON.parse(data))
	} catch {
		// Handle invalid data
	}
}

// WRONG
const data = JSON.parse(localStorage.key)
```

### React Query

- Use specific query keys that include all parameters affecting the query.
- Handle loading, error, success states explicitly.

---

## Error Handling

### User-facing errors

- Always show user-friendly error messages, not technical details.
- Provide actionable next steps (retry button, alternative path).

### Console errors

- Use `console.error()` for errors, not `console.log()`.
- Include context about what operation failed.

### Async operations

- Always handle errors in async operations (try/catch or .catch()).
- Never let promises fail silently.

---

## Accessibility

### Links

- All external links (`target="_blank"`) must have `rel="noopener noreferrer"`.
- Disabled interactive elements must be truly non-interactive (`tabIndex={-1}`,
  prevent default click).

### ARIA

- Use semantic HTML elements when possible before reaching for ARIA.
- Ensure all interactive elements are keyboard accessible.
- Include `aria-label` or visible text for icon-only buttons.

### Screen readers

- Use `.sr-only` class for screen-reader-only content.
- Ensure dynamic content updates are announced with appropriate `aria-live`
  regions.

---

## Code Organization

### File structure

```
src/
  app/           # Next.js App Router pages and server actions
  components/    # React components
  hooks/         # Custom React hooks
  lib/           # Utility functions and shared logic
  pages/         # Next.js Pages Router pages
  locales/       # i18n translation files
```

### Imports

- Use `import type` for types, regular `import` for values, separate statements
  even from same module
- Use relative paths instead of path aliases.
- Group imports: external packages first, then internal modules, then types.

### Constants

- Extract magic numbers into named constants with descriptive names.
- Place constants at module level or in a dedicated constants file.

```tsx
// CORRECT
const PRECIPITATION_ALERT_THRESHOLD_MM = 15
const LOCATION_CHANGE_THRESHOLD_KM = 1

if (precipitation >= PRECIPITATION_ALERT_THRESHOLD_MM) { ... }

// WRONG
if (precipitation >= 15) { ... }
```

---

## Testing

### What to test

- Business logic in utility functions and hooks
- Component rendering and interactions
- Edge cases and error states
- All new server-side functionality must have corresponding tests

### Test structure

- Use descriptive test names that explain the expected behavior.
- Follow Arrange-Act-Assert pattern.
- Mock external dependencies (fetch, localStorage, geolocation).

### Running tests

```bash
pnpm test        # Run all tests
pnpm test:watch  # Run in watch mode
```

---

## Git Commits

### What to commit

- Each commit should represent a single logical change.
- Don't commit incomplete or broken code.
- Run linting and tests before committing.

---

## Linting and Formatting

### Commands

```bash
pnpm lint        # Run TypeScript check and Prettier
pnpm test        # Run tests
pnpm tsc         # Type check (run before completing work)
```

### Prettier config

- Tabs for indentation
- 80 character line width
- Tailwind class sorting enabled

### Pre-commit

- Husky runs lint-staged on commit
- All staged files are formatted with Prettier

---

## Database

### Prisma Migrations

- **Don't create prisma migrations on the user's behalf** - always prompt the
  user to create a migration using the prisma CLI
- After schema changes, remind the user to run migration commands

---

## Security

### User input

- Validate all user input with Zod schemas.
- Use server actions for sensitive operations.

### External data

- Never trust data from external APIs without validation.
- Use Zod `.safeParse()` to handle invalid data gracefully.

### Secrets

- Never commit secrets or credentials.
- Use environment variables for sensitive configuration.
- `.env` files with secrets should be in `.gitignore`.

---

## Performance

### Images

- Use Next.js `Image` component for automatic optimization.
- Set `priority` for above-the-fold images.
- Specify `width` and `height` to prevent layout shift.

### Rendering

- Avoid side effects during render.
- Keep component render functions pure.
- Trust React Compiler for memoization (see above).

### Network

- Use React Query's built-in caching.
- Avoid redundant API calls.
