"use client";

import { useState } from "react";
import {
  RefreshCw,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DateRange = "7d" | "30d" | "90d" | "custom";

interface TopBarProps {
  title: string;
  onDateRangeChange?: (range: DateRange) => void;
  onRefresh?: () => void;
  className?: string;
}

export function TopBar({
  title,
  onDateRangeChange,
  onRefresh,
  className,
}: TopBarProps) {
  const [activeRange, setActiveRange] = useState<DateRange>("30d");
  const [repoOpen, setRepoOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifCount] = useState(3);

  const DATE_RANGES: { label: string; value: DateRange }[] = [
    { label: "Last 7d", value: "7d" },
    { label: "Last 30d", value: "30d" },
    { label: "Last 90d", value: "90d" },
    { label: "Custom", value: "custom" },
  ];

  function handleDateRange(range: DateRange) {
    setActiveRange(range);
    onDateRangeChange?.(range);
  }

  function handleRefresh() {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  }

  // Close all dropdowns when clicking outside
  function closeAll() {
    setRepoOpen(false);
    setTeamOpen(false);
    setUserOpen(false);
  }

  return (
    <header
      className={cn(
        "h-16 flex items-center gap-3 px-4 md:px-6 bg-background border-b border-border flex-shrink-0",
        className
      )}
    >
      {/* Page Title */}
      <h1 className="text-lg font-semibold text-foreground mr-auto truncate hidden md:block">
        {title}
      </h1>

      {/* Date Range Buttons */}
      <div className="hidden sm:flex items-center gap-0.5 bg-muted rounded-md p-0.5">
        {DATE_RANGES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handleDateRange(value)}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium transition-colors duration-150",
              activeRange === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Repository Filter */}
      <div className="relative hidden md:block">
        <button
          onClick={() => { setRepoOpen((o) => !o); setTeamOpen(false); setUserOpen(false); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border",
            "text-xs font-medium text-foreground bg-background",
            "hover:bg-muted transition-colors duration-150"
          )}
        >
          <span>All repos</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
        {repoOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={closeAll} />
            <div className="absolute right-0 mt-1 w-44 bg-popover border border-border rounded-md shadow-lg z-20 py-1">
              {["All repos", "devmetrics/api", "devmetrics/web", "devmetrics/infra"].map((repo) => (
                <button
                  key={repo}
                  onClick={() => setRepoOpen(false)}
                  className="w-full text-left px-3 py-1.5 text-xs text-popover-foreground hover:bg-accent transition-colors"
                >
                  {repo}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Team Filter */}
      <div className="relative hidden md:block">
        <button
          onClick={() => { setTeamOpen((o) => !o); setRepoOpen(false); setUserOpen(false); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border",
            "text-xs font-medium text-foreground bg-background",
            "hover:bg-muted transition-colors duration-150"
          )}
        >
          <span>All members</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
        {teamOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={closeAll} />
            <div className="absolute right-0 mt-1 w-44 bg-popover border border-border rounded-md shadow-lg z-20 py-1">
              {["All members", "Alice Chen", "Bob Kumar", "Carol Smith", "Dave Lee"].map((member) => (
                <button
                  key={member}
                  onClick={() => setTeamOpen(false)}
                  className="w-full text-left px-3 py-1.5 text-xs text-popover-foreground hover:bg-accent transition-colors"
                >
                  {member}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Refresh */}
      <button
        onClick={handleRefresh}
        aria-label="Refresh data"
        className={cn(
          "h-8 w-8 flex items-center justify-center rounded-md",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          "transition-colors duration-150"
        )}
      >
        <RefreshCw
          className={cn("h-4 w-4", isRefreshing && "animate-spin")}
        />
      </button>

      {/* Notification Bell */}
      <button
        aria-label="Notifications"
        className={cn(
          "relative h-8 w-8 flex items-center justify-center rounded-md",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          "transition-colors duration-150"
        )}
      >
        <Bell className="h-4 w-4" />
        {notifCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive border border-background" />
        )}
      </button>

      {/* User Avatar Menu */}
      <div className="relative">
        <button
          onClick={() => { setUserOpen((o) => !o); setRepoOpen(false); setTeamOpen(false); }}
          aria-label="User menu"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1",
            "hover:bg-muted transition-colors duration-150"
          )}
        >
          <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">AC</span>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
        </button>
        {userOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={closeAll} />
            <div className="absolute right-0 mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-20 py-1">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-medium text-popover-foreground">Alice Chen</p>
                <p className="text-xs text-muted-foreground">alice@acmecorp.com</p>
              </div>
              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-popover-foreground hover:bg-accent transition-colors">
                <User className="h-3.5 w-3.5" />
                Profile
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-popover-foreground hover:bg-accent transition-colors">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </button>
              <div className="border-t border-border mt-1 pt-1">
                <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-accent transition-colors">
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
