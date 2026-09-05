# Development and releases

## Setup

Use Node.js 24+ and the pnpm version in `package.json`. Run
`pnpm install --frozen-lockfile`. The `/demo` dashboard works without
environment configuration. `pnpm dev` starts the hosted development server.

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

`pnpm format:fix` applies formatting. ESLint is currently excluded from CI while
its TypeScript compatibility is unresolved; `pnpm lint` still invokes ESLint and
also modifies files.

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

A commit to `main` runs quality checks. A commit whose message contains
`(release)` creates its version tag and GitHub release only after those checks
pass. The local release script packages files; it does not publish to browser
stores.
