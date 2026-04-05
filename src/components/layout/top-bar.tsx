"use client";

import { useState } from "react";
import {
  RefreshCw,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Check,
  X,
  GitPullRequest,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DateRange = "7d" | "30d" | "90d" | "custom";

// ── Mock users for switching ────────────────────────────────────────────────
const USERS = [
  { id: 1, name: "Alice Chen", email: "alice@acmecorp.com", initials: "AC" },
  { id: 2, name: "Bob Kumar", email: "bob@acmecorp.com", initials: "BK" },
  { id: 3, name: "Carol Smith", email: "carol@acmecorp.com", initials: "CS" },
  { id: 4, name: "Dave Lee", email: "dave@acmecorp.com", initials: "DL" },
];

// ── Mock notifications ──────────────────────────────────────────────────────
const NOTIFICATIONS = [
  { id: 1, type: "pr" as const, title: "PR #342 merged", body: "Add user authentication flow was merged by Alex Rivera", time: "5m ago", read: false },
  { id: 2, type: "review" as const, title: "Review requested", body: "Jordan Kim requested your review on PR #340", time: "23m ago", read: false },
  { id: 3, type: "alert" as const, title: "CI pipeline failed", body: "Build failed on branch feature/webhook-handlers", time: "1h ago", read: false },
  { id: 4, type: "comment" as const, title: "New comment on PR #339", body: 'Casey Johnson commented: "LGTM, nice refactor"', time: "2h ago", read: true },
  { id: 5, type: "pr" as const, title: "PR #338 opened", body: "Morgan Lee opened Add dark mode support", time: "3h ago", read: true },
];

const REPOS = ["All repos", "devmetrics/api", "devmetrics/web", "devmetrics/infra"];

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
  const [selectedRepo, setSelectedRepo] = useState("All repos");
  const [teamOpen, setTeamOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(USERS[0]);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  function closeAll() {
    setRepoOpen(false);
    setTeamOpen(false);
    setUserOpen(false);
    setNotifOpen(false);
  }

  function handleSwitchUser(user: typeof USERS[0]) {
    setCurrentUser(user);
    setUserOpen(false);
  }

  function handleSelectRepo(repo: string) {
    setSelectedRepo(repo);
    setRepoOpen(false);
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: number) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function notifIcon(type: string) {
    switch (type) {
      case "pr": return <GitPullRequest className="h-4 w-4 text-purple-500" />;
      case "review": return <User className="h-4 w-4 text-blue-500" />;
      case "alert": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "comment": return <MessageSquare className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
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

      {/* Repository Switcher */}
      <div className="relative hidden md:block">
        <button
          onClick={() => { setRepoOpen((o) => !o); setTeamOpen(false); setUserOpen(false); setNotifOpen(false); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border",
            "text-xs font-medium text-foreground bg-background",
            "hover:bg-muted transition-colors duration-150"
          )}
        >
          <span>{selectedRepo}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
        {repoOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={closeAll} />
            <div className="absolute right-0 mt-1 w-44 bg-popover border border-border rounded-md shadow-lg z-20 py-1">
              {REPOS.map((repo) => (
                <button
                  key={repo}
                  onClick={() => handleSelectRepo(repo)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 text-xs text-popover-foreground hover:bg-accent transition-colors",
                    selectedRepo === repo && "font-semibold"
                  )}
                >
                  {repo}
                  {selectedRepo === repo && <Check className="h-3 w-3 text-primary" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Team Filter */}
      <div className="relative hidden md:block">
        <button
          onClick={() => { setTeamOpen((o) => !o); setRepoOpen(false); setUserOpen(false); setNotifOpen(false); }}
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

      {/* Notification Bell with Modal */}
      <div className="relative">
        <button
          onClick={() => { setNotifOpen((o) => !o); setRepoOpen(false); setTeamOpen(false); setUserOpen(false); }}
          aria-label="Notifications"
          className={cn(
            "relative h-8 w-8 flex items-center justify-center rounded-md",
            "text-muted-foreground hover:text-foreground hover:bg-muted",
            "transition-colors duration-150"
          )}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-destructive border-2 border-background flex items-center justify-center">
              <span className="text-[9px] font-bold text-destructive-foreground">{unreadCount}</span>
            </span>
          )}
        </button>
        {notifOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={closeAll} />
            <div className="absolute right-0 mt-1 w-80 bg-popover border border-border rounded-lg shadow-xl z-20 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-popover-foreground">Notifications</p>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
              {/* Notification List */}
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => markRead(notif.id)}
                    className={cn(
                      "w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-0",
                      !notif.read && "bg-primary/5"
                    )}
                  >
                    <div className="mt-0.5 flex-shrink-0">{notifIcon(notif.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-xs truncate", !notif.read ? "font-semibold text-popover-foreground" : "text-popover-foreground")}>
                          {notif.title}
                        </p>
                        {!notif.read && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notif.body}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">{notif.time}</p>
                    </div>
                  </button>
                ))}
              </div>
              {/* Footer */}
              <div className="px-4 py-2 border-t border-border">
                <button className="w-full text-center text-xs text-primary hover:underline py-1">
                  View all notifications
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Avatar Menu with Switching */}
      <div className="relative">
        <button
          onClick={() => { setUserOpen((o) => !o); setRepoOpen(false); setTeamOpen(false); setNotifOpen(false); }}
          aria-label="User menu"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1",
            "hover:bg-muted transition-colors duration-150"
          )}
        >
          <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">{currentUser.initials}</span>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
        </button>
        {userOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={closeAll} />
            <div className="absolute right-0 mt-1 w-56 bg-popover border border-border rounded-md shadow-lg z-20 py-1">
              {/* Current user info */}
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-medium text-popover-foreground">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser.email}</p>
              </div>
              {/* User switcher */}
              <div className="border-b border-border py-1">
                <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Switch account</p>
                {USERS.filter((u) => u.id !== currentUser.id).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSwitchUser(user)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-popover-foreground hover:bg-accent transition-colors"
                  >
                    <div className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-semibold text-muted-foreground">{user.initials}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
              {/* Menu items */}
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
