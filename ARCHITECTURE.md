# Hệ thống Cảnh báo Sớm Học vụ (SEWS)

> **Dự án:** Xây dựng hệ thống cảnh báo sớm sinh viên cần theo dõi dựa trên dữ liệu học tập (tín chỉ, kết quả học phần, chương trình đào tạo)
> **Chủ đầu tư:** Ban Công tác Sinh viên — Trường Đại học Đà Lạt (DLU)
> **Nhóm phát triển:** Đinh Thị Mai Lành · Trương Võ Trọng Nhân · Võ Thị Minh Ân (CTK47A)
> **GVHD:** Ks. Nguyễn Trọng Hiếu
> **Phiên bản tài liệu:** 3.0 · Cập nhật: 08/2026

### 📌 Thay đổi chính so với bản 2.0

| # | Thay đổi | Lý do |
|---|---|---|
| 1 | Giảm từ **4 mức** (Xanh/Vàng/Cam/Đỏ) xuống còn **3 mức** (Xanh/Vàng/Đỏ) | Mức Cam và Đỏ có bản chất tương tự nhau, gộp lại giúp quy trình xử lý gọn hơn |
| 2 | Thiết kế lại toàn bộ **CSDL (mục 10)** để khớp đúng với ERD thực tế của dự án (19 bảng: `student`, `course_result`, `warning_rule`, `student_warning`...) | Bản 2.0 dùng schema giả định (ARI liên tục, `academic_records`, `conduct_scores`...) chưa khớp với thiết kế thật |
| 3 | Chuyển từ công thức **ARI liên tục** (α·R_Acad + β·R_Train + γ·R_Behav) sang **Rule Engine rời rạc** dựa trên bảng `warning_rule` | Khớp với thiết kế CSDL thực tế: mỗi rule có `threshold` và `severity` riêng, không phải một điểm số tổng hợp |
| 4 | Gộp `interventions` + `appointments` thành một bảng duy nhất **`warning_action`** | ERD thực tế chỉ có 1 bảng ghi hành động xử lý, không tách riêng |
| 5 | Cập nhật **Actor & RBAC (mục 1.4, 13)** theo đúng bảng "Đối tượng sử dụng" của dự án (Ban chủ nhiệm Khoa, GVCN/CVHT, Giáo vụ Khoa, Trợ lý CTSV, Trợ lý Truyền thông, Quản trị hệ thống) | Bản 2.0 dùng vai trò chung chung, chưa khớp danh sách actor thật |
| 6 | Tạm loại **điểm rèn luyện (RLT)** và **hoạt động phong trào** khỏi phạm vi tính cảnh báo | CSDL hiện tại không có bảng `conduct_scores` / `activity_participations` — xem ADR-013 |

---

## Mục lục

