# Refactor plan: `next-24-hours-tile.tsx`

> Status: **proposal only — no refactoring started.** Target file:
> `src/features/weather/ui/next-24-hours-tile.tsx` (~3,555 LoC)

## Why this file needs decomposing

`next-24-hours-tile.tsx` is a single module that bundles three unrelated
responsibilities. They share almost no logic, yet live in one 3,500-line file,
which makes the module hard to navigate, hard to test in isolation, and a
frequent merge-conflict hotspot.

The three layers, as they exist today:

| Layer                                         | Approx. lines                             | Responsibility                                                                                                                                                                                                    |
| --------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **View dispatcher** — `Next24HoursDetailView` | 278–901 (~620)                            | Maps `data` into per-metric arrays, then branches on `viewId` (7 `if` blocks) to assemble a `DetailViewShell` + chart per view.                                                                                   |
| **Detail-view chart kit**                     | 902–2065, 2114–2430, 2431–2716            | `DetailViewShell`, `Metric`, label components, `LineChart` / `ChartLine` / `ChartTooltip`, `PrecipitationChart`, `ChartFrame`, `ChartGrid`, plus scale/path/format/convert helpers.                               |
| **Weather-map subsystem**                     | 1236–2065 (components) + 2717–3555 (math) | ~1,000+ LoC of canvas rendering (wind particles, precipitation mesh), tile projection, interpolation, noise, and playback. Effectively self-contained (~181 internal references, no coupling to the other views). |

The ~30 types declared at the top (lines 87–272) describe whichever of the three
layers they belong to, but are currently grouped together as one
undifferentiated block.

## Proposed structure

Replace the single file with a folder under
`src/features/weather/ui/next-24-hours/`:

```
next-24-hours/
  index.tsx                      # re-exports public API (Next24HoursDetailView, ids, type)
  view-ids.ts                    # NEXT_24_HOURS_DETAIL_VIEW_IDS + Next24HoursDetailViewId
  next-24-hours-detail-view.tsx  # the dispatcher — slimmed to ~80 lines
  views/
    view-registry.ts             # the core abstraction (see below)
    temperature-view.ts
    precipitation-view.ts
    wind-view.ts
    air-quality-view.ts
    sun-view.ts
    conditions-view.ts
    map-view.tsx
  chart/
    detail-view-shell.tsx
    metric.tsx
    line-chart.tsx               # LineChart + ChartLine + ChartTooltip
    precipitation-chart.tsx
    chart-frame.tsx              # ChartFrame, AxisLabels, ChartGrid, EmptyChartState
    chart-scale.ts               # getChartScale, getScaleLabels, getLinePath, getChartX/Y, getNearest…
    labels.tsx                   # Relative/Weekday/HourInterval labels, AnimatedNumber
  map/
    weather-map.tsx              # WeatherMap, WeatherMapDetail
    canvas/                      # WindParticleCanvas, PrecipitationCanvas
    overlays.tsx                 # Tooltip, CenterMarker, Legend, Timeline, Metrics
    geo.ts                       # projection, tiles, viewport, coordinate↔world
    precipitation-field.ts       # mesh, interpolation, bands, influence radius
    wind-field.ts                # wind interpolation, nearest point, direction lerp
    playback.ts                  # frame/interpolation/playback state
    map-constants.ts
    map-types.ts
  lib/
    units.ts                     # convertTemperature/Wind/Precipitation/Visibility
    format.ts                    # formatHour, formatDecimal, formatPollutant…, getAqiCategory
    feels-like.ts                # getFeelsLikeExplanation + thresholds
    math.ts                      # average/max/min/sum/isNumber
    sun.ts                       # getNextSunEvent, isSameLocalDate
```

Rationale for the split:

- **`index.tsx` keeps the public import path stable.** Everything outside this
  feature imports `Next24HoursDetailView`, `NEXT_24_HOURS_DETAIL_VIEW_IDS`, and
  `Next24HoursDetailViewId`. A barrel re-export means no churn in
  `src/pages/index.tsx` or anywhere else.
- **`map/` is the highest-leverage extraction.** It is self-contained and
  removes ~1,000 lines in one move. Splitting its canvas rendering from its
  geo/field math also makes the math unit-testable without a DOM/canvas.
- **`chart/` and `lib/` are reusable, framework-light pieces.** Pure functions
  (scale, format, units, math) move cleanly and gain straightforward test
  coverage.
- **`views/` isolates per-view intent** so a change to, say, the air-quality
  view no longer requires scrolling past the map renderer.

## The one abstraction worth introducing

The dispatcher's 7 branches share ~90% of their shape: icon, title, kicker,
metrics, and a chart with a scale + formatter. That repetition accounts for most
of the ~620 lines. Collapse it into a **descriptor registry**:

