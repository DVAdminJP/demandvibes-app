import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: member } = await supabase
    .from("workspace_members")
    .select("*, workspaces(*)")
    .single();

  const workspace = member?.workspaces as { name: string; slug: string; plan: string } | null;

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" description="Manage your workspace and account" />
      <div className="flex-1 p-8 max-w-2xl space-y-6">
        {/* Workspace */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Workspace name</Label>
              <Input defaultValue={workspace?.name ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input defaultValue={workspace?.slug ?? ""} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-400">app.demandvibes.com/{workspace?.slug}</p>
            </div>
            <Button size="sm">Save changes</Button>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Team Members</CardTitle>
              <Button size="sm" variant="outline">Invite member</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold uppercase">
                  {user?.email?.charAt(0) ?? "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  <p className="text-xs text-gray-400">Account owner</p>
                </div>
              </div>
              <Badge variant="info">Owner</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Billing */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900 capitalize">{workspace?.plan ?? "Free"} plan</p>
                <p className="text-xs text-gray-400">Upgrade for more connected accounts and team members</p>
              </div>
              <Button size="sm" variant="outline">Upgrade plan</Button>
            </div>
            <Separator className="my-4" />
            <p className="text-xs text-gray-400">
              Billing integration coming soon. Contact{" "}
              <a href="mailto:billing@demandvibes.com" className="text-blue-600 hover:underline">
                billing@demandvibes.com
              </a>{" "}
              for enterprise pricing.
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-0 shadow-sm border border-red-100">
          <CardHeader>
            <CardTitle className="text-base text-red-700">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Delete workspace</p>
                <p className="text-xs text-gray-400">Permanently remove this workspace and all data</p>
              </div>
              <Button size="sm" variant="destructive">Delete</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
