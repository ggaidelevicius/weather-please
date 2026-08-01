# Privacy Policy for the "Weather Please" Browser Extension

_Last updated: August 1, 2026_

This policy explains what data the "Weather Please" browser extension accesses,
how it uses and protects that data, and the choices available to you.

## 1. Information We Don't Collect

The extension does not access or collect your browsing history, the contents of
websites you visit, contacts, files, or advertising identifiers. We do not
operate a server that receives or stores your Google account or Google Calendar
data.

## 2. Geolocation Data and Third-Party Services

To retrieve local weather information, "Weather Please" requires access to your
device's geolocation (latitude and longitude). Upon installation, you will be
prompted to allow location access. If you decline, the extension will not
function.

Location data is sent directly to third-party services to fetch weather updates
and to display a user-friendly location name. These services operate under their
own privacy policies, which you can review here:

- [Open-Meteo Privacy Policy](https://open-meteo.com/en/terms)
- [Nominatim (OpenStreetMap) Privacy Policy](https://osmfoundation.org/wiki/Privacy_Policy)

Nominatim is used to convert your coordinates into a readable location name
(reverse geocoding). "Weather Please" does not store or transmit your location
data beyond these requests.

## 3. Google User Data and Calendar Integration (Optional)

You may optionally connect a Google account so the extension can show your
upcoming calendar events on your new tab page. The extension uses Google OAuth
2.0 and requests the `calendar.events.readonly` scope. Calendar access is not
required to use the weather features.

### 3.1 Google User Data We Access

If you connect a Google account, we access:

- Your Google account's stable identifier and email address or name, used only
  to identify and label the connected account in the extension.
- OAuth access and refresh tokens, used to authenticate requests and keep the
  connection working until you disconnect it.
- Up to 10 upcoming events from your primary Google Calendar within the next
  three days. The event fields accessed are title, description, start and end
  time, all-day status, location, event status, event identifiers, and the
  Google Calendar source link.

This is read-only access. The extension cannot create, edit, delete, or
otherwise modify your events or calendars.

### 3.2 How We Use Google User Data

We use your Google account information and OAuth tokens only to connect the
account, refresh the connection, and make authorized read-only requests to
Google Calendar. We use event data only to display, group, sort, and deduplicate
your upcoming events and to provide a link that opens the source event in Google
Calendar.

Google user data is not used for advertising, profiling, credit or eligibility
decisions, or developing, improving, or training general-purpose artificial
intelligence or machine-learning models.

### 3.3 Sharing, Transfer, and Disclosure of Google User Data

Google user data travels directly between Google and the extension in your
browser. It is not transmitted to our servers. We do not sell, rent, share,
transfer, or disclose Google user data to third parties, advertisers, data
brokers, or other users. We do not permit humans to read your Google user data.

### 3.4 Storage and Data Protection

Authentication uses the OAuth 2.0 Authorization Code flow with PKCE, so the
extension never receives or stores your Google password. Requests to Google use
HTTPS/TLS, and the extension requests only the read-only scope required for its
calendar display.

Event details are held in browser memory only and are not written to persistent
storage. OAuth tokens and the connected account identifier and label are stored
locally in browser storage, isolated to the extension's origin and protected by
your browser profile and operating-system access controls. No Google user data
is included in analytics, diagnostic reports, or application logs.

### 3.5 Retention and Deletion of Google User Data

Calendar event details remain in memory only while the page is open and are
discarded when the page is closed or reloaded, when refreshed data replaces
them, or when you disconnect the account. OAuth tokens and connected-account
information remain in local browser storage only while the account is connected.
Disconnecting the account in the extension's settings deletes those locally
stored values. Removing the extension also removes its local extension storage.

You may also revoke access from your
[Google Account connections](https://myaccount.google.com/connections), which
invalidates the authorization. Because we do not keep Google user data on our
servers or in server backups, there is no additional server-side copy to request
that we delete.

### 3.6 Google API Services User Data Policy

"Weather Please's" use and transfer of information received from Google APIs
adheres to the
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
including the Limited Use requirements.

## 4. Microsoft Outlook Data (Optional)

You may also connect a Microsoft Outlook account to display upcoming events. For
this integration:

- Authentication happens directly between your browser and Microsoft using OAuth
  2.0. We never see or store your password.
- The extension requests the minimum read-only access required to list your
  upcoming events. It cannot create, edit, or delete events.
- Event data is fetched directly from Microsoft and displayed locally. It is not
  transmitted to or stored on our servers.
- Sign-in tokens are stored locally in your browser and are deleted when you
  disconnect the account.
- You can disconnect the account in the extension's settings and revoke access
  from your Microsoft account security settings.

Microsoft's handling of your data is governed by the
[Microsoft Privacy Statement](https://privacy.microsoft.com/privacystatement).

## 5. How We Use Other Information

Your geolocation is used only to retrieve local weather data and a readable
place name from the services described above. Weather data, your selected
settings, and location cache may be stored locally in your browser so the
extension can load quickly and remember your preferences.

## 6. Your Choices

You may choose whether to grant location access when prompted. If you do not
allow it, the extension will not function. Calendar connections are entirely
optional, and the extension works fully without them. By using "Weather Please,"
you acknowledge and accept these requirements.

## 7. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Changes will be posted on
this page and take effect immediately upon posting.

## 8. Contact Us

If you have any questions or suggestions about this Privacy Policy, contact us
at [contact@weather-please.app](mailto:contact@weather-please.app).
