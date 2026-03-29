"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitPullRequest,
  Clock,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "PRs", href: "/dashboard/pr-metrics", icon: GitPullRequest },
  { label: "Review", href: "/dashboard/code-review", icon: Clock },
  { label: "Velocity", href: "/dashboard/velocity", icon: TrendingUp },
  { label: "More", href: "/dashboard/settings", icon: MoreHorizontal },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "flex md:hidden",
        "bg-background border-t border-border",
        "h-16 pb-safe"
      )}
      aria-label="Mobile navigation"
    >
      {MOBILE_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5",
              "text-xs font-medium transition-colors duration-150",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span className="text-[10px] leading-none">{label}</span>
            {isActive && (
              <span className="absolute bottom-0 w-6 h-0.5 rounded-t bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
