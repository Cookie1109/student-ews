# Báo cáo tiến độ giai đoạn 1

**Thời điểm hoàn thành:** 15/09/2026  
**Phạm vi:** Chuẩn hóa nền tảng SEWS theo `PROJECT_COMPLETION_PLAN.md`

## Kết quả

- `AcademicWarningRun` lưu snapshot đầu vào phiên bản 1, SHA-256 và thời điểm chụp. Snapshot gồm phạm vi, policy, run tiến độ/hoàn thành, GPA/tổng hợp kỳ và quyết định của từng sinh viên.
- Reason `LOW_TERM_GPA` và `LOW_CUMULATIVE_GPA` liên kết tới bản tổng hợp nguồn cụ thể qua `sourceId`.
- Báo cáo không còn fallback GPA 2,0 trong mã. Hệ thống yêu cầu policy active có phiên bản; thao tác kích hoạt được gắn người thực hiện và audit.
- Dashboard dùng đúng kỳ được lọc. Khi không lọc, các khối được neo vào kỳ báo cáo gần nhất đủ 80% độ phủ GPA học kỳ và hiển thị mode/kỳ/policy/run/cutoff riêng.
- Nhật ký hỗ trợ có trạng thái `OPEN`, `IN_PROGRESS`, `RESOLVED`, `ESCALATED`, `REOPENED`; backend chặn chuyển trạng thái sai, lưu lịch sử, phân công, hạn xử lý, thời điểm hoàn tất và audit.
- Quyền tạo/cập nhật nhật ký được tách khỏi quyền đọc.
- Seed tạo RBAC, tài khoản quản trị/cố vấn, policy và bộ dữ liệu demo gồm khóa, lớp, CTĐT, ba sinh viên, GPA và các snapshot tiến độ/cảnh báo.

## API bổ sung

| Phương thức | Đường dẫn | Quyền | Mục đích |
| --- | --- | --- | --- |
| `PATCH` / `PUT` | `/api/v1/academic-warnings/actions/{id}` | `academic_warning.action.update` | Chuyển trạng thái, phân công, hạn xử lý hoặc cập nhật ghi chú |
| `POST` | `/api/v1/academic-warnings/actions` | `academic_warning.action.create` | Tạo hồ sơ hỗ trợ |

## Luồng demo

1. Chạy `npm run db:deploy` rồi `npm run db:seed` trên database demo.
2. Đăng nhập `admin` / `Admin@123456` hoặc tài khoản được ghi đè trong `.env`.
3. Mở Dashboard để kiểm tra ba thẻ nguồn dữ liệu GPA, cảnh báo live và tiến độ theo run.
4. Mở Cảnh báo học vụ, chọn một run và sinh viên; tạo nhật ký rồi chuyển trạng thái theo các nút hợp lệ.
5. Kiểm tra run detail để xem `sourceSnapshot`, `sourceSnapshotHash`, `sourceCapturedAt` và `sourceId` của reason GPA.

> Tài khoản/mật khẩu mặc định chỉ dành cho demo cục bộ. Triển khai thật phải ghi đè biến `SEED_*_PASSWORD` và đổi mật khẩu sau lần đăng nhập đầu.

## Kiểm chứng mã nguồn

- Prisma schema hợp lệ.
- Typecheck backend và frontend đạt.
- Production build backend và frontend đạt.
- Backend lint đạt.
- 18 test backend: 17 đạt, 1 bỏ qua vì đặc tả SWE bên ngoài không có trong workspace.
- Frontend vẫn còn các lỗi lint tồn đọng đã được ghi nhận từ trước; các file thay đổi đã qua typecheck.
