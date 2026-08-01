# Chính sách quyền riêng tư của tiện ích "Weather Please"

_Cập nhật lần cuối: 1 tháng 8 năm 2026_

Chính sách này giải thích dữ liệu mà tiện ích truy cập, cách sử dụng và bảo vệ
dữ liệu, cùng các lựa chọn của bạn.

## 1. Thông tin chúng tôi không thu thập

Tiện ích không truy cập hoặc thu thập lịch sử duyệt web, nội dung trang web,
danh bạ, tệp hay mã nhận dạng quảng cáo. Chúng tôi không vận hành máy chủ nhận
hoặc lưu dữ liệu Tài khoản Google hay Google Calendar của bạn.

## 2. Vị trí và dịch vụ bên thứ ba

Vĩ độ và kinh độ thiết bị được dùng để lấy thời tiết địa phương. Nếu từ chối,
tiện ích sẽ không hoạt động. Vị trí được gửi trực tiếp để lấy thời tiết và tên
địa điểm; chính sách của các dịch vụ sau được áp dụng:

- [Open-Meteo](https://open-meteo.com/en/terms)
- [Nominatim/OpenStreetMap](https://osmfoundation.org/wiki/Privacy_Policy)

Nominatim chuyển tọa độ thành tên địa điểm (mã hóa địa lý ngược). Vị trí chỉ
được truyền cho các yêu cầu này.

## 3. Dữ liệu người dùng Google và tích hợp Lịch (không bắt buộc)

Bạn có thể kết nối Google để hiển thị sự kiện sắp tới trên tab mới. Tiện ích
dùng Google OAuth 2.0 và phạm vi `calendar.events.readonly`. Tính năng thời tiết
không cần quyền lịch.

<a id="google-user-data-access"></a>

### 3.1 Dữ liệu Google chúng tôi truy cập

- mã tài khoản ổn định và email hoặc tên, chỉ để nhận diện và gắn nhãn tài
  khoản;
- mã truy cập và làm mới OAuth, để xác thực và duy trì kết nối;
- tối đa 10 sự kiện trong lịch chính trong ba ngày tới: tiêu đề, mô tả, bắt
  đầu/kết thúc, cả ngày, địa điểm, trạng thái, mã sự kiện và liên kết nguồn.

Quyền chỉ đọc; tiện ích không thể tạo, sửa hoặc xóa lịch hay sự kiện.

<a id="google-user-data-use"></a>

### 3.2 Cách sử dụng dữ liệu Google

Thông tin tài khoản và mã chỉ dùng để kết nối, làm mới và gửi yêu cầu đọc được
cho phép. Sự kiện chỉ được hiển thị, nhóm, sắp xếp, loại trùng và cung cấp liên
kết nguồn.

Dữ liệu không dùng cho quảng cáo, lập hồ sơ, quyết định tín dụng/đủ điều kiện,
hoặc phát triển, cải thiện hay huấn luyện mô hình AI/ML đa dụng.

<a id="google-user-data-sharing"></a>

### 3.3 Chia sẻ, chuyển giao và tiết lộ

Dữ liệu đi trực tiếp giữa Google và tiện ích trong trình duyệt, không đến máy
chủ của chúng tôi. Chúng tôi không bán, cho thuê, chia sẻ, chuyển giao hoặc tiết
lộ cho bên thứ ba, nhà quảng cáo, môi giới dữ liệu hay người dùng khác, và không
cho phép con người đọc dữ liệu.

<a id="google-user-data-protection"></a>

### 3.4 Lưu trữ và bảo vệ

Xác thực dùng OAuth 2.0 Authorization Code với PKCE nên mật khẩu Google không
được nhận hoặc lưu. Yêu cầu dùng HTTPS/TLS và chỉ xin quyền đọc cần thiết.

Chi tiết sự kiện chỉ ở trong bộ nhớ trình duyệt. Mã, ID và nhãn tài khoản được
lưu cục bộ, cô lập theo nguồn của tiện ích và được bảo vệ bởi hồ sơ trình duyệt
cùng kiểm soát hệ điều hành. Dữ liệu Google không được đưa vào phân tích, chẩn
đoán hoặc nhật ký.

<a id="google-user-data-retention"></a>

### 3.5 Lưu giữ và xóa

Sự kiện bị loại khỏi bộ nhớ khi đóng/tải lại trang, khi có dữ liệu mới hoặc khi
ngắt kết nối. Mã và thông tin tài khoản chỉ được giữ cục bộ trong thời gian kết
nối và bị xóa khi ngắt. Gỡ tiện ích cũng xóa kho lưu trữ cục bộ của tiện ích.

Bạn cũng có thể thu hồi tại
[Kết nối Tài khoản Google](https://myaccount.google.com/connections). Chúng tôi
không giữ dữ liệu Google trên máy chủ hoặc bản sao lưu nên không có bản sao máy
chủ cần xóa.

### 3.6 Chính sách dữ liệu người dùng của dịch vụ API Google

Việc sử dụng dữ liệu API Google tuân thủ
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
bao gồm yêu cầu Sử dụng hạn chế.

## 4. Dữ liệu Microsoft Outlook (không bắt buộc)

Bạn cũng có thể kết nối Outlook. OAuth 2.0 diễn ra trực tiếp với Microsoft; mật
khẩu không được nhận hoặc lưu. Quyền chỉ đọc, sự kiện hiển thị cục bộ và mã bị
xóa khi ngắt kết nối. Bạn cũng có thể thu hồi tại Microsoft. Áp dụng
[Tuyên bố quyền riêng tư Microsoft](https://privacy.microsoft.com/privacystatement).

## 5. Cách dùng thông tin khác

Vị trí chỉ dùng để lấy thời tiết và tên địa điểm. Dữ liệu thời tiết, cài đặt và
bộ nhớ đệm vị trí có thể được lưu cục bộ để tải nhanh và nhớ tùy chọn.

## 6. Lựa chọn của bạn

Bạn có thể từ chối vị trí, nhưng tiện ích sẽ không hoạt động. Kết nối lịch hoàn
toàn tùy chọn và có thể ngắt bất kỳ lúc nào.

## 7. Thay đổi

Chính sách có thể được cập nhật. Thay đổi có hiệu lực khi đăng tại đây.

## 8. Liên hệ

[contact@weather-please.app](mailto:contact@weather-please.app)
