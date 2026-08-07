# Política de Privacidade da extensão de navegador "Weather Please"

_Última atualização: 1º de agosto de 2026_

Esta política explica quais dados a extensão "Weather Please" acessa, como os
utiliza e protege e quais opções estão disponíveis para você.

## 1. Informações que não coletamos

A extensão não acessa nem coleta seu histórico de navegação, o conteúdo dos
sites que você visita, contatos, arquivos ou identificadores de publicidade. Não
operamos nenhum servidor que receba ou armazene dados da sua Conta do Google ou
do Google Agenda.

## 2. Geolocalização e serviços de terceiros

Para obter informações meteorológicas locais, o "Weather Please" precisa da
localização do seu dispositivo (latitude e longitude). Ao instalar a extensão,
você deverá permitir o acesso à localização. Se você negar o acesso, a extensão
não funcionará.

A localização é enviada diretamente a serviços de terceiros para obter dados
meteorológicos e um nome de local legível. As políticas próprias desses serviços
são aplicáveis:

- [Política do Open-Meteo](https://open-meteo.com/en/terms)
- [Política do Nominatim/OpenStreetMap](https://osmfoundation.org/wiki/Privacy_Policy)

O Nominatim converte as coordenadas em um nome de local (geocodificação
reversa). O "Weather Please" não armazena nem transmite seus dados de
localização além dessas solicitações.

## 3. Dados de usuário do Google e integração com o Google Agenda (opcional)

Você pode conectar uma Conta do Google para exibir os próximos eventos na página
de nova guia. A extensão usa o Google OAuth 2.0 e solicita o escopo
`calendar.events.readonly`. Os recursos meteorológicos não exigem acesso ao
calendário.

<a id="google-user-data-access"></a>

### 3.1 Dados de usuário do Google que acessamos

Se você conectar uma conta, acessaremos:

- o identificador estável da conta e seu endereço de e-mail ou nome, somente
  para identificar e nomear a conta conectada;
- tokens de acesso e atualização OAuth, para autenticar solicitações e manter a
  conexão;
- até 10 próximos eventos do calendário principal nos três dias seguintes:
  título, descrição, início e término, status de dia inteiro, localização,
  status e identificadores do evento e link de origem do Google Agenda.

O acesso é somente para leitura. A extensão não pode criar, editar nem excluir
eventos ou calendários.

<a id="google-user-data-use"></a>

### 3.2 Como usamos os dados de usuário do Google

Os dados da conta e os tokens são usados exclusivamente para conectar a conta,
renovar a conexão e fazer solicitações de leitura autorizadas. Os eventos são
apenas exibidos, agrupados e ordenados, com a remoção de duplicatas, e é
fornecido um link para abrir o evento original no Google Agenda.

Não usamos dados do Google para publicidade, criação de perfis, decisões de
crédito ou elegibilidade, nem para desenvolver, aprimorar ou treinar modelos
gerais de IA ou aprendizado de máquina.

<a id="google-user-data-sharing"></a>

### 3.3 Compartilhamento, transferência e divulgação

Os dados trafegam diretamente entre o Google e a extensão no seu navegador e não
são enviados aos nossos servidores. Não vendemos, alugamos, compartilhamos,
transferimos nem divulgamos esses dados a terceiros, anunciantes, corretores de
dados ou outros usuários. Não permitimos que pessoas leiam seus dados do Google.

<a id="google-user-data-protection"></a>

### 3.4 Armazenamento e proteção

A autenticação usa o fluxo de código de autorização OAuth 2.0 com PKCE; a
extensão nunca recebe nem armazena sua senha do Google. As solicitações usam
HTTPS/TLS e apenas o escopo de leitura necessário é solicitado.

Os detalhes dos eventos são mantidos somente na memória do navegador. Os tokens,
o identificador e o nome da conta são armazenados localmente no armazenamento do
navegador, isolados na origem da extensão e protegidos pelo perfil do navegador
e pelos controles do sistema operacional. Os dados do Google não são incluídos
em análises, diagnósticos nem registros.

<a id="google-user-data-retention"></a>

### 3.5 Retenção e exclusão

Os detalhes dos eventos permanecem na memória somente enquanto a página está
aberta. Eles são descartados quando a página é fechada ou recarregada, quando
são substituídos por dados atualizados ou quando a conta é desconectada. Os
tokens e os dados da conta são mantidos localmente somente enquanto a conexão
existir. Desconectar a conta nas configurações da extensão exclui esses dados
locais; desinstalar a extensão também exclui seu armazenamento local.

Você também pode revogar o acesso em
[Conexões da sua Conta do Google](https://myaccount.google.com/connections), o
que invalida a autorização. Não armazenamos dados do Google em servidores nem em
backups, portanto não há outra cópia no servidor a ser excluída.

### 3.6 Política de Dados do Usuário dos Serviços de API do Google

O uso e a transferência de informações recebidas das APIs do Google pelo
"Weather Please" estão em conformidade com a
[Política de Dados do Usuário dos Serviços de API do Google](https://developers.google.com/terms/api-services-user-data-policy),
incluindo os requisitos de Uso Limitado.

## 4. Dados do Microsoft Outlook (opcional)

Você também pode conectar o Outlook. A autenticação é realizada diretamente com
a Microsoft por meio do OAuth 2.0; nunca vemos nem armazenamos sua senha. A
extensão solicita somente o acesso mínimo de leitura necessário para listar os
próximos eventos e não pode criar, editar nem excluir eventos. Os dados são
obtidos diretamente da Microsoft, exibidos localmente e não são transmitidos nem
armazenados nos nossos servidores. Os tokens de acesso são armazenados
localmente no navegador e excluídos quando a conta é desconectada. Você pode
desconectar a conta nas configurações da extensão e também revogar o acesso nas
configurações de segurança da sua conta Microsoft. A
[Declaração de Privacidade da Microsoft](https://privacy.microsoft.com/privacystatement)
é aplicável.

## 5. Como usamos outras informações

A localização é usada somente para obter a previsão do tempo local e um nome de
local. Os dados meteorológicos, as configurações e o cache de localização podem
ser armazenados localmente para acelerar o carregamento e lembrar suas
preferências.

## 6. Suas opções

Você decide se permite o acesso à localização; sem ele, a extensão não funciona.
As conexões de calendário são totalmente opcionais, podem ser desconectadas a
qualquer momento e não são necessárias para usar todos os recursos
meteorológicos. Ao usar o "Weather Please", você reconhece e aceita esses
requisitos.

## 7. Alterações nesta política

Podemos atualizar esta política de tempos em tempos. As alterações serão
publicadas aqui e entrarão em vigor imediatamente após a publicação.

## 8. Contato

Em caso de dúvidas ou sugestões sobre esta política, entre em contato pelo
e-mail [contact@weather-please.app](mailto:contact@weather-please.app).
