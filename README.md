# SEWS — Student Early Warning System

Hệ thống theo dõi học vụ và cảnh báo sớm sinh viên dành cho Khoa Công nghệ Thông
tin, Trường Đại học Đà Lạt. SEWS tập trung dữ liệu sinh viên, kết quả học tập và
chương trình đào tạo để hỗ trợ cán bộ theo dõi tiến độ, nhận diện trường hợp cần
quan tâm và lập báo cáo.

Repository được tổ chức thành **npm monorepo**, gồm frontend và backend có thể
chạy, build và triển khai độc lập.

## Chức năng

- Dashboard tổng quan và hồ sơ chi tiết sinh viên.
- Quản lý sinh viên, lớp, khóa học, năm học và học kỳ.
- Quản lý chương trình đào tạo, học phần và kế hoạch học tập.
- Theo dõi tiến độ đào tạo, đánh giá hoàn thành và dự báo tốt nghiệp.
- Cảnh báo học vụ, cấu hình chính sách và ghi nhận hành động theo dõi.
- Quản lý điểm, quyết định, chính sách miễn giảm học phí; nhập và xuất dữ liệu.
- Báo cáo học vụ; quản lý tài khoản, vai trò, quyền và phân công cố vấn.
- Đăng nhập bằng JWT, refresh token qua HttpOnly cookie và giới hạn phạm vi dữ liệu.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | Next.js 16.3.4, React 19, TypeScript |
| Giao diện | Tailwind CSS 4, Lucide React, Recharts |
| Trạng thái phía client | Zustand |
| Backend | Next.js Route Handlers, TypeScript |
| Cơ sở dữ liệu | PostgreSQL, Prisma 6 |
| Xác thực | JWT (`jose`), `bcryptjs`, HttpOnly cookie |
| Quản lý repository | npm workspaces |
| Kiểm thử | Node.js test runner và `tsx` |

## Cấu trúc dự án

```text
apps/
  frontend/      Next.js: trang, component, hooks, stores và proxy API
  backend/       Next.js API: app/api/v1, lib/services, lib/auth, Prisma, tests
legacy/vite/     Mã Vite cũ, lưu tham khảo và không tham gia build
scripts/         Lệnh chạy chung và smoke test
```

Backend hiện vẫn dùng Next.js Route Handlers. Việc tách này chưa chuyển framework
sang NestJS. Toàn bộ 93 route (142 phương thức API) và nghiệp vụ được giữ lại;
frontend không import mã backend hay Prisma. Nếu chuyển backend sang NestJS sau
này, giữ hợp đồng `/api/v1` để frontend tiếp tục hoạt động.

## Chạy trên máy phát triển

Yêu cầu Node.js >= 20.9, npm và PostgreSQL. Cài Git LFS để lấy đầy đủ tài nguyên
nhị phân được theo dõi trong repository. Dùng npm và `package-lock.json` ở thư
mục gốc; lockfile pnpm cũ đã được lưu trong `legacy/vite`.

Lấy mã nguồn:

```bash
git clone https://github.com/Cookie1109/student-ews.git
cd student-ews
npm ci
```

1. Với máy mới, sao chép `apps/backend/.env.example` thành `apps/backend/.env`
   và `apps/frontend/.env.example` thành `apps/frontend/.env.local`.
2. Điền `DATABASE_URL`, `JWT_SECRET` ngẫu nhiên và `ALLOWED_ORIGINS` ở backend.
3. Chạy `npm run db:generate` để sinh Prisma Client.
4. Chuẩn bị database theo [hướng dẫn Prisma](apps/backend/prisma/MIGRATIONS.md).
   Database mới cần chạy `npm run db:deploy` sau khi đã tạo database PostgreSQL.
5. Chạy `npm run dev`, mở http://localhost:3000. Backend chạy tại
   http://localhost:3001; kiểm tra kết nối database qua `/api/v1/healthz`.

Ví dụ sao chép cấu hình bằng PowerShell, chỉ chạy khi các file đích chưa có:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/frontend/.env.example apps/frontend/.env.local
```

| Biến môi trường | Ứng dụng | Ý nghĩa |
| --- | --- | --- |
| `BACKEND_URL` | Frontend | Origin backend phía server, mặc định `http://127.0.0.1:3001` |
| `DATABASE_URL` | Backend | Chuỗi kết nối PostgreSQL |
| `JWT_SECRET` | Backend | Khóa ký JWT ngẫu nhiên, tối thiểu 32 ký tự |
| `ALLOWED_ORIGINS` | Backend | Các origin trình duyệt được phép gửi request ghi, cách nhau bằng dấu phẩy |

Chỉ các file `.env.example` được đưa vào Git. Giữ khóa JWT, mật khẩu và file
`.env`/`.env.local` trong môi trường triển khai của bạn.

Trên máy đã thực hiện việc tách, các file `.env`/`.env.local` cũ đã được chuyển
vào `apps/backend`; không cần chép đè chúng bằng file mẫu. `.env.local` có ưu tiên
cao hơn `.env` đối với Next.js; Prisma CLI dùng `.env`, nên giữ `DATABASE_URL`
nhất quán nếu tồn tại trong cả hai file.

Database hiện có không cần migration chỉ vì thay đổi thư mục. Với database mới
hoặc triển khai migration, đọc [hướng dẫn Prisma](apps/backend/prisma/MIGRATIONS.md).
Không có seed script được triển khai trong repository, nên lệnh `db:seed` cũ trỏ
đến file không tồn tại đã được bỏ.

Repository không cung cấp tài khoản hay mật khẩu mặc định. Khi triển khai mới,
cần chuẩn bị tài khoản ban đầu, vai trò và quyền trong database qua quy trình
quản trị được kiểm soát.

