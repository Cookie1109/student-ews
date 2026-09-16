# Báo cáo hoàn thành Giai đoạn 2

**Ngày hoàn thành:** 16/09/2026
**Phạm vi:** Rèn luyện, hoạt động sinh viên và dashboard đa nguồn

## 1. Xác minh dữ liệu rèn luyện

- Database có **9.375** bản ghi `StudentConductRecord`.
- **2.744** bản ghi có `lastScore` từ 0–100 và đều có `statusId = "1"`.
- **6.631** bản ghi có `statusId = "0"`, chưa có điểm công nhận.
- Quy ước đã triển khai: `statusId = "1"` là **Đã công nhận**, `statusId = "0"` là **Chờ đánh giá**; chỉ `lastScore` của bản ghi đã công nhận được dùng để phân loại và cảnh báo.

## 2. Hạng mục đã triển khai

### Rèn luyện

- Phân loại S5: Xuất sắc, Tốt, Khá, Trung bình, Yếu, Kém.
- API danh sách và chi tiết theo học kỳ tại `/api/v1/students/{id}/conduct`.
- Tab Rèn luyện riêng trong hồ sơ sinh viên.
- Chính sách cảnh báo có `conductScoreThreshold`; mặc định 50/100.
- Phiên tính cảnh báo tạo reason `LOW_CONDUCT_SCORE`, liên kết đến bản ghi nguồn và lưu dữ liệu rèn luyện trong snapshot.

### Hoạt động

- Thêm `Activity`, `ActivityParticipation`, unique `(studentId, activityId)`, index và khóa ngoại bảo toàn lịch sử (`RESTRICT`).
- API danh sách/tạo/cập nhật hoạt động; ghi nhận và xác nhận tham gia.
- RBAC `activity.read` và `activity.manage`; các thao tác ghi có audit log.
- Trang `/activities` hỗ trợ tìm kiếm, lọc học kỳ/loại, ghi nhận tham gia và xác nhận hoàn thành.

### Dashboard đa nguồn

- Hiển thị song song GPA, cảnh báo, tiến độ, rèn luyện và hoạt động.
- Thêm bộ lọc mức cảnh báo và trạng thái hỗ trợ.
- Thêm chuỗi GPA tối đa 8 học kỳ và biểu đồ phân bố rèn luyện.
- Hiển thị độ phủ/thiếu dữ liệu rèn luyện và hoạt động theo phạm vi đang chọn.

## 3. Database và kiểm thử

- Migration: `20260916090000_phase2_conduct_activities` đã được áp dụng thành công.
- Policy mặc định v1 đã được kích hoạt với ngưỡng GPA học kỳ/tích lũy 2.0 và rèn luyện 50.
- Backend: typecheck, lint và 20 test đều đạt (19 pass, 1 skip do thiếu OpenAPI ngoài repository).
- Frontend: typecheck đạt. Lint toàn frontend vẫn còn lỗi tồn đọng đã được ghi trong Giai đoạn 3; file mới không thêm lỗi kiểu TypeScript.

## 4. Ghi chú dữ liệu hoạt động

Database hiện chưa có bản ghi hoạt động thực tế. Hệ thống đã cung cấp luồng nhập thủ công hoàn chỉnh; seed cho môi trường demo cũng đã có một hoạt động và dữ liệu tham gia mẫu. Không tự động chèn dữ liệu giả vào database hiện tại.
