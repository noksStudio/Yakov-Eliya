import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminNav />
      <div className="flex-1 md:ms-64">{children}</div>
    </div>
  );
}
