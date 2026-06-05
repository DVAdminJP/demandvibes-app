"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-gray-500">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-500">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