## Các lệnh thường dùng

| Lệnh tại thư mục gốc | Chức năng |
| --- | --- |
| `npm run dev` | Chạy frontend :3000 và backend :3001; Ctrl+C dừng cả hai |
| `npm run dev:frontend` / `npm run dev:backend` | Chạy riêng một ứng dụng |
| `npm run build` | Build hai ứng dụng |
| `npm run build:frontend` / `npm run build:backend` | Build riêng |
| `npm start` | Chạy hai bản production đã build |
| `npm run start:frontend` / `npm run start:backend` | Khởi động riêng bản production |
| `npm run typecheck` | Sinh route types và kiểm tra TypeScript cho cả hai |
| `npm test` | Test backend và kiểm tra danh sách endpoint trước/sau tách |
| `npm run test:smoke` | Kiểm tra HTTP khi cả hai server đang chạy |
| `npm run lint` / `npm run lint:backend` | Lint toàn bộ / riêng backend |
| `npm run db:generate` | Sinh Prisma Client từ schema của backend |
| `npm run db:deploy` | Áp dụng migration lên database đã cấu hình |

Các script import dữ liệu nằm ở `apps/backend/scripts`. Chúng giữ nguyên hành vi
thay thế dữ liệu cũ; không được chạy tự động khi cài đặt, build hay test.

## Kết nối và triển khai

Trình duyệt gọi `/api/v1/...` trên domain frontend. `apps/frontend/proxy.ts`
chuyển request sang `BACKEND_URL` ở runtime, giữ query, body và cookie. Backend
trả JSON hoặc file trực tiếp. Không cần `NEXT_PUBLIC_API_URL` hay chia sẻ khóa
JWT cho frontend.

Frontend chỉ kiểm tra sự có mặt của cookie ở proxy; server layout xác minh phiên
qua `/api/v1/auth/me` trước khi render dashboard. Backend tiếp tục xác thực JWT,
kiểm tra quyền và giới hạn phạm vi dữ liệu trên các request API.

- Frontend: đặt `BACKEND_URL` thành origin backend mà server truy cập được,
  ví dụ `http://backend:3001`. Có thể thay đổi khi khởi động mà không build lại.
- Backend: đặt `DATABASE_URL`, `JWT_SECRET` và `ALLOWED_ORIGINS`, ví dụ
  `https://students.example.edu`. Origin phải khớp chính xác; danh sách phân cách
  bằng dấu phẩy. Không dùng `*`. Request ghi có Origin ngoài danh sách bị từ chối,
  kể cả login, refresh và logout. Client server-to-server không gửi Origin vẫn
  phải đáp ứng yêu cầu xác thực và phân quyền của API.
- Dùng HTTPS ở phía trình duyệt khi chạy production vì cookie có cờ Secure.
  Cho backend truy cập qua mạng nội bộ khi có thể. Mô hình hiện tại cho trình duyệt
  đi qua frontend; không bật CORS cho trình duyệt gọi backend khác domain trực tiếp.
- Có thể cài từ thư mục gốc bằng `npm ci`, sinh Prisma Client, build rồi chạy
  `npm run start:frontend` và `npm run start:backend` trên hai process/container.
  Chỉ đưa biến môi trường backend vào process/container backend.
- Lệnh chạy chung hỗ trợ `FRONTEND_PORT` và `BACKEND_PORT`; nếu đổi cổng, cập nhật
  `BACKEND_URL`, `ALLOWED_ORIGINS` tương ứng. Lệnh chạy riêng hỗ trợ ghi đè cổng
  bằng `npm run dev --workspace=@sms/frontend -- --port 3100` (backend tương tự).

## Kiểm chứng việc tách

`tests/fixtures/api-operations.json` của backend ghi lại danh sách phương thức và
đường dẫn từ Git HEAD trước khi di chuyển. Test kiểm tra không mất/thêm endpoint.
Test đối chiếu đặc tả SWE bên ngoài sẽ skip nếu file không có; đặt
`SWE_OPENAPI_PATH` để kiểm tra với đặc tả đó.

Smoke test kiểm tra trang đăng nhập, redirect dashboard, database health, request
ID, API proxy, origin và cả hai header Set-Cookie khi đăng xuất không có phiên.
Đặt `SMOKE_FRONTEND_URL` / `SMOKE_BACKEND_URL` nếu dùng cổng khác.
Đặt `SMOKE_ACCESS_TOKEN` của tài khoản test có quyền `student.read` để kiểm tra
thêm phiên đăng nhập, dashboard và kết quả API phân trang qua hai đường truy cập.
Token không được in ra. Smoke test không thay đổi dữ liệu nghiệp vụ.

Test hồi quy login/refresh dùng persistence giả lập và chạy các route handler,
JWT, cookie, phân quyền thật; không tạo tài khoản hoặc phiên trong database.
Trên Windows, dừng backend trước khi chạy `db:generate` nếu Prisma báo DLL đang
bị khóa (`EPERM`).

Lint frontend còn các lỗi trong mã giao diện có từ trước lần tách; không tắt các
quy tắc lint để che lỗi. Lint backend, test và build được kiểm tra riêng.

## Tài liệu liên quan

- [Kiến trúc và nghiệp vụ hệ thống](ARCHITECTURE.md).
- [Schema database](apps/backend/prisma/schema.prisma).
- [Hướng dẫn migration](apps/backend/prisma/MIGRATIONS.md).
- [Danh sách phương thức API](apps/backend/tests/fixtures/api-operations.json).
- [Mã Vite lưu trữ](legacy/vite/README.md).