```ts
// views/view-registry.ts
type DetailViewContext = {
	// derived arrays, computed once
	temperatures: number[]
	wind: number[]
	/* …; */ times: number[]
	units: {
		temperature: string
		wind: string
		precipitation: string
		visibility: string
	}
	// …
}

type DetailViewConfig = {
	icon: ReactNode
	title: ReactNode
	buildMetrics: (ctx: DetailViewContext) => ReactNode
	buildChart: (ctx: DetailViewContext) => ReactNode
	buildFooter?: (ctx: DetailViewContext) => ReactNode
}

export const DETAIL_VIEW_REGISTRY: Record<
	Next24HoursDetailViewId,
	DetailViewConfig
>
```

The dispatcher then reduces to roughly:

```tsx
const ctx = useDetailViewContext({ data, temperatureUnit, unitSystem })
if (viewId === 'map') return <MapView … />          // the one genuine special case
const config = DETAIL_VIEW_REGISTRY[viewId]
return (
  <DetailViewShell icon={config.icon} title={config.title}
    metrics={config.buildMetrics(ctx)} footer={config.buildFooter?.(ctx)}>
    {config.buildChart(ctx)}
  </DetailViewShell>
)
```

- `map` stays a separate branch — it is genuinely a different component shape,
  not a chart-in-a-shell.
- The data-prep block (lines ~293–333) moves into a `useDetailViewContext` hook
  so every view config reads from one typed context instead of recomputing
  arrays.

## Suggested sequencing

Each step is independently shippable and verifiable. Run `pnpm tsc --noEmit`
(and `pnpm test` where logic is touched) after every step.

1. **Mechanical extraction, no logic change** — pull `lib/` (units, format,
   math, sun, feels-like) and `view-ids.ts` out first. Pure functions, lowest
   risk, immediately sheds a few hundred lines.
2. **Map subsystem → `map/`.** Self-contained, lifts cleanly, removes the single
   largest chunk (~1,000 lines).
3. **Chart kit → `chart/`.** Shared components plus chart math.
4. **Registry refactor.** Convert the 7 branches into configs. This is the only
   step that restructures logic, so do it last and lean on tests + types.

Steps 1–3 are behavior-preserving file moves (cut/paste + import fixes). Step 4
is the actual design change.

## Considerations and risks

- **Public API stability.** Only three symbols are consumed externally
  (`Next24HoursDetailView`, `NEXT_24_HOURS_DETAIL_VIEW_IDS`,
  `Next24HoursDetailViewId`). Preserve them via `index.tsx`; confirm no other
  module deep-imports internals before moving.
- **Imports / path conventions.** AGENTS.md mandates relative imports (no path
  aliases) and `import type` for type-only imports. New files must follow this;
  watch for relative-path depth changes when nesting under `next-24-hours/`.
- **React Compiler.** Compiler is enabled — do not add `useMemo`/`useCallback`
  while moving code. The `useDetailViewContext` hook should compute plainly and
  let the compiler handle memoization.
- **Canvas + lifecycle code is the fragile part.** The map canvases use refs,
  rAF loops, and `framer-motion` motion values. Move them as whole units; avoid
  "improving" effect/cleanup logic in the same pass as the move.
- **`'use client'` / module side effects.** Verify whether the file or its
  consumers rely on client-only behavior; keep any directives attached to the
  right new file.
- **Lingui `<Trans>` extraction.** View titles/labels use the Lingui macro.
  Moving them between files is fine, but re-run extraction afterward and confirm
  message IDs are unchanged so translations are not orphaned.
- **`pnpm lint` is mutating** (runs Prettier `--write` + ESLint `--fix`). Use
  `pnpm tsc --noEmit` and `pnpm test` as neutral verification during the
  refactor; reserve `lint` for a deliberate final formatting pass.
- **Test coverage gap.** Extracting pure helpers into `lib/` and `chart/` is a
  good moment to add focused unit tests (scale math, unit conversion, field
  interpolation) — but only after the move, to keep each step reviewable.
- **Review size.** Do not land all four steps as one change. One step per PR/
  commit keeps diffs reviewable, since large cut/paste moves are otherwise hard
  to verify by eye.

## Open questions (resolve before starting)

- Confirm nothing outside this feature deep-imports internal helpers (e.g. chart
  math or map utilities) that we assume are private.
- Decide whether the folder should be named `next-24-hours/` (matches the view
  id) or kept as the existing `next-24-hours-tile` stem for git-history
  continuity.
- Decide whether to add the new unit tests within each extraction step or as a
  dedicated follow-up.
