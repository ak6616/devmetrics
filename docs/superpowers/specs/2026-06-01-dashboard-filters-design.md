# Działające filtry dashboardu (DevMetrics) — design

**Data:** 2026-06-01
**Status:** zaakceptowany
**Repo:** devmetrics · branch `feat/dashboard-filters`
**Podejście:** B (wspólny toolkit transformacji filtrów na istniejących mockach)

## Problem

Filtry w globalnym `TopBar` (okres 7d/30d/90d/Custom, repo „All repos", członek „All members")
są **dekoracyjne** — nigdy nie podpięte:
- `TopBar` dostaje tylko `title` (`dashboard-layout.tsx`), bez callbacków.
- Date range zmienia tylko lokalne podświetlenie; repo/member dropdown tylko zamyka się
  (`setRepoOpen(false)`/`setTeamOpen(false)`), bez stanu/callbacku, etykieta na sztywno.
- Strony renderują statyczne stałe z `@/lib/mock-data` — nic nie reaguje na wybór.

Cel: filtry mają realnie zmieniać dane na **wszystkich 6 sekcjach** dashboardu
(Dashboard, PR Metrics, Code Review, Velocity, Burndown, Team).

## Decyzje (z brainstormingu)

- Źródło danych: **mock reagujący na filtry** (nie realne API).
- Zakres: **wszystkie 6 podstron** dashboardu (rozszerzone z samego Dashboardu).
- „Custom": **odroczone** — działają presety 7d/30d/90d; przycisk Custom wyszarzony.
- Architektura: **B** — zostają istniejące zestawy mock jako baza; nakładamy jednolite
  helpery filtrowania + per-stronowe selektory. (A „event store" / C „hybryda" odrzucone
  jako zbyt kosztowne na ten cel; liczby są „wiarygodnym mockiem", nie idealną symulacją
  spójną między stronami.)

## Architektura

### 1. Wspólny stan filtrów — `src/lib/filters-context.tsx` (nowy, `"use client"`)
- `FilterProvider` + `useFilters()` → `{ range, repo, member, setRange, setRepo, setMember }`.
- `range: "7d" | "30d" | "90d"` (domyślnie `"30d"`); `repo: string` (domyślnie `"all"`);
  `member: string` (domyślnie `"all"`).
- Montowany w `DashboardLayout` (owija `TopBar` + `children`), więc i TopBar, i strony
  czytają ten sam stan.

### 2. Toolkit + selektory — `src/lib/filters.ts` (nowy, czyste funkcje)
Wspólne stałe i helpery:
- `REPOS = ["devmetrics/api", "devmetrics/web", "devmetrics/infra"]`,
  `MEMBERS` = nazwy spójne z danymi (`Sarah Chen`, `Alex Rivera`, `Jordan Kim`,
  `Taylor Swift`, `Morgan Lee`, `Casey Johnson`, `Riley Park`, `Jamie Woods`).
- `windowDays(range): 7 | 30 | 90`.
- `sliceByRange(series, range)` — ostatnie N elementów serii dziennej.
- `repoFactor(repo): number` — `repo === "all" ? 1 : deterministyczny ułamek (~0.2–0.5)`
  z seeda nazwy repo (stały, bez `Math.random`).
- `memberShare(member, member-list): number` — `member === "all" ? 1 : udział danej osoby`
  (z jej `prsMerged` względem sumy).
- `scaleInt(n, factor)` / `scaleFloat(n, factor)` — skalowanie z zaokrągleniem.

Per-stronowe selektory (każdy bierze `filters`, zwraca gotowe dane danej strony,
wyprowadzone z istniejących stałych w `mock-data.ts`):
- `selectDashboard(f)` → `{ kpi, prActivity[], reviewTimeTrend[], topContributors[],
  prSizeDistribution[], heatmap[], recentActivity[], rangeDays }`.
- `selectPrMetrics(f)` → dane sekcji PR Metrics (zachowując pola, których strona używa).
- `selectCodeReview(f)` → `{ codeReviewMetrics, reviewByMember[], slaCompliance[],
  reviewBottlenecks[] }`.
