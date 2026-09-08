export type WarningLevel = "red" | "yellow" | "green";
export type InterventionStatus = "none" | "contacted" | "monitoring" | "resolved";

export interface Student {
  id: string;
  name: string;
  className: string;
  faculty: string;
  major: string;
  enrollYear: number;
  advisor: string;
  currentGPA: number;
  trainingScore: number;
  activityScore: number;
  riskScore: number;
  warningLevel: WarningLevel;
  academicStatus: "normal" | "warning1" | "warning2" | "suspended";
  interventionStatus: InterventionStatus;
  gpaHistory: { semester: string; gpa: number }[];
  trainingHistory: { semester: string; score: number }[];
  grades: { subject: string; credits: number; score: number; letterGrade: string }[];
  interventions: InterventionLog[];
  phone: string;
  email: string;
  gpaTrend: "up" | "down" | "stable";
}

export interface InterventionLog {
  id: string;
  date: string;
  method: "direct" | "phone" | "email";
  content: string;
  result: string;
  nextPlan: string;
  nextDate: string;
  advisor: string;
}

export interface UploadHistory {
  id: string;
  type: "academic" | "training" | "activity";
  uploadedBy: string;
  uploadedAt: string;
  semester: string;
  totalRecords: number;
  successRecords: number;
  errorRecords: number;
  errors: { line: number; message: string }[];
}

const baseInterventions: InterventionLog[] = [
  {
    id: "i1",
    date: "2024-12-05",
    method: "direct",
    content: "Gặp trực tiếp tại phòng tư vấn. Sinh viên phản ánh gặp khó khăn với môn Giải tích 2 và Lập trình hướng đối tượng. Có vấn đề về tài chính ảnh hưởng đến việc học.",
    result: "Đã giới thiệu sinh viên đến phòng Hỗ trợ học tập và chương trình học bổng vượt khó.",
    nextPlan: "Kiểm tra kết quả giữa kỳ và tình trạng đăng ký học bổng.",
    nextDate: "2025-01-10",
    advisor: "ThS. Nguyễn Thị Hoa"
  },
  {
    id: "i2",
    date: "2024-10-20",
    method: "phone",
    content: "Gọi điện nhắc nhở về tỷ lệ vắng mặt cao trong tháng 10. Sinh viên cho biết bị ốm kéo dài.",
    result: "Sinh viên đã nộp giấy bệnh viện và cam kết cải thiện chuyên cần.",
    nextPlan: "Theo dõi điểm danh 2 tuần tiếp theo.",
    nextDate: "2024-11-05",
    advisor: "ThS. Nguyễn Thị Hoa"
  }
];

