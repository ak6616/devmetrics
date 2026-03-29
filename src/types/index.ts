import { Session } from "next-auth";

export interface DevMetricsSession extends Session {
  githubId?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface OverviewMetrics {
  prsOpened: number;
  prsMerged: number;
  mergeRate: number;
  avgCycleTimeHrs: number;
  avgReviewTimeHrs: number;
}

export interface PrVolumeDataPoint {
  date: Date;
  prsOpened: number;
  prsMerged: number;
}

export interface ContributorMetric {
  authorLogin: string | null;
  prCount: number;
  avgCycleTimeHrs: number;
}

export interface VelocityDataPoint {
  sprintName: string | null;
  startDate: Date;
  endDate: Date;
  totalPoints: number;
  pointsPerWeek: number;
}

export interface BurndownData {
  totalPoints: number;
  days: { date: string; remaining: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
