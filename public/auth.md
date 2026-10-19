# Authentication for Weather Please

## Public access

Reading the website, the live demo, and the privacy policy, or installing the
extension, does not require an account, login, API key, or payment.

Public information is available at
[Weather Please](https://weather-please.app/), with an
[agent guide](https://weather-please.app/llms.txt) and
[sitemap](https://weather-please.app/sitemap.xml).

There is no website account sign-up, agent authentication flow, delegated OAuth
access, or public authenticated API. Do not ask users to create a website
account or provide website credentials.

## Calendar connections

Calendar connections are optional and happen inside the extension. The extension
signs in directly with Google or Microsoft using their own OAuth pages and
requests read-only calendar access. Tokens stay in the user's browser, and this
website never receives calendar credentials or calendar data. Agents must not
request, collect, or submit Google or Microsoft account credentials.

## Bug reports

The [bug report form](https://weather-please.app/bug) accepts a message and an
optional email address. Submitting a report is a separate action from reading
the site, and the form is rate limited. Submit a report only when the user
explicitly asks you to. The form is not a public agent API; do not bypass its
rate limits or send reports as part of a crawl.
