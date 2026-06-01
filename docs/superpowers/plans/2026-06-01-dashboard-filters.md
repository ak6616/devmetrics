# Dashboard Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sprawić, by globalne filtry TopBar (okres 7d/30d/90d, repo, członek) realnie zmieniały dane na wszystkich 6 sekcjach dashboardu.

**Architecture:** Wspólny `FilterProvider`/`useFilters()` (Context) montowany w `DashboardLayout`. Czysty moduł `lib/filters.ts` z helperami + per-stronowymi selektorami, które biorą `filters` i zwracają przefiltrowane/przeskalowane wersje istniejących danych z `mock-data.ts` (kształty zachowane 1:1). TopBar zapisuje do Contextu; każda strona czyta przez `useFilters()` + `useMemo(selectX)`.

**Tech Stack:** Next.js (App Router, client components), React (Context, useMemo), TypeScript, recharts. Brak frameworka testowego — weryfikacja `tsc`/`build`/smoke.

**Konwencje:**
- Wszystkie 6 stron są już `"use client"`.
- Selektory zachowują dokładnie te same pola co eksporty `mock-data.ts`, więc strony zmieniają tylko źródło danych (import → hook), nie JSX.
- Determinizm: seed z nazw, bez `Math.random`/`Date.now` w ścieżce renderu (zgodność SSR/hydracji).

---

### Task 1: FilterProvider (Context)

**Files:**
- Create: `src/lib/filters-context.tsx`

- [ ] **Step 1: Utwórz context**

Create `src/lib/filters-context.tsx`:

```tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type Range = "7d" | "30d" | "90d";

interface FiltersState {
  range: Range;
  repo: string; // "all" | nazwa repo
  member: string; // "all" | nazwa członka
  setRange: (r: Range) => void;
  setRepo: (r: string) => void;
  setMember: (m: string) => void;
}

const FiltersContext = createContext<FiltersState | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<Range>("30d");
  const [repo, setRepo] = useState<string>("all");
  const [member, setMember] = useState<string>("all");
  return (
    <FiltersContext.Provider value={{ range, repo, member, setRange, setRepo, setMember }}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters(): FiltersState {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within FilterProvider");
  return ctx;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (brak błędów).

- [ ] **Step 3: Commit**

```bash
git add src/lib/filters-context.tsx
git commit -m "feat(filters): add FilterProvider context"
```

---

### Task 2: Montaż providera w DashboardLayout

**Files:**
- Modify: `src/components/layout/dashboard-layout.tsx`

- [ ] **Step 1: Import providera**

W `src/components/layout/dashboard-layout.tsx` dodaj import (po istniejących importach komponentów):

```tsx
import { FilterProvider } from "@/lib/filters-context";
```

- [ ] **Step 2: Owiń zwracany JSX providerem**

Zamień `return (` ... `);` tak, by całość była opakowana. Konkretnie zamień najbardziej zewnętrzny element:

Z:
```tsx
  return (
    <div className="flex h-screen overflow-hidden bg-background">
```
na:
```tsx
  return (
    <FilterProvider>
    <div className="flex h-screen overflow-hidden bg-background">
```

oraz domykający tag — ostatnia linia `return` (`</div>` zamykający ten kontener) na `</div></FilterProvider>`. Konkretnie zamień końcówkę:
```tsx
      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
```
na:
```tsx
      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
    </FilterProvider>
  );
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/dashboard-layout.tsx
git commit -m "feat(filters): mount FilterProvider in dashboard layout"
```

---

### Task 3: Moduł filtrów + selektory (`lib/filters.ts`)

**Files:**
- Create: `src/lib/filters.ts`

- [ ] **Step 1: Utwórz moduł z helperami i wszystkimi selektorami**

Create `src/lib/filters.ts`:

```ts
import * as M from "@/lib/mock-data";
import type { Range } from "@/lib/filters-context";

export interface Filters {
  range: Range;
  repo: string;
  member: string;
}

export const REPOS = ["devmetrics/api", "devmetrics/web", "devmetrics/infra"];
export const MEMBERS: string[] = M.topContributors.map((c) => c.name);

export function windowDays(range: Range): number {
  return range === "7d" ? 7 : range === "30d" ? 30 : 90;
}

// ── deterministyczne skalowanie (seed z nazw) ────────────────────────────────
function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function repoFactor(repo: string): number {
  if (repo === "all") return 1;
  return 0.25 + ((hash(repo) % 1000) / 1000) * 0.25; // 0.25–0.50
}
export function memberShare(member: string): number {
  if (member === "all") return 1;
  const total = M.topContributors.reduce((s, c) => s + c.prsMerged, 0);
  const me = M.topContributors.find((c) => c.name === member)?.prsMerged ?? 0;
  return total ? me / total : 0;
}
function combined(f: Filters): number {
  return repoFactor(f.repo) * memberShare(f.member);
}
const sInt = (n: number, k: number) => Math.max(0, Math.round(n * k));
const sFloat = (n: number, k: number, d = 1) =>
  parseFloat((n * k).toFixed(d));

function fmtHM(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

// ── 90-dniowe serie bazowe (deterministyczne) ────────────────────────────────
const BASE_DAYS = 90;
function dayAt(i: number, total: number): string {
  const end = new Date(2026, 2, 30); // anchor: 2026-03-30
  const d = new Date(end);
  d.setDate(end.getDate() - (total - 1 - i));
  return d.toISOString().slice(0, 10);
}
const _prR = rng(42);
const basePrActivity = Array.from({ length: BASE_DAYS }, (_, i) => ({
  date: dayAt(i, BASE_DAYS),
  opened: Math.floor(_prR() * 8) + 2,
  merged: Math.floor(_prR() * 7) + 1,
  rejected: Math.floor(_prR() * 2),
}));
const _rvR = rng(137);
const baseReview = Array.from({ length: BASE_DAYS }, (_, i) => ({
  date: dayAt(i, BASE_DAYS),
  avgHours: parseFloat((_rvR() * 6 + 2).toFixed(1)),
  target: 6,
}));
const _slaR = rng(512);
const baseSla = Array.from({ length: BASE_DAYS }, (_, i) => ({
  date: dayAt(i, BASE_DAYS),
  compliance: parseFloat((_slaR() * 30 + 65).toFixed(1)),
  target: 80,
}));

function sliceByRange<T>(arr: T[], range: Range): T[] {
  return arr.slice(-windowDays(range));
}
function repoForIndex(i: number): string {
  return REPOS[i % REPOS.length];
}

// ── Selektory per strona ─────────────────────────────────────────────────────

export function selectDashboard(f: Filters) {
  const k = combined(f);
  const days = windowDays(f.range);

  const prActivityData = sliceByRange(basePrActivity, f.range).map((d) => ({
    date: d.date,
    opened: sInt(d.opened, k),
    merged: sInt(d.merged, k),
    rejected: sInt(d.rejected, k),
  }));
  const reviewTimeTrendData = sliceByRange(baseReview, f.range);

  const mergedSum = prActivityData.reduce((s, d) => s + d.merged, 0);
  const avgHours =
    reviewTimeTrendData.reduce((s, d) => s + d.avgHours, 0) /
    (reviewTimeTrendData.length || 1);

  let topContributors = M.topContributors.map((c) => ({
    ...c,
    prsMerged: sInt(c.prsMerged, repoFactor(f.repo)),
  }));
  if (f.member !== "all")
    topContributors = topContributors.filter((c) => c.name === f.member);

  const prSizeDistribution = M.prSizeDistribution.map((d) => ({
    ...d,
    value: sInt(d.value, k),
  }));

  const heatmapData = M.heatmapData.slice(-days).map((d) => ({
    ...d,
    count: sInt(d.count, k),
  }));

  let recent = M.recentActivity.map((r, i) => ({ ...r, _repo: repoForIndex(i) }));
  if (f.repo !== "all") recent = recent.filter((r) => r._repo === f.repo);
  if (f.member !== "all") recent = recent.filter((r) => r.author === f.member);
  const recentActivity = recent.map(({ _repo, ...r }) => r);

  const kpiData = {
    totalPRsMerged: {
      value: mergedSum,
      trend: M.kpiData.totalPRsMerged.trend,
      previousValue: sInt(M.kpiData.totalPRsMerged.previousValue, k),
    },
    avgReviewTime: {
      value: fmtHM(avgHours),
      trendMinutes: M.kpiData.avgReviewTime.trendMinutes,
      trend: M.kpiData.avgReviewTime.trend,
    },
    teamVelocity: {
      value: sInt(M.kpiData.teamVelocity.value, k),
      trend: M.kpiData.teamVelocity.trend,
      sparkline: M.kpiData.teamVelocity.sparkline.map((v) => sInt(v, k)),
    },
    openPRs: {
      value: sInt(M.kpiData.openPRs.value, k),
      delta: M.kpiData.openPRs.delta,
    },
  };

  return {
    kpiData,
    prActivityData,
    reviewTimeTrendData,
    topContributors,
    prSizeDistribution,
    heatmapData,
    recentActivity,
    rangeDays: days,
  };
}

export function selectPrMetrics(f: Filters) {
  const d = selectDashboard(f);
  return {
    prActivityData: d.prActivityData,
    prSizeDistribution: d.prSizeDistribution,
    recentActivity: d.recentActivity,
  };
}

export function selectCodeReview(f: Filters) {
  const k = combined(f);
  const slaComplianceData = sliceByRange(baseSla, f.range);

  let reviewByMember = M.reviewByMember.map((m) => ({
    ...m,
    reviewed: sInt(m.reviewed, repoFactor(f.repo)),
  }));
  if (f.member !== "all")
    reviewByMember = reviewByMember.filter((m) => m.name === f.member);

  let bn = M.reviewBottlenecks.map((b, i) => ({ ...b, _repo: repoForIndex(i) }));
  if (f.repo !== "all") bn = bn.filter((b) => b._repo === f.repo);
  if (f.member !== "all") bn = bn.filter((b) => b.author === f.member);
  const reviewBottlenecks = bn.map(({ _repo, ...b }) => b);

  const codeReviewMetrics = {
    ...M.codeReviewMetrics,
    prsWithNoReviews: sInt(M.codeReviewMetrics.prsWithNoReviews, k),
  };

  return { codeReviewMetrics, reviewByMember, slaComplianceData, reviewBottlenecks };
}

function sprintsForRange(range: Range): number {
  return range === "7d" ? 2 : range === "30d" ? 4 : 10;
}

export function selectVelocity(f: Filters) {
  const rf = repoFactor(f.repo);
  const n = sprintsForRange(f.range);

  const velocityData = M.velocityData.slice(-n).map((s) => ({
    ...s,
    planned: sInt(s.planned, rf),
    completed: sInt(s.completed, rf),
  }));

  let memberVelocity = M.memberVelocity.slice(
    -Math.min(n, M.memberVelocity.length)
  );
  if (f.member !== "all") {
    memberVelocity = memberVelocity.map((row) => ({
      sprint: (row as Record<string, unknown>).sprint as string,
      [f.member]: ((row as Record<string, number>)[f.member] ?? 0),
    })) as typeof M.memberVelocity;
  }

  return { velocityData, memberVelocity };
}

export function selectBurndown(f: Filters) {
  const k = combined(f);
  const burndownData = M.burndownData.map((d) => ({
    day: d.day,
    ideal: sFloat(d.ideal, k),
    actual: sFloat(d.actual, k),
    completed: sInt(d.completed, k),
  }));
  // scopeChanges: filtr po repo (deterministycznie po indeksie); brak pola author
  let sc = M.scopeChanges.map((s, i) => ({ ...s, _repo: repoForIndex(i) }));
  if (f.repo !== "all") sc = sc.filter((s) => s._repo === f.repo);
  const scopeChanges = sc.map(({ _repo, ...s }) => s);
  return { burndownData, scopeChanges };
}

export function selectTeam(f: Filters) {
  const rf = repoFactor(f.repo);
  let teamMembers = M.teamMembers.map((m) => ({
    ...m,
    prsMerged: sInt(m.prsMerged, rf),
    openPRs: sInt(m.openPRs, rf),
    sparkline: m.sparkline.map((v) => sInt(v, rf)),
  }));
  if (f.member !== "all")
    teamMembers = teamMembers.filter((m) => m.name === f.member);
  return { teamMembers };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS. (Jeśli `memberVelocity` zgłosi konflikt typu z `as`, potwierdź kształt `M.memberVelocity` w `mock-data.ts` i dostosuj rzutowanie — dane to tablica obiektów `{ sprint: string, [name]: number }`.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/filters.ts
git commit -m "feat(filters): add filter helpers and per-page selectors"
```

---

### Task 4: Podpięcie TopBar do Contextu

**Files:**
- Modify: `src/components/layout/top-bar.tsx` (pełna podmiana zawartości)

- [ ] **Step 1: Zastąp całą zawartość pliku**

Replace `src/components/layout/top-bar.tsx` with:

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS. (Usunęliśmy prop `onDateRangeChange`; `DashboardLayout` go nie przekazywał, więc bez zmian tam.)

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/top-bar.tsx
git commit -m "feat(filters): wire TopBar to filter context (range/repo/member)"
```

---

### Task 5: Strona Dashboard

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Podmień import mock-data na hooki**

W `src/app/(dashboard)/dashboard/page.tsx` zamień blok importu:

```tsx
import {
  kpiData,
  prActivityData,
  reviewTimeTrendData,
  topContributors,
  prSizeDistribution,
  heatmapData,
  recentActivity,
} from "@/lib/mock-data";
```
na:
```tsx
import { useMemo } from "react";
import { useFilters } from "@/lib/filters-context";
import { selectDashboard } from "@/lib/filters";
```

- [ ] **Step 2: Pobierz dane z selektora wewnątrz komponentu**

W `export default function DashboardPage() {`, jako pierwsze linie ciała funkcji (przed `const totalPRs = ...`), dodaj:

```tsx
  const f = useFilters();
  const {
    kpiData,
    prActivityData,
    reviewTimeTrendData,
    topContributors,
    prSizeDistribution,
    heatmapData,
    recentActivity,
  } = useMemo(() => selectDashboard(f), [f]);
```

Uwaga: `heatmapData` jest też używany w `ReviewHeatmap()` (komponent modułowy). Zmień `ReviewHeatmap` tak, by przyjmował dane przez prop: zamień sygnaturę `function ReviewHeatmap() {` na `function ReviewHeatmap({ heatmapData }: { heatmapData: { week: number; day: number; count: number }[] }) {` i w JSX dashboardu zamień `<ReviewHeatmap />` na `<ReviewHeatmap heatmapData={heatmapData} />`.

- [ ] **Step 3: Dynamiczny podtytuł (opcjonalny, spójność)**

Zamień tekst `Overview of your team&apos;s development metrics — last 30 days` na:
```tsx
Overview of your team&apos;s development metrics — last {rangeDaysLabel}
```
i dodaj do destrukturyzacji `rangeDays` oraz powyżej `return`: `const rangeDaysLabel = `${rangeDays} days`;` (dodaj `rangeDays` do destrukturyzacji z `selectDashboard`).

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/dashboard/page.tsx"
git commit -m "feat(filters): wire Dashboard page to filters"
```

---

### Task 6: Strona PR Metrics

**Files:**
- Modify: `src/app/(dashboard)/dashboard/pr-metrics/page.tsx`

- [ ] **Step 1: Podmień import**

Zamień blok:
```tsx
import {
  prActivityData,
  prSizeDistribution,
  recentActivity,
} from "@/lib/mock-data";
```
na:
```tsx
import { useFilters } from "@/lib/filters-context";
import { selectPrMetrics } from "@/lib/filters";
```
(Strona już importuje `useMemo` z `react` — pozostaw.)

- [ ] **Step 2: Pobierz dane z selektora**

Jako pierwsze linie ciała komponentu strony dodaj:
```tsx
  const f = useFilters();
  const { prActivityData, prSizeDistribution, recentActivity } = useMemo(
    () => selectPrMetrics(f),
    [f]
  );
```
Istniejące lokalne `useState`/`useMemo` (np. sortowanie tabeli) operują na `recentActivity` i działają bez zmian — globalny filtr je poprzedza.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/dashboard/pr-metrics/page.tsx"
git commit -m "feat(filters): wire PR Metrics page to filters"
```

---

### Task 7: Strona Code Review

**Files:**
- Modify: `src/app/(dashboard)/dashboard/code-review/page.tsx`

- [ ] **Step 1: Podmień import**

Zamień blok:
```tsx
import {
  codeReviewMetrics,
  reviewByMember,
  slaComplianceData,
  reviewBottlenecks,
} from "@/lib/mock-data";
```
na:
```tsx
import { useMemo } from "react";
import { useFilters } from "@/lib/filters-context";
import { selectCodeReview } from "@/lib/filters";
```
(Jeśli strona już importuje `useMemo`/`useState` z `react`, nie duplikuj — dodaj tylko brakujące.)

- [ ] **Step 2: Pobierz dane z selektora**

Jako pierwsze linie ciała komponentu strony dodaj:
```tsx
  const f = useFilters();
  const { codeReviewMetrics, reviewByMember, slaComplianceData, reviewBottlenecks } =
    useMemo(() => selectCodeReview(f), [f]);
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/dashboard/code-review/page.tsx"
git commit -m "feat(filters): wire Code Review page to filters"
```

---

### Task 8: Strona Velocity

**Files:**
- Modify: `src/app/(dashboard)/dashboard/velocity/page.tsx`

- [ ] **Step 1: Podmień import**

Zamień:
```tsx
import { velocityData, memberVelocity } from "@/lib/mock-data";
```
na:
```tsx
import { useMemo } from "react";
import { useFilters } from "@/lib/filters-context";
import { selectVelocity } from "@/lib/filters";
```
(Strona importuje już `useState` z react — pozostaw; dodaj `useMemo` jeśli go nie ma.)

- [ ] **Step 2: Pobierz dane z selektora**

Jako pierwsze linie ciała komponentu dodaj:
```tsx
  const f = useFilters();
  const { velocityData, memberVelocity } = useMemo(() => selectVelocity(f), [f]);
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/dashboard/velocity/page.tsx"
git commit -m "feat(filters): wire Velocity page to filters"
```

---

### Task 9: Strona Burndown

**Files:**
- Modify: `src/app/(dashboard)/dashboard/burndown/page.tsx`

- [ ] **Step 1: Podmień import**

Zamień:
```tsx
import { burndownData, scopeChanges } from "@/lib/mock-data";
```
na:
```tsx
import { useMemo } from "react";
import { useFilters } from "@/lib/filters-context";
import { selectBurndown } from "@/lib/filters";
```
(Strona importuje już `useState` — pozostaw.)

- [ ] **Step 2: Pobierz dane z selektora**

Jako pierwsze linie ciała komponentu dodaj:
```tsx
  const f = useFilters();
  const { burndownData, scopeChanges } = useMemo(() => selectBurndown(f), [f]);
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/dashboard/burndown/page.tsx"
git commit -m "feat(filters): wire Burndown page to filters"
```

---

### Task 10: Strona Team

**Files:**
- Modify: `src/app/(dashboard)/dashboard/team/page.tsx`

- [ ] **Step 1: Podmień import**

Zamień:
```tsx
import { teamMembers } from "@/lib/mock-data";
```
na:
```tsx
import { useMemo } from "react";
import { useFilters } from "@/lib/filters-context";
import { selectTeam } from "@/lib/filters";
```

- [ ] **Step 2: Pobierz dane z selektora**

Jako pierwsze linie ciała komponentu dodaj:
```tsx
  const f = useFilters();
  const { teamMembers } = useMemo(() => selectTeam(f), [f]);
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/dashboard/team/page.tsx"
git commit -m "feat(filters): wire Team page to filters"
```

---

### Task 11: Weryfikacja całości

**Files:** brak zmian — tylko weryfikacja.

- [ ] **Step 1: Pełny build**

Run: `npm run build`
Expected: build przechodzi bez błędów.

- [ ] **Step 2: Smoke ręczny (dev)**

Run: `npm run dev`, zaloguj się, na **każdej** z 6 sekcji sprawdź:
1. Przełączanie 7d/30d/90d zmienia długość/kształt wykresów i KPI; podtytuł Dashboardu pokazuje liczbę dni.
2. Wybór repo (np. `devmetrics/api`) zmienia liczby i filtruje listy otagowane repo (recent activity, bottlenecks, scope changes); etykieta TopBar pokazuje wybrane repo.
3. Wybór członka filtruje listy per-osoba (Recent Activity po autorze, Review by member, Team, Top Contributors) i skaluje serie; etykieta pokazuje wybraną osobę.
4. „All repos"/„All members" resetuje; „Custom" jest wyszarzony i nieklikalny.

Expected: filtry realnie działają na wszystkich sekcjach.

- [ ] **Step 3: Push gałęzi**

```bash
git push -u origin feat/dashboard-filters
```

---

## Notatki dla wykonawcy

- **Kształty zachowane 1:1** — selektory zwracają te same pola co eksporty `mock-data.ts`, więc strony zmieniają tylko źródło danych. Jeśli `tsc` zgłosi niezgodność pola, porównaj z oryginalnym kształtem w `mock-data.ts` i wyrównaj selektor.
- **Determinizm** — żadnego `Math.random`/`Date.now` w renderze; seedy ze stałych/nazw.
- **Pusty wynik filtra** (np. członek bez rekordów) → puste tablice; recharts/tabela renderują pusto, co jest poprawnym efektem filtra.
- **Zakres**: tylko 6 sekcji dashboardu. Settings bez zmian. `mock-data.ts` pozostaje źródłem bazowym (nietknięty).
- Commit per task; gałąź `feat/dashboard-filters`; push w Task 11.
```
