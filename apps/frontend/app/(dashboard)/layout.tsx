import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { backendOrigin } from "@/lib/backend-origin";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const accessToken = (await cookies()).get("sms_access_token")?.value;
  if (!accessToken) redirect("/login");

  const session = await fetch(`${backendOrigin()}/api/v1/auth/me`, {
    headers: { cookie: `sms_access_token=${encodeURIComponent(accessToken)}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (session.status === 401 || session.status === 403) redirect("/login");
  if (!session.ok) throw new Error("Không thể kết nối dịch vụ xác thực");

  return <DashboardShell>{children}</DashboardShell>;
}
