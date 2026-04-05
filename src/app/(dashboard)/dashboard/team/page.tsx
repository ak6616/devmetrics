"use client";

import { useState } from "react";
import { teamMembers } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import { ArrowRightLeft, Check } from "lucide-react";

const roleConfig: Record<
  string,
  { label: string; className: string }
> = {
  Frontend: {
    label: "Frontend",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  Backend: {
    label: "Backend",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  "Full-stack": {
    label: "Full-stack",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  DevOps: {
    label: "DevOps",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
};

const avatarColors = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
];

export default function TeamPage() {
  const [activeUserId, setActiveUserId] = useState<number>(1);

  const activeUser = teamMembers.find((m) => m.id === activeUserId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {teamMembers.length} members &middot; Current sprint performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeUser && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20">
              <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Viewing as: {activeUser.name}</span>
            </div>
          )}
          <Button size="sm">Invite Member</Button>
        </div>
      </div>

      {/* Member Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member, index) => {
          const role = roleConfig[member.role] ?? {
            label: member.role,
            className: "bg-gray-100 text-gray-700 border-gray-200",
          };
          const avatarColor = avatarColors[index % avatarColors.length];
          const sparklineData = member.sparkline.map((value, i) => ({
            i,
            value,
          }));

          return (
            <Card
              key={member.id}
              className={`group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
                activeUserId === member.id ? "ring-2 ring-primary/50 border-primary/30" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <Avatar className={`h-11 w-11 shrink-0 ${avatarColor}`}>
                    <AvatarFallback
                      className={`text-white font-semibold text-sm ${avatarColor}`}
                    >
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name + username + role */}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm leading-tight truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      @{member.username}
                    </p>
                    <div className="mt-1.5">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${role.className}`}
                      >
                        {role.label}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {/* PRs merged + sparkline */}
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      PRs Merged
                    </p>
                    <p className="text-2xl font-bold leading-tight mt-0.5">
                      {member.prsMerged}
                    </p>
                    <p className="text-xs text-muted-foreground">this period</p>
                  </div>
                  {/* Sparkline */}
                  <div className="h-12 w-24 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={sparklineData}
                        margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
                      >
                        <defs>
                          <linearGradient
                            id={`sparkGrad-${member.id}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          strokeWidth={1.5}
                          fill={`url(#sparkGrad-${member.id})`}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Avg Review
                    </p>
                    <p className="text-sm font-semibold mt-0.5">
                      {member.avgReviewTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Open PRs
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-sm font-semibold">{member.openPRs}</p>
                      {member.openPRs > 2 && (
                        <Badge
                          variant="warning"
                          className="text-[10px] px-1.5 py-0"
                        >
                          High
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8 group-hover:border-primary group-hover:text-primary transition-colors"
                  >
                    View Details
                  </Button>
                  <Button
                    variant={activeUserId === member.id ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-8 gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveUserId(member.id);
                    }}
                  >
                    {activeUserId === member.id ? (
                      <>
                        <Check className="h-3 w-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="h-3 w-3" />
                        Switch
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
