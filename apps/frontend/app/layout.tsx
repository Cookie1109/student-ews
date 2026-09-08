import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hệ thống Cảnh báo Sớm Học vụ (SEWS) - Đại học Đà Lạt",
  description: "Hệ thống cảnh báo sớm sinh viên cần theo dõi dựa trên dữ liệu học tập",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
