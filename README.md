# <img src="https://raw.githubusercontent.com/ggaidelevicius/weather-please/main/public/favicon.png" alt="Weather Please logo" width="50"> Weather Please

Weather Please is a new tab replacement extension that is suitable for any browser that supports extensions (such as chromium).

It displays maximum and minimum temperatures, a general prognosis, maximum UV index, maximum wind speed, and chance of precipitation for the current day, as well as up to 8 days into the future.

It also displays weather alerts in the case of extreme UV, high precipitation, strong wind, and low visibility. All alerts are fully toggleable on a per alert-type basis.

Both metric and imperial number formats are supported.

Weather Please uses [Open Meteo](https://open-meteo.com/) as the source for all weather data. At the time of writing, the Open Meteo platform is FOSS, and does not require the end-user to provide an API key.

[Get Weather Please for Google Chrome and other Chromium browsers (such as Edge)](https://chrome.google.com/webstore/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn)

[Get Weather Please for Firefox](https://addons.mozilla.org/en-US/firefox/addon/weather-please/)

[Get Weather Please for Safari](https://apps.apple.com/au/app/weather-please/id6462968576)

[Try a live demo](https://weather-please.app/)

## Translations

Weather Please is available in the following languages:

- Bengali\*
- German\*
- English
- Spanish\*
- French\*
- Hindi\*
- Indonesian\*
- Italian\*
- Japanese\*
- Korean\*
- Lithuanian\*
- Russian\*
- Vietnamese\*
- Chinese\*

Languages marked with \* were translated using [ChatGPT](https://chat.openai.com/) and have not had their quality independently verified.

If you would like to help by providing or verifying translations, please [reach out via email](mailto:contact@weather-please.app).

## Development

Weather Please is built using [Next.js](https://nextjs.org/). It uses the [Mantine component library](https://mantine.dev/), [Tabler Icons](https://tablericons.com/), and [Framer Motion](https://www.framer.com/motion/). [Sentry](https://sentry.io/) is used for error reporting. [Lingui](https://lingui.dev/) is used for translations.

To run the development environment locally, first clone this repo and ensure that you have [Node.js](https://nodejs.org) >= 20.5.1 installed. Next, run `pnpm i`, and finally `pnpm dev`.

There are no environment variables to configure.

## Feedback

If you encounter any issues, or have any suggestions, please [open a GitHub issue](https://github.com/ggaidelevicius/weather-please/issues).
