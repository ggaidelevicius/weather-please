# “Weather Please”浏览器扩展隐私政策

_最后更新日期：2026 年 8 月 1 日_

本政策说明扩展程序访问哪些数据、如何使用和保护这些数据，以及您可作出的选择。

## 1. 我们不收集的信息

扩展程序不会访问或收集您的浏览历史、所访问网站的内容、联系人、文件或广告标识符。我们不运营任何接收或存储您的 Google 账户或 Google 日历数据的服务器。

## 2. 地理位置与第三方服务

为获取本地天气，“Weather
Please”会使用设备的经纬度。若拒绝授权，扩展程序将无法运行。位置数据仅为获取天气和易读地名而直接发送至以下服务，并适用其隐私政策：

- [Open-Meteo](https://open-meteo.com/en/terms)
- [Nominatim/OpenStreetMap](https://osmfoundation.org/wiki/Privacy_Policy)

Nominatim 用于将坐标转换为地名（反向地理编码）。位置数据只会为这些请求而传输。

## 3. Google 用户数据与日历集成（可选）

您可连接 Google 账户，在新标签页显示近期事件。扩展程序使用 Google OAuth
2.0，并申请 `calendar.events.readonly` 权限范围。天气功能无需日历权限。

<a id="google-user-data-access"></a>

### 3.1 我们访问的 Google 用户数据

- 稳定的账户标识符以及电子邮件地址或姓名，仅用于识别和标记已连接账户；
- OAuth 访问令牌和刷新令牌，用于验证请求并维持连接；
- 主日历未来三天内最多 10 个事件：标题、说明、开始和结束时间、全天状态、地点、事件状态、事件标识符及 Google 日历来源链接。

访问权限为只读。扩展程序无法创建、编辑或删除事件或日历。

<a id="google-user-data-use"></a>

### 3.2 Google 用户数据的用途

账户信息和令牌仅用于连接账户、刷新连接以及发出已授权的只读请求。事件数据仅用于显示、分组、排序、去重和提供来源事件链接。

Google 用户数据不会用于广告、用户画像、信用或资格决定，也不会用于开发、改进或训练通用 AI 或机器学习模型。

<a id="google-user-data-sharing"></a>

### 3.3 共享、传输与披露

数据仅在 Google 与您浏览器中的扩展程序之间直接传输，不会发送到我们的服务器。我们不会向第三方、广告商、数据经纪商或其他用户出售、出租、共享、转移或披露这些数据，也不允许人工读取。

<a id="google-user-data-protection"></a>

### 3.4 存储与保护

身份验证采用带 PKCE 的 OAuth
2.0 授权码流程，因此扩展程序不会接收或存储您的 Google 密码。请求使用 HTTPS/TLS，且只申请必要的只读权限。

事件详情仅保留在浏览器内存中。令牌、账户标识符和标签存储在浏览器本地存储中，仅限扩展程序来源访问，并受浏览器配置文件及操作系统访问控制保护。Google 数据不会写入分析、诊断报告或应用日志。

<a id="google-user-data-retention"></a>

### 3.5 保留与删除

关闭或重新加载页面、刷新数据取代旧数据或断开账户时，事件详情会从内存中清除。令牌和账户信息仅在账户连接期间保留于本地；断开连接即会删除。卸载扩展程序也会删除其本地扩展存储。

您还可在
[Google 账户关联](https://myaccount.google.com/connections)中撤销访问，使授权失效。我们不在服务器或服务器备份中保存 Google 数据，因此不存在其他服务器副本需要删除。

### 3.6 Google API 服务用户数据政策

“Weather Please”对 Google API 信息的使用和传输遵守
[Google API 服务用户数据政策](https://developers.google.com/terms/api-services-user-data-policy)，包括有限使用要求。

## 4. Microsoft Outlook 数据（可选）

您也可连接 Outlook。身份验证通过 OAuth
2.0 直接与 Microsoft 进行；我们不会接收或保存密码。权限为只读，事件仅在本地显示，断开连接时会删除本地令牌。您也可在 Microsoft 撤销访问。适用
[Microsoft 隐私声明](https://privacy.microsoft.com/privacystatement)。

## 5. 其他信息的使用

位置仅用于获取本地天气和地名。为加快加载并记住偏好，天气数据、设置及位置缓存可能保存在本地。

## 6. 您的选择

您可拒绝位置权限，但扩展程序将无法运行。日历连接完全可选，且可随时断开。

## 7. 政策变更

我们可能更新本政策。变更在本页面发布时生效。

## 8. 联系我们

请联系 [contact@weather-please.app](mailto:contact@weather-please.app)。
