"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        checked ? "bg-primary" : "bg-input"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Integration Card ─────────────────────────────────────────────────────────
interface IntegrationCardProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  connected: boolean;
  details?: { label: string; value: string }[];
  primaryAction?: string;
  secondaryAction?: string;
  connectAction?: string;
}

function IntegrationCard({
  icon,
  name,
  description,
  connected,
  details = [],
  primaryAction,
  secondaryAction,
  connectAction,
}: IntegrationCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-muted/50 text-xl">
            {icon}
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="font-semibold text-sm">{name}</span>
              {connected ? (
                <Badge className="bg-green-100 text-green-700 border-green-200 border text-[11px] px-2 py-0 font-semibold rounded-full">
                  Connected
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-muted-foreground text-[11px] px-2 py-0 font-semibold rounded-full"
                >
                  Not connected
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">{description}</p>

            {connected && details.length > 0 && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mb-4 rounded-lg bg-muted/40 px-3 py-2.5 sm:grid-cols-3">
                {details.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                      {label}
                    </p>
                    <p className="text-xs font-semibold mt-0.5 truncate">{value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {connected ? (
                <>
                  {primaryAction && (
                    <Button size="sm" variant="outline" className="h-8 text-xs">
                      {primaryAction}
                    </Button>
                  )}
                  {secondaryAction && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {secondaryAction}
                    </Button>
                  )}
                </>
              ) : (
                connectAction && (
                  <Button size="sm" className="h-8 text-xs">
                    {connectAction}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Notification Row ─────────────────────────────────────────────────────────
function NotificationRow({
  title,
  description,
  emailChecked,
  slackChecked,
  onEmailChange,
  onSlackChange,
}: {
  title: string;
  description: string;
  emailChecked: boolean;
  slackChecked: boolean;
  onEmailChange: (v: boolean) => void;
  onSlackChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-6 shrink-0">
        <div className="flex flex-col items-center gap-1">
          <Toggle checked={emailChecked} onChange={onEmailChange} />
          <span className="text-[10px] text-muted-foreground">Email</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Toggle checked={slackChecked} onChange={onSlackChange} />
          <span className="text-[10px] text-muted-foreground">Slack</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  // Notification toggles state
  const [notifications, setNotifications] = useState({
    slaBreach: { email: true, slack: true },
    dailySummary: { email: true, slack: false },
    weeklyReport: { email: true, slack: false },
    prReminders: { email: false, slack: true },
    deployAlerts: { email: true, slack: true },
  });

  const setNotif = (
    key: keyof typeof notifications,
    channel: "email" | "slack",
    value: boolean
  ) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: { ...prev[key], [channel]: value },
    }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your integrations, profile, and preferences
        </p>
      </div>

      <Tabs defaultValue="integrations">
        <TabsList className="h-10">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* ── Integrations ── */}
        <TabsContent value="integrations" className="mt-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold mb-1">Connected services</h2>
            <p className="text-xs text-muted-foreground">
              Connect your tools to enable automatic data sync and enhanced metrics.
            </p>
          </div>

          <IntegrationCard
            icon="🐙"
            name="GitHub"
            description="Sync pull requests, reviews, and contributor stats automatically."
            connected
            details={[
              { label: "Organization", value: "Acme Corp" },
              { label: "Repos synced", value: "12 repositories" },
              { label: "Last sync", value: "2 min ago" },
            ]}
            primaryAction="Manage Repos"
            secondaryAction="Disconnect"
          />

          <IntegrationCard
            icon="▲"
            name="Vercel"
            description="Track deployments and correlate them with your PR activity."
            connected
            details={[
              { label: "Project", value: "devmetrics-app" },
              { label: "Deploy URL", value: "devmetrics.vercel.app" },
              { label: "Last deploy", value: "14 min ago" },
            ]}
            primaryAction="View Deployments"
            secondaryAction="Disconnect"
          />

          <IntegrationCard
            icon="💬"
            name="Slack"
            description="Receive PR alerts, SLA breach notifications, and daily summaries in Slack."
            connected={false}
            connectAction="Connect Slack"
          />

          <IntegrationCard
            icon="🟦"
            name="Jira"
            description="Link pull requests to Jira issues and track sprint progress."
            connected={false}
            connectAction="Connect Jira"
          />
        </TabsContent>

        {/* ── Profile ── */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team Profile</CardTitle>
              <CardDescription>
                Your workspace details and plan information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {[
                { label: "Team name", value: "Acme Engineering" },
                { label: "Plan", value: "Pro" },
                { label: "Members", value: "8 active members" },
                { label: "Timezone", value: "UTC-5 (Eastern Time)" },
                { label: "GitHub org", value: "acme-corp" },
                { label: "Account created", value: "January 12, 2025" },
              ].map(({ label, value }, i, arr) => (
                <div key={label}>
                  <div className="flex items-center justify-between py-3.5">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{value}</span>
                      {label === "Plan" && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 border text-[11px] px-2 py-0 font-semibold rounded-full">
                          Pro
                        </Badge>
                      )}
                    </div>
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}

              <div className="pt-4 flex gap-2">
                <Button size="sm" variant="outline">
                  Edit Profile
                </Button>
                <Button size="sm" variant="outline">
                  Transfer Ownership
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications ── */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>
                Choose how and when you receive alerts from DevMetrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-2 gap-8 pr-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Email
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Slack
                </span>
              </div>
              <Separator />

              <NotificationRow
                title="PR SLA Breach"
                description="Alert when a pull request exceeds the configured review time SLA."
                emailChecked={notifications.slaBreach.email}
                slackChecked={notifications.slaBreach.slack}
                onEmailChange={(v) => setNotif("slaBreach", "email", v)}
                onSlackChange={(v) => setNotif("slaBreach", "slack", v)}
              />
              <Separator />
              <NotificationRow
                title="Daily Summary"
                description="A digest of PR activity, merges, and team performance each morning."
                emailChecked={notifications.dailySummary.email}
                slackChecked={notifications.dailySummary.slack}
                onEmailChange={(v) => setNotif("dailySummary", "email", v)}
                onSlackChange={(v) => setNotif("dailySummary", "slack", v)}
              />
              <Separator />
              <NotificationRow
                title="Weekly Report"
                description="Comprehensive weekly metrics report delivered every Monday."
                emailChecked={notifications.weeklyReport.email}
                slackChecked={notifications.weeklyReport.slack}
                onEmailChange={(v) => setNotif("weeklyReport", "email", v)}
                onSlackChange={(v) => setNotif("weeklyReport", "slack", v)}
              />
              <Separator />
              <NotificationRow
                title="PR Review Reminders"
                description="Nudge reviewers when a PR has been waiting longer than 4 hours."
                emailChecked={notifications.prReminders.email}
                slackChecked={notifications.prReminders.slack}
                onEmailChange={(v) => setNotif("prReminders", "email", v)}
                onSlackChange={(v) => setNotif("prReminders", "slack", v)}
              />
              <Separator />
              <NotificationRow
                title="Deployment Alerts"
                description="Notify when a Vercel deployment succeeds or fails."
                emailChecked={notifications.deployAlerts.email}
                slackChecked={notifications.deployAlerts.slack}
                onEmailChange={(v) => setNotif("deployAlerts", "email", v)}
                onSlackChange={(v) => setNotif("deployAlerts", "slack", v)}
              />

              <div className="mt-4 pt-4 border-t flex justify-end">
                <Button size="sm">Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Billing ── */}
        <TabsContent value="billing" className="mt-6 space-y-4">
          {/* Current Plan */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold">Pro Plan</span>
                    <Badge className="bg-primary text-primary-foreground text-[11px] px-2 py-0.5 rounded-full">
                      Current
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    All features for growing engineering teams
                  </p>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">$29</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Billed monthly &middot; Next invoice Apr 29, 2026
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-w-[140px]">
                  <Button size="sm">Upgrade to Team</Button>
                  <Button size="sm" variant="outline">
                    Manage Billing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Usage This Month</CardTitle>
              <CardDescription>Mar 1 – Mar 29, 2026</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Active members", used: 8, limit: 10, unit: "members" },
                { label: "Repos connected", used: 12, limit: 25, unit: "repos" },
                { label: "API requests", used: 18400, limit: 50000, unit: "requests" },
              ].map(({ label, used, limit, unit }) => {
                const pct = Math.round((used / limit) * 100);
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground text-xs">
                        {used.toLocaleString()} / {limit.toLocaleString()} {unit}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 80 ? "bg-amber-500" : "bg-primary"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {pct}% used
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Plan Comparison */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Upgrade for more</CardTitle>
              <CardDescription>
                Unlock advanced features with the Team or Enterprise plan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    name: "Team",
                    price: "$79",
                    period: "/month",
                    features: [
                      "Up to 25 members",
                      "Unlimited repos",
                      "Advanced analytics",
                      "Custom SLA rules",
                      "Priority support",
                    ],
                    highlight: true,
                  },
                  {
                    name: "Enterprise",
                    price: "Custom",
                    period: "",
                    features: [
                      "Unlimited members",
                      "SSO / SAML",
                      "Audit logs",
                      "Dedicated CSM",
                      "SLA guarantee",
                    ],
                    highlight: false,
                  },
                ].map((plan) => (
                  <div
                    key={plan.name}
                    className={`rounded-lg border p-4 ${
                      plan.highlight ? "border-primary/40 bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-lg font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-xs text-muted-foreground">
                          {plan.period}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold mb-3">{plan.name}</p>
                    <ul className="space-y-1.5 mb-4">
                      {plan.features.map((f) => (
                        <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="text-green-500 font-bold">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      size="sm"
                      className="w-full"
                      variant={plan.highlight ? "default" : "outline"}
                    >
                      {plan.name === "Enterprise" ? "Contact Sales" : `Upgrade to ${plan.name}`}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
