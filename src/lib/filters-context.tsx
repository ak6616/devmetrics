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
    <FiltersContext.Provider
      value={{ range, repo, member, setRange, setRepo, setMember }}
    >
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters(): FiltersState {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within FilterProvider");
  return ctx;
}
