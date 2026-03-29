"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitPullRequest,
  Clock,
  TrendingUp,
  Flame,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "PR Metrics", href: "/dashboard/pr-metrics", icon: GitPullRequest },
  { label: "Code Review", href: "/dashboard/code-review", icon: Clock },
  { label: "Team Velocity", href: "/dashboard/velocity", icon: TrendingUp },
  { label: "Sprint Burndown", href: "/dashboard/burndown", icon: Flame },
  { label: "Team Members", href: "/dashboard/team", icon: Users },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
] as const;

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export function Sidebar({ collapsed, onToggle, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60",
        className
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-16 px-4 border-b border-white/10 flex-shrink-0",
          collapsed ? "justify-center" : "gap-2"
        )}
      >
        <BarChart2 className="h-6 w-6 text-primary flex-shrink-0" />
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight text-sidebar-foreground">
            DevMetrics
          </span>
        )}
      </div>

      {/* Avatar / Team Area */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary">AC</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                Team: Acme Corp
              </p>
              <p className="text-xs text-sidebar-foreground/60">Plan: Pro</p>
            </div>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center py-3 border-b border-white/10 flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">AC</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors duration-150",
                "hover:bg-white/10 hover:text-sidebar-foreground",
                isActive
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-sidebar-foreground/70",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 flex-shrink-0",
                  isActive ? "text-primary" : "text-sidebar-foreground/70"
                )}
              />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Status Section */}
      <div className="flex-shrink-0 border-t border-white/10 px-3 py-3 space-y-1.5">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success flex-shrink-0" />
              <span className="text-xs text-sidebar-foreground/70">
                GitHub Connected ✓
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <span className="text-xs text-sidebar-foreground/60">
                Sync: 2 min ago
              </span>
            </div>
          </>
        ) : (
          <div className="flex justify-center">
            <span className="h-2 w-2 rounded-full bg-success" title="GitHub Connected" />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "absolute -right-3 top-20 z-10",
          "h-6 w-6 rounded-full bg-sidebar border border-white/20",
          "flex items-center justify-center",
          "text-sidebar-foreground/60 hover:text-sidebar-foreground",
          "transition-colors duration-150 shadow-md"
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  );
}
