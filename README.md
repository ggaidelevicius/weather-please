# <img src="https://raw.githubusercontent.com/ggaidelevicius/weather-please/main/public/favicon.png" alt="Weather Please logo" width="50"> Weather Please

Weather Please is a new tab replacement extension that is suitable for any
browser that supports extensions (such as chromium).

It displays maximum and minimum temperatures, a general prognosis, maximum UV
index, maximum wind speed, and chance of precipitation for the current day, as
well as up to 8 days into the future.

It also displays weather alerts in the case of extreme UV, high precipitation,
strong wind, and low visibility. All alerts are fully toggleable on a per
alert-type basis.

Both metric and imperial number formats are supported.

Weather Please uses [Open Meteo](https://open-meteo.com/) as the source for all
weather data.

[Get Weather Please for Google Chrome and other Chromium browsers (such as Edge)](https://chrome.google.com/webstore/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn)

[Get Weather Please for Firefox](https://addons.mozilla.org/en-US/firefox/addon/weather-please/)

[Try a live demo](https://weather-please.app/)

## Translations

Weather Please is available in the following languages:

- Bengali
- German
- English
- Spanish
- French
- Hindi
- Indonesian
- Italian
- Japanese
- Korean
- Lithuanian
- Portuguese (Brazil)
- Russian
- Vietnamese
- Chinese

## Development

Weather Please is built using [Next.js](https://nextjs.org/). It uses
[Tailwind CSS](https://tailwindcss.com/),
[Tabler Icons](https://tablericons.com/), and
[Framer Motion](https://www.framer.com/motion/). [Lingui](https://lingui.dev/)
is used for translations.

Use Node.js 24 or newer and the pnpm version pinned in `package.json`.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `/demo` for the weather dashboard. The weather dashboard needs no account
or API key. The optional hosted bug form and calendar integrations are described
in [the development guide](docs/development.md), including environment
variables, database setup, and OAuth redirect configuration.

```bash
pnpm db:generate       # Requires DATABASE_URL; generating does not connect to it
pnpm typecheck
pnpm test
pnpm format:check
pnpm build:extension   # Writes the unpacked extension to extension/
pnpm build:web         # Builds the hosted website; requires DATABASE_URL
pnpm start             # Serves the website build
```

`pnpm build` remains an alias for the extension build. Extension builds run in a
temporary staging directory and do not rename source directories or rewrite
analytics imports. Website builds include analytics; extension builds exclude
it. Vercel uses `pnpm build:web` through `vercel.json`.

ESLint compatibility with the current TypeScript version is deferred.
`pnpm lint` remains a mutating local command and still invokes ESLint.

See [architecture](docs/architecture.md) for module boundaries and
[development and release instructions](docs/development.md) for browser smoke
tests and packaging.

## Feedback

If you encounter any issues, or have any suggestions, please
[open a GitHub issue](https://github.com/ggaidelevicius/weather-please/issues).
