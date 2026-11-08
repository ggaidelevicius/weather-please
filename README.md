# <img src="https://raw.githubusercontent.com/ggaidelevicius/weather-please/main/public/favicon.png" alt="" width="40"> Weather Please

A new tab extension that shows today's weather and the next 8 days, with alerts
for extreme conditions. Weather data comes from
[Open-Meteo](https://open-meteo.com/).

[Chrome](https://chrome.google.com/webstore/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn)
· [Firefox](https://addons.mozilla.org/en-US/firefox/addon/weather-please/) ·
[Live demo](https://weather-please.app/)

## Quick start

```bash
pnpm install --frozen-lockfile   # also installs the pinned Node.js 26 runtime
pnpm dev
```

Open `http://localhost:3000/demo`. The dashboard works without any environment
variables. You only need a `.env.local` for the bug form and calendar sign-in.
See [development](docs/development.md#setup).

## Commands

| Command                     | What it does                                             |
| --------------------------- | -------------------------------------------------------- |
| `pnpm dev`                  | Dev server for the website and dashboard                 |
| `pnpm typecheck`            | Generates Next.js types, then runs `tsc --noEmit`        |
| `pnpm test`                 | Vitest unit tests                                        |
| `pnpm test:browser`         | Playwright tests against the website and the extension   |
| `pnpm exec oxlint .`        | Lint (read-only; `pnpm lint` applies fixes)              |
| `pnpm exec oxfmt . --check` | Format check (read-only; `pnpm format` writes)           |
| `pnpm build:extension`      | Unpacked extension in `extension/` (alias: `pnpm build`) |
| `pnpm build:web`            | Website build for Vercel; needs `DATABASE_URL`           |
| `pnpm release patch`        | Bumps versions and packages browser ZIPs                 |

The pre-commit hook lints and formats staged files, then runs the type check, a
full lint, and the tests.

## Stack

Next.js 16 (Pages Router for the dashboard, App Router for the website), React
19 with React Compiler, TypeScript 7, Tailwind CSS, Lingui, Prisma, Vitest, and
Playwright. The code uses native Temporal, so it needs Chrome 144+ or Firefox
139+.

## Layout

```
src/pages/demo.tsx   dashboard entry (also the extension's only page)
src/app/             website: landing, privacy, /bug
src/features/        feature modules (api, model, hooks, ui)
src/shared/          browser utilities and shared UI
src/server/          server-only code
src/locales/         Lingui catalogs
_locales/            browser-store extension name and description
scripts/             extension build, release, and source archive
```

## Docs

- [Architecture](docs/architecture.md): module boundaries, routing, and caching
- [Development](docs/development.md): environment, database, OAuth, browser
  tests, and releases
- [Privacy policy](PRIVACY.md)

## Translations

Available in 15 languages: Bengali, Chinese, English, French, German, Hindi,
Indonesian, Italian, Japanese, Korean, Lithuanian, Portuguese (Brazil), Russian,
Spanish, and Vietnamese.

## Feedback

Found a bug or have an idea?
[Open an issue](https://github.com/ggaidelevicius/weather-please/issues).
