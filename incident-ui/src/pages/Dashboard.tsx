import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Box, Button, Typography } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import NetworkCheckRoundedIcon from "@mui/icons-material/NetworkCheckRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import AssistantRoundedIcon from "@mui/icons-material/AssistantRounded";

import KpiCard from "../components/KpiCard";
import { getDashboard } from "../services/dashboardService";
import { getRecentIncidents } from "../services/recentIncidentService";
import type { Incident } from "../types/incident";

type DashboardResponse = {
  total_incidents?: number;
  high_priority_incidents?: number;
  running_investigations?: number;
  resolved?: number;
  failed?: number;
  avg_investigation_time?: string | number | null;
  avg_confidence?: string | number | null;
};

type RecentIncident = Incident & {
  opened_at: string;
  investigation_status?: string | null;
  investigation_id?: string | null;
};

const trendDays = [
  { day: "Mon", created: 42, resolved: 39 },
  { day: "Tue", created: 51, resolved: 44 },
  { day: "Wed", created: 38, resolved: 40 },
  { day: "Thu", created: 63, resolved: 55 },
  { day: "Fri", created: 58, resolved: 61 },
  { day: "Sat", created: 29, resolved: 27 },
  { day: "Sun", created: 35, resolved: 31 },
];

function formatAverageTime(value: string | number | null | undefined) {
  if (value == null) return "0m";
  return typeof value === "number" ? `${value}m` : value;
}

function formatConfidence(value: string | number | null | undefined) {
  if (value == null) return "0%";
  const normalized = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(normalized)) return "0%";
  return `${normalized}%`;
}

function formatClockLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatTimeAgo(openedAt: string) {
  const opened = new Date(openedAt);
  const diffMs = Date.now() - opened.getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));

  if (minutes < 60) {
    return minutes <= 1 ? "just now" : `${minutes} minutes ago`;
  }

  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

function severityTone(priority: string) {
  const normalized = priority.toString().toLowerCase();

  if (["1", "p1", "critical"].includes(normalized)) {
    return { bg: "#fef2f2", fg: "#ef4444", border: "#fecaca", label: "Critical" };
  }

  if (["2", "p2", "high"].includes(normalized)) {
    return { bg: "#fff7ed", fg: "#f97316", border: "#fed7aa", label: "High" };
  }

  if (["3", "p3", "medium"].includes(normalized)) {
    return { bg: "#eff6ff", fg: "#0284c7", border: "#bfdbfe", label: "Medium" };
  }

  return { bg: "#ecfdf5", fg: "#16a34a", border: "#bbf7d0", label: "Low" };
}

function statusTone(status?: string | null) {
  const normalized = (status ?? "").toLowerCase();

  if (normalized.includes("running")) {
    return { bg: "#fff7ed", fg: "#f97316", border: "#fed7aa", label: "Running" };
  }

  return { bg: "#f8fafc", fg: "#475569", border: "#cbd5e1", label: "Completed" };
}

function sectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Box>
      {eyebrow && <Typography className="dashboard-eyebrow">{eyebrow}</Typography>}
      <Typography className="dashboard-title">{title}</Typography>
      {subtitle && <Typography className="dashboard-subtitle">{subtitle}</Typography>}
    </Box>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Box className={`dashboard-panel ${className}`}>{children}</Box>;
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<RecentIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");

  const loadDashboard = async () => {
    setRefreshing(true);
    try {
      const [dashboardData, incidents] = await Promise.all([
        getDashboard(),
        getRecentIncidents(),
      ]);

      setDashboard(dashboardData);
      setRecentIncidents(incidents);
      setUpdatedAt(formatClockLabel(new Date()));
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setUpdatedAt(formatClockLabel(new Date()));
    }, 30_000);

    if (!updatedAt) {
      setUpdatedAt(formatClockLabel(new Date()));
    }

    return () => window.clearInterval(timer);
  }, [updatedAt]);

  const kpis = useMemo(() => {
    const totalIncidents = dashboard?.total_incidents ?? recentIncidents.length;
    const openIncidents = recentIncidents.filter((incident) =>
      !incident.state?.toLowerCase?.().includes("resolved"),
    ).length;
    const investigating = recentIncidents.filter(
      (incident) => !!incident.investigation_id || !!incident.investigation_status,
    ).length;
    const resolvedToday = dashboard?.resolved ?? 0;
    const avgTime = formatAverageTime(dashboard?.avg_investigation_time);
    const confidence = formatConfidence(dashboard?.avg_confidence);

    return [
      { title: "Total Incidents", value: totalIncidents, tone: "indigo" as const, icon: "clipboard" as const, delta: "+4.2%", deltaTone: "red" as const },
      { title: "Open Incidents", value: openIncidents, tone: "green" as const, icon: "flag" as const, delta: "-6", deltaTone: "green" as const },
      { title: "Investigating", value: investigating, tone: "red" as const, icon: "close" as const, delta: "+3", deltaTone: "red" as const },
      { title: "Resolved Today", value: resolvedToday, tone: "green" as const, icon: "check" as const, delta: "+11%", deltaTone: "green" as const },
      { title: "Avg Investigation Time", value: avgTime, tone: "violet" as const, icon: "clock" as const, delta: "-38s", deltaTone: "green" as const },
      { title: "AI Confidence Avg", value: confidence, tone: "blue" as const, icon: "pulse" as const, delta: "+2.1%", deltaTone: "green" as const },
    ];
  }, [dashboard, recentIncidents]);

  const affectedApps = useMemo(() => {
    const counts = new Map<string, number>();

    for (const incident of recentIncidents) {
      const key = incident.service || incident.short_description.split(" ")[0] || "unknown";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [recentIncidents]);

  const priorityCounts = useMemo(() => {
    const totals = new Map<string, number>();

    for (const incident of recentIncidents) {
      const tone = severityTone(incident.priority).label;
      totals.set(tone, (totals.get(tone) ?? 0) + 1);
    }

    return [
      { label: "Critical", value: totals.get("Critical") ?? 0, color: "#ef4444" },
      { label: "High", value: totals.get("High") ?? 0, color: "#eab308" },
      { label: "Medium", value: totals.get("Medium") ?? 0, color: "#0284c7" },
      { label: "Low", value: totals.get("Low") ?? 0, color: "#16a34a" },
    ];
  }, [recentIncidents]);

  const recentAiInvestigations = useMemo(() => {
    return recentIncidents
      .filter((incident) => incident.investigation_id)
      .slice(0, 2);
  }, [recentIncidents]);

  const recommendations = useMemo(() => {
    const topApp = affectedApps[0]?.name ?? "the current service";
    const topPriority = priorityCounts.find((item) => item.value > 0)?.label ?? "Critical";
    const linkedInvestigations = recentAiInvestigations.length;

    return [
      {
        tone: "amber",
        icon: TrendingUpRoundedIcon,
        text: `${topApp} is the most affected service in the latest incidents. Review recent regressions and capacity pressure.`,
      },
      {
        tone: "amber",
        icon: NetworkCheckRoundedIcon,
        text: `${topPriority} incidents are leading the dashboard. Check routing, latency, and dependency health first.`,
      },
      {
        tone: "green",
        icon: CheckCircleRoundedIcon,
        text: `AI confidence is currently at ${formatConfidence(dashboard?.avg_confidence)} across ${recentIncidents.length} recent incidents.`,
      },
      {
        tone: "red",
        icon: ErrorOutlineRoundedIcon,
        text: `${linkedInvestigations} investigation${linkedInvestigations === 1 ? "" : "s"} are linked to visible incidents.`,
      },
    ];
  }, [affectedApps, dashboard?.avg_confidence, priorityCounts, recentAiInvestigations.length, recentIncidents.length]);

  if (loading && !dashboard) {
    return (
      <Box className="dashboard-page">
        <Typography className="dashboard-title">Loading Dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box className="dashboard-page">
      <Box className="dashboard-hero">
        <Box className="dashboard-hero-header">
          {sectionTitle({
            eyebrow: "OVERVIEW",
            title: "Operations Dashboard",
            subtitle: "Real-time view of incidents and AI-driven investigations across your platform.",
          })}

          <Box className="dashboard-actions">
            <Box className="dashboard-datetime">
              {updatedAt || formatClockLabel(new Date())}
            </Box>
            <Button
              className="dashboard-refresh"
              startIcon={<RefreshRoundedIcon />}
              onClick={loadDashboard}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing" : "Refresh"}
            </Button>
          </Box>
        </Box>

        <Box className="dashboard-stats">
          {kpis.map((stat) => (
            <KpiCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              tone={stat.tone}
              icon={stat.icon}
              delta={stat.delta}
              deltaTone={stat.deltaTone}
            />
          ))}
        </Box>

        <Box className="dashboard-grid dashboard-grid-top">
          <Panel className="dashboard-wide-panel">
            <Box className="dashboard-panel-header">
              {sectionTitle({ title: "Incident Trend", subtitle: "Last 7 days" })}
              <Box className="dashboard-legend">
                <Box className="legend-item">
                  <Box className="legend-dot legend-created" />
                  <Typography>Created</Typography>
                </Box>
                <Box className="legend-item">
                  <Box className="legend-dot legend-resolved" />
                  <Typography>Resolved</Typography>
                </Box>
              </Box>
            </Box>

            <Box className="chart-area">
              <Box className="chart-y-axis">
                {[80, 60, 40, 20, 0].map((value) => (
                  <Typography key={value}>{value}</Typography>
                ))}
              </Box>

              <Box className="chart-lines">
                <Box className="chart-grid-lines">
                  {[80, 60, 40, 20, 0].map((value) => (
                    <Box key={value} className="chart-grid-line" />
                  ))}
                </Box>
                <Box className="line-plot line-created">
                  {trendDays.map((point) => (
                    <Box
                      key={`${point.day}-created`}
                      className="line-point"
                      style={{ "--point-top": `${100 - (point.created / 80) * 100}%` } as CSSProperties}
                    />
                  ))}
                </Box>
                <Box className="line-plot line-resolved">
                  {trendDays.map((point) => (
                    <Box
                      key={`${point.day}-resolved`}
                      className="line-point line-point-accent"
                      style={{ "--point-top": `${100 - (point.resolved / 80) * 100}%` } as CSSProperties}
                    />
                  ))}
                </Box>
                <Box className="chart-x-axis">
                  {trendDays.map((point) => (
                    <Typography key={point.day}>{point.day}</Typography>
                  ))}
                </Box>
              </Box>
            </Box>
          </Panel>

          <Panel className="dashboard-side-panel">
            {sectionTitle({ title: "Incidents by Priority", subtitle: "Currently open" })}
            <Box className="donut-wrap">
              <Box
                className="donut-chart"
                style={{
                  background: `conic-gradient(
                    #ef4444 0 ${priorityCounts[0]?.value ?? 0}%,
                    #eab308 ${priorityCounts[0]?.value ?? 0}% ${((priorityCounts[0]?.value ?? 0) + (priorityCounts[1]?.value ?? 0))}%,
                    #0284c7 ${((priorityCounts[0]?.value ?? 0) + (priorityCounts[1]?.value ?? 0))}% ${((priorityCounts[0]?.value ?? 0) + (priorityCounts[1]?.value ?? 0) + (priorityCounts[2]?.value ?? 0))}%,
                    #16a34a ${((priorityCounts[0]?.value ?? 0) + (priorityCounts[1]?.value ?? 0) + (priorityCounts[2]?.value ?? 0))}% 100%
                  )`,
                }}
              />
              <Box className="donut-hole" />
            </Box>

            <Box className="priority-list">
              {priorityCounts.map((item) => (
                <Box key={item.label} className="priority-item">
                  <Box className="priority-label">
                    <Box className="priority-dot" sx={{ backgroundColor: item.color }} />
                    <Typography>{item.label}</Typography>
                  </Box>
                  <Typography className="priority-value">{item.value}</Typography>
                </Box>
              ))}
            </Box>
          </Panel>
        </Box>
      </Box>

      <Box className="dashboard-section">
        <Box className="dashboard-grid dashboard-grid-three">
          <Panel>
            <Typography className="card-heading">Most Affected Applications</Typography>
            <Box className="app-list">
              {affectedApps.length === 0 ? (
                <Typography className="dashboard-subtitle">No recent incidents found.</Typography>
              ) : (
                affectedApps.map((app) => (
                  <Box key={app.name} className="app-item">
                    <Box className="app-row">
                      <Typography className="app-name">{app.name}</Typography>
                      <Typography className="app-count">{app.value}</Typography>
                    </Box>
                    <Box className="app-bar-track">
                      <Box className="app-bar-fill" style={{ width: `${(app.value / affectedApps[0].value) * 100}%` }} />
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Panel>

          <Panel>
            <Box className="card-heading-row">
              <Typography className="card-heading">Recent Incidents</Typography>
            </Box>

            <Box className="incident-list">
              {recentIncidents.length === 0 ? (
                <Typography className="dashboard-subtitle">No incidents available.</Typography>
              ) : (
                recentIncidents.map((incident) => {
                  const style = severityTone(incident.priority);
                  return (
                    <Box key={incident.number} className="incident-item">
                      <Box
                        className="severity-pill"
                        sx={{
                          backgroundColor: style.bg,
                          color: style.fg,
                          borderColor: style.border,
                        }}
                      >
                        <Box className="severity-dot" sx={{ backgroundColor: style.fg }} />
                        {style.label}
                      </Box>

                      <Box className="incident-copy">
                        <Typography className="incident-title">{incident.short_description}</Typography>
                        <Typography className="incident-subtitle">
                          {incident.number} · {incident.service || "unknown"} · {formatTimeAgo(incident.opened_at)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Panel>

          <Panel>
            <Typography className="card-heading">Recent AI Investigations</Typography>
            <Box className="ai-list">
              {recentAiInvestigations.length === 0 ? (
                <Typography className="dashboard-subtitle">No investigations linked to recent incidents.</Typography>
              ) : (
                recentAiInvestigations.map((item) => {
                  const pill = statusTone(item.investigation_status);
                  return (
                    <Box key={item.number} className="ai-item">
                      <Box className="ai-avatar">
                        <AssistantRoundedIcon fontSize="small" />
                      </Box>

                      <Box className="ai-copy">
                        <Typography className="ai-title">
                          {item.number} · {item.service || "unknown"}
                        </Typography>
                        <Typography className="ai-subtitle">
                          {item.investigation_status || pill.label}
                        </Typography>
                      </Box>

                      <Box
                        className="ai-status"
                        sx={{
                          backgroundColor: pill.bg,
                          color: pill.fg,
                          borderColor: pill.border,
                        }}
                      >
                        {pill.label}
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Panel>
        </Box>

        <Panel className="recommendations-panel">
          <Box className="dashboard-panel-header recommendations-header">
            <Box className="recommendations-title">
              <AutoAwesomeRoundedIcon />
              <Typography className="card-heading">AI Recommendations</Typography>
              <Box className="insights-pill">INSIGHTS</Box>
            </Box>
          </Box>

          <Box className="recommendation-grid">
            {recommendations.map((item) => {
              const Icon = item.icon;
              return (
                <Box key={item.text} className={`recommendation-card recommendation-${item.tone}`}>
                  <Icon fontSize="small" />
                  <Typography>{item.text}</Typography>
                </Box>
              );
            })}
          </Box>
        </Panel>
      </Box>
    </Box>
  );
}