export const students: Student[] = [
  {
    id: "SV001",
    name: "Nguyễn Văn An",
    className: "CNTT-K22A",
    faculty: "Công nghệ Thông tin",
    major: "Kỹ thuật Phần mềm",
    enrollYear: 2022,
    advisor: "ThS. Nguyễn Thị Hoa",
    currentGPA: 1.45,
    trainingScore: 38,
    activityScore: 20,
    riskScore: 88,
    warningLevel: "red",
    academicStatus: "warning2",
    interventionStatus: "monitoring",
    gpaTrend: "down",
    phone: "0901234567",
    email: "nguyenvanan@student.edu.vn",
    gpaHistory: [
      { semester: "HK1 2022-23", gpa: 2.85 },
      { semester: "HK2 2022-23", gpa: 2.62 },
      { semester: "HK1 2023-24", gpa: 2.10 },
      { semester: "HK2 2023-24", gpa: 1.75 },
      { semester: "HK1 2024-25", gpa: 1.45 },
    ],
    trainingHistory: [
      { semester: "HK1 2022-23", score: 72 },
      { semester: "HK2 2022-23", score: 65 },
      { semester: "HK1 2023-24", score: 58 },
      { semester: "HK2 2023-24", score: 45 },
      { semester: "HK1 2024-25", score: 38 },
    ],
    grades: [
      { subject: "Giải tích 2", credits: 3, score: 3.5, letterGrade: "D+" },
      { subject: "Lập trình hướng đối tượng", credits: 4, score: 2.0, letterGrade: "F" },
      { subject: "Cơ sở dữ liệu", credits: 3, score: 4.0, letterGrade: "D" },
      { subject: "Mạng máy tính", credits: 3, score: 2.5, letterGrade: "F" },
      { subject: "Kiến trúc máy tính", credits: 2, score: 5.0, letterGrade: "D+" },
      { subject: "Tiếng Anh 3", credits: 3, score: 5.5, letterGrade: "C" },
    ],
    interventions: baseInterventions,
  },
  {
    id: "SV002",
    name: "Trần Thị Bích",
    className: "QTKD-K23B",
    faculty: "Quản trị Kinh doanh",
    major: "Marketing",
    enrollYear: 2023,
    advisor: "TS. Lê Minh Tuấn",
    currentGPA: 1.82,
    trainingScore: 42,
    activityScore: 35,
    riskScore: 74,
    warningLevel: "red",
    academicStatus: "warning1",
    interventionStatus: "contacted",
    gpaTrend: "down",
    phone: "0912345678",
    email: "tranthiMich@student.edu.vn",
    gpaHistory: [
      { semester: "HK1 2023-24", gpa: 2.40 },
      { semester: "HK2 2023-24", gpa: 2.15 },
      { semester: "HK1 2024-25", gpa: 1.82 },
    ],
    trainingHistory: [
      { semester: "HK1 2023-24", score: 68 },
      { semester: "HK2 2023-24", score: 55 },
      { semester: "HK1 2024-25", score: 42 },
    ],
    grades: [
      { subject: "Marketing căn bản", credits: 3, score: 5.0, letterGrade: "C+" },
      { subject: "Quản trị học", credits: 3, score: 4.5, letterGrade: "D+" },
      { subject: "Kinh tế vi mô", credits: 3, score: 3.0, letterGrade: "D" },
      { subject: "Thống kê kinh doanh", credits: 3, score: 2.5, letterGrade: "F" },
      { subject: "Tiếng Anh thương mại", credits: 3, score: 6.0, letterGrade: "C+" },
    ],
    interventions: [baseInterventions[0]],
  },
  {
    id: "SV003",
    name: "Phạm Hoàng Cường",
    className: "CNTT-K22B",
    faculty: "Công nghệ Thông tin",
    major: "An toàn Thông tin",
    enrollYear: 2022,
    advisor: "ThS. Nguyễn Thị Hoa",
    currentGPA: 1.95,
    trainingScore: 50,
    activityScore: 40,
    riskScore: 68,
    warningLevel: "red",
    academicStatus: "warning1",
    interventionStatus: "monitoring",
    gpaTrend: "down",
    phone: "0923456789",
    email: "phamhoangcuong@student.edu.vn",
    gpaHistory: [
      { semester: "HK1 2022-23", gpa: 3.10 },
      { semester: "HK2 2022-23", gpa: 2.75 },
      { semester: "HK1 2023-24", gpa: 2.40 },
      { semester: "HK2 2023-24", gpa: 2.20 },
      { semester: "HK1 2024-25", gpa: 1.95 },
    ],
    trainingHistory: [
      { semester: "HK1 2022-23", score: 80 },
      { semester: "HK2 2022-23", score: 72 },
      { semester: "HK1 2023-24", score: 65 },
      { semester: "HK2 2023-24", score: 58 },
      { semester: "HK1 2024-25", score: 50 },
    ],
    grades: [
      { subject: "Bảo mật thông tin", credits: 3, score: 5.5, letterGrade: "C" },
      { subject: "Mật mã học", credits: 3, score: 4.0, letterGrade: "D" },
      { subject: "Hệ điều hành", credits: 3, score: 5.0, letterGrade: "C" },
      { subject: "Lập trình Python", credits: 3, score: 6.5, letterGrade: "B" },
    ],
    interventions: [baseInterventions[1]],
  },
  {
    id: "SV004",
    name: "Lê Thị Dung",
    className: "KT-K23A",
    faculty: "Kế toán",
    major: "Kế toán Doanh nghiệp",
    enrollYear: 2023,
    advisor: "TS. Lê Minh Tuấn",
    currentGPA: 2.05,
    trainingScore: 55,
    activityScore: 45,
    riskScore: 58,
    warningLevel: "yellow",
    academicStatus: "normal",
    interventionStatus: "contacted",
    gpaTrend: "down",
    phone: "0934567890",
    email: "lethidung@student.edu.vn",
    gpaHistory: [
      { semester: "HK1 2023-24", gpa: 2.60 },
      { semester: "HK2 2023-24", gpa: 2.35 },
      { semester: "HK1 2024-25", gpa: 2.05 },
    ],
    trainingHistory: [
      { semester: "HK1 2023-24", score: 75 },
      { semester: "HK2 2023-24", score: 65 },
      { semester: "HK1 2024-25", score: 55 },
    ],
    grades: [
      { subject: "Kế toán tài chính 1", credits: 3, score: 5.5, letterGrade: "C" },
      { subject: "Nguyên lý kế toán", credits: 3, score: 6.0, letterGrade: "C+" },
      { subject: "Kinh tế vĩ mô", credits: 3, score: 4.5, letterGrade: "D+" },
      { subject: "Toán tài chính", credits: 3, score: 4.0, letterGrade: "D" },
    ],
    interventions: [],
  },
  {
    id: "SV005",
    name: "Hoàng Minh Đức",
    className: "CNTT-K22A",
    faculty: "Công nghệ Thông tin",
    major: "Kỹ thuật Phần mềm",
    enrollYear: 2022,
    advisor: "ThS. Nguyễn Thị Hoa",
    currentGPA: 2.25,
    trainingScore: 60,
    activityScore: 50,
    riskScore: 48,
    warningLevel: "yellow",
    academicStatus: "normal",
    interventionStatus: "monitoring",
    gpaTrend: "stable",
    phone: "0945678901",
    email: "hoangminhduc@student.edu.vn",
    gpaHistory: [
      { semester: "HK1 2022-23", gpa: 2.45 },
      { semester: "HK2 2022-23", gpa: 2.30 },
      { semester: "HK1 2023-24", gpa: 2.20 },
      { semester: "HK2 2023-24", gpa: 2.28 },
      { semester: "HK1 2024-25", gpa: 2.25 },
    ],
    trainingHistory: [
      { semester: "HK1 2022-23", score: 65 },
      { semester: "HK2 2022-23", score: 62 },
      { semester: "HK1 2023-24", score: 58 },
      { semester: "HK2 2023-24", score: 62 },
      { semester: "HK1 2024-25", score: 60 },
    ],
    grades: [
      { subject: "Thuật toán", credits: 3, score: 6.5, letterGrade: "B" },
      { subject: "Lập trình Web", credits: 3, score: 5.5, letterGrade: "C" },
      { subject: "Kiểm thử phần mềm", credits: 3, score: 6.0, letterGrade: "C+" },
      { subject: "Quản lý dự án IT", credits: 3, score: 5.0, letterGrade: "C" },
    ],
    interventions: [],
  },
  {
    id: "SV006",
    name: "Vũ Thị Hà",
    className: "QTKD-K22A",
    faculty: "Quản trị Kinh doanh",
    major: "Quản trị Tài chính",
    enrollYear: 2022,
    advisor: "TS. Lê Minh Tuấn",
    currentGPA: 2.42,
    trainingScore: 62,
    activityScore: 55,
    riskScore: 40,
    warningLevel: "yellow",
    academicStatus: "normal",
    interventionStatus: "none",
    gpaTrend: "stable",
    phone: "0956789012",
    email: "vuthiha@student.edu.vn",
    gpaHistory: [
      { semester: "HK1 2022-23", gpa: 2.80 },
      { semester: "HK2 2022-23", gpa: 2.65 },
      { semester: "HK1 2023-24", gpa: 2.50 },
      { semester: "HK2 2023-24", gpa: 2.45 },
      { semester: "HK1 2024-25", gpa: 2.42 },
    ],
    trainingHistory: [
      { semester: "HK1 2022-23", score: 78 },
      { semester: "HK2 2022-23", score: 72 },
      { semester: "HK1 2023-24", score: 68 },
      { semester: "HK2 2023-24", score: 65 },
      { semester: "HK1 2024-25", score: 62 },
    ],
    grades: [
      { subject: "Quản trị tài chính", credits: 3, score: 6.5, letterGrade: "B" },
      { subject: "Phân tích đầu tư", credits: 3, score: 6.0, letterGrade: "C+" },
      { subject: "Ngân hàng thương mại", credits: 3, score: 5.5, letterGrade: "C" },
    ],
    interventions: [],
  },
  {
    id: "SV007",
    name: "Đinh Văn Giang",
    className: "KT-K22B",
    faculty: "Kế toán",
    major: "Kiểm toán",
    enrollYear: 2022,
    advisor: "ThS. Nguyễn Thị Hoa",
    currentGPA: 3.15,
    trainingScore: 82,
    activityScore: 70,
    riskScore: 15,
    warningLevel: "green",
    academicStatus: "normal",
    interventionStatus: "resolved",
    gpaTrend: "up",
    phone: "0967890123",
    email: "dinhvangiang@student.edu.vn",
    gpaHistory: [
      { semester: "HK1 2022-23", gpa: 2.95 },
      { semester: "HK2 2022-23", gpa: 3.05 },
      { semester: "HK1 2023-24", gpa: 3.10 },
      { semester: "HK2 2023-24", gpa: 3.12 },
      { semester: "HK1 2024-25", gpa: 3.15 },
    ],
    trainingHistory: [
      { semester: "HK1 2022-23", score: 75 },
      { semester: "HK2 2022-23", score: 78 },
      { semester: "HK1 2023-24", score: 80 },
      { semester: "HK2 2023-24", score: 82 },
      { semester: "HK1 2024-25", score: 82 },
    ],
    grades: [
      { subject: "Kiểm toán nội bộ", credits: 3, score: 8.0, letterGrade: "B+" },
      { subject: "Kiểm toán độc lập", credits: 3, score: 7.5, letterGrade: "B" },
      { subject: "Pháp luật kinh tế", credits: 2, score: 8.5, letterGrade: "A" },
    ],
    interventions: [],
  },
  {
    id: "SV008",
    name: "Nguyễn Thị Hiền",
    className: "CNTT-K23A",
    faculty: "Công nghệ Thông tin",
    major: "Trí tuệ Nhân tạo",
    enrollYear: 2023,
    advisor: "ThS. Nguyễn Thị Hoa",
    currentGPA: 3.52,
    trainingScore: 88,
    activityScore: 80,
    riskScore: 8,
    warningLevel: "green",
    academicStatus: "normal",
    interventionStatus: "none",
    gpaTrend: "up",
    phone: "0978901234",
    email: "nguyenthihien@student.edu.vn",
    gpaHistory: [
      { semester: "HK1 2023-24", gpa: 3.40 },
      { semester: "HK2 2023-24", gpa: 3.48 },
      { semester: "HK1 2024-25", gpa: 3.52 },
    ],
    trainingHistory: [
      { semester: "HK1 2023-24", score: 85 },
      { semester: "HK2 2023-24", score: 87 },
      { semester: "HK1 2024-25", score: 88 },
    ],
    grades: [
      { subject: "Machine Learning", credits: 3, score: 9.0, letterGrade: "A" },
      { subject: "Deep Learning", credits: 3, score: 8.5, letterGrade: "A" },
      { subject: "Xử lý ngôn ngữ tự nhiên", credits: 3, score: 8.0, letterGrade: "B+" },
    ],
    interventions: [],
  },
  {
    id: "SV009",
    name: "Trần Quốc Hùng",
    className: "QTKD-K22B",
    faculty: "Quản trị Kinh doanh",
    major: "Logistics",
    enrollYear: 2022,
    advisor: "TS. Lê Minh Tuấn",
    currentGPA: 1.60,
    trainingScore: 35,
    activityScore: 25,
    riskScore: 85,
    warningLevel: "red",
    academicStatus: "warning2",
    interventionStatus: "none",
    gpaTrend: "down",
    phone: "0989012345",
    email: "tranquochung@student.edu.vn",
    gpaHistory: [
      { semester: "HK1 2022-23", gpa: 2.20 },
      { semester: "HK2 2022-23", gpa: 2.05 },
      { semester: "HK1 2023-24", gpa: 1.90 },
      { semester: "HK2 2023-24", gpa: 1.75 },
      { semester: "HK1 2024-25", gpa: 1.60 },
    ],
    trainingHistory: [
      { semester: "HK1 2022-23", score: 60 },
      { semester: "HK2 2022-23", score: 52 },
      { semester: "HK1 2023-24", score: 45 },
      { semester: "HK2 2023-24", score: 40 },
      { semester: "HK1 2024-25", score: 35 },
    ],
    grades: [
      { subject: "Logistics căn bản", credits: 3, score: 4.0, letterGrade: "D" },
      { subject: "Quản lý chuỗi cung ứng", credits: 3, score: 3.5, letterGrade: "D+" },
      { subject: "Nghiệp vụ ngoại thương", credits: 3, score: 2.5, letterGrade: "F" },
    ],
    interventions: [],
  },
  {
    id: "SV010",
    name: "Lý Thị Kim",
    className: "KT-K23A",
    faculty: "Kế toán",
    major: "Kế toán Doanh nghiệp",
    enrollYear: 2023,
    advisor: "TS. Lê Minh Tuấn",
    currentGPA: 2.80,
    trainingScore: 74,
    activityScore: 60,
    riskScore: 25,
    warningLevel: "green",
    academicStatus: "normal",
    interventionStatus: "none",
    gpaTrend: "up",
    phone: "0990123456",
    email: "lythikim@student.edu.vn",
    gpaHistory: [
      { semester: "HK1 2023-24", gpa: 2.65 },
      { semester: "HK2 2023-24", gpa: 2.72 },
      { semester: "HK1 2024-25", gpa: 2.80 },
    ],
    trainingHistory: [
      { semester: "HK1 2023-24", score: 70 },
      { semester: "HK2 2023-24", score: 72 },
      { semester: "HK1 2024-25", score: 74 },
    ],
    grades: [
      { subject: "Kế toán tài chính 2", credits: 3, score: 7.5, letterGrade: "B" },
      { subject: "Thuế", credits: 3, score: 7.0, letterGrade: "B" },
      { subject: "Luật kinh tế", credits: 2, score: 8.0, letterGrade: "B+" },
    ],
    interventions: [],
  },
];

