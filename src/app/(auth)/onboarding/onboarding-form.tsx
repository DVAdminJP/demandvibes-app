"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils";

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const slug = slugify(name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error: rpcError } = await supabase.rpc("create_workspace_with_owner", {
        p_name: name.trim(),
        p_slug: slug,
        p_user_id: user.id,
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Workspace name</Label>
        <Input
          id="name"
          placeholder="Acme Marketing Agency"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
        />
      </div>

      {name && (
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
          <span className="text-gray-500">Your workspace URL: </span>
          <span className="font-mono font-medium text-gray-700">
            app.demandvibes.com/{slug}
          </span>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
        {loading ? "Creating workspace..." : "Create workspace →"}
      </Button>
    </form>
  );
}