- `selectVelocity(f)` → `{ velocity[], memberVelocity[] }` (range → liczba ostatnich sprintów).
- `selectBurndown(f)` → `{ burndown[], scopeChanges[] }`.
- `selectTeam(f)` → `{ members[] }`.

Reguły transformacji (jednolite):
- **range**: serie dzienne (`prActivity`, `reviewTimeTrend`, `slaCompliance`, `heatmap`)
  generowane/rozszerzone do 90 dni i cięte do okna; KPI liczone z okna; strony sprintowe
  (`velocity`, `burndown`) → range mapuje na liczbę ostatnich sprintów (7d→2, 30d→4, 90d→all).
- **repo**: `repo === "all"` = pełne; konkretne repo → `repoFactor` skaluje liczby/serie
  i filtruje listy otagowane repo (`recentActivity`, `reviewBottlenecks` — repo przypisane
  deterministycznie po indeksie rekordu).
- **member**: listy per-osoba (`topContributors`, `reviewByMember`, `teamMembers`,
  `memberVelocity`, `recentActivity` po `author`) → filtrowane do wybranej osoby; serie
  skalowane `memberShare`.

Determinizm: wszystkie transformacje czyste i deterministyczne (seed z nazw), bez
`Math.random`/`Date.now` w ścieżce renderu → brak rozjazdu SSR/hydracji.

### 3. `top-bar.tsx` — podpięcie
- Zastąp lokalny `activeRange` + martwy `onDateRangeChange` odczytem/zapisem z `useFilters()`.
- Repo i Members: listy z `REPOS`/`MEMBERS`; klik **ustawia** filtr (`setRepo`/`setMember`)
  i zamyka dropdown; **etykieta** pokazuje aktualny wybór („All repos"/konkretne; analogicznie
  member). Element „All …" resetuje do `"all"`.
- „Custom": render jako `disabled` (wyszarzony, `title="Coming soon"`), bez akcji.

### 4. Strony (6) — konsumpcja
Każda: `"use client"`, `const f = useFilters(); const data = useMemo(() => selectX(f), [f]);`
render z `data.*` zamiast statycznych importów. Podtytuły z „last 30 days" → dynamiczne
wg `range`. Istniejąca lokalna interaktywność (np. sortowanie tabeli w PR Metrics) zostaje
i działa **na** danych po globalnym filtrze.

## Data flow
Klik w TopBar → setter w `FilterProvider` → strony przez `useFilters()` + `useMemo`
przeliczają `selectX(filters)` → wykresy/tabele/KPI re-render.

## Error handling
Czyste funkcje, brak sieci. `repo`/`member === "all"` = sentinel braku filtra. Selektory
zawsze zwracają komplet pól (gdy filtr wyzeruje listę — pusta tablica + UI „brak danych"
tam gdzie strona już to obsługuje; inaczej zostawiamy min. 1 element/agregat = 0).

## Testy / weryfikacja
Brak frameworka testowego. Weryfikacja:
- `npx tsc --noEmit` + `npm run build` czysto.
- Smoke na **każdej** z 6 stron: przełączanie 7/30/90 zmienia serie/KPI; wybór repo
  zmienia liczby i filtruje listy repo; wybór członka filtruje listy per-osoba (np.
  Recent Activity po autorze) i skaluje serie; etykiety TopBar się aktualizują; „all" resetuje.

## Poza zakresem (YAGNI)
Settings (bez filtrów), date-picker „Custom", podpięcie realnego API, zachowanie przycisku
Refresh (zostaje kosmetyczny), idealna spójność liczb między stronami (świadomie — to mock).

## Plan wykonania (zarys — szczegóły w writing-plans)
Wielokrokowy: (1) `filters-context` + montaż w layoutcie; (2) `filters.ts` helpery +
selektory; (3) `top-bar` wpięcie; (4–9) po jednej stronie: Dashboard, PR Metrics,
Code Review, Velocity, Burndown, Team; (10) build + smoke.
