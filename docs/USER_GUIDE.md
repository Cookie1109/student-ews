# Hướng dẫn sử dụng SEWS

## 1. Đăng nhập và phạm vi dữ liệu

Đăng nhập tại `/login`. Dữ liệu hiển thị phụ thuộc role và phạm vi được phân:

- Ban chủ nhiệm/quản trị có thể xem toàn hệ thống hoặc toàn khoa.
- Cố vấn học tập chỉ xem các lớp đã được phân công.
- Nút tạo/cập nhật hỗ trợ và xuất báo cáo chỉ xuất hiện khi tài khoản có quyền tương ứng.

Nếu một sinh viên hoặc báo cáo nằm ngoài phạm vi, hệ thống trả `404` để không làm lộ sự tồn tại của hồ sơ.

## 2. Theo dõi dashboard và báo cáo

Tại **Tổng quan**, chọn năm học, học kỳ, chương trình, lớp, mức cảnh báo hoặc trạng thái hỗ trợ. Mỗi chỉ số ghi rõ kỳ/cutoff và hiển thị “chưa có dữ liệu” thay vì suy diễn thành 0%.

Tại **Báo cáo**:

1. Chọn loại dữ liệu: cảnh báo, tiến độ CTĐT, rèn luyện hoặc nhật ký hỗ trợ.
2. Chọn **Xuất Excel (.xlsx)** để tải workbook.
3. Chọn **Xuất PDF tổng hợp** để tải báo cáo cảnh báo dành cho ban chủ nhiệm khoa.
4. Trong biểu đồ/lớp, bấm vào nhóm để mở danh sách sinh viên chi tiết.

Xám nghĩa là chưa đủ dữ liệu kỳ; Xanh nghĩa là đủ dữ liệu và không vi phạm điều kiện hiện tại. Đỏ/Vàng là mức theo dõi nội bộ, không thay thế quyết định chính thức của trường.

## 3. Hồ sơ sinh viên

Từ danh sách sinh viên, mở một hồ sơ để xem:

- tổng quan GPA, tín chỉ và tiến độ;
- kết quả rèn luyện tạm thời/công nhận;
- điểm học phần, quyết định, chính sách học phí và đăng ký;
- tiến độ CTĐT, nguyên nhân cảnh báo và nhật ký hỗ trợ;
- timeline hợp nhất cảnh báo, quyết định và hỗ trợ.

Chọn **Xuất PDF hồ sơ** để tạo bản tổng hợp đầy đủ. File luôn được tạo ở backend theo đúng data scope của tài khoản.

## 4. Ghi nhận và xử lý hỗ trợ

Trong tab **Cảnh báo học vụ**, chọn **Ghi nhận can thiệp mới**, nhập loại hành động và nội dung. Quy trình trạng thái hợp lệ:

`OPEN → IN_PROGRESS → RESOLVED`, có thể chuyển `ESCALATED`; hồ sơ đã giải quyết có thể `REOPENED` rồi quay lại xử lý.

`RESOLVED` chỉ có nghĩa hồ sơ hỗ trợ đã hoàn tất, không đồng nghĩa sinh viên hết nguy cơ. Mọi lần tạo/cập nhật đều lưu người thao tác và lịch sử trạng thái.

## 5. Quản trị và vận hành

- Quản trị viên phân role, permission và lớp cố vấn tại **RBAC**.
- Quyền `report.export` cho phép tải báo cáo nhưng vẫn chịu giới hạn phạm vi dữ liệu.
- Thay đổi quyền, phân công, xóa dữ liệu, ghi hỗ trợ và xuất file đều được ghi audit.
- Khi dữ liệu nguồn thay đổi, tạo đợt đánh giá mới; không sửa lịch sử run đã hoàn tất.

## 6. Xử lý sự cố thường gặp

- **Không thấy nút xuất:** tài khoản chưa có `report.export`; nhờ quản trị cấp quyền rồi đăng nhập lại để nhận token mới.
- **File trống:** kiểm tra kỳ, lớp/CTĐT và data scope; dữ liệu có thể chưa có run hoàn tất.
- **Không chuyển được trạng thái hỗ trợ:** tải lại hồ sơ và chọn đúng bước chuyển hợp lệ.
- **Xám/chưa đủ dữ liệu:** kiểm tra tổng hợp GPA của kỳ; không được coi trạng thái này là an toàn.