export const semesterTrend = [
  { semester: "HK2\n2022-23", red: 15, yellow: 22, green: 145 },
  { semester: "HK1\n2023-24", red: 20, yellow: 28, green: 132 },
  { semester: "HK2\n2023-24", red: 25, yellow: 30, green: 123 },
  { semester: "HK1\n2024-25", red: 28, yellow: 35, green: 112 },
];

export const facultyHeatmap = [
  { faculty: "Công nghệ Thông tin", classes: ["CNTT-K22A", "CNTT-K22B", "CNTT-K23A", "CNTT-K23B"], rates: [28, 22, 15, 10] },
  { faculty: "Quản trị Kinh doanh", classes: ["QTKD-K22A", "QTKD-K22B", "QTKD-K23A", "QTKD-K23B"], rates: [18, 32, 20, 14] },
  { faculty: "Kế toán", classes: ["KT-K22A", "KT-K22B", "KT-K23A", "KT-K23B"], rates: [12, 16, 22, 8] },
  { faculty: "Luật", classes: ["LU-K22A", "LU-K22B", "LU-K23A"], rates: [10, 14, 18] },
];

export const uploadHistory: UploadHistory[] = [
  {
    id: "u1",
    type: "academic",
    uploadedBy: "Admin Nguyễn",
    uploadedAt: "2024-12-15 09:32",
    semester: "HK1 2024-25",
    totalRecords: 500,
    successRecords: 493,
    errorRecords: 7,
    errors: [
      { line: 45, message: "Mã SV 'SV9999' không tồn tại trong hệ thống" },
      { line: 102, message: "Điểm GPA '5.2' vượt ngoài khoảng hợp lệ (0-4)" },
      { line: 203, message: "Thiếu cột 'Học kỳ'" },
    ]
  },
  {
    id: "u2",
    type: "training",
    uploadedBy: "Admin Nguyễn",
    uploadedAt: "2024-12-14 14:18",
    semester: "HK1 2024-25",
    totalRecords: 500,
    successRecords: 500,
    errorRecords: 0,
    errors: []
  },
  {
    id: "u3",
    type: "activity",
    uploadedBy: "Phòng CTSV",
    uploadedAt: "2024-12-10 10:05",
    semester: "HK1 2024-25",
    totalRecords: 500,
    successRecords: 498,
    errorRecords: 2,
    errors: [
      { line: 87, message: "Giá trị cột 'Điểm hoạt động' không phải số" },
    ]
  },
];

export const warningConfig = {
  redGPA: 1.8,
  yellowGPA: 2.4,
  redTraining: 45,
  yellowTraining: 60,
  weights: { academic: 60, training: 25, activity: 15 },
};

export const topWarningClasses = [
  { className: "QTKD-K22B", faculty: "QTKD", total: 42, warning: 18, rate: 42.9 },
  { className: "CNTT-K22A", faculty: "CNTT", total: 38, warning: 14, rate: 36.8 },
  { className: "CNTT-K22B", faculty: "CNTT", total: 40, warning: 14, rate: 35.0 },
  { className: "KT-K23A", faculty: "Kế toán", total: 35, warning: 12, rate: 34.3 },
  { className: "QTKD-K23A", faculty: "QTKD", total: 44, warning: 14, rate: 31.8 },
];
