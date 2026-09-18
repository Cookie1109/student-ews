# Báo cáo hoàn thành giai đoạn 3

**Ngày cập nhật:** 19/09/2026

## Kết quả bàn giao

- Thêm `ExportService`, endpoint `GET /api/v1/reports/export` và quyền `report.export`.
- Xuất XLSX thật cho cảnh báo, tiến độ CTĐT, rèn luyện, nhật ký hỗ trợ.
- Xuất PDF tiếng Việt cho báo cáo cảnh báo và hồ sơ chi tiết sinh viên.
- Bổ sung loading/error state khi tải file, timeline hồ sơ hợp nhất và nút PDF hồ sơ.
- Ghi audit cho xuất file, hỗ trợ, thay đổi quyền/phân công và route xóa dữ liệu.
- Đồng bộ inventory API, seed RBAC, migration, smoke test và tài liệu người dùng.
- Lint frontend/backend và typecheck đều không còn lỗi.

## Kiểm thử

Test hồi quy kiểm tra hợp đồng route, auth/cookie/Origin, phân quyền, parse dữ liệu số, tiến độ, pending/forecast, biên ngưỡng GPA, thiếu GPA, phân loại/phê duyệt rèn luyện, state machine hỗ trợ, chọn kỳ báo cáo và chữ ký file XLSX/PDF.

Smoke test có thể kiểm tra rèn luyện bằng `SMOKE_STUDENT_ID` và export bằng `SMOKE_EXPORTS=1`. Chế độ export chỉ tạo thêm audit log, không đổi dữ liệu học vụ.

## Giới hạn đã biết

- PDF tổng hợp tập trung vào báo cáo cảnh báo; tiến độ/rèn luyện/hỗ trợ được xuất dưới dạng XLSX.
- Các export lớn đang tạo file trong bộ nhớ; cần chuyển sang job/stream nếu dữ liệu vượt quy mô đồ án.
- Tự chọn tổng quát “chọn N trong M” vẫn là giới hạn nghiệp vụ đã nêu từ giai đoạn trước.
