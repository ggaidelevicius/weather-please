# <img src="https://raw.githubusercontent.com/ggaidelevicius/weather-please/main/public/favicon.png" alt="Weather Please logo" width="50"> Weather Please

Weather Please is a new tab replacement extension that is suitable for any browser that supports extensions (such as chromium).

It displays maximum and minimum temperatures, a general prognosis, maximum UV index, maximum wind speed, and chance of precipitation for the current day, as well as 2 days into the future.

It also displays weather alerts in the case of extreme UV, high precipitation, high wind, and low visibility. All alerts are fully toggleable on a per alert-type basis.

Both metric and imperial number formats are supported.

Weather please uses [Open Meteo](https://open-meteo.com/) as the source for all weather data. At the time of writing, the Open Meteo platform is FOSS, and does not require the end-user to provide an API key.

[Get Weather Please for Google Chrome](https://chrome.google.com/webstore/detail/weather-please/pgpheojdhgdjjahjpacijmgenmegnchn)

[Get Weather Please for Firefox](https://addons.mozilla.org/en-US/firefox/addon/weather-please/)

[Try a live demo](https://weather-please-extension.vercel.app/)

## Translations

If you would like to help by providing translations, please [reach out via email](mailto:weatherplease.dev@gmail.com).

## Development
Weather Please is built using [Next.js](https://nextjs.org/). It uses the [Mantine component library](https://mantine.dev/), [Tabler Icons](https://tablericons.com/), and [Framer Motion](https://www.framer.com/motion/).

To run the development environment locally, first clone this repo and ensure that you have [Node.js](https://nodejs.org) >= 20.5.1 installed. Next, run ```pnpm i```, and finally ```pnpm dev```.

There are no environment variables to configure.

## Feedback
If you encounter any issues, or have any suggestions, please [open a GitHub issue](https://github.com/ggaidelevicius/weather-please/issues).
