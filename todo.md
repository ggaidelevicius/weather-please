# Architecture review & improvement backlog

> High-level review of overall project architecture, strengths, and prioritized
> areas for improvement. Proposal/analysis only — no refactoring started.

## What this project is

A **Chrome MV3 extension** (new-tab override) built on **Next.js 16**,
statically exported (`output: 'export'`) for the extension build, but _also_
deployable to **Vercel** — where the `app/` route plus a Prisma-backed server
action handle bug-report submissions. One codebase, two build targets, gated by
`if (process.env.VERCEL !== '1')` in `next.config.ts`.

The code is organized **feature-sliced**:
`src/features/{weather, seasonal-events, settings, location}`, each with a
consistent `api / hooks / model / ui` internal layering, plus a lean `shared/`
and a root `lib/`. ~27.5k LoC excluding generated code.

### Size by area (excluding `generated/`)

| Area                       | LoC    | Files | Notes                                              |
| -------------------------- | ------ | ----- | -------------------------------------------------- |
| `features/seasonal-events` | 13,216 | 36    | ~53% of feature code; 27 Three.js/R3F event scenes |
| `features/weather`         | 8,274  | 19    | API client, caching, alerts, detail views          |
| `features/settings`        | 2,526  | 11    | config schema, migrations, settings UI             |
| `shared`                   | 1,261  | 17    | UI primitives + lib helpers                        |
| `pages`                    | 995    | 3     | extension new-tab entry (`index.tsx` is 958 LoC)   |
| `features/location`        | 576    | 5     |                                                    |
| `app`                      | 366    | 4     | bug page + server action (Vercel target)           |
| `lib`                      | 320    | 3     | prisma, rate-limit                                 |

### Largest single files

- `features/weather/ui/next-24-hours-tile.tsx` — **3,555** (separate refactor
  plan in `src/features/weather/ui/todo.md`)
- `pages/index.tsx` — **958**
- `features/settings/ui/settings.tsx` — **822**
- `features/weather/api/weather-api.ts` — **690**
- `features/weather/ui/tile.tsx` — **567**
- `features/weather/hooks/use-weather.ts` — **545**
- `features/weather/ui/weather-alert.tsx` — **520**

## Strengths (worth preserving)

- **Consistent, deliberate feature-slicing.** The `api/hooks/model/ui`
  convention is followed across features — the project's best structural asset.
  Location of code is predictable.
- **Strong boundary validation.** Zod is applied where AGENTS.md prescribes:
  localStorage config, the server action, form/query payloads — and not
  over-applied to internal, already-typed flows.
- **Mature config handling.** `useConfig` has a versioned schema with an
  explicit `migrateConfig` and a stored config version.
- **Good test placement.** `__tests__` sit beside `model/` and `hooks/` logic
  (weather API, alert processor, tile-grid, config) — coverage concentrated on
  the testable business layers.
- **Data-driven event registry.** Events are a typed `SeasonalEvent[]` rather
  than scattered conditionals.
- **Seasonal-events module is lazily loaded** via
  `import('../core/seasonal-events-module')`, keeping Three.js off the initial
  render path.

## Areas for improvement (prioritized)

### 1. Seasonal events dominate and aren't individually code-split — highest impact

13.2k LoC / 36 files = **~53% of all feature code**, across 27 event files
averaging ~500 LoC each. Two distinct problems:

- **Bundle.** `core/seasonal-events-module.ts` _statically_ imports all 27
  events, and each event statically imports `three` / `@react-three/fiber` at
  the top. So the lazy "events chunk" is one monolith — whenever _any_ event is
  active, the new tab downloads _all 27_ scenes + Three.js. For a page that
  loads on every new tab, the active event should `import()` only its own scene
  (push the dynamic boundary down into each event's `run`/component, or build a
  registry of lazy importers keyed by `SeasonalEventId`).
- **Duplication.** 27 structurally near-identical R3F scene files imply heavy
  scaffold repetition (Canvas setup, DPR handling, frame loop, settings-modal
  pause wiring) even though `randomInRange` / `getCanvasDpr` are shared. A
  declarative particle/scene abstraction (per-event config + a small shader or
  behavior hook) could collapse much of this.

### 2. `pages/index.tsx` is the real app-shell god component (958 LoC)

It carries view-switching state, wheel/touch gesture handling, the view
indicator, seasonal orchestration, and weather wiring all at once. The gesture +
navigation logic (`handleViewWheel`, cooldowns, touch thresholds, indicator
timers) should be extracted into hooks (`useViewNavigation`, `useWheelGesture`)
and standalone components. Sibling problem to the `next-24-hours-tile.tsx`
refactor.

### 3. The dual router (`pages/` + `app/`) — intentional, not a problem

The extension UI lives in `pages/` while `app/` holds only the Vercel-hosted bug
page + server action. This is **deliberate**: the extension runs under the MV3
default CSP (`script-src 'self'`), which blocks App Router's inline
bootstrap/RSC scripts, so Pages Router is required for a CSP-clean static
export. The build hides `src/app` during the extension build (`renameAppDir`) to
enforce this.

Full migration to `app/` is **not recommended** — the only workaround for the
inline-script blocker is a post-export HTML transform that couples the build to
Next's internal output format (fragile across upgrades), and a client-side new
tab gains nothing from App Router's server features. The rationale is documented
in `scripts/renameAppDir.mjs`; the standing action is to keep that comment
accurate rather than to migrate.

### 4. Other large UI files

`settings.tsx` (822), `tile.tsx` (567), `weather-alert.tsx` (520) are candidates
for the same decomposition once the tile and index shell are done.
`settings.tsx` in particular accumulates form sections that split cleanly.

### 5. Generated Prisma client is committed (`src/generated/prisma`, ~4k LoC)

Fine if intentional, but it inflates the tree and pollutes searches/reviews.
Consider gitignoring and generating in CI / `postinstall` unless the static
export specifically needs it checked in.

### 6. State is a single localStorage blob, prop-drilled

`index.tsx` threads many `config.*` values down through the tree. Acceptable at
this size and avoids premature abstraction, but it will hurt as views multiply.
A read-only config context (+ a setter) would cut the drilling without a heavy
store.

### 7. Minor: file/export name mismatches

e.g. `next-24-hours-tile.tsx` exports `Next24HoursDetailView` — it's a
detail-view module, not a "tile." Worth renaming during the planned refactor.

## Suggested sequencing

1. **Per-event code-splitting** for seasonal events (largest user-facing payoff
   — perf win on a page that loads constantly), then the event-scene abstraction
   to cut the 13k LoC.
2. **Decompose `pages/index.tsx`** — extract gesture/navigation hooks; de-risks
   future view work.
3. **`next-24-hours-tile.tsx` refactor** per `src/features/weather/ui/todo.md`.
4. **Documentation pass** so the dual-target build and any remaining
   `VERCEL`-gated behavior is intentional and legible.

## Validation notes

- After any build-pipeline change, load `extension/` unpacked in Chrome and
  confirm the new tab hydrates with **no CSP violations** in the console.
- `pnpm tsc --noEmit` and `pnpm test` for code changes; `pnpm lint` is mutating
  (Prettier `--write` + ESLint `--fix`) so reserve it for a final formatting
  pass.
