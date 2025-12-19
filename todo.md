# TODO

## Data correctness and caching

- [x] Key cached weather data/alerts by coordinates and invalidate when lat/lon
      changes (store lat/lon with cache and verify in
      [use-weather.ts](src/hooks/use-weather.ts)).
  - **Action:** Add `lat` and `lon` to localStorage alongside data and verify
    they match before using cached data in `isLocalStorageDataValid()`.

---

## UX and error handling

- [ ] Handle geolocation errors in
      [initialisation.tsx](src/components/initialisation.tsx) (show an error,
      stop the loading spinner, and provide a manual lat/lon entry or a "skip
      for now" path).
  - **Action:** Add error callback to `getCurrentPosition()`, set `loading` to
    false, display error message, and provide manual coordinate input fallback.

- [ ] Show a user-facing weather fetch error and add a retry path; check
      `res.ok` and handle non-200 responses in
      [use-weather.ts](src/hooks/use-weather.ts), and render the error in
      [index.tsx](src/pages/index.tsx).
  - **Action:**
    1. Update fetch to throw on non-200:
       `.then(res => { if (!res.ok) throw new Error('Weather fetch failed'); return res.json() })`
    2. Add error UI in index.tsx when `error` is truthy with a retry button that
       invalidates the query.

---

## Security and accessibility

- [ ] Add `rel="noopener noreferrer"` to all external `target="_blank"` links.
  - **Files:** [button.tsx:58](src/components/button.tsx#L58),
    [settings.tsx:196-224](src/components/settings.tsx#L196-L224),
    [index.tsx:188-194](src/pages/index.tsx#L188-L194)
  - **Action:** Add `rel="noopener noreferrer"` to all anchor tags with
    `target="_blank"`.

- [ ] Make disabled anchor buttons non-interactive (prevent default, add
      `tabIndex={-1}`, set a `data-disabled` flag for styles) in
      [button.tsx](src/components/button.tsx).
  - **Action:** When `disabled` is true and `href` is set, add `tabIndex={-1}`,
    `aria-disabled="true"`, and an `onClick` handler that calls
    `e.preventDefault()`.

---

## Performance and rendering

- [ ] Replace `WeatherAlert` stateful ReactElement list with derived data to
      avoid multi-effect state churn and enforce a stable order.
  - **File:** [weather-alert.tsx](src/components/weather-alert.tsx)
  - **Action:** Refactor to compute alerts declaratively. Instead of 5
    useEffects managing an array of ReactElements via `setAlerts`, derive the
    alerts array directly from props (React Compiler handles memoization
    automatically):
    ```tsx
    const alerts = []
    if (showUvAlerts && hoursOfExtremeUv.includes(true)) { alerts.push({ type: 'uv', ... }) }
    // etc for each alert type
    ```
    Then render `alerts.map(alert => <Alert ... />)`.

---

## Data and display consistency

- [ ] Add a fallback icon/description for unknown weather codes to avoid
      rendering `undefined`.
  - **File:** [tile.tsx:219](src/components/tile.tsx#L219),
    [tile.tsx:207](src/components/tile.tsx#L207)
  - **Action:** Add a fallback: `iconMap[description] ?? FallbackIcon` and
    `descriptionMap[description] ?? <Trans>Unknown conditions</Trans>`.

- [ ] Revisit precipitation duration logic and copy so the duration shown
      matches the algorithm; compute the duration once and update tests.
  - **Files:** [alert-processor.ts](src/lib/alert-processor.ts),
    [weather-alert.tsx](src/components/weather-alert.tsx),
    [alert-processor.test.ts](src/lib/__tests__/alert-processor.test.ts)
  - **Action:** Audit the `processPrecipitationDuration` function and ensure the
    UI text accurately reflects what the duration array represents. The current
    logic uses `indexOf(false)` which may not correctly handle non-contiguous
    precipitation.

---

## Backend robustness

- [ ] Replace in-memory rate limiting with durable storage (Redis/Vercel
      KV/etc.) and parse `x-forwarded-for` safely.
  - **File:** [rate-limit.ts](src/lib/rate-limit.ts),
    [actions.ts](src/app/actions.ts)
  - **Action:**
    1. Use Vercel KV or similar for rate limit state in production
    2. Parse only the first IP from `x-forwarded-for` (e.g.,
       `ip.split(',')[0].trim()`)

- [ ] Add a Prisma client singleton and guard against missing `DATABASE_URL`,
      plus wrap `submitForm` in try/catch for graceful failures.
  - **Files:** [prisma.ts](src/lib/prisma.ts), [actions.ts](src/app/actions.ts)
  - **Action:**
    1. Verify prisma.ts uses singleton pattern (check if it already does)
    2. Wrap the `prisma.formSubmission.create()` call in try/catch and return a
       user-friendly error message on failure

---

## Internationalization

- [ ] Move `changeLocalisation` into a `useEffect` in
      [bug/page.tsx](src/app/bug/page.tsx) to avoid side effects in render, and
      handle the async load state.
  - **Action:** The locale change should be in a useEffect that runs on mount or
    when locale param changes, not during render.

---

# Independent Review Findings (Opus)

## Type safety issues

- [ ] Fix `as unknown as string` type assertions throughout the codebase.
  - **Files:** [settings.tsx:67](src/components/settings.tsx#L67),
    [settings.tsx:79](src/components/settings.tsx#L79),
    [settings.tsx:94](src/components/settings.tsx#L94), and many more
  - **Action:** Create a proper type for Lingui `Trans` component output that
    can be used as label props. Consider updating the `Input`, `Select`, and
    `Switch` components to accept `ReactNode` for their label props instead of
    `string`.

## Code duplication

- [ ] Consolidate duplicate alert handling logic in
      [weather-alert.tsx](src/components/weather-alert.tsx).
  - **Issue:** There are 5 nearly identical useEffect hooks (lines 44-92,
    104-182, 197-248, 263-313, 328-391) that all follow the same pattern.
  - **Action:** Extract a reusable function or custom hook:
    ```tsx
    const useAlertState = (
      condition: boolean[],
      showAlert: boolean,
      key: string,
      renderAlert: (timing: number) => ReactElement
    ) => { ... }
    ```

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

## Empty fragment anti-pattern

- [ ] Replace empty fragment return with `null`.
  - **File:** [weather-alert.tsx:414](src/components/weather-alert.tsx#L414)
  - **Issue:** `return <></>` should be `return null` for clarity.

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
