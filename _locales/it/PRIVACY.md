# Informativa sulla privacy dell’estensione "Weather Please"

_Ultimo aggiornamento: 1 agosto 2026_

Questa informativa spiega a quali dati accede l’estensione "Weather Please",
come li usa e protegge e quali scelte sono disponibili.

## 1. Informazioni che non raccogliamo

L’estensione non accede né raccoglie cronologia di navigazione, contenuti dei
siti visitati, contatti, file o identificatori pubblicitari. Non gestiamo server
che ricevono o conservano dati dell’account Google o di Google Calendar.

## 2. Geolocalizzazione e servizi di terze parti

Per il meteo locale, "Weather Please" usa la posizione del dispositivo
(latitudine e longitudine). Se neghi l’accesso, l’estensione non funzionerà. La
posizione viene inviata direttamente a servizi terzi per ottenere meteo e nome
del luogo; si applicano le loro informative:

- [Open-Meteo](https://open-meteo.com/en/terms)
- [Nominatim/OpenStreetMap](https://osmfoundation.org/wiki/Privacy_Policy)

Nominatim converte le coordinate in un nome leggibile (geocodifica inversa). La
posizione viene trasmessa solo per queste richieste.

## 3. Dati utente Google e integrazione Calendar (facoltativa)

Puoi collegare un account Google per mostrare gli eventi imminenti nella nuova
scheda. L’estensione usa Google OAuth 2.0 e richiede l’ambito
`calendar.events.readonly`. Il meteo funziona senza accesso al calendario.

<a id="google-user-data-access"></a>

### 3.1 Dati utente Google a cui accediamo

Se colleghi un account, accediamo a:

- identificatore stabile, indirizzo e-mail o nome, solo per identificare ed
  etichettare l’account collegato;
- token OAuth di accesso e aggiornamento, per autenticare le richieste e
  mantenere la connessione;
- fino a 10 eventi del calendario principale nei tre giorni successivi: titolo,
  descrizione, inizio e fine, giornata intera, luogo, stato, identificatori e
  link originale di Google Calendar.

L’accesso è di sola lettura: l’estensione non può creare, modificare o eliminare
eventi o calendari.

<a id="google-user-data-use"></a>

### 3.2 Come usiamo i dati utente Google

Dati account e token servono solo a collegare l’account, rinnovare la
connessione ed eseguire letture autorizzate. Gli eventi vengono solo
visualizzati, raggruppati, ordinati e deduplicati, con un link all’evento
originale.

I dati Google non sono usati per pubblicità, profilazione, decisioni creditizie
o di idoneità, né per sviluppare, migliorare o addestrare modelli generici di IA
o apprendimento automatico.

<a id="google-user-data-sharing"></a>

### 3.3 Condivisione, trasferimento e divulgazione

I dati viaggiano direttamente tra Google e l’estensione nel browser e non
raggiungono i nostri server. Non li vendiamo, affittiamo, condividiamo,
trasferiamo o divulghiamo a terzi, inserzionisti, data broker o altri utenti.
Non consentiamo a persone di leggerli.

<a id="google-user-data-protection"></a>

### 3.4 Archiviazione e protezione

L’autenticazione usa il flusso OAuth 2.0 Authorization Code con PKCE;
l’estensione non riceve né conserva la password Google. Le richieste usano
HTTPS/TLS e viene richiesto solo l’accesso in lettura necessario.

I dettagli degli eventi restano solo nella memoria del browser. Token,
identificatore ed etichetta dell’account sono conservati nello spazio locale del
browser, isolato all’origine dell’estensione e protetto dal profilo del browser
e dai controlli del sistema operativo. I dati Google non compaiono in analisi,
diagnostica o registri.

<a id="google-user-data-retention"></a>

### 3.5 Conservazione ed eliminazione

Gli eventi vengono eliminati dalla memoria alla chiusura o ricarica della
pagina, quando dati aggiornati li sostituiscono o alla disconnessione. Token e
dati account restano localmente solo mentre l’account è collegato. Disconnettere
l’account li elimina; rimuovere l’estensione elimina anche il suo spazio locale.

Puoi revocare l’accesso nelle
[connessioni dell’Account Google](https://myaccount.google.com/connections),
invalidando l’autorizzazione. Non conserviamo copie su server o backup.

### 3.6 Norme sui dati utente dei servizi API di Google

L’uso e il trasferimento dei dati ricevuti dalle API Google rispettano la
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
inclusi i requisiti di Utilizzo limitato.

## 4. Dati Microsoft Outlook (facoltativi)

Puoi collegare Outlook. L’autenticazione avviene direttamente con Microsoft
tramite OAuth 2.0; non vediamo né conserviamo la password. L’accesso è di sola
lettura, gli eventi sono mostrati localmente e i token locali vengono eliminati
alla disconnessione. Puoi revocare l’accesso anche da Microsoft. Si applica
l’[Informativa Microsoft](https://privacy.microsoft.com/privacystatement).

## 5. Uso di altre informazioni

La posizione serve solo a ottenere meteo locale e nome del luogo. Meteo,
impostazioni e cache della posizione possono essere conservati localmente per
velocizzare il caricamento e ricordare le preferenze.

## 6. Le tue scelte

Puoi negare la posizione, ma l’estensione non funzionerà. Le connessioni al
calendario sono completamente facoltative e revocabili in qualsiasi momento.

## 7. Modifiche

Possiamo aggiornare questa informativa. Le modifiche hanno effetto quando
pubblicate in questa pagina.

## 8. Contatti

Scrivi a [contact@weather-please.app](mailto:contact@weather-please.app).
