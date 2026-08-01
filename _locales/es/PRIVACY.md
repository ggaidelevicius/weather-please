# Política de privacidad de la extensión de navegador "Weather Please"

_Última actualización: 1 de agosto de 2026_

Esta política explica a qué datos accede la extensión "Weather Please", cómo los
utiliza y protege, y las opciones disponibles para ti.

## 1. Información que no recopilamos

La extensión no accede ni recopila tu historial de navegación, el contenido de
los sitios que visitas, contactos, archivos ni identificadores publicitarios. No
operamos ningún servidor que reciba o almacene datos de tu cuenta de Google o de
Google Calendar.

## 2. Geolocalización y servicios de terceros

Para obtener información meteorológica local, "Weather Please" necesita la
ubicación de tu dispositivo (latitud y longitud). Si rechazas el acceso, la
extensión no funcionará.

La ubicación se envía directamente a servicios de terceros para obtener datos
meteorológicos y un nombre de lugar legible. Se aplican sus propias políticas:

- [Política de Open-Meteo](https://open-meteo.com/en/terms)
- [Política de Nominatim/OpenStreetMap](https://osmfoundation.org/wiki/Privacy_Policy)

Nominatim convierte las coordenadas en un nombre de lugar (geocodificación
inversa). "Weather Please" solo transmite la ubicación para estas solicitudes.

## 3. Datos de usuario de Google e integración con Calendar (opcional)

Puedes conectar una cuenta de Google para mostrar próximos eventos en la página
de nueva pestaña. La extensión usa Google OAuth 2.0 y solicita el alcance
`calendar.events.readonly`. Las funciones meteorológicas no requieren acceso al
calendario.

<a id="google-user-data-access"></a>

### 3.1 Datos de usuario de Google a los que accedemos

Si conectas una cuenta, accedemos a:

- el identificador estable de la cuenta y su correo electrónico o nombre, solo
  para identificar y etiquetar la cuenta conectada;
- tokens de acceso y actualización OAuth, para autenticar solicitudes y mantener
  la conexión;
- hasta 10 eventos próximos del calendario principal durante los próximos tres
  días: título, descripción, inicio y fin, estado de día completo, ubicación,
  estado e identificadores del evento y enlace de origen de Google Calendar.

El acceso es de solo lectura. La extensión no puede crear, editar ni eliminar
eventos o calendarios.

<a id="google-user-data-use"></a>

### 3.2 Cómo usamos los datos de usuario de Google

Los datos de cuenta y tokens se usan únicamente para conectar la cuenta, renovar
la conexión y realizar solicitudes de lectura autorizadas. Los eventos solo se
muestran, agrupan, ordenan y deduplican, y se ofrece un enlace al evento
original.

No usamos datos de Google para publicidad, elaboración de perfiles, decisiones
crediticias o de elegibilidad, ni para desarrollar, mejorar o entrenar modelos
generales de IA o aprendizaje automático.

<a id="google-user-data-sharing"></a>

### 3.3 Uso compartido, transferencia y divulgación

Los datos viajan directamente entre Google y la extensión en tu navegador y no
se envían a nuestros servidores. No los vendemos, alquilamos, compartimos,
transferimos ni divulgamos a terceros, anunciantes, corredores de datos u otros
usuarios. No permitimos que personas lean tus datos de Google.

<a id="google-user-data-protection"></a>

### 3.4 Almacenamiento y protección

La autenticación utiliza el flujo de código de autorización OAuth 2.0 con PKCE;
la extensión nunca recibe ni almacena tu contraseña de Google. Las solicitudes
usan HTTPS/TLS y solo se pide el alcance de lectura necesario.

Los detalles de eventos se mantienen únicamente en la memoria del navegador. Los
tokens, el identificador y la etiqueta de cuenta se guardan localmente en el
almacenamiento del navegador, aislados al origen de la extensión y protegidos
por el perfil del navegador y los controles del sistema operativo. Los datos de
Google no se incluyen en analíticas, diagnósticos ni registros.

<a id="google-user-data-retention"></a>

### 3.5 Conservación y eliminación

Los detalles de eventos se descartan al cerrar o recargar la página, al ser
reemplazados por datos actualizados o al desconectar la cuenta. Los tokens y
datos de cuenta se conservan localmente solo mientras exista la conexión.
Desconectar la cuenta los elimina; desinstalar la extensión elimina también su
almacenamiento local.

También puedes revocar el acceso en
[Conexiones de tu cuenta de Google](https://myaccount.google.com/connections),
lo que invalida la autorización. No guardamos datos de Google en servidores ni
copias de seguridad, por lo que no existe otra copia del servidor que eliminar.

### 3.6 Política de datos de usuario de los servicios de API de Google

El uso y la transferencia de información de las APIs de Google por "Weather
Please" cumplen la
[Política de datos de usuario de los servicios de API de Google](https://developers.google.com/terms/api-services-user-data-policy),
incluidos los requisitos de Uso limitado.

## 4. Datos de Microsoft Outlook (opcional)

También puedes conectar Outlook. La autenticación se realiza directamente con
Microsoft mediante OAuth 2.0; nunca vemos ni guardamos tu contraseña. La
extensión solicita solo lectura y no puede modificar eventos. Los eventos se
obtienen directamente de Microsoft y se muestran localmente. Los tokens se
guardan localmente y se eliminan al desconectar. También puedes revocar el
acceso en Microsoft. Se aplica la
[Declaración de privacidad de Microsoft](https://privacy.microsoft.com/privacystatement).

## 5. Cómo usamos otra información

La ubicación solo se usa para obtener el tiempo local y un nombre de lugar. Los
datos meteorológicos, ajustes y caché de ubicación pueden guardarse localmente
para cargar más rápido y recordar tus preferencias.

## 6. Tus opciones

Tú decides si permites la ubicación; sin ella, la extensión no funciona. Las
conexiones de calendario son totalmente opcionales y pueden desconectarse en
cualquier momento.

## 7. Cambios en esta política

Podemos actualizar esta política. Los cambios se publicarán aquí y entrarán en
vigor al publicarse.

## 8. Contacto

Para cualquier consulta, escribe a
[contact@weather-please.app](mailto:contact@weather-please.app).
