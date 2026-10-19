# Architecture

The repository shares one React/TypeScript codebase between a browser extension
and a hosted website. The Pages Router owns the weather dashboard.
`src/pages/demo.tsx` composes the dashboard directly; reusable navigation hooks
and UI pieces live in `features/dashboard`.

The App Router owns the landing and privacy pages, their Markdown routes, the
sitemap, and `/bug` with its server action. The root layout shares navigation,
the footer, global styles, and analytics across the website, including the bug
form. Marketing copy renders on the server, with client boundaries around
interactive demonstrations and their English translation providers.

The website uses Cache Components to retain the hero forecast's conditional
refresh policy: one hour for live weather and five minutes for sample data.
Cache Components and partial prefetching are disabled for extension exports.

Public pages negotiate HTML and Markdown through the proxy. Responses use
`Cache-Control: private, no-store` and CDN-specific `no-store` headers to
prevent representation mixups. Next.js owns the HTML/RSC `Vary` header and can
replace the proxy's `Accept` variation; Markdown responses retain
`Vary: Accept`. The public Markdown browser tests check final response types,
cache prevention, and the framework's RSC variations without modifying Next.js.

Infrastructure used only by the server lives in `src/server`; shared browser
utilities and UI live in `src/shared`. Feature folders contain APIs, models,
hooks, and UI. Configuration schemas, defaults, and types belong to
`features/settings/model`, independent of hooks. Keep domain calculations out of
UI modules where possible and colocate tests with the behavior they cover.

## Dates and time

Native Temporal is required in Node 26+, Chrome 144+, and Firefox 139+.
`shared/lib/time.ts` centralizes the current clock and system timezone. Domain
code uses `Temporal.PlainDate` for calendar dates, `Temporal.Instant` for exact
times, and `Temporal.ZonedDateTime` for local calendar arithmetic and
formatting. Calendar days advance with `add({ days: 1 })`, independently of
whether a daylight-saving day contains 23, 24, or 25 hours.

Persisted timestamps and API payloads remain numbers or ISO strings, and
existing weather cache records migrate on read. Temporal values are
reconstructed and validated at boundaries. The test setup connects Temporal's
clock to Vitest's fake clock. Date conversion remains only where an external API
requires it, such as `astronomy-engine`; Prisma returns Date values from stored
timestamps. Temporal handles named timezones, while `@photostructure/tz-lookup`
still maps coordinates to a timezone and `astronomy-engine` still calculates sky
positions.

## Weather and persistence

Weather API responses are validated before mapping into domain data. Forecast
and air-quality requests start together; optional air-quality enrichment has a
bounded wait. Weather rendering does not depend on successful localStorage
writes. The cache stores identity, timestamps, and data in one versioned record.
Existing multi-key caches migrate on read. Map updates must match the cached
identity.

The settings migration pipeline upgrades old configuration shapes, repairs
invalid fields individually, and validates the completed configuration. Draft
coordinate input can remain incomplete while the last valid configuration
remains active.

Calendar loads use a request generation and cancellation signal. Completed loads
must belong to the current lifecycle and preserve account edits made during the
request. Removed accounts cannot contribute events to a completed load.

## Presentation and effects

Weather detail views, reusable charts, and map canvases have separate UI
modules. Chart geometry and map projection/interpolation live in the weather
model and can be tested without mounting the dashboard. Settings sections are
separate components under `features/settings/ui/sections`.

Seasonal definitions contain dates, descriptions, and tile accents. They import
animation implementations dynamically only when an event runs. Date selection
does not load Three.js or every animation implementation.

## Extension build constraint

Manifest V3's default CSP forbids executable inline scripts. Pages Router
exports use external bootstrap scripts and non-executable JSON page data; App
Router exports include executable inline bootstrap/flight scripts. Preserve the
Pages Router build for the extension.

The extension builder copies approved source inputs into a temporary directory,
excludes `src/app` there, generates Prisma types, and exports with an explicit
extension target. It then packages the exported `/demo` page as `index.html`.
The original checkout stays available to editors and website builds throughout.
