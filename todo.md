# TODO

## Error boundary

- [ ] Add a React error boundary component.
  - **Issue:** No error boundary exists to catch and handle React rendering
    errors gracefully.
  - **Action:** Create an ErrorBoundary component that catches errors, logs
    them, and displays a user-friendly fallback UI.

## Test coverage gaps

- [ ] Add component tests for UI rendering.
  - **Issue:** Current tests only cover hooks and utility functions. No tests
    for Tile, Settings, Alert, Initialisation components.
  - **Action:** Add basic render tests and interaction tests for key components.

## localStorage direct property access

- [ ] Use `localStorage.getItem()`/`setItem()` consistently instead of direct
      property access.
  - **Files:** [use-weather.ts:99](src/hooks/use-weather.ts#L99),
    [use-weather.ts:177](src/hooks/use-weather.ts#L177),
    [use-weather.ts:206-208](src/hooks/use-weather.ts#L206-L208)
  - **Issue:** Direct property access like `localStorage.data` works but is
    non-standard and can confuse test mocks.
  - **Action:** Replace with `localStorage.getItem('data')` and
    `localStorage.setItem('data', value)`.

## Unused comment/uncertainty marker

- [ ] Resolve the uncertainty comment and remove if not needed.
  - **File:** [weather-alert.tsx:332](src/components/weather-alert.tsx#L332)
  - **Issue:** Comment says "might not need to be doing +1" - this should be
    verified and the comment either removed or converted to documentation
    explaining why +1 is needed.
