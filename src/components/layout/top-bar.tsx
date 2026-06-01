"use client";

import { useState } from "react";
import { RefreshCw, Bell, ChevronDown, User, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilters, type Range } from "@/lib/filters-context";
import { REPOS, MEMBERS } from "@/lib/filters";

interface TopBarProps {
  title: string;
  onRefresh?: () => void;
  className?: string;
}

export function TopBar({ title, onRefresh, className }: TopBarProps) {
  const { range, repo, member, setRange, setRepo, setMember } = useFilters();
  const [repoOpen, setRepoOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifCount] = useState(3);

  const DATE_RANGES: { label: string; value: Range }[] = [
    { label: "Last 7d", value: "7d" },
    { label: "Last 30d", value: "30d" },
    { label: "Last 90d", value: "90d" },
  ];

  function handleRefresh() {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  }

  function closeAll() {
    setRepoOpen(false);
    setTeamOpen(false);
    setUserOpen(false);
  }

  const repoLabel = repo === "all" ? "All repos" : repo;
  const memberLabel = member === "all" ? "All members" : member;

  return (
    <header
      className={cn(
        "h-16 flex items-center gap-3 px-4 md:px-6 bg-background border-b border-border flex-shrink-0",
        className
      )}
    >
      <h1 className="text-lg font-semibold text-foreground mr-auto truncate hidden md:block">
        {title}
      </h1>

      {/* Date Range */}
      <div className="hidden sm:flex items-center gap-0.5 bg-muted rounded-md p-0.5">
        {DATE_RANGES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setRange(value)}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium transition-colors duration-150",
              range === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
        <button
          disabled
          title="Coming soon"
          className="px-2.5 py-1 rounded text-xs font-medium text-muted-foreground/40 cursor-not-allowed"
        >
          Custom
        </button>
      </div>

      {/* Repository Filter */}
      <div className="relative hidden md:block">
        <button
          onClick={() => { setRepoOpen((o) => !o); setTeamOpen(false); setUserOpen(false); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border",
            "text-xs font-medium text-foreground bg-background hover:bg-muted transition-colors duration-150"
          )}
        >
          <span>{repoLabel}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
        {repoOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={closeAll} />
            <div className="absolute right-0 mt-1 w-44 bg-popover border border-border rounded-md shadow-lg z-20 py-1">
              {[{ label: "All repos", value: "all" }, ...REPOS.map((r) => ({ label: r, value: r }))].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setRepo(opt.value); setRepoOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors",
                    repo === opt.value ? "text-foreground font-medium" : "text-popover-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Member Filter */}
      <div className="relative hidden md:block">
        <button
          onClick={() => { setTeamOpen((o) => !o); setRepoOpen(false); setUserOpen(false); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border",
            "text-xs font-medium text-foreground bg-background hover:bg-muted transition-colors duration-150"
          )}
        >
          <span>{memberLabel}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
        {teamOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={closeAll} />
            <div className="absolute right-0 mt-1 w-44 bg-popover border border-border rounded-md shadow-lg z-20 py-1 max-h-72 overflow-y-auto">
              {[{ label: "All members", value: "all" }, ...MEMBERS.map((m) => ({ label: m, value: m }))].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setMember(opt.value); setTeamOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors",
                    member === opt.value ? "text-foreground font-medium" : "text-popover-foreground"
                  )}
                >
                  {opt.label}
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
          "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
        )}
      >
        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
      </button>

      {/* Notification Bell */}
      <button
        aria-label="Notifications"
        className={cn(
          "relative h-8 w-8 flex items-center justify-center rounded-md",
          "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
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
          className={cn("flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted transition-colors duration-150")}
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
                <User className="h-3.5 w-3.5" /> Profile
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-popover-foreground hover:bg-accent transition-colors">
                <Settings className="h-3.5 w-3.5" /> Settings
              </button>
              <div className="border-t border-border mt-1 pt-1">
                <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-accent transition-colors">
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
