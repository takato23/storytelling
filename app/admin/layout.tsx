import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { hasSupabaseCredentials } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  if (!hasSupabaseCredentials()) {
    return <>{children}</>;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fadmin");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    redirect("/cuenta/pedidos");
  }

  return <AdminShell>{children}</AdminShell>;
}
