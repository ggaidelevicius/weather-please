# Architecture

The repository shares one React/TypeScript codebase between a browser extension
and a hosted website. The Pages Router owns the landing page, privacy page, and
weather dashboard. `src/pages/demo.tsx` composes the dashboard directly;
reusable navigation hooks and UI pieces live in `features/dashboard`.

The App Router owns `/bug` and its server action. Infrastructure used only by
the server lives in `src/server`; shared browser utilities and UI live in
`src/shared`. Feature folders contain APIs, models, hooks, and UI. Configuration
schemas, defaults, and types belong to `features/settings/model`, independent of
hooks. Keep domain calculations out of UI modules where possible and colocate
tests with the behavior they cover.

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
