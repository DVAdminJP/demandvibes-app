import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's workspace
  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!member) {
    redirect("/onboarding");
  }

  const workspace = (member.workspaces as unknown) as { id: string; name: string; slug: string; plan: string; created_at: string } | null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar workspace={workspace} userEmail={user.email} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
