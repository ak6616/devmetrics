"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MobileNav } from "./mobile-nav";
import { cn } from "@/lib/utils";

/** Map pathnames to human-readable page titles */
function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/pr-metrics": "PR Metrics",
    "/dashboard/code-review": "Code Review",
    "/dashboard/team-velocity": "Team Velocity",
    "/dashboard/sprint-burndown": "Sprint Burndown",
    "/dashboard/team-members": "Team Members",
    "/dashboard/settings": "Settings",
  };
  return map[pathname] ?? "DevMetrics";
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Restore collapsed preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sidebar-collapsed");
      if (stored !== null) setSidebarCollapsed(stored === "true");
    } catch {
      // localStorage may not be available in SSR
    }
  }, []);

  // Persist collapsed preference
  const handleToggle = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar-collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Close drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar — hidden on mobile, shown on md+ */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggle} />
      </div>

      {/* Tablet/Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          aria-modal="true"
          role="dialog"
          aria-label="Navigation drawer"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="absolute left-0 top-0 bottom-0 z-50 flex">
            <Sidebar
              collapsed={false}
              onToggle={() => setDrawerOpen(false)}
              className="h-full shadow-2xl"
            />
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className={cn(
                "absolute top-4 right-4",
                "h-7 w-7 flex items-center justify-center rounded-full",
                "bg-white/10 hover:bg-white/20 text-sidebar-foreground",
                "transition-colors duration-150"
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar title={pageTitle} />

        {/* Scrollable Page Content */}
        <main
          id="main-content"
          className={cn(
            "flex-1 overflow-y-auto",
            "p-4 md:p-6",
            // Reserve space for mobile bottom nav
            "pb-20 md:pb-6"
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
