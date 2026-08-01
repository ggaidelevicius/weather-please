# Politique de confidentialité de l’extension « Weather Please »

_Dernière mise à jour : 1er août 2026_

Cette politique explique les données auxquelles l’extension « Weather Please »
accède, leur utilisation et leur protection, ainsi que vos choix.

## 1. Informations que nous ne collectons pas

L’extension n’accède pas à votre historique de navigation, au contenu des sites
visités, à vos contacts, fichiers ou identifiants publicitaires, et ne les
collecte pas. Nous n’exploitons aucun serveur recevant ou stockant les données
de votre compte Google ou de Google Agenda.

## 2. Géolocalisation et services tiers

Pour fournir la météo locale, « Weather Please » utilise la position de votre
appareil (latitude et longitude). Si vous refusez cet accès, l’extension ne
fonctionnera pas.

La position est envoyée directement à des services tiers pour obtenir la météo
et un nom de lieu lisible. Leurs propres politiques s’appliquent :

- [Politique d’Open-Meteo](https://open-meteo.com/en/terms)
- [Politique de Nominatim/OpenStreetMap](https://osmfoundation.org/wiki/Privacy_Policy)

Nominatim transforme les coordonnées en nom de lieu (géocodage inverse). «
Weather Please » ne transmet la position que pour ces requêtes.

## 3. Données utilisateur Google et intégration Agenda (facultatif)

Vous pouvez connecter un compte Google pour afficher vos événements à venir sur
la page de nouvel onglet. L’extension utilise Google OAuth 2.0 et demande le
champ d’application `calendar.events.readonly`. La météo fonctionne sans accès à
l’agenda.

<a id="google-user-data-access"></a>

### 3.1 Données utilisateur Google auxquelles nous accédons

Si vous connectez un compte, nous accédons :

- à l’identifiant stable du compte et à son adresse e-mail ou nom, uniquement
  pour identifier et libeller le compte connecté ;
- aux jetons OAuth d’accès et d’actualisation, pour authentifier les requêtes et
  maintenir la connexion ;
- à jusqu’à 10 événements du calendrier principal sur les trois prochains jours
  : titre, description, début et fin, journée entière, lieu, état, identifiants
  et lien source Google Agenda.

L’accès est en lecture seule. L’extension ne peut ni créer, ni modifier, ni
supprimer des événements ou des agendas.

<a id="google-user-data-use"></a>

### 3.2 Utilisation des données utilisateur Google

Les informations de compte et jetons servent uniquement à connecter le compte,
actualiser la connexion et effectuer des lectures autorisées. Les événements
sont uniquement affichés, regroupés, triés et dédupliqués, avec un lien vers
l’événement source.

Les données Google ne servent pas à la publicité, au profilage, aux décisions de
crédit ou d’éligibilité, ni au développement, à l’amélioration ou à
l’entraînement de modèles généraux d’IA ou d’apprentissage automatique.

<a id="google-user-data-sharing"></a>

### 3.3 Partage, transfert et divulgation

Les données circulent directement entre Google et l’extension dans votre
navigateur et ne sont pas envoyées à nos serveurs. Nous ne les vendons, louons,
partageons, transférons ou divulguons pas à des tiers, annonceurs, courtiers en
données ou autres utilisateurs. Aucun humain n’est autorisé à les lire.

<a id="google-user-data-protection"></a>

### 3.4 Stockage et protection

L’authentification utilise le flux de code d’autorisation OAuth 2.0 avec PKCE ;
l’extension ne reçoit ni ne stocke jamais votre mot de passe Google. Les
requêtes utilisent HTTPS/TLS et seul l’accès en lecture nécessaire est demandé.

Les détails des événements restent uniquement en mémoire. Les jetons,
l’identifiant et le libellé du compte sont conservés dans le stockage local du
navigateur, isolé à l’origine de l’extension et protégé par le profil du
navigateur et les contrôles du système d’exploitation. Les données Google ne
sont incluses dans aucune analyse, aucun diagnostic ou journal.

<a id="google-user-data-retention"></a>

### 3.5 Conservation et suppression

Les événements sont supprimés de la mémoire lorsque la page est fermée ou
rechargée, lorsqu’ils sont remplacés par des données actualisées ou lorsque le
compte est déconnecté. Les jetons et informations du compte restent localement
uniquement pendant la connexion. Déconnecter le compte les supprime ;
désinstaller l’extension supprime également son stockage local.

Vous pouvez aussi révoquer l’accès dans les
[connexions de votre compte Google](https://myaccount.google.com/connections),
ce qui invalide l’autorisation. Nous ne conservons aucune copie sur serveur ou
dans des sauvegardes.

### 3.6 Règles Google API Services User Data Policy

L’utilisation et le transfert par « Weather Please » des informations reçues des
API Google respectent la
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
y compris les exigences d’utilisation limitée.

## 4. Données Microsoft Outlook (facultatif)

Vous pouvez aussi connecter Outlook. L’authentification se fait directement avec
Microsoft via OAuth 2.0 ; nous ne voyons ni ne stockons votre mot de passe.
L’accès est en lecture seule. Les événements sont récupérés auprès de Microsoft
et affichés localement. Les jetons locaux sont supprimés à la déconnexion. Vous
pouvez aussi révoquer l’accès chez Microsoft. La
[Déclaration de confidentialité Microsoft](https://privacy.microsoft.com/privacystatement)
s’applique.

## 5. Utilisation des autres informations

La position sert uniquement à obtenir la météo locale et un nom de lieu. La
météo, les réglages et le cache de position peuvent être stockés localement pour
accélérer le chargement et mémoriser vos préférences.

## 6. Vos choix

Vous choisissez d’autoriser ou non la position ; sans elle, l’extension ne
fonctionne pas. Les connexions aux agendas sont entièrement facultatives et
peuvent être supprimées à tout moment.

## 7. Modifications de cette politique

Nous pouvons mettre cette politique à jour. Les modifications sont publiées ici
et prennent effet dès leur publication.

## 8. Contact

Pour toute question, écrivez à
[contact@weather-please.app](mailto:contact@weather-please.app).
