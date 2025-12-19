# TODO

## Magic numbers

- [ ] Extract magic numbers into named constants.
  - **Examples:**
    - Precipitation threshold `15` in
      [weather-alert.tsx:108](src/components/weather-alert.tsx#L108)
    - Distance threshold `1` (km) in [index.tsx:108](src/pages/index.tsx#L108)
    - Array lengths `13` and `25` for alert arrays in
      [use-weather.ts:30-36](src/hooks/use-weather.ts#L30-L36)
  - **Action:** Create a constants file or define constants at module level with
    descriptive names.

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

## Query invalidation scope

- [ ] Consider scoping query invalidation to specific coordinates.
  - **File:** [use-weather.ts:220](src/hooks/use-weather.ts#L220)
  - **Issue:** `queryClient.invalidateQueries({ queryKey: ['weather'] })`
    invalidates all weather queries, not just the current location's.
  - **Action:** This is fine for single-location use but would be an issue if
    multi-location support was added. Low priority.

## Grid class string could be simplified

- [ ] Refactor the grid column class generation in
      [index.tsx:170](src/pages/index.tsx#L170).
  - **Issue:** Long ternary chain for grid-cols classes.
  - **Action:** Create a lookup object or utility function:
    ```tsx
    const gridColsClass =
    	{
    		'1': 'lg:grid-cols-1',
    		'2': 'lg:grid-cols-2',
    		// ...
    	}[config.daysToRetrieve] ?? ''
    ```
