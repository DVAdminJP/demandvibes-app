"use client";

import { useState } from "react";
import { CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Platform } from "@/types";

interface PlatformDef {
  id: Platform;
  name: string;
  description: string;
  color: string;
  logo: React.ReactNode;
}

interface ConnectCardProps {
  platform: PlatformDef;
  connections: { platform: string; account_name: string | null; is_active: boolean }[];
}

export function ConnectCard({ platform, connections }: ConnectCardProps) {
  const [loading, setLoading] = useState(false);
  const isConnected = connections.length > 0;

  async function handleConnect() {
    setLoading(true);
    try {
      const res = await fetch(`/api/oauth/${platform.id}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50">
              {platform.logo}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{platform.name}</h3>
              <Badge
                variant={isConnected ? "success" : "outline"}
                className="mt-0.5"
              >
                {isConnected ? `${connections.length} account${connections.length > 1 ? "s" : ""}` : "Not connected"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          {platform.description}
        </p>

        {/* Connected Accounts */}
        {isConnected && (
          <div className="mb-4 space-y-1.5">
            {connections.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm py-1.5 px-2.5 rounded-lg bg-gray-50"
              >
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-gray-700 truncate">
                  {c.account_name ?? "Connected account"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <Button
          className="w-full gap-2"
          variant={isConnected ? "outline" : "default"}
          onClick={handleConnect}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          {loading ? "Connecting..." : isConnected ? "Add account" : "Connect"}
        </Button>
      </CardContent>
    </Card>
  );
}
