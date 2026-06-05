"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plug,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Settings,
  ChevronDown,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/connect", label: "Connect Platforms", icon: Plug },
  { href: "/campaigns", label: "Campaigns", icon: BarChart3 },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/ai-assistant", label: "AI Assistant", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  workspace: Workspace | null;
  userEmail?: string;
}

export function Sidebar({ workspace, userEmail }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col bg-[#0F1629] text-white flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">DemandVibes</span>
      </div>

      {/* Workspace Switcher */}
      {workspace && (
        <div className="px-4 py-3 border-b border-white/10">
          <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/20 text-blue-400 text-xs font-bold uppercase">
                {workspace.name.charAt(0)}
              </div>
              <span className="font-medium truncate max-w-[140px]">{workspace.name}</span>
            </div>
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User Avatar */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold uppercase flex-shrink-0">
            {userEmail?.charAt(0) ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {userEmail ?? "User"}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {workspace?.plan ?? "free"} plan
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