1. [Tổng quan & Bối cảnh nghiệp vụ](#1-tổng-quan--bối-cảnh-nghiệp-vụ)
2. [Quy trình nghiệp vụ của Cán bộ Ban CTSV](#2-quy-trình-nghiệp-vụ-của-cán-bộ-ban-ctsv)
3. [Yêu cầu chức năng bắt buộc (Core Features)](#3-yêu-cầu-chức-năng-bắt-buộc-core-features)
4. [Yêu cầu chức năng nâng cao (Advanced Features)](#4-yêu-cầu-chức-năng-nâng-cao-advanced-features)
5. [Kiến trúc tổng thể hệ thống](#5-kiến-trúc-tổng-thể-hệ-thống)
6. [Các nguồn dữ liệu & Tích hợp](#6-các-nguồn-dữ-liệu--tích-hợp)
7. [Lõi nghiệp vụ: Rule Engine tính cảnh báo](#7-lõi-nghiệp-vụ-rule-engine-tính-cảnh-báo)
8. [Phân loại cảnh báo theo 3 mức màu](#8-phân-loại-cảnh-báo-theo-3-mức-màu)
9. [Vòng đời xử lý cảnh báo — Finite State Machine](#9-vòng-đời-xử-lý-cảnh-báo--finite-state-machine)
10. [Thiết kế cơ sở dữ liệu](#10-thiết-kế-cơ-sở-dữ-liệu)
11. [Kiến trúc API](#11-kiến-trúc-api)
12. [Kiến trúc Frontend (Dashboard)](#12-kiến-trúc-frontend-dashboard)
13. [Bảo mật & Phân quyền (RBAC)](#13-bảo-mật--phân-quyền-rbac)
14. [Technology Stack](#14-technology-stack)
15. [Kế hoạch phát triển & Milestones](#15-kế-hoạch-phát-triển--milestones)
16. [Architectural Decision Records (ADRs)](#16-architectural-decision-records-adrs)

---

## 1. Tổng quan & Bối cảnh nghiệp vụ

### 1.1 Vai trò người dùng chính

Hệ thống SEWS phục vụ **Ban chủ nhiệm Khoa, Giảng viên chủ nhiệm/Cố vấn học tập, Giáo vụ Khoa, và Trợ lý Ban Công tác Sinh viên** tại Trường Đại học Đà Lạt, là những người chịu trách nhiệm:

- Tiếp nhận, rà soát và phân loại sinh viên có dấu hiệu cần theo dõi về học tập
- Tìm hiểu nguyên nhân (thiếu tín chỉ, nợ tín chỉ, GPA thấp, rớt môn), tổ chức gặp gỡ, tư vấn và đề xuất hỗ trợ
- Phối hợp giữa Khoa và Ban CTSV để cùng theo dõi một sinh viên
- Tổng hợp số liệu, báo cáo theo lớp/khóa/học kỳ cho Ban chủ nhiệm Khoa và lãnh đạo

### 1.2 Tuyên ngôn bài toán

Khoa và Ban CTSV hiện phải **tra cứu thủ công** kết quả học tập của từng sinh viên (điểm học phần, số tín chỉ đã tích lũy, đối chiếu với chương trình đào tạo) để phát hiện sinh viên có nguy cơ. Quy trình này chậm, dễ bỏ sót, và chỉ phát hiện được rủi ro **sau khi** học kỳ kết thúc — khi đã quá muộn để can thiệp.

**SEWS** (Student Early Warning System) giải quyết bài toán này bằng cách **tự động hóa toàn bộ chu trình**: đồng bộ dữ liệu học tập → đối chiếu với các quy tắc cảnh báo (`warning_rule`) → phát hiện vi phạm ngưỡng → phân loại theo 3 mức màu → thông báo → theo dõi xử lý (`warning_action`) → đánh giá kết quả, chạy xuyên suốt học kỳ.

### 1.3 Triết lý thiết kế cốt lõi

> *"Công nghệ không phải để kiểm soát người học, mà để thấu hiểu và đồng hành sớm."*

| Nguyên tắc | Biểu hiện trong thiết kế |
|---|---|
| **Phòng ngừa trước, xử phạt sau** | Cảnh báo Vàng kích hoạt ngay khi phát hiện thiếu tín chỉ hoặc nợ tín chỉ nhẹ — không đợi đến khi đủ điều kiện cảnh báo học vụ chính thức (GPA thấp) |
| **Giải thích được (Explainable)** | Mỗi cảnh báo (`student_warning`) đi kèm `reason`, `actual_value`, `expected_value` và tham chiếu đúng `warning_rule` đã kích hoạt |
| **Cấu hình được, không hard-code** | Toàn bộ ngưỡng cảnh báo lưu trong bảng `warning_rule` (`threshold`, `severity`, `is_active`) — Admin chỉnh qua UI |
| **Quy trình vòng kín (Closed-loop)** | Mỗi `student_warning` được theo dõi qua các `warning_action` cho đến khi `RESOLVED` hoặc `ESCALATED`, không chỉ phát cảnh báo rồi thôi |
| **Đơn giản, đúng phạm vi dữ liệu sẵn có** | Chỉ tính cảnh báo trên dữ liệu học tập (tín chỉ, kết quả học phần) — không suy diễn từ dữ liệu chưa có trong CSDL (rèn luyện, hoạt động phong trào) |

### 1.4 Các actor trong hệ thống

> Bảng dưới đây khớp với bảng "Đối tượng sử dụng" của dự án.

| Actor | Nhu cầu sử dụng chính |
|---|---|
| **Ban chủ nhiệm Khoa** | Xem dashboard tổng quan, báo cáo, cảnh báo, thống kê theo lớp/khóa/học kỳ |
| **Giảng viên Chủ nhiệm / Cố vấn học tập (GVCN/CVHT)** | Xem lớp phụ trách (`class_advisor`), sinh viên, bảng điểm (`course_result`), CTĐT (`curriculum_course`, `training_plan`), cảnh báo học tập, đăng ký học phần (`course_registration`) |
| **Giáo vụ / Chuyên viên Khoa** | Xem dashboard sinh viên, xuất báo cáo chi tiết sinh viên để phản hồi phụ huynh |
| **Trợ lý Công tác sinh viên** | Theo dõi hồ sơ, cảnh báo (`student_warning`) và danh sách sinh viên cần xử lý; ghi nhận hành động xử lý (`warning_action`) |
| **Trợ lý Truyền thông** | Xem số liệu thống kê tổng hợp, xu hướng và báo cáo đã được phân quyền |
| **Quản trị hệ thống / nội bộ** | Quản lý phân quyền (`role`, `user_role`), tham số cảnh báo (`warning_rule`), kế hoạch học phần nội bộ (`training_plan`, `training_plan_course`) |
| **Hệ thống nguồn** | Cổng Đào tạo — cung cấp dữ liệu sinh viên, chương trình đào tạo, đăng ký & kết quả học phần |

> **Lưu ý phạm vi:** Điểm rèn luyện, kỷ luật và hoạt động Đoàn — Hội **không nằm trong CSDL hiện tại** nên chưa được tính vào cảnh báo, dù bảng nhu cầu sử dụng có nhắc đến "điểm rèn luyện". Xem ADR-013 để biết hướng bổ sung khi có nguồn dữ liệu.

---

## 2. Quy trình nghiệp vụ của Cán bộ Ban CTSV / Khoa

> Phần này mô tả **tuần tự các bước thực tế** khi hệ thống báo có sinh viên cần theo dõi. Đây là nền tảng để thiết kế toàn bộ luồng chức năng của hệ thống.

### 2.1 Sơ đồ quy trình tổng quan

```
┌─────────────────────────────────────────────────────────────────────────┐
│              QUY TRÌNH XỬ LÝ CẢNH BÁO SINH VIÊN                        │
│              (Khoa / Ban Công tác Sinh viên — DLU)                      │
└─────────────────────────────────────────────────────────────────────────┘

  ❶ Hệ thống báo có sinh viên cần theo dõi (Rule Engine phát hiện vi phạm)
     │
     ▼
  ❷ Xem danh sách cảnh báo ──→ Ưu tiên mức Đỏ trước, sau đó Vàng
     │
     ▼
  ❸ Xem kỹ hồ sơ từng sinh viên
     │  ├─ Kết quả học tập các kỳ gần đây (course_result)
     │  └─ Tiến độ tín chỉ theo CTĐT (curriculum_course, training_plan_course)
     │
     ▼
  ❹ Xác định nguyên nhân cảnh báo (rule nào đã kích hoạt)
     │  ├─ Thiếu tín chỉ so với CTĐT?
     │  ├─ Nợ tín chỉ nhẹ (vài học phần rớt)?
     │  ├─ GPA thấp?
     │  └─ Rớt môn nhiều?
     │
     ▼
  ❺ Phân nhóm sinh viên theo nguyên nhân
     │  (Nhóm thiếu/nợ tín chỉ nhẹ = Vàng ≠ Nhóm GPA thấp/rớt nhiều = Đỏ)
     │
     ▼
  ❻ Liên hệ sinh viên ──→ Email / Tin nhắn / Điện thoại
     │                      → Mời gặp trực tiếp
     │
     ▼
  ❼ Gặp trực tiếp sinh viên
     │  ├─ Trao đổi, tìm hiểu hoàn cảnh & khó khăn
     │  └─ Ghi lại nội dung buổi gặp vào hệ thống (warning_action)
     │
     ▼
  ❽ Đề xuất hướng hỗ trợ cụ thể
     │  ├─ Học lại / Phụ đạo thêm
     │  ├─ Tư vấn đăng ký học phần lại theo lộ trình
     │  └─ Giảm bớt khối lượng học
     │
     ▼
  ❾ Phối hợp các bên liên quan
     │  ├─ Thông báo → Giảng viên chủ nhiệm/CVHT (qua class_advisor)
     │  └─ Thông báo → Ban chủ nhiệm Khoa (nếu mức Đỏ)
     │
     ▼
  ❿ Theo dõi tiếp các kỳ sau
     │  ├─ Cập nhật trạng thái xử lý (student_warning.status)
     │  │
     │  ├─ CÓ cải thiện ──→ RESOLVED ("Đã ổn")
     │  │
     │  └─ KHÔNG cải thiện ──→ ESCALATED ("Báo cấp trên")
     │                          (Ban chủ nhiệm Khoa / Lãnh đạo)
     │
     ▼
  ⓫ Cuối kỳ / Cuối năm
     └─ Tổng hợp số liệu → Làm báo cáo → Gửi lên trên
```

### 2.2 Mô tả chi tiết từng bước

| Bước | Hành động | Hệ thống hỗ trợ |
|:---:|---|---|
| **❶** | Nhận thông báo từ hệ thống về sinh viên cần theo dõi | Dashboard hiển thị cảnh báo mới, thông báo qua email |
| **❷** | Vào hệ thống xem danh sách sinh viên bị đưa vào diện cảnh báo, ưu tiên xem những em ở mức Đỏ trước | Danh sách sắp xếp theo mức độ nghiêm trọng (Đỏ → Vàng) |
| **❸** | Xem kỹ hồ sơ từng em: kết quả học tập các kỳ gần đây, tiến độ tín chỉ theo CTĐT | Trang chi tiết sinh viên với lịch sử kết quả học phần, biểu đồ tiến độ |
| **❹** | Xác định rõ nguyên nhân bị cảnh báo: thiếu tín chỉ, nợ tín chỉ, học yếu, rớt môn nhiều, hay kết hợp | Hệ thống tự xác định rule nào đã kích hoạt (F-09) |
| **❺** | Xếp các em vào từng nhóm theo nguyên nhân để dễ có cách hỗ trợ phù hợp | Bộ lọc theo `warning_type`, gắn nhãn tự động |
| **❻** | Liên hệ sinh viên qua email, tin nhắn hoặc điện thoại để mời lên gặp trực tiếp | Gửi thông báo trực tiếp trong hệ thống |
| **❼** | Gặp trực tiếp sinh viên, trao đổi tìm hiểu hoàn cảnh, khó khăn, ghi lại nội dung buổi gặp vào hệ thống | Form ghi `warning_action`, lưu hồ sơ lịch sử |
| **❽** | Đề xuất hướng hỗ trợ cụ thể: học lại, phụ đạo, giảm tải | Ghi nhận vào `warning_action.note`, theo dõi kết quả |
| **❾** | Thông báo và phối hợp với GVCN/CVHT của lớp (qua `class_advisor`) hoặc Ban chủ nhiệm Khoa | Thông báo tự động đến các bên liên quan khi có cập nhật |
| **❿** | Theo dõi tiếp trong các kỳ sau xem tình hình có cải thiện không, cập nhật lại `status`. Nếu không cải thiện → báo Ban chủ nhiệm Khoa | Trạng thái xử lý cập nhật liên tục, cảnh báo leo thang |
| **⓫** | Cuối kỳ/cuối năm tổng hợp số liệu, làm báo cáo gửi lên trên về tình hình chung | Xuất báo cáo theo kỳ, theo khoa, theo rule |

---

## 3. Yêu cầu chức năng bắt buộc (Core Features)

> Đây là các chức năng **bắt buộc phải có** để phục vụ quy trình nghiệp vụ tại mục 2.

### 3.1 Quản lý danh sách cảnh báo

| ID | Chức năng | Mô tả chi tiết | Mapping quy trình |
|---|---|---|---|
| **F-01** | Danh sách sinh viên đang bị cảnh báo | Hiển thị toàn bộ sinh viên có `student_warning` đang mở (status ≠ CLOSED), có phân trang | Bước ❷ |
| **F-02** | Sắp xếp đa tiêu chí | Sắp xếp theo mức độ nghiêm trọng (**Đỏ → Vàng**), theo khoa, theo lớp, theo khóa | Bước ❷ |
| **F-03** | Tìm kiếm nhanh | Tìm theo tên, mã số sinh viên (`student_code`), lớp, khoa — kết quả hiển thị tức thì | Bước ❷ |
| **F-04** | Bộ lọc nâng cao | Lọc kết hợp: mức cảnh báo (Đỏ/Vàng) + khoa + lớp + khóa + trạng thái xử lý + rule | Bước ❷ ❺ |

### 3.2 Hồ sơ chi tiết sinh viên

| ID | Chức năng | Mô tả chi tiết | Mapping quy trình |
|---|---|---|---|
| **F-05** | Xem điểm học tập | GPA học kỳ, GPA tích lũy (tính từ `course_result` × `course.credits`), số tín chỉ nợ | Bước ❸ |
| **F-06** | Xem tiến độ theo CTĐT | Đối chiếu `curriculum_course` / `training_plan_course` với `course_result` để xác định số tín chỉ đã tích lũy so với kế hoạch đào tạo (`academic_program`) | Bước ❸ |
| **F-07** | Xem lịch sử đăng ký học phần | Toàn bộ `course_registration` qua các kỳ: học phần đã đăng ký, loại đăng ký, trạng thái | Bước ❸ |
| **F-08** | Lịch sử cảnh báo | Toàn bộ `student_warning` trước đó (nếu có), kèm `warning_action` và kết quả xử lý | Bước ❸ |
| **F-09** | Phân tích nguyên nhân tự động | Hệ thống tự xác định `warning_rule` nào đã kích hoạt: thiếu tín chỉ, nợ tín chỉ nhẹ, GPA thấp, rớt môn nhiều | Bước ❹ |

### 3.3 Ghi nhận xử lý & Hỗ trợ

| ID | Chức năng | Mô tả chi tiết | Mapping quy trình |
|---|---|---|---|
| **F-10** | Ghi nhận hành động xử lý | Ghi một dòng `warning_action` (loại hành động, ngày, ghi chú) cho mỗi lần liên hệ/gặp sinh viên | Bước ❼ |
| **F-11** | Ghi nhận phương án hỗ trợ | Lưu hướng hỗ trợ đã đề xuất trong `warning_action.note` (học lại/phụ đạo/giảm tải...) | Bước ❽ |
| **F-12** | Lịch sử xử lý đầy đủ | Xem lại toàn bộ `warning_action` theo `warning_id`: ai đã xử lý, ngày nào, nội dung gì | Bước ❼ ❽ ❿ |

### 3.4 Liên lạc & Thông báo

| ID | Chức năng | Mô tả chi tiết | Mapping quy trình |
|---|---|---|---|
| **F-13** | Gửi thông báo trong hệ thống | Gửi email đến sinh viên ngay trong hệ thống; mỗi lần gửi được ghi lại thành một `warning_action` (action_type = `NOTIFY_STUDENT`) | Bước ❻ |
| **F-14** | Thông báo tự động đến GVCN/CVHT | Khi `student_warning` được tạo hoặc cập nhật, GVCN/CVHT của lớp (tra theo `class_advisor`) nhận được thông báo | Bước ❾ |

### 3.5 Quản lý trạng thái xử lý

| ID | Chức năng | Mô tả chi tiết | Mapping quy trình |
|---|---|---|---|
| **F-15** | Cập nhật trạng thái xử lý | Chuyển `student_warning.status`: **OPEN → IN_PROGRESS → RESOLVED / ESCALATED → CLOSED** | Bước ❿ |
| **F-16** | Cơ chế leo thang (Escalation) | Cảnh báo Đỏ không cải thiện sau thời gian quy định → tự động chuyển `ESCALATED`, hỗ trợ báo cáo lên Ban chủ nhiệm Khoa | Bước ❿ |

### 3.6 Báo cáo & Xuất dữ liệu

| ID | Chức năng | Mô tả chi tiết | Mapping quy trình |
|---|---|---|---|
| **F-17** | Xuất báo cáo tổng hợp | Xuất số liệu theo kỳ, theo khoa, theo `warning_rule` — định dạng Excel/PDF | Bước ⓫ |
| **F-18** | Thống kê tổng quan (Dashboard) | Bảng tổng quan nhanh: số lượng sinh viên mỗi mức (Xanh/Vàng/Đỏ), tỷ lệ đã xử lý, tỷ lệ cải thiện | Bước ⓫ |

### 3.7 Phân quyền & Bảo mật

| ID | Chức năng | Mô tả chi tiết | Mapping quy trình |
|---|---|---|---|
| **F-19** | Phân quyền theo phạm vi | GVCN/CVHT chỉ xem sinh viên thuộc lớp mình phụ trách (`class_advisor`); Ban chủ nhiệm Khoa xem theo `faculty_id` | Toàn quy trình |
| **F-20** | Bảo mật thông tin sinh viên | Chỉ người có vai trò phù hợp (`role`, `user_role`) mới xem được; mã hóa dữ liệu nhạy cảm khi lưu trữ | Toàn quy trình |

---

## 4. Yêu cầu chức năng nâng cao (Advanced Features)

> Các chức năng **không bắt buộc nhưng sẽ rất hữu ích**, giúp nâng cao hiệu quả công việc.

### 4.1 Phân tích & Trực quan hóa

| ID | Chức năng | Mô tả chi tiết | Giá trị mang lại |
|---|---|---|---|
| **A-01** | Biểu đồ xu hướng học tập | Biểu đồ GPA theo từng kỳ, tính trực tiếp từ `course_result` nhóm theo `semester_id` (không cần bảng snapshot riêng) | Đánh giá nhanh tiến trình cải thiện |
| **A-02** | So sánh số liệu giữa các khóa/năm | So sánh tỷ lệ cảnh báo giữa các `cohort` (khóa), các năm học | Đánh giá hiệu quả tổng thể |

### 4.2 Gợi ý thông minh & Ưu tiên

| ID | Chức năng | Mô tả chi tiết | Giá trị mang lại |
|---|---|---|---|
| **A-03** | Gợi ý mức độ ưu tiên | Sinh viên có nhiều `student_warning` cùng lúc, hoặc bị cảnh báo Đỏ nhiều kỳ liên tiếp → đưa lên đầu danh sách | Không bỏ sót trường hợp nghiêm trọng |
| **A-04** | Đánh giá hiệu quả xử lý | So sánh tỷ lệ `student_warning` chuyển sang `RESOLVED` theo từng loại `warning_action.action_type` đã áp dụng | Tối ưu chiến lược hỗ trợ theo thời gian |
| **A-05** | Xem lại lịch sử hỗ trợ | Xem lại những lần trước đã hỗ trợ sinh viên đó bằng hành động gì, kết quả ra sao (dựa trên `warning_action`) | Tránh lặp lại phương án thất bại |

### 4.3 Phối hợp

| ID | Chức năng | Mô tả chi tiết | Giá trị mang lại |
|---|---|---|---|
| **A-06** | Thông báo đồng thời đến GVCN/CVHT | Tra `class_advisor` theo lớp của sinh viên để gửi thông báo đồng thời với người xử lý chính | Phối hợp kịp thời |
| **A-07** | Ghi lịch hẹn/gặp gỡ dạng hành động | Vì CSDL hiện tại chỉ có `warning_action` (không có bảng lịch hẹn riêng), việc "đặt lịch" được ghi như một `warning_action` với `action_type = SCHEDULE_MEETING`, không có nhắc lịch tự động ở phiên bản này | Đơn giản, đúng với dữ liệu sẵn có |
| **A-08** | Ghi nhận sinh viên có đến gặp | Ghi bằng một `warning_action` tiếp theo với `action_type = MEETING_ATTENDED` hoặc `MEETING_NO_SHOW` | Theo dõi mức độ hợp tác của sinh viên |

> **Lưu ý:** So với bản 2.0, A-07/A-08 không còn dùng bảng `appointments` riêng (có `reminder_sent`, `scheduled_at`...) vì ERD thực tế không có bảng này — toàn bộ được gộp vào `warning_action`. Nếu Khoa cần tính năng nhắc lịch tự động, cần bổ sung bảng riêng ở giai đoạn sau (xem ADR-014).

---

## 5. Kiến trúc tổng thể hệ thống

### 5.1 Ngữ cảnh hệ thống (System Context)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TRƯỜNG ĐẠI HỌC ĐÀ LẠT                          │
│                                                                             │
│                    ┌──────────────────────────┐                           │
│                    │      CỔNG ĐÀO TẠO       │                           │
│                    │   (Phòng Quản lý ĐT)     │                           │
│                    │                          │                           │
│                    │ • Hồ sơ SV / Lớp / Khóa  │                           │
│                    │ • Chương trình đào tạo   │                           │
│                    │ • Đăng ký & Kết quả HP   │                           │
│                    └────────────┬─────────────┘                           │
│                                 │                                          │
│                    ┌────────────▼────────────┐                            │
│                    │     ████████████         │                           │
│                    │     █  S E W S  █         │                           │
│                    │     ████████████         │                           │
│                    │  Student Early Warning  │                            │
│                    │        System           │                            │
│                    └────┬──────────┬─────────┘                            │
│                         │          │                                       │
│             ┌───────────┘          └──────────────────┐                   │
│             ▼                                         ▼                   │
│  ┌──────────────────────┐              ┌─────────────────────────────┐    │
│  │    WEB DASHBOARD     │              │        THÔNG BÁO            │    │
│  │                      │              │                             │    │
│  │ • Ban CN Khoa        │              │ 📧 Email → SV / GVCN/CVHT  │    │
│  │ • GVCN / CVHT        │              │ 🔔 Trong hệ thống           │    │
│  │ • Giáo vụ Khoa       │              │                             │    │
│  │ • Trợ lý CTSV        │              └─────────────────────────────┘    │
│  │ • Trợ lý Truyền thông│                                                 │
│  └──────────────────────┘                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Ranh giới hệ thống (System Boundary)

SEWS **KHÔNG** thay thế Cổng Đào tạo. SEWS chỉ:
- **Đọc (read-only)** dữ liệu sinh viên, CTĐT, đăng ký & kết quả học phần từ Cổng Đào tạo
- **Ghi** kết quả cảnh báo (`student_warning`) và lịch sử xử lý (`warning_action`) vào database riêng của SEWS
- **Gửi** thông báo ra ngoài qua Notification Service

### 5.3 Kiến trúc phân tầng

SEWS áp dụng kiến trúc **Layered Monolith** với ranh giới module rõ ràng, phù hợp với quy mô nhóm 3 người và có thể tách thành microservices khi cần mở rộng.

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│    ┌─────────────────────┐                                  │
│    │   Web Dashboard     │                                  │
│    │   (React + Charts)  │                                  │
│    └──────────┬──────────┘                                  │
└───────────────┼───────────────────────────────────────────────┘
                │           REST API / WS
┌───────────────┼───────────────────────────────────────────────┐
│               │      API GATEWAY LAYER                       │
│               │   (Express.js Router)                        │
│               │   • Auth Middleware (JWT)                     │
│               │   • Rate Limiting / Request Validation        │
│               └────────────┬──────────────────────────────────┘
└────────────────────────────┼──────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│              APPLICATION / DOMAIN LAYER                        │
│                            │                                   │
│  ┌─────────────┐  ┌────────┴──────┐  ┌──────────────────┐     │
│  │  Integration│  │  Rule Engine  │  │  Warning         │     │
│  │  Service    │  │  (Warning     │  │  Lifecycle       │     │
│  │  (ETL)      │  │  Engine)      │  │  Manager (FSM)   │     │
│  └─────────────┘  │ • Evaluate    │  └──────────────────┘     │
│                   │   warning_rule│                            │
│  ┌─────────────┐  │ • Tính GPA/   │  ┌──────────────────┐     │
│  │ Warning     │  │   tín chỉ từ  │  │  Scheduler       │     │
│  │ Action      │  │   course_result│  │  (Cron Jobs)     │     │
│  │ Manager     │  └───────────────┘  │  • Weekly scan   │     │
│  └─────────────┘                     │  • End-of-term   │     │
│                   ┌───────────────┐  └──────────────────┘     │
│  ┌─────────────┐  │  Report       │                            │
│  │Notification │  │  Generator    │                            │
│  │  Service    │  └───────────────┘                            │
│  └─────────────┘                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│              INFRASTRUCTURE / DATA LAYER                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  PostgreSQL  │  │  Redis Cache │  │  Message Queue   │   │
│  │  (Primary DB)│  │  (dashboard  │  │  (Email queue)   │   │
│  │              │  │   cache,     │  └──────────────────┘   │
│  │              │  │   sessions)  │                          │
│  └──────────────┘  └──────────────┘                          │
│  ┌──────────────┐                                            │
│  │  File Store  │                                            │
│  │  (Reports)   │                                            │
│  └──────────────┘                                            │
└────────────────────────────────────────────────────────────┘
```

### 5.4 Mapping chức năng → Module hệ thống

| Chức năng (ID) | Module chịu trách nhiệm |
|---|---|
| F-01 → F-04 | Warning Lifecycle Manager + API Gateway |
| F-05 → F-09 | Rule Engine + Integration Service |
| F-10 → F-12 | Warning Action Manager |
| F-13 → F-14 | Notification Service |
| F-15 → F-16 | Warning Lifecycle Manager (FSM) |
| F-17 → F-18 | Report Generator |
| F-19 → F-20 | Auth Middleware + RBAC |
| A-01 → A-02 | Rule Engine + Report Generator |
| A-03 → A-05 | Rule Engine + Warning Action Manager |
| A-06 → A-08 | Notification Service + Warning Action Manager |

---

## 6. Các nguồn dữ liệu & Tích hợp

### 6.1 Nguồn dữ liệu

Khác với bản 2.0 (giả định 3 nguồn: Đào tạo / CTSV / Đoàn-Hội), CSDL thực tế của dự án chỉ mô hình hóa **một miền dữ liệu duy nhất: dữ liệu học tập**, đến từ **Cổng Đào tạo**:

```
                        CỔNG ĐÀO TẠO
                        ──────────────
                     Hệ thống Quản lý Đào tạo
                              │
                              │ Đồng bộ định kỳ / API
                              ▼
                ┌────────────────────────────────┐
                │   ETL PIPELINE (Integration    │
                │   Service)                     │
                │  1. Extract → 2. Validate      │
                │  3. Transform → 4. Load        │
                └────────────────┬────────────────┘
                                 ▼
                      SEWS Database (PostgreSQL)
                      • faculty, cohort, class
                      • student, academic_program
                      • curriculum_course, course
                      • academic_year, semester
                      • training_plan(_course)
                      • course_registration
                      • course_result
```

### 6.2 Dữ liệu đồng bộ từ Cổng Đào tạo

| Bảng/Luồng dữ liệu | Tần suất đồng bộ | Mô tả | Bảng SEWS tương ứng |
|---|---|---|---|
| Hồ sơ tổ chức | Khi có thay đổi | Khoa, khóa, lớp | `faculty`, `cohort`, `class` |
| Hồ sơ sinh viên | Khi có thay đổi | MSSV, lớp, chương trình, khóa nhập học | `student` |
| Chương trình đào tạo | Đầu năm học / khi cập nhật CTĐT | Ngành, số tín chỉ toàn khóa, khung chương trình | `academic_program`, `curriculum_course`, `course` |
| Kế hoạch học kỳ | Đầu học kỳ | Học phần mở trong kỳ theo từng chương trình | `training_plan`, `training_plan_course` |
| Đăng ký học phần | Sau mỗi đợt đăng ký | Sinh viên đăng ký học phần nào, loại đăng ký | `course_registration` |
| Kết quả học phần | Sau khi công bố điểm | Điểm, xếp loại, đạt/không đạt, số lần học | `course_result` |

### 6.3 Trạng thái tích hợp & Chiến lược Mock Data

> **Ghi chú:** Tại thời điểm phát triển, nhóm chưa có quyền truy cập API thực từ Cổng Đào tạo. Integration Service tạm dùng **mock data theo đúng schema đã chốt ở mục 10**. Khi có API thật, chỉ cần viết thêm 1 tầng Adapter/Mapper chuyển đổi field nguồn → schema nội bộ; Rule Engine không cần sửa vì hoàn toàn độc lập với nguồn dữ liệu.

---

## 7. Lõi nghiệp vụ: Rule Engine tính cảnh báo

### 7.1 Vì sao đổi từ ARI liên tục sang Rule Engine

Bản 2.0 dùng công thức điểm rủi ro liên tục `ARI = α·R_Acad + β·R_Train + γ·R_Behav`. Tuy nhiên **CSDL thực tế của dự án không lưu một điểm ARI tổng hợp** — bảng `warning_rule` có `threshold`/`severity` riêng cho từng loại vi phạm, và bảng `student_warning` lưu `actual_value`/`expected_value` theo **từng rule**, không phải một điểm số chung. Vì vậy bản 3.0 thiết kế lại thành một **Rule Engine rời rạc**: mỗi rule độc lập, tự quyết định mức độ nghiêm trọng (`severity`) của chính nó.

### 7.2 Danh sách rule mặc định (seed cho bảng `warning_rule`)

| `code` | `warning_type` | `severity` | Ý nghĩa | `threshold` đề xuất |
|---|---|---|---|---|
| `THIEU_TIN_CHI` | `CREDIT_SHORTAGE` | 🟡 VÀNG | Số tín chỉ đã tích lũy thấp hơn kế hoạch CTĐT tính đến thời điểm hiện tại | Thiếu ≥ 6 tín chỉ |
| `NO_TIN_CHI_NHE` | `CREDIT_DEBT` | 🟡 VÀNG | Có học phần chưa qua (rớt) nhưng tổng tín chỉ nợ còn ở mức nhẹ | Nợ từ 1–9 tín chỉ |
| `GPA_THAP` | `LOW_GPA` | 🔴 ĐỎ | GPA học kỳ hoặc GPA tích lũy dưới ngưỡng cảnh báo học vụ | GPA_sem < 1.00 (hoặc theo `academic_program`) |
| `ROT_MON_NHIEU` | `MANY_FAILED` | 🔴 ĐỎ | Tổng tín chỉ nợ lớn, hoặc rớt nhiều học phần trong một kỳ | Nợ ≥ 10 tín chỉ, hoặc ≥ 3 học phần rớt/kỳ |

> Toàn bộ 4 dòng trên là dữ liệu cấu hình (`is_active = TRUE`), **không hard-code trong code** — Quản trị hệ thống có thể thêm/sửa/tắt rule qua UI mà không cần lập trình viên (xem F-19, mục 13).

### 7.3 Cách tính các đại lượng đầu vào

Vì CSDL không lưu sẵn `gpa_sem`/`gpa_cum`/số tín chỉ tích lũy, Rule Engine tính trực tiếp từ `course_result` mỗi khi chạy:

```sql
-- GPA học kỳ và tín chỉ đạt trong kỳ
SELECT
  cr.student_id,
  cr.semester_id,
  SUM(cr.score * c.credits) / NULLIF(SUM(c.credits), 0)  AS gpa_sem,
  SUM(c.credits) FILTER (WHERE cr.passed = TRUE)         AS credits_passed_in_sem,
  SUM(c.credits) FILTER (WHERE cr.passed = FALSE)        AS credits_failed_in_sem,
  COUNT(*)       FILTER (WHERE cr.passed = FALSE)        AS courses_failed_in_sem
FROM course_result cr
JOIN course c ON c.course_id = cr.course_id
GROUP BY cr.student_id, cr.semester_id;

-- Tín chỉ đã tích lũy (đạt) lũy kế và số tín chỉ đang nợ (rớt, attempt gần nhất chưa qua)
-- so với kế hoạch CTĐT (curriculum_course) tính đến năm/kỳ hiện tại của sinh viên
```

### 7.4 Đánh giá từng rule (`warning_type`)

**`CREDIT_SHORTAGE` — Thiếu tín chỉ (Vàng)**
```
expected_credits  = SUM(course.credits) từ curriculum_course
                     WHERE program_id = sinh viên.program_id
                       AND (expected_year, expected_semester) <= kỳ hiện tại
actual_credits    = SUM(course.credits) từ course_result WHERE passed = TRUE
credit_gap        = expected_credits − actual_credits

NẾU credit_gap ≥ threshold (mặc định 6)  →  kích hoạt THIEU_TIN_CHI (VÀNG)
```

**`CREDIT_DEBT` — Nợ tín chỉ nhẹ (Vàng)**
```
credit_debt = SUM(course.credits) các học phần mà lần học gần nhất
              (attempt_no lớn nhất) có passed = FALSE

NẾU 0 < credit_debt < threshold_ROT_MON_NHIEU (mặc định 10)
   VÀ credit_debt ≥ threshold_NO_TIN_CHI_NHE (mặc định 1)
  →  kích hoạt NO_TIN_CHI_NHE (VÀNG)
```

**`LOW_GPA` — GPA thấp (Đỏ)**
```
NẾU gpa_sem < threshold (mặc định 1.00)
  →  kích hoạt GPA_THAP (ĐỎ)
```

**`MANY_FAILED` — Rớt môn nhiều (Đỏ)**
```
NẾU credit_debt ≥ threshold (mặc định 10)
   HOẶC courses_failed_in_sem ≥ 3
  →  kích hoạt ROT_MON_NHIEU (ĐỎ)
```

> **Nguyên tắc ưu tiên:** Nếu một sinh viên kích hoạt cả rule Vàng lẫn rule Đỏ trong cùng kỳ, hệ thống tạo **cả hai** dòng `student_warning` (mỗi rule một dòng, để giữ tính giải thích được — F-09), nhưng **màu hiển thị tổng của sinh viên = mức cao nhất** trong các cảnh báo đang mở (xem mục 8).

### 7.5 Mapping rule → nhóm hỗ trợ (phục vụ bước ❹ ❺ quy trình)

| `warning_rule.code` | Mức | Gợi ý hỗ trợ |
|---|---|---|
| `THIEU_TIN_CHI` | 🟡 Vàng | Tư vấn đăng ký học phần còn thiếu, cân nhắc học vượt |
| `NO_TIN_CHI_NHE` | 🟡 Vàng | Lập lộ trình đăng ký học lại các học phần đang nợ |
| `GPA_THAP` | 🔴 Đỏ | Học lại, phụ đạo, giảm tải, tư vấn học tập |
| `ROT_MON_NHIEU` | 🔴 Đỏ | Học lại theo lộ trình ưu tiên, tư vấn tâm lý nếu cần |

---

## 8. Phân loại cảnh báo theo 3 mức màu

```
                🟢 Xanh                🟡 Vàng                    🔴 Đỏ
          (Không có cảnh báo)   (THIEU_TIN_CHI /          (GPA_THAP /
                                  NO_TIN_CHI_NHE)            ROT_MON_NHIEU)
```

| Mức | Màu | Điều kiện | Rule liên quan | Hành động tự động | Trạng thái xử lý (F-15) |
|---|---|---|---|---|---|
| **1 — Bình thường** | 🟢 Xanh | Sinh viên không có `student_warning` nào đang mở (status ∈ {OPEN, IN_PROGRESS}) | — | Không có hành động | — |
| **2 — Giám sát** | 🟡 Vàng | Có ít nhất 1 `student_warning` đang mở với `severity = VANG`, và **không có** cảnh báo ĐỎ nào đang mở | `THIEU_TIN_CHI`, `NO_TIN_CHI_NHE` | Email nhắc cải thiện; hiển thị trên dashboard GVCN/CVHT | OPEN |
| **3 — Nguy cơ / Khẩn cấp** | 🔴 Đỏ | Có ít nhất 1 `student_warning` đang mở với `severity = DO` (bất kể có cảnh báo Vàng khác hay không) | `GPA_THAP`, `ROT_MON_NHIEU` | Thông báo khẩn đến GVCN/CVHT + Ban chủ nhiệm Khoa; đưa vào danh sách ưu tiên xử lý | OPEN → có thể ESCALATED |

> **So với bản 2.0:** mức Cam (Nguy cơ cao) và Đỏ (Báo động đỏ) được **gộp làm một mức Đỏ duy nhất**, vì cả hai đều xuất phát từ cùng nhóm nguyên nhân học thuật nghiêm trọng (GPA thấp / rớt môn nhiều) và trong thực tế được xử lý theo cùng một quy trình khẩn.

---

## 9. Vòng đời xử lý cảnh báo — Finite State Machine

Mỗi dòng **`student_warning`** tuân theo máy trạng thái sau (phản ánh quy trình thực tế ở mục 2):

```
        [Rule Engine phát hiện vi phạm ngưỡng — mục 7]
                          │
                          ▼
                 ┌─────────────────┐
                 │      OPEN       │ ←── student_warning mới (severity: VÀNG/ĐỎ) — Bước ❷
                 │  (Mới phát hiện)│
                 └────────┬────────┘
                          │  warning_action đầu tiên được ghi (liên hệ/gặp SV) — Bước ❻ ❼
                          ▼
                 ┌─────────────────┐
                 │   IN_PROGRESS   │ ←── Bước ❼ ❽ ❾
                 │   (Đang xử lý)  │
                 └────────┬────────┘
              ┌───────────┼────────────────┐
              │                            │
   [Kỳ sau: rule không          [Cảnh báo ĐỎ không cải thiện
    còn kích hoạt]                sau thời gian quy định]
              │                            │
              ▼                            ▼
     ┌─────────────────┐         ┌──────────────────┐
     │     RESOLVED     │         │     ESCALATED     │ ←── Bước ❿
     │     (Đã ổn)      │         │  (Báo cấp trên)   │
     └────────┬─────────┘         └─────────┬──────────┘
              │                             │
              └─────────────┬───────────────┘
                            ▼
                   ┌─────────────────┐
                   │      CLOSED     │ ←── Bước ⓫ (cuối kỳ)
                   │    (Hoàn tất)   │
                   └─────────────────┘
```

**Quy tắc chuyển trạng thái:**

| Chuyển trạng thái | Điều kiện | Bước QT |
|---|---|---|
| *(mới)* → OPEN | Rule Engine phát hiện vi phạm ngưỡng ở lần quét gần nhất | ❷ |
| OPEN → IN_PROGRESS | Cán bộ/GVCN ghi `warning_action` đầu tiên (liên hệ, gặp, gửi thông báo) | ❻ ❼ |
| IN_PROGRESS → RESOLVED | Ở lần đánh giá lại (kỳ sau), rule tương ứng không còn kích hoạt | ❿ |
| IN_PROGRESS → ESCALATED | Cảnh báo **ĐỎ** vẫn kích hoạt sau N kỳ liên tiếp không cải thiện, hoặc cán bộ chủ động ghi `warning_action` loại `ESCALATE` | ❿ |
| RESOLVED / ESCALATED → CLOSED | Kết thúc theo dõi cuối kỳ | ⓫ |

> **Đơn giản hoá so với bản 2.0:** không còn các trạng thái riêng cho từng mức (NOTIFIED/SCHEDULED) hay theo nguyên nhân RLT, vì chỉ còn 2 mức cảnh báo (Vàng/Đỏ) và mọi hành động xử lý đều đi qua cùng một bảng `warning_action`.

---

## 10. Thiết kế cơ sở dữ liệu

### 10.1 Sơ đồ quan hệ chính (ERD)

> Schema dưới đây khớp đúng với ERD thực tế của dự án (19 bảng).

```
faculty ──< cohort ──< class ──< student
faculty ──< academic_program ──< student
academic_program ──< curriculum_course >── course
academic_program ──< training_plan >── semester
training_plan ──< training_plan_course >── course
academic_year ──< semester

student ──< course_registration >── course, semester
student ──< course_result       >── course, semester

class ──< class_advisor >── user_account
user_account ──< user_role >── role

warning_rule ──< student_warning >── student, semester
student_warning ──< warning_action
```

### 10.2 Các bảng

```sql
-- ══════════════════ TỔ CHỨC / DANH MỤC ══════════════════

CREATE TABLE faculty (
  faculty_id      BIGSERIAL PRIMARY KEY,
  code            VARCHAR(20)  NOT NULL UNIQUE,
  name            VARCHAR(255) NOT NULL
);

CREATE TABLE cohort (
  cohort_id       BIGSERIAL PRIMARY KEY,
  code            VARCHAR(20)  NOT NULL UNIQUE,
  name            VARCHAR(100),
  start_year      INT NOT NULL,
  end_year        INT,
  faculty_id      BIGINT NOT NULL REFERENCES faculty(faculty_id)
);

CREATE TABLE class (
  class_id        BIGSERIAL PRIMARY KEY,
  code            VARCHAR(30)  NOT NULL UNIQUE,
  name            VARCHAR(100),
  cohort_id       BIGINT NOT NULL REFERENCES cohort(cohort_id)
);

CREATE TABLE academic_year (
  academic_year_id BIGSERIAL PRIMARY KEY,
  name             VARCHAR(20) NOT NULL UNIQUE,
  start_date       DATE,
  end_date         DATE
);

CREATE TABLE semester (
  semester_id       BIGSERIAL PRIMARY KEY,
  academic_year_id  BIGINT NOT NULL REFERENCES academic_year(academic_year_id),
  semester_no       INT NOT NULL,
  name              VARCHAR(50),
  start_date        DATE,
  end_date          DATE
);

-- ══════════════════ CHƯƠNG TRÌNH ĐÀO TẠO ══════════════════

CREATE TABLE academic_program (
  program_id      BIGSERIAL PRIMARY KEY,
  code            VARCHAR(30)  NOT NULL UNIQUE,
  name            VARCHAR(255) NOT NULL,
  duration_years  NUMERIC(3,1),
  total_credits   INT,
  version         VARCHAR(20),
  faculty_id      BIGINT NOT NULL REFERENCES faculty(faculty_id)
);

CREATE TABLE course (
  course_id       BIGSERIAL PRIMARY KEY,
  code            VARCHAR(20)  NOT NULL UNIQUE,
  name            VARCHAR(255) NOT NULL,
  credits         INT NOT NULL
);

-- Khung CTĐT chuẩn của mỗi chương trình → dùng để tính THIEU_TIN_CHI (7.4)
CREATE TABLE curriculum_course (
  curriculum_course_id BIGSERIAL PRIMARY KEY,
  program_id      BIGINT NOT NULL REFERENCES academic_program(program_id),
  course_id       BIGINT NOT NULL REFERENCES course(course_id),
  course_type     VARCHAR(20) NOT NULL,   -- BẮT_BUỘC / TỰ_CHỌN...
  expected_year   INT,
  expected_semester INT,
  is_required     BOOLEAN NOT NULL DEFAULT TRUE
);

-- Kế hoạch mở học phần theo từng học kỳ cụ thể
CREATE TABLE training_plan (
  training_plan_id BIGSERIAL PRIMARY KEY,
  program_id       BIGINT NOT NULL REFERENCES academic_program(program_id),
  semester_id      BIGINT NOT NULL REFERENCES semester(semester_id),
  name             VARCHAR(255),
  status           VARCHAR(30) NOT NULL
);

CREATE TABLE training_plan_course (
  training_plan_course_id BIGSERIAL PRIMARY KEY,
  training_plan_id BIGINT NOT NULL REFERENCES training_plan(training_plan_id),
  course_id        BIGINT NOT NULL REFERENCES course(course_id),
  course_type      VARCHAR(20) NOT NULL,
  is_required      BOOLEAN NOT NULL DEFAULT TRUE
);

-- ══════════════════ SINH VIÊN & KẾT QUẢ HỌC TẬP ══════════════════

CREATE TABLE student (
  student_id      BIGSERIAL PRIMARY KEY,
  student_code    VARCHAR(20)  NOT NULL UNIQUE,
  full_name       VARCHAR(255) NOT NULL,
  date_of_birth   DATE,
  class_id        BIGINT NOT NULL REFERENCES class(class_id),
  program_id      BIGINT NOT NULL REFERENCES academic_program(program_id),
  admission_year  INT,
  status          VARCHAR(30) NOT NULL     -- ĐANG_HỌC / BẢO_LƯU / THÔI_HỌC...
);

-- Phục vụ F-07
CREATE TABLE course_registration (
  registration_id  BIGSERIAL PRIMARY KEY,
  student_id       BIGINT NOT NULL REFERENCES student(student_id),
  course_id        BIGINT NOT NULL REFERENCES course(course_id),
  semester_id      BIGINT NOT NULL REFERENCES semester(semester_id),
  registration_type VARCHAR(30) NOT NULL,  -- MỚI / HỌC_LẠI / HỌC_CẢI_THIỆN
  status           VARCHAR(30) NOT NULL
);

-- Phục vụ F-05, F-06, và toàn bộ Rule Engine (mục 7)
CREATE TABLE course_result (
  result_id        BIGSERIAL PRIMARY KEY,
  student_id       BIGINT NOT NULL REFERENCES student(student_id),
  course_id        BIGINT NOT NULL REFERENCES course(course_id),
  semester_id      BIGINT NOT NULL REFERENCES semester(semester_id),
  score            NUMERIC(4,2),
  grade            VARCHAR(5),
  passed           BOOLEAN,
  attempt_no       INT NOT NULL DEFAULT 1
);

-- ══════════════════ CẢNH BÁO ══════════════════

-- Cấu hình rule (mục 7.2) — Admin chỉnh qua UI, không hard-code
CREATE TABLE warning_rule (
  rule_id         BIGSERIAL PRIMARY KEY,
  code            VARCHAR(30)  NOT NULL UNIQUE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  warning_type    VARCHAR(30) NOT NULL,   -- CREDIT_SHORTAGE/CREDIT_DEBT/LOW_GPA/MANY_FAILED
  severity        VARCHAR(20) NOT NULL,   -- VANG / DO
  threshold       NUMERIC(8,2),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

-- Một dòng = một cảnh báo cụ thể cho một SV trong một kỳ, theo một rule
CREATE TABLE student_warning (
  warning_id      BIGSERIAL PRIMARY KEY,
  student_id      BIGINT NOT NULL REFERENCES student(student_id),
  rule_id         BIGINT NOT NULL REFERENCES warning_rule(rule_id),
  semester_id     BIGINT NOT NULL REFERENCES semester(semester_id),
  detected_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  severity        VARCHAR(20) NOT NULL,   -- VANG / DO (chép lại từ rule tại thời điểm phát hiện)
  status          VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- OPEN/IN_PROGRESS/RESOLVED/ESCALATED/CLOSED (mục 9)
  reason          TEXT,
  actual_value    NUMERIC(10,2),          -- vd: GPA thực tế, số tín chỉ nợ thực tế
  expected_value  NUMERIC(10,2)           -- vd: ngưỡng threshold tại thời điểm phát hiện
);

-- Lịch sử xử lý — gộp cả "can thiệp" lẫn "lịch hẹn" (F-10→12, A-06→08)
CREATE TABLE warning_action (
  action_id       BIGSERIAL PRIMARY KEY,
  warning_id      BIGINT NOT NULL REFERENCES student_warning(warning_id),
  action_type     VARCHAR(50) NOT NULL,   -- CONTACT/MEETING/NOTIFY_STUDENT/SCHEDULE_MEETING/
                                           -- MEETING_ATTENDED/MEETING_NO_SHOW/ESCALATE/RESOLVE...
  action_date     TIMESTAMP NOT NULL DEFAULT NOW(),
  note            TEXT,
  created_by      BIGINT REFERENCES user_account(user_id)
);

-- ══════════════════ NGƯỜI DÙNG & PHÂN QUYỀN ══════════════════

CREATE TABLE user_account (
  user_id         BIGSERIAL PRIMARY KEY,
  username        VARCHAR(100) NOT NULL UNIQUE,
  password_hash   VARCHAR(255),
  full_name       VARCHAR(255),
  email           VARCHAR(255),
  status          VARCHAR(30)
);

CREATE TABLE role (
  role_id         BIGSERIAL PRIMARY KEY,
  code            VARCHAR(30)  NOT NULL UNIQUE,
  name            VARCHAR(100) NOT NULL
);

CREATE TABLE user_role (
  user_id         BIGINT NOT NULL REFERENCES user_account(user_id),
  role_id         BIGINT NOT NULL REFERENCES role(role_id),
  PRIMARY KEY (user_id, role_id)
);

-- GVCN/CVHT phụ trách lớp nào (F-19, dùng để lọc phạm vi xem)
CREATE TABLE class_advisor (
  class_id        BIGINT NOT NULL REFERENCES class(class_id),
  user_id         BIGINT NOT NULL REFERENCES user_account(user_id),
  start_date      DATE,
  end_date        DATE,
  PRIMARY KEY (class_id, user_id)
);
```

> **Không còn trong schema v3.0** (so với bản 2.0): `academic_records`, `conduct_scores`, `activity_participations`, `interventions`, `appointments`, `ari_snapshots`, `notification_logs`, `rules_config`, `audit_logs`. Các nhu cầu tương ứng được đáp ứng bằng: tính toán trực tiếp từ `course_result` (thay `academic_records`), `warning_rule` (thay `rules_config`), và `warning_action` (thay cả `interventions` + `appointments` + log thông báo). Xem ADR-013, 014.

### 10.3 Indexing Strategy

```sql
CREATE INDEX idx_student_warning_student_sem ON student_warning(student_id, semester_id);
CREATE INDEX idx_student_warning_severity_status ON student_warning(severity, status);
CREATE INDEX idx_student_warning_rule ON student_warning(rule_id);
CREATE INDEX idx_course_result_student_sem ON course_result(student_id, semester_id);
CREATE INDEX idx_course_result_course ON course_result(course_id, passed);
CREATE INDEX idx_course_registration_student_sem ON course_registration(student_id, semester_id);
CREATE INDEX idx_warning_action_warning ON warning_action(warning_id);
CREATE INDEX idx_student_class_program ON student(class_id, program_id);
CREATE INDEX idx_curriculum_course_program ON curriculum_course(program_id, expected_year, expected_semester);
```

---

## 11. Kiến trúc API

### 11.1 Quy ước chung

- **Base URL:** `/api/v1`
- **Auth:** JWT Bearer Token (access token 15 phút + refresh token 7 ngày)
- **Format:** JSON
- **Pagination:** `?page=1&limit=20`
- **Filtering:** `?semester=HK1-2026&severity=DO&status=IN_PROGRESS&faculty=CNTT&rule=GPA_THAP`

### 11.2 Nhóm endpoints chính

```
AUTH
  POST   /api/v1/auth/login
  POST   /api/v1/auth/refresh
  POST   /api/v1/auth/logout

─── Core Features (F-01 → F-20) ───

STUDENTS (F-01 → F-09)
  GET    /api/v1/students                          Danh sách SV + filter/sort (F-01→04)
  GET    /api/v1/students/:id                       Chi tiết SV (F-05)
  GET    /api/v1/students/:id/curriculum-progress   Tiến độ tín chỉ theo CTĐT (F-06)
  GET    /api/v1/students/:id/course-registrations  Lịch sử đăng ký học phần (F-07)
  GET    /api/v1/students/:id/warnings              Lịch sử cảnh báo (F-08)
  GET    /api/v1/students/:id/gpa-history           Trend GPA cho chart (A-01)

WARNINGS (student_warning) (F-15, F-16)
  GET    /api/v1/warnings                           Dashboard list (F-01), mức Đỏ/Vàng
  GET    /api/v1/warnings/:id                        Chi tiết 1 cảnh báo + FSM state
  PATCH  /api/v1/warnings/:id/status                 Cập nhật trạng thái (F-15)

WARNING ACTIONS (F-10 → F-12, A-06 → A-08)
  POST   /api/v1/warnings/:id/actions                Ghi nhận hành động xử lý (F-10, F-11)
  GET    /api/v1/warnings/:id/actions                Lịch sử xử lý (F-12, A-05)

NOTIFICATIONS (F-13, F-14)
  POST   /api/v1/notifications/send                  Gửi thông báo (ghi thành 1 warning_action)

REPORTS (F-17, F-18)
  GET    /api/v1/dashboard/overview                  Tổng quan 3 mức (F-18)
  GET    /api/v1/reports/semester/:semId              Báo cáo theo kỳ (F-17)
  GET    /api/v1/reports/by-faculty                   Báo cáo theo khoa (F-17)
  GET    /api/v1/reports/by-rule                       Báo cáo theo warning_rule (F-17)
  GET    /api/v1/reports/export                        Xuất Excel/PDF (F-17)

─── Advanced Features (A-01 → A-08) ───

ANALYTICS
  GET    /api/v1/analytics/trend/:studentId          Biểu đồ xu hướng GPA (A-01)
  GET    /api/v1/analytics/compare                    So sánh theo cohort/năm (A-02)
  GET    /api/v1/analytics/priority-queue              Gợi ý ưu tiên (A-03)
  GET    /api/v1/analytics/action-effectiveness        Đánh giá hiệu quả xử lý (A-04)

─── Admin ───

WARNING RULES (Admin only)
  GET    /api/v1/warning-rules                        Xem cấu hình rule hiện tại
  PATCH  /api/v1/warning-rules/:id                     Cập nhật threshold/severity/is_active

WEBHOOKS (nhận dữ liệu từ Cổng Đào tạo)
  POST   /api/v1/webhooks/students
  POST   /api/v1/webhooks/course-registrations
  POST   /api/v1/webhooks/course-results
```

### 11.3 WebSocket — Real-time Dashboard

```
ws://sews.dlu.edu.vn/ws

Events:
  server → client:
    "warning.created"       { student_id, rule_code, severity }
    "warning.status.changed" { warning_id, from_status, to_status }
    "level.changed"          { student_id, from_color, to_color }
```

---

## 12. Kiến trúc Frontend (Dashboard)

### 12.1 Cấu trúc thư mục

```
src/
├── pages/
│   ├── Dashboard/              -- Tổng quan (F-18): 3 mức màu, thống kê nhanh
│   ├── WarningList/            -- Danh sách cảnh báo (F-01→04): lọc, sắp xếp, tìm kiếm
│   ├── StudentDetail/          -- Hồ sơ SV (F-05→09): điểm, tiến độ CTĐT, lịch sử
│   ├── ActionLog/               -- Ghi nhận xử lý (F-10→12): form + lịch sử warning_action
│   ├── Reports/                -- Báo cáo (F-17): xuất Excel/PDF, thống kê
│   ├── Analytics/              -- Phân tích (A-01→05): biểu đồ, so sánh
│   └── Settings/                -- Cấu hình warning_rule (Admin)
│
├── components/
│   ├── LevelBadge/               -- Badge màu xanh/vàng/đỏ
│   ├── GpaTrendChart/            -- Biểu đồ GPA qua các kỳ (A-01)
│   ├── WarningRuleBadge/         -- Badge rule đã kích hoạt (F-09)
│   ├── CurriculumProgressBar/    -- Thanh tiến độ tín chỉ theo CTĐT (F-06)
│   ├── StatusTracker/            -- Timeline trạng thái xử lý (F-15)
│   ├── ActionForm/                -- Form ghi warning_action (F-10)
│   └── ComparisonChart/           -- So sánh khóa/năm (A-02)
│
├── hooks/
│   ├── useWebSocket.ts           -- Subscribe real-time events
│   ├── useGpaHistory.ts          -- Fetch trend data
│   ├── useWarnings.ts            -- CRUD student_warning
│   └── useWarningActions.ts      -- CRUD warning_action
│
├── services/
│   ├── api.ts                    -- Axios instance + interceptors
│   └── notification.ts           -- Push notification
│
└── stores/                       -- Global state (Zustand)
    ├── authStore.ts
    ├── dashboardStore.ts
    └── filterStore.ts
```

### 12.2 Các widget Dashboard chính

| Widget | Dữ liệu hiển thị | Chức năng phục vụ |
|---|---|---|
| **Tổng quan 3 màu** | Số SV mỗi mức (Xanh/Vàng/Đỏ), % so với tổng | F-18 |
| **Danh sách khẩn cấp** | SV mức Đỏ chưa được xử lý, sắp xếp theo mức ưu tiên | F-01, A-03 |
| **GPA Trend Chart** | Đường GPA qua các kỳ | A-01 |
| **Curriculum Progress Bar** | Tín chỉ đã tích lũy / tổng tín chỉ CTĐT | F-06 |
| **Status Tracker** | Vòng đời `student_warning` dạng timeline | F-15 |
| **Action Timeline** | Lịch sử `warning_action` với kết quả từng lần | F-12, A-05 |
| **So sánh khóa/năm** | Biểu đồ cột/đường so sánh qua các `cohort` | A-02 |

---

## 13. Bảo mật & Phân quyền (RBAC)

### 13.1 Roles

> Bảng `role` lưu các mã vai trò dưới đây; `user_role` gán nhiều vai trò cho một `user_account`.

| `role.code` | Actor | Phạm vi truy cập | Chức năng được phép |
|---|---|---|---|
| `SYSTEM_ADMIN` | Quản trị hệ thống/nội bộ | Toàn bộ | Tất cả + cấu hình `warning_rule`, `role`/`user_role`, `training_plan(_course)` |
| `FACULTY_BOARD` | Ban chủ nhiệm Khoa | Theo `faculty_id` | Dashboard tổng quan, báo cáo, cảnh báo, thống kê theo lớp/khóa/học kỳ |
| `CLASS_ADVISOR` | Giảng viên chủ nhiệm / CVHT | Chỉ SV thuộc lớp trong `class_advisor` | Xem lớp phụ trách, SV, bảng điểm, CTĐT, cảnh báo học tập, đăng ký học phần |
| `FACULTY_STAFF` | Giáo vụ / Chuyên viên Khoa | Theo `faculty_id` | Xem dashboard SV, xuất báo cáo chi tiết SV |
| `STUDENT_AFFAIRS_ASSISTANT` | Trợ lý Công tác sinh viên | Theo `faculty_id` hoặc toàn trường (cấu hình) | Theo dõi hồ sơ, cảnh báo, danh sách SV cần xử lý; ghi `warning_action` |
| `COMMS_ASSISTANT` | Trợ lý Truyền thông | Chỉ dữ liệu tổng hợp (không xem chi tiết từng SV) | Xem số liệu thống kê, xu hướng, báo cáo đã được phân quyền |

> **So với bản 2.0:** loại bỏ role `STUDENT` (sinh viên tự xem điểm) vì bảng "Đối tượng sử dụng" của dự án không liệt kê sinh viên là actor trực tiếp của hệ thống. Nếu Khoa cần Cổng thông tin cho sinh viên, cần bổ sung actor + role riêng.

### 13.2 Nguyên tắc bảo mật (F-20)

- **Phân quyền theo phạm vi (F-19):** `CLASS_ADVISOR` chỉ xem SV thuộc lớp mình (qua `class_advisor`); `FACULTY_BOARD`/`FACULTY_STAFF` chỉ xem theo `faculty_id`, không cross-access giữa các Khoa
- **Truy vết hành động:** Mọi `warning_action` đều lưu `created_by` (ai thực hiện) — dùng thay cho bảng `audit_logs` tổng quát chưa có trong schema hiện tại (xem ADR-013)
- **Sensitive data:** Thông tin cá nhân sinh viên (`date_of_birth`, `email`) chỉ hiển thị cho vai trò từ `CLASS_ADVISOR` trở lên
- **JWT secret rotation:** Mỗi 90 ngày
- **Session management:** Tự động đăng xuất sau 30 phút không hoạt động

---

## 14. Technology Stack

| Layer | Technology | Lý do chọn |
|---|---|---|
| **Frontend** | React + Vite + Tailwind CSS v4 | Ecosystem mạnh, dễ tích hợp chart libraries |
| **Charts** | Recharts / Chart.js | Open-source, dễ customize cho biểu đồ GPA (A-01) |
| **Backend** | Node.js + Express.js | Team quen thuộc, phù hợp scope dự án |
| **Database** | PostgreSQL | ACID, phù hợp mô hình quan hệ nhiều bảng (19 bảng) của CTĐT |
| **Cache** | Redis | Cache số liệu dashboard; session storage |
| **Message Queue** | RabbitMQ | Hàng đợi gửi email cảnh báo, tránh nghẽn khi quét hàng loạt |
| **Auth** | JWT + bcrypt | Stateless, phù hợp REST API |
| **ORM** | Prisma | Type-safe, migration management — khớp tốt với 19 bảng quan hệ chặt |
| **Email** | Nodemailer + SMTP | Gửi thông báo trong hệ thống (F-13) |
| **Design tool** | Figma | Wireframe & prototype |
| **API testing** | Postman | Test + document API |
| **Version control** | Git + GitHub | Source control, code review |

---

## 15. Kế hoạch phát triển & Milestones

```
10/08 ──── 13/09/2026    SPRINT 1: NỀN TẢNG
  ✦ Xác nhận ERD thực tế với nhà trường (19 bảng — mục 10)
  ✦ Setup môi trường (Docker, CI/CD, Git flow), migration Prisma theo schema mục 10
  ✦ Wireframe giao diện Dashboard (3 mức màu)
  ✦ Module đăng nhập, phân quyền (JWT + RBAC theo 6 role — mục 13) → F-19, F-20
  ✦ Integration stubs: Mock data cho student/course_result/course_registration

14/09 ──── 20/09/2026    ★ MILESTONE 1 (20%)
  Chấm điểm: DB schema (19 bảng) + Wireframe + Auth module demo

21/09 ──── 11/10/2026    SPRINT 2: RULE ENGINE + CHỨC NĂNG BẮT BUỘC
  ✦ Rule Engine: 4 rule mặc định (THIEU_TIN_CHI/NO_TIN_CHI_NHE/GPA_THAP/ROT_MON_NHIEU) (F-09)
  ✦ Warning Lifecycle FSM: OPEN/IN_PROGRESS/RESOLVED/ESCALATED/CLOSED (F-15, F-16)
  ✦ Dashboard: tổng quan 3 mức + danh sách + lọc + tìm kiếm (F-01→04, F-18)
  ✦ Hồ sơ chi tiết sinh viên (F-05→08)
  ✦ Gửi thông báo trong hệ thống (F-13, F-14)

12/10 ──── 18/10/2026    ★ MILESTONE 2 (30%)
  Demo luồng: Đồng bộ dữ liệu → Rule Engine đánh giá → Phân loại 3 màu → Dashboard → Chi tiết

19/10 ──── 15/11/2026    SPRINT 3: XỬ LÝ + NÂNG CAO + HOÀN THIỆN
  ✦ Ghi nhận warning_action + lịch sử (F-10→12)
  ✦ Xuất báo cáo Excel/PDF (F-17)
  ✦ Biểu đồ xu hướng GPA (A-01), gợi ý ưu tiên (A-03)
  ✦ Đánh giá hiệu quả xử lý (A-04) — nếu đủ thời gian
  ✦ Testing toàn bộ (Unit + Integration + UAT với Khoa/Ban CTSV)
  ✦ Tài liệu hướng dẫn sử dụng + Báo cáo đồ án

16/11 ──── 22/11/2026    ★ MILESTONE 3 — NỘP BÁO CÁO & CHẤM ĐỒ ÁN (50%)
```

---

## 16. Architectural Decision Records (ADRs)

### ADR-001: Monolith thay vì Microservices

**Quyết định:** Sử dụng Layered Monolith với ranh giới module rõ ràng.

**Lý do:** Team 3 người trong 3 tháng. Microservices đòi hỏi overhead vận hành không tương xứng với scope. Module boundaries rõ ràng cho phép tách thành microservices sau nếu cần.

---

### ADR-002: Rule config trong Database thay vì hard-code

**Quyết định:** Toàn bộ ngưỡng nghiệp vụ lưu trong bảng `warning_rule`.

**Lý do:** Ngưỡng cảnh báo có thể thay đổi theo thực tế từng Khoa/kỳ. Với DB config, Admin thay đổi `threshold`/`severity`/`is_active` qua UI mà không cần lập trình viên.

> **Cập nhật (v3.0):** bảng `rules_config` (key-value chung) của bản 2.0 được thay bằng `warning_rule` — đã có sẵn cấu trúc `threshold`/`severity` chuyên biệt cho từng rule, không cần bảng cấu hình tổng quát riêng.

---

### ADR-003: Trạng thái xử lý phản ánh quy trình thực tế

**Quyết định:** FSM states của `student_warning` mapping 1:1 với các bước trong quy trình thực tế (mục 2): `OPEN / IN_PROGRESS / RESOLVED / ESCALATED / CLOSED`.

**Lý do:** Hệ thống phải phục vụ người dùng thực tế, không ép người dùng thay đổi cách làm việc.

> **Cập nhật (v3.0):** rút gọn từ 8 trạng thái (bản 2.0: NEW/NOTIFIED/SCHEDULED/ESCALATED/IN_PROGRESS/STABLE/FOLLOW_UP/REPORTED_UP/RESOLVED) xuống còn 5, vì chỉ còn 2 mức cảnh báo (Vàng/Đỏ) thay vì 3 (Vàng/Cam/Đỏ) nên không cần nhánh trạng thái riêng cho từng mức.

---

### ADR-004: Phân nhóm nguyên nhân theo rule đã kích hoạt

**Quyết định:** Hệ thống phân loại sinh viên theo `warning_rule.code` đã kích hoạt (`THIEU_TIN_CHI`/`NO_TIN_CHI_NHE`/`GPA_THAP`/`ROT_MON_NHIEU`) thay vì theo tỷ trọng một điểm rủi ro tổng hợp.

**Lý do:** Khớp trực tiếp với thiết kế bảng `student_warning` (mỗi dòng gắn với một `rule_id` cụ thể), đơn giản và dễ giải thích hơn cách tính tỷ trọng thành phần rủi ro ẩn của bản 2.0.

---

### ADR-005: Gộp `interventions` và `appointments` thành `warning_action`

**Quyết định:** Dùng một bảng `warning_action` duy nhất (có `action_type`) thay vì tách riêng bảng ghi chú can thiệp và bảng lịch hẹn.

**Lý do:** ERD thực tế của dự án chỉ có một bảng ghi hành động xử lý. `action_type` (`CONTACT`/`MEETING`/`SCHEDULE_MEETING`/`MEETING_ATTENDED`/`NOTIFY_STUDENT`/`ESCALATE`/`RESOLVE`...) đủ để phân biệt các loại hành động mà không cần hai bảng riêng.

**Hệ quả:** Tính năng nhắc lịch tự động (`reminder_sent`) của bản 2.0 không còn được hỗ trợ trực tiếp trong schema này — xem ADR-014 nếu cần bổ sung sau.

---

### ADR-006: SEWS chỉ READ từ Cổng Đào tạo, không WRITE ngược lại

**Quyết định:** SEWS là hệ thống *hỗ trợ quyết định*, không phải *hệ thống ra quyết định*.

**Lý do:** Toàn vẹn dữ liệu. Điểm chính thức, kết quả học phần phải xuất phát từ hệ thống gốc của nhà trường. SEWS chỉ đọc và tính toán cảnh báo, không ghi ngược lại `course_result`/`course_registration`.

---

### ADR-007: [SUPERSEDED] Ngưỡng R_Acad phân biệt theo học kỳ đầu và academic_year

> **Trạng thái: đã thay thế bởi ADR-013.** Nội dung gốc dựa trên bảng `academic_records` (có cột `is_first_semester`) không còn tồn tại trong schema v3.0. Ngưỡng GPA thấp (`GPA_THAP`) ở bản 3.0 dùng một threshold cấu hình được trong `warning_rule` (mục 7.2), có thể tinh chỉnh riêng theo `academic_program` nếu cần, thay vì hard-code nhiều nhánh theo năm học như bản 2.0.

---

### ADR-008: [SUPERSEDED] Kỷ luật là TRẦN xếp loại rèn luyện, không phải phép cộng

> **Trạng thái: đã thay thế bởi ADR-013.** CSDL v3.0 không có bảng `conduct_scores`, nên toàn bộ logic trần xếp loại rèn luyện theo kỷ luật (QĐ 99/QĐ-ĐHĐL, Điều 8) tạm thời **không được tính vào cảnh báo**. Sẽ khôi phục nếu Khoa bổ sung nguồn dữ liệu điểm rèn luyện.

---

### ADR-009: [SUPERSEDED] F-debt/24 là chỉ số nội bộ, không phải quy tắc pháp lý

> **Trạng thái: đã thay thế bởi ADR-013.** Tinh thần của ADR này (phân biệt rõ chỉ số nội bộ SEWS tự đặt ra với quy định pháp lý chính thức) vẫn giữ nguyên ở v3.0: các ngưỡng `THIEU_TIN_CHI`/`NO_TIN_CHI_NHE`/`ROT_MON_NHIEU` (mục 7.2) là **ngưỡng nội bộ do nhóm SEWS đề xuất**, cần Khoa/Ban CTSV xác nhận trước khi áp dụng chính thức; chỉ `GPA_THAP` có căn cứ trực tiếp từ quy chế đào tạo.

---

### ADR-010: [SUPERSEDED] `family_hardship` gắn vào Rules Engine, không chỉ hiển thị

> **Trạng thái: đã thay thế bởi ADR-013.** Cột `family_hardship`/`hardship_type` không có trong bảng `student` của schema v3.0, nên logic châm chước theo hoàn cảnh gia đình tạm thời không được áp dụng. Nếu cần, có thể bổ sung 2 cột này vào `student` và một điều chỉnh nhẹ (`hardship_bonus`) trong Rule Engine ở giai đoạn sau.

---

### ADR-011: Tách tầng Adapter/Mapper cho Integration Service

**Quyết định:** Integration Service tạm dùng mock data theo đúng schema nội bộ (mục 10). Khi có API thật từ nhà trường, chỉ cần viết thêm 1 tầng "adapter/mapper" chuyển đổi field → schema nội bộ, không đụng vào Rule Engine.

**Lý do:** Tại thời điểm phát triển, chưa có quyền truy cập API thực. Toàn bộ logic Rule Engine (mục 7) hoàn toàn độc lập với nguồn dữ liệu, chỉ phụ thuộc vào schema nội bộ.

---

### ADR-012: Gộp mức Cam và Đỏ thành một mức Đỏ duy nhất

**Quyết định:** Chuyển từ phân loại 4 mức (Xanh/Vàng/Cam/Đỏ) sang 3 mức (Xanh/Vàng/Đỏ).

**Lý do:** Theo yêu cầu thực tế, mức Cam ("Nguy cơ cao") và Đỏ ("Báo động đỏ") của bản 2.0 có bản chất tương tự nhau — cùng xuất phát từ vấn đề học thuật nghiêm trọng và được xử lý theo cùng một quy trình khẩn (thông báo GVCN/CVHT + Ban chủ nhiệm Khoa). Gộp lại giúp: (1) đơn giản hóa FSM (bớt 1 nhánh trạng thái), (2) khớp trực tiếp với 2 nhóm `severity` (VÀNG/ĐỎ) đã có sẵn trong bảng `warning_rule`, không cần suy ra mức thứ 3 từ một khoảng điểm liên tục.

**Hệ quả:** Mọi nơi tham chiếu "4 mức màu" trong tài liệu (mục 3, 5, 8, 9, 12) được cập nhật thành 3 mức. `warning_rule.severity` chỉ nhận 2 giá trị: `VANG`, `DO`.

---

### ADR-013: Thu hẹp phạm vi cảnh báo về dữ liệu học tập, tạm loại RLT & hoạt động phong trào

**Quyết định:** Rule Engine v3.0 chỉ tính cảnh báo dựa trên dữ liệu học tập (`course_result`, `course_registration`, `curriculum_course`). Điểm rèn luyện (RLT), kỷ luật, và hoạt động Đoàn — Hội **không được tính vào cảnh báo** ở phiên bản này.

**Lý do:** ERD thực tế của dự án (ảnh CSDL cung cấp) không có bảng `conduct_scores`, `activity_participations`, hay các cột liên quan (`family_hardship`, `discipline_cap`...). Việc tính cảnh báo dựa trên dữ liệu không tồn tại trong schema sẽ khiến thiết kế không thể triển khai được. Đây thay thế cho ADR-007, 008, 009, 010 của bản 2.0.

**Hệ quả:** Bảng "Đối tượng sử dụng" của dự án có nhắc "điểm rèn luyện" như một nhu cầu của Trợ lý CTSV (mục 1.4) — nhu cầu này **chưa được đáp ứng đầy đủ** ở v3.0 và cần trao đổi thêm với nhóm: hoặc (a) bổ sung bảng `conduct_scores` vào schema ở giai đoạn sau, hoặc (b) xác nhận rằng "điểm rèn luyện" trong bảng nhu cầu chỉ mang tính tham khảo chung, không thuộc phạm vi tính cảnh báo tự động của SEWS.

---

### ADR-014: Không có bảng lịch hẹn/nhắc lịch riêng — dùng `warning_action`

**Quyết định:** Việc đặt lịch gặp và nhắc lịch tự động (A-07, A-08 của bản 2.0, vốn dùng bảng `appointments` riêng với `scheduled_at`/`reminder_sent`) được đơn giản hóa thành các dòng `warning_action` với `action_type` phù hợp (`SCHEDULE_MEETING`, `MEETING_ATTENDED`, `MEETING_NO_SHOW`).

**Lý do:** ERD thực tế không có bảng `appointments`. Thay vì thêm bảng ngoài phạm vi CSDL đã chốt, nhóm chọn dùng lại `warning_action` để giữ đúng thiết kế đã có.

**Hệ quả:** Không có cơ chế nhắc lịch tự động (cron nhắc trước giờ hẹn) ở v3.0. Nếu cần, bổ sung bảng `appointment` riêng (có `scheduled_at`, `reminder_sent`) ở giai đoạn sau, không ảnh hưởng đến Rule Engine.

---

### ADR-015: Cập nhật Actor & RBAC theo bảng "Đối tượng sử dụng" thực tế

**Quyết định:** Thay 6 role chung chung của bản 2.0 (`ADMIN`/`CTSV_MANAGER`/`CTSV_STAFF`/`GVCN`/`ADVISOR`/`STUDENT`) bằng 6 role khớp đúng bảng "Đối tượng sử dụng" của dự án: `SYSTEM_ADMIN`, `FACULTY_BOARD`, `CLASS_ADVISOR`, `FACULTY_STAFF`, `STUDENT_AFFAIRS_ASSISTANT`, `COMMS_ASSISTANT`.

**Lý do:** Bảng vai trò gốc của bản 2.0 không khớp với danh sách actor thật của dự án — thiếu vai trò Giáo vụ Khoa và Trợ lý Truyền thông, đồng thời gộp chung "Cán bộ Ban CTSV" và "Lãnh đạo" theo cách không phản ánh đúng cơ cấu Khoa.

**Hệ quả:** Sinh viên không còn là actor trực tiếp đăng nhập hệ thống ở v3.0 (không có role `STUDENT`). Nếu nhà trường vẫn muốn sinh viên tự xem cảnh báo của mình, cần bổ sung lại actor này và xác nhận phạm vi dữ liệu được phép xem.

---

*Tài liệu này là nguồn sự thật duy nhất (single source of truth) cho kiến trúc hệ thống SEWS. Mọi quyết định kỹ thuật thay đổi so với tài liệu này phải được cập nhật vào đây và ghi ADR tương ứng trước khi implement.*

*— Nhóm phát triển CTK47A, Trường Đại học Đà Lạt · 08/2026*
