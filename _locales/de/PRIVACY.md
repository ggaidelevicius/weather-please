# Datenschutzrichtlinie für die Browsererweiterung „Weather Please“

_Letzte Aktualisierung: 1. August 2026_

Diese Richtlinie erläutert, auf welche Daten die Browsererweiterung „Weather
Please“ zugreift, wie sie diese Daten verwendet und schützt und welche
Wahlmöglichkeiten Sie haben.

## 1. Welche Daten wir nicht erfassen

Die Erweiterung greift nicht auf Ihren Browserverlauf, die Inhalte besuchter
Websites, Kontakte, Dateien oder Werbekennungen zu und erfasst diese nicht. Wir
betreiben keinen Server, der Daten Ihres Google-Kontos oder Google Kalenders
empfängt oder speichert.

## 2. Standortdaten und Drittanbieterdienste

Für lokale Wetterinformationen benötigt „Weather Please“ den Standort Ihres
Geräts (Breiten- und Längengrad). Wenn Sie den Zugriff ablehnen, funktioniert
die Erweiterung nicht.

Standortdaten werden direkt an Drittanbieterdienste gesendet, um Wetterdaten und
einen lesbaren Ortsnamen abzurufen. Es gelten deren eigene
Datenschutzrichtlinien:

- [Open-Meteo-Datenschutzrichtlinie](https://open-meteo.com/en/terms)
- [Nominatim-/OpenStreetMap-Datenschutzrichtlinie](https://osmfoundation.org/wiki/Privacy_Policy)

Nominatim wandelt Koordinaten in einen Ortsnamen um (Reverse Geocoding).
„Weather Please“ überträgt Standortdaten nur für diese Anfragen.

## 3. Google-Nutzerdaten und Kalenderintegration (optional)

Sie können ein Google-Konto verbinden, um anstehende Termine auf der
Neuer-Tab-Seite anzuzeigen. Die Erweiterung verwendet Google OAuth 2.0 und
fordert den Bereich `calendar.events.readonly` an. Die Wetterfunktionen können
ohne Kalenderzugriff genutzt werden.

<a id="google-user-data-access"></a>

### 3.1 Google-Nutzerdaten, auf die wir zugreifen

Wenn Sie ein Google-Konto verbinden, greifen wir auf Folgendes zu:

- stabile Google-Kontokennung sowie E-Mail-Adresse oder Name, ausschließlich zur
  Identifizierung und Beschriftung des verbundenen Kontos;
- OAuth-Zugriffs- und Aktualisierungstoken zur Authentifizierung und
  Aufrechterhaltung der Verbindung;
- bis zu 10 anstehende Termine aus Ihrem primären Google Kalender innerhalb der
  nächsten drei Tage: Titel, Beschreibung, Beginn und Ende, Ganztagsstatus, Ort,
  Terminstatus, Terminkennungen und Google-Kalender-Quelllink.

Der Zugriff ist schreibgeschützt. Die Erweiterung kann keine Kalender oder
Termine erstellen, bearbeiten oder löschen.

<a id="google-user-data-use"></a>

### 3.2 Verwendung von Google-Nutzerdaten

Kontodaten und OAuth-Token werden nur zum Verbinden des Kontos, Erneuern der
Verbindung und für autorisierte Leseanfragen verwendet. Termindaten werden nur
angezeigt, gruppiert, sortiert und dedupliziert; außerdem wird ein Link zum
Quelltermin bereitgestellt.

Google-Nutzerdaten werden nicht für Werbung, Profilbildung,
Bonitäts-/Berechtigungsentscheidungen oder zum Entwickeln, Verbessern oder
Trainieren allgemeiner KI- oder Machine-Learning-Modelle verwendet.

<a id="google-user-data-sharing"></a>

### 3.3 Weitergabe, Übertragung und Offenlegung

Google-Nutzerdaten werden direkt zwischen Google und der Erweiterung in Ihrem
Browser übertragen und nicht an unsere Server gesendet. Wir verkaufen,
vermieten, teilen, übertragen oder offenbaren sie nicht gegenüber Dritten,
Werbetreibenden, Datenhändlern oder anderen Nutzern. Menschen erhalten keinen
Zugriff auf Ihre Google-Nutzerdaten.

<a id="google-user-data-protection"></a>

### 3.4 Speicherung und Datenschutz

Die Authentifizierung verwendet den OAuth-2.0-Autorisierungscodefluss mit PKCE;
die Erweiterung erhält oder speichert Ihr Google-Passwort daher nie. Anfragen an
Google verwenden HTTPS/TLS, und es wird nur der erforderliche Lesezugriff
angefordert.

Termindetails werden nur im Browserspeicher gehalten und nicht dauerhaft
gespeichert. OAuth-Token, Kontokennung und Kontobezeichnung werden lokal im
Browserspeicher abgelegt, sind auf den Ursprung der Erweiterung beschränkt und
durch Browserprofil und Betriebssystemzugriff geschützt. Google-Nutzerdaten
werden nicht in Analysen, Diagnoseberichten oder Anwendungsprotokollen erfasst.

<a id="google-user-data-retention"></a>

### 3.5 Aufbewahrung und Löschung

Termindetails werden verworfen, wenn die Seite geschlossen oder neu geladen
wird, aktualisierte Daten sie ersetzen oder das Konto getrennt wird. Token und
Kontoinformationen bleiben nur solange lokal gespeichert, wie das Konto
verbunden ist. Durch Trennen des Kontos werden diese Werte gelöscht. Das
Entfernen der Erweiterung löscht auch ihren lokalen Erweiterungsspeicher.

Sie können den Zugriff außerdem unter
[Verknüpfungen Ihres Google-Kontos](https://myaccount.google.com/connections)
widerrufen. Dadurch wird die Autorisierung ungültig. Da wir keine
Google-Nutzerdaten auf Servern oder in Server-Backups speichern, gibt es keine
weitere serverseitige Kopie zu löschen.

### 3.6 Google API Services User Data Policy

Die Nutzung und Übertragung von über Google APIs erhaltenen Informationen durch
„Weather Please“ entspricht der
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
einschließlich der Anforderungen zur eingeschränkten Nutzung.

## 4. Microsoft-Outlook-Daten (optional)

Sie können ein Microsoft-Outlook-Konto verbinden. Die Authentifizierung erfolgt
direkt mit Microsoft über OAuth 2.0; wir sehen oder speichern Ihr Passwort nie.
Die Erweiterung fordert nur Lesezugriff an und kann keine Termine ändern.
Termine werden direkt von Microsoft abgerufen und lokal angezeigt. Token werden
lokal gespeichert und beim Trennen gelöscht. Sie können den Zugriff zusätzlich
in den Sicherheitseinstellungen Ihres Microsoft-Kontos widerrufen. Es gilt die
[Microsoft-Datenschutzerklärung](https://privacy.microsoft.com/privacystatement).

## 5. Verwendung anderer Informationen

Ihr Standort wird nur zum Abrufen lokaler Wetterdaten und eines Ortsnamens
verwendet. Wetterdaten, Einstellungen und Standortcache können lokal gespeichert
werden, damit die Erweiterung schnell lädt und Ihre Einstellungen beibehält.

## 6. Ihre Wahlmöglichkeiten

Sie entscheiden, ob Sie Standortzugriff gewähren; ohne ihn funktioniert die
Erweiterung nicht. Kalenderverbindungen sind vollständig optional. Konten können
jederzeit in den Einstellungen getrennt werden.

## 7. Änderungen dieser Datenschutzrichtlinie

Wir können diese Richtlinie aktualisieren. Änderungen werden auf dieser Seite
veröffentlicht und gelten ab ihrer Veröffentlichung.

## 8. Kontakt

Bei Fragen kontaktieren Sie uns unter
[contact@weather-please.app](mailto:contact@weather-please.app).
