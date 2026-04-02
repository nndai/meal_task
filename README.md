# Meal Task 📝

Ứng dụng quản lý việc nhà theo ngày, giúp các thành viên dễ dàng theo dõi và thực hiện các công việc hàng ngày trong gia đình hoặc nhóm.

## Tính năng chính ✨

- **Mẫu công việc (Task Templates):** Quản lý chung các công việc cần làm hàng ngày.
- **Tự động theo ngày:** Tự động có đầy đủ các công việc trên giao diện mỗi ngày.
- **Ghi nhận thông minh:** Mỗi lần hoàn thành sẽ được lưu dưới dạng bộ ba thông tin `(Ngày + Công việc + Thành viên)`.
- **Thông báo đẩy (Web Push Notifications):** Tính năng tự nguyện cho phép đăng ký nhận thông báo (ví dụ gửi nhắc nhở công việc) qua trình duyệt. Có trang cài đặt quản lý bật/tắt nhận thông báo.

## Yêu cầu công nghệ ⚙️

- **Frontend/Backend:** Next.js (App Router), React, Tailwind CSS
- **Database:** Supabase (PostgreSQL)

## Cài đặt môi trường tại máy (Local) 🚀

### 1. Cài đặt thư viện

Mở terminal tại thư mục gốc của dự án và chạy:

```bash
npm install
```

### 2. Thiết lập Biến môi trường

Tạo một file `.env` ở thư mục gốc (hoặc copy từ `.env.example`).
Điền các giá trị cần thiết vào (thông tin URL và API key từ dashboard Supabase của bạn).

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# (Tùy chọn cho Push Notification) Tạo khóa bằng lệnh: npx web-push generate-vapid-keys 
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your_email@example.com
```

### 3. Cài đặt Database Base

Các script cấu hình cơ sở dữ liệu đã được gộp lại tại thư mục `sql/`. Để chạy ứng dụng với đầy đủ tính năng hiện tại:

1. Đăng nhập vào trang quản trị Supabase.
2. Mở trình **SQL Editor**.
3. Copy toàn bộ nội dung từ file [`sql/schema.sql`](./sql/schema.sql) và dán vào đó để tạo tất cả các bảng và Security Policies.

*Lưu ý:* Mã SQL trong dự án đang thiết lập Policy mở (cho phép đọc/ghi tự do) để phục vụ phát triển nhanh. Khi bạn triển khai thực tế trên server (Production), cần cấu hình lại các quy tắc RLS (Row Level Security) cho bảo mật hơn.

### 4. Chạy thử nghiệm Local

Sau khi cài đặt xong, khởi chạy máy chủ phát triển bằng lệnh:

```bash
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) trên trình duyệt để sử dụng ứng dụng.
