# Development and releases

## Setup

Use the pnpm version in `package.json` and run `pnpm install --frozen-lockfile`.
The `devEngines.runtime` entry pins Node.js 26.8.1, which pnpm installs and uses
for project commands and Git hooks, even when a terminal or editor inherits an
older Node version. Check the project runtime with `pnpm exec node --version`.
The `/demo` dashboard works without environment configuration. `pnpm dev` starts
the hosted development server.

Chrome 144+ and Firefox 139+ are the supported browsers. The application uses
native Temporal throughout its date and time logic, without a polyfill. Direct
Node commands outside pnpm also require Node 26+. Extension manifests enforce
the corresponding browser minimums.

TypeScript runs side by side using Microsoft's
[recommended package aliases](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6-0):
`@typescript/native` points to TypeScript 7 and provides `tsc`, while
`typescript` points to `@typescript/typescript6` and supplies the compiler API
and `tsc6`. Existing standalone checks, including `pnpm typecheck`, use the
native compiler. ESLint uses the compatible TypeScript 6 API, and Next's build
checker resolves `typescript` and uses TypeScript 6. Revisit this compatibility
setup when the tools support TypeScript's new API; installing TypeScript 7.1
alone will not make consumers of the old API compatible.

Copy `.env.example` to `.env.local` when enabling optional services. Never
commit actual environment files. Public variables are embedded during builds, so
rebuild the extension after changing provider configuration.

| Variable                           | Used by                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `DATABASE_URL`                     | Hosted bug-report storage, rate limiting, and Prisma CLI                                  |
| `NEXT_PUBLIC_MICROSOFT_CLIENT_ID`  | Microsoft calendar sign-in                                                                |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`     | Google calendar sign-in                                                                   |
| `NEXT_PUBLIC_GOOGLE_CLIENT_SECRET` | Non-confidential installed-app Google client value required by the current token exchange |

For Prisma CLI commands, export `DATABASE_URL` in your shell or put it in
`.env`; Prisma's dotenv configuration reads `.env`, while Next.js also loads
`.env.local`. A local PostgreSQL database is needed to submit bug reports, but
generating types and compiling the website do not require a live database
connection.

```bash
pnpm db:generate
pnpm db:migrate       # Local schema changes
pnpm db:deploy        # Apply committed migrations to the configured database
```

The browser OAuth redirect must match the provider registration. On the website
it is the origin plus `/demo`; extensions use the redirect returned by the
browser identity API. The extension requires its `identity` permission. A
website OAuth client's confidential secret must never be put into a
`NEXT_PUBLIC_*` variable.

Both calendar providers refresh access tokens automatically. Microsoft refresh
tokens issued to redirect URIs registered as `spa` have a fixed 24-hour
lifetime; rotating a refresh token does not extend that original deadline. Once
it expires, the account needs a new authorization flow. Microsoft account and
organization policies can also require sign-in sooner. See
[Microsoft's refresh-token lifetime documentation](https://learn.microsoft.com/en-us/entra/identity-platform/refresh-tokens#token-lifetime).

Dashboard tabs coordinate forecast, air-quality, map forecast, calendar, device
location, and location-label requests through `shared-resource.ts`. A Web Lock
gives one tab ownership of each resource while other tabs wait and then reuse
its validated cache entry. BroadcastChannel and storage events propagate
updates. Weather keys include the location and relevant settings; calendar
requests use account-specific locks, with a separate short lock for updating the
stored account list.

Switching tabs lets the current owner finish its in-flight requests and share
the result. Waiting tabs recheck the cache and visibility after acquiring a
lock, so hidden tabs release it without starting network requests. Closing or
freezing a page cancels its requests and releases ownership; stalled requests
time out. Waiting visible tabs can then take over, and resumed tabs reuse any
ongoing refresh or check the cache before starting another. Shared cache
generations reject late results after invalidation, and concurrent manual
refreshes share the same request. Website tabs and extension tabs coordinate
within their own origins. Unavailable browser storage falls back to memory and
broadcast results; without Web Locks, request deduplication is limited to the
current tab.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm format:check
pnpm build:web
pnpm build:extension
pnpm exec playwright install chromium
pnpm test:browser
```

Browser tests run against the production website on port 3100 and the unpacked
Manifest V3 extension. They stub external weather/location services and exercise
onboarding, persistent settings, navigation, and CSP-compatible startup. The
port must be free. `PLAYWRIGHT_BROWSERS_PATH` can point to a writable browser
cache.

The shared-fetch and native Temporal browser tests run in isolated routed pages
without starting an application server. Temporal checks exercise Chrome's
Chromium engine and Firefox, including daylight-saving transitions and cache
compatibility:

```bash
pnpm exec playwright install chromium firefox
pnpm exec playwright test --config=playwright.shared.config.ts
```

`pnpm format:fix` applies formatting. `pnpm exec eslint .` checks lint rules
without changing files; `pnpm lint` also applies formatting and lint fixes.

## Packaging

`pnpm build` and `pnpm build:extension` produce `extension/`. Load that
directory as an unpacked extension to try the build locally. `pnpm build:web`
produces the website build used by `pnpm start` and Vercel.

```bash
pnpm source:archive   # Produces extension/src.zip without changing versions
pnpm source:verify    # Extracts, installs, and builds an independent source copy
pnpm release patch   # Builds, increments versions, and packages browser ZIPs
```

The release script creates Chromium and Firefox packages and a source archive.
Source packaging uses an explicit list of build inputs; local environment files,
credentials, symlinks, generated Prisma code, and generated outputs are
excluded. The archive includes scripts, translations, schema/migrations, and the
lockfile. Do not replace this policy with a recursive copy of the workspace
root.

A push to `main` whose latest commit message contains `(release)` creates its
version tag and GitHub release. The local release script packages files; it does
not publish to browser stores.
