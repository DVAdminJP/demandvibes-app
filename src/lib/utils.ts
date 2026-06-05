import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function formatROAS(value: number): string {
  return `${value.toFixed(2)}x`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    google: "Google Ads",
    meta: "Meta Ads",
    linkedin: "LinkedIn Ads",
  };
  return labels[platform] ?? platform;
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    google: "#4285F4",
    meta: "#1877F2",
    linkedin: "#0A66C2",
  };
  return colors[platform] ?? "#6B7280";
}
