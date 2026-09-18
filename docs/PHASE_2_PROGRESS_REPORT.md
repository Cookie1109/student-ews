# Báo cáo hoàn thành Giai đoạn 2

**Ngày hoàn thành:** 16/09/2026
**Phạm vi hiện tại:** Rèn luyện, tiến độ đào tạo và dashboard học vụ

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

### Điều chỉnh phạm vi hoạt động

- Dự án không có nguồn dữ liệu chính thức về hoạt động sinh viên tham gia.
- Đã gỡ trang, API, quyền và dữ liệu seed liên quan đến tham gia hoạt động.
- Các bảng lịch sử được giữ lại để tránh migration xóa dữ liệu ngoài ý muốn, nhưng không còn được ứng dụng sử dụng.

### Dashboard đa nguồn

- Hiển thị song song GPA, cảnh báo, tiến độ, rèn luyện và dự báo tốt nghiệp đúng hạn.
- Thêm bộ lọc mức cảnh báo và trạng thái hỗ trợ.
- Thêm chuỗi GPA tối đa 8 học kỳ và biểu đồ phân bố rèn luyện.
- Hiển thị độ phủ dữ liệu rèn luyện và kết quả dự báo tốt nghiệp theo phạm vi đang chọn.

## 3. Database và kiểm thử

- Migration `20260916130000_retire_activity_participation_feature` loại bỏ các quyền hoạt động đã ngừng sử dụng nhưng không xóa bảng lịch sử.
- Policy mặc định v1 đã được kích hoạt với ngưỡng GPA học kỳ/tích lũy 2.0 và rèn luyện 50.
- Backend: typecheck, lint và 20 test đều đạt (19 pass, 1 skip do thiếu OpenAPI ngoài repository).
- Frontend: typecheck đạt. Lint toàn frontend vẫn còn lỗi tồn đọng đã được ghi trong Giai đoạn 3; file mới không thêm lỗi kiểu TypeScript.

## 4. Ghi chú dữ liệu hoạt động

Database không có nguồn hoạt động thực tế đủ tin cậy. Chức năng tham gia hoạt động và dữ liệu demo tương ứng đã được loại khỏi phạm vi sản phẩm. Dashboard không diễn giải dữ liệu thiếu thành tỷ lệ 0%.
