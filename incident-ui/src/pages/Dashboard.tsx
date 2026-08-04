import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import NetworkCheckRoundedIcon from "@mui/icons-material/NetworkCheckRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import AssistantRoundedIcon from "@mui/icons-material/AssistantRounded";
import {
  Box,
  Button,
  Typography,
  Tooltip,
} from "@mui/material";

import KpiCard from "../components/KpiCard";
import {
  getDashboard,
  getIncidentTrend,
  getServiceNowStatus,
} from "../services/dashboardService";
import { getRecentIncidents } from "../services/recentIncidentService";
import type { Incident } from "../types/incident";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

type Metric = {
  value: number | string;
  current_week: number | string;
  previous_week: number | string;
  delta: number;
};

type DashboardResponse = {
  total_incidents: Metric;
  high_priority_incidents: Metric;
  running_investigations: Metric;
  resolved: Metric;
  failed: Metric;
  avg_investigation_time: Metric;
  avg_confidence: Metric;
};

type RecentIncident = Incident & {
  opened_at: string;
  investigation_status?: string | null;
  investigation_id?: string | null;
};

interface IncidentTrend {
  day: string;
  created: number;
  resolved: number;
}

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
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <Box>
      {eyebrow && (
        <Typography className="dashboard-eyebrow">
          {eyebrow}
        </Typography>
      )}

      <Typography
        className={
          compact ? "dashboard-panel-title" : "dashboard-title"
        }
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography className="dashboard-subtitle">
          {subtitle}
        </Typography>
      )}
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <Box
      sx={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        p: 1.5,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
    >
      <Typography fontWeight={700}>{label}</Typography>

      <Typography sx={{ color: "#1d4ed8", mt: 0.5 }}>
        ● Created : {payload[0].value}
      </Typography>

      <Typography sx={{ color: "#f97316" }}>
        ● Resolved : {payload[1].value}
      </Typography>
    </Box>
  );
};

function KpiHover({
  title,
  current,
  previous,
}: {
  title: string;
  current: string | number;
  previous: string | number;
}) {
  return (
    <Box
      sx={{
        bgcolor: "#fff",
        color: "#111827",
        borderRadius: 2,
        px: 1.5,
        py: 1.2,
        minWidth: 170,
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: 14,
          mb: 0.75,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          color: "#2563eb",
          fontSize: 13,
        }}
      >
        ● This Week : <strong>{current}</strong>
      </Typography>

      <Typography
        sx={{
          color: "#64748b",
          fontSize: 13,
          mt: 0.5,
        }}
      >
        ● Previous Week : <strong>{previous}</strong>
      </Typography>
    </Box>
  );
}

const deltaText = (delta: number) =>
  `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;

const deltaTone = (
  delta: number,
  lowerIsBetter = false,
): "green" | "red" => {
  const improved = lowerIsBetter ? delta <= 0 : delta >= 0;
  return improved ? "green" : "red";
};

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<RecentIncident[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");
  const [trendData, setTrendData] = useState<IncidentTrend[]>([]);
  const [serviceNowOnline, setServiceNowOnline] = useState<boolean | null>(null);

  const loadDashboard = async () => {
    setRefreshing(true);
    try {
      const [dashboardData, incidents] = await Promise.all([
        getDashboard(),
        getRecentIncidents(),
      ]);
      const trend = await getIncidentTrend();
      setTrendData(trend);
      console.log(trend);

      setDashboard(dashboardData);
      setRecentIncidents(incidents);
      setUpdatedAt(formatClockLabel(new Date()));
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      getServiceNowStatus()
        .then((status) => setServiceNowOnline(status.online))
        .catch(() => setServiceNowOnline(false));
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

    const serviceNowTimer = window.setInterval(() => {
      getServiceNowStatus()
        .then((status) => setServiceNowOnline(status.online))
        .catch(() => setServiceNowOnline(false));
    }, 60_000);

    if (!updatedAt) {
      setUpdatedAt(formatClockLabel(new Date()));
    }

    return () => {
      window.clearInterval(timer);
      window.clearInterval(serviceNowTimer);
    };
  }, [updatedAt]);

  const kpis = useMemo(() => {
    const totalIncidents = dashboard?.total_incidents?.value ?? recentIncidents.length;

    const resolvedToday = dashboard?.resolved?.value ?? 0;

    const avgTime = formatAverageTime(
        dashboard?.avg_investigation_time?.value ?? 0,
    );

    const confidence = formatConfidence(
        dashboard?.avg_confidence?.value ?? 0,
    );

    return [
      {
        title: "Total Incidents",
        value: dashboard?.total_incidents.value ?? 0,
        tone: "indigo",
        icon: "pulse",
        delta: deltaText(dashboard?.total_incidents.delta ?? 0),
        deltaTone: deltaTone(dashboard?.total_incidents.delta ?? 0),
        currentWeek:
            dashboard?.total_incidents.current_week ?? 0,

        previousWeek:
            dashboard?.total_incidents.previous_week ?? 0,
      },

      {
        title: "AI Resolved",
        value: dashboard?.resolved.value ?? 0,
        tone: "green",
        icon: "check",
        delta: deltaText(dashboard?.resolved.delta ?? 0),
        deltaTone: deltaTone(dashboard?.resolved.delta ?? 0),
        currentWeek: dashboard?.resolved.current_week ?? 0,
        previousWeek: dashboard?.resolved.previous_week ?? 0,
      },

      {
        title: "Failed Investigations",
        value: dashboard?.failed?.value ?? 0,
        tone: "red",
        icon: "alert",
        delta: deltaText(dashboard?.failed?.delta ?? 0),
        deltaTone: deltaTone(dashboard?.failed?.delta ?? 0),
        currentWeek: dashboard?.failed.current_week ?? 0,
        previousWeek: dashboard?.failed.previous_week ?? 0,
      },

      {
        title: "High Priority",
        value: dashboard?.high_priority_incidents?.value ?? 0,
        tone: "green",
        icon: "search",
        delta: deltaText(dashboard?.high_priority_incidents?.delta ?? 0),
        deltaTone: deltaTone(
          dashboard?.high_priority_incidents?.delta ?? 0,
        ),
        currentWeek:
            dashboard?.high_priority_incidents.current_week ?? 0,

        previousWeek:
            dashboard?.high_priority_incidents.previous_week ?? 0,
      },

      {
        title: "Avg Investigation Time",
        value: formatAverageTime(
          dashboard?.avg_investigation_time?.value,
        ),
        tone: "violet",
        icon: "clock",
        delta: deltaText(
          dashboard?.avg_investigation_time?.delta ?? 0,
        ),
        deltaTone: deltaTone(
          dashboard?.avg_investigation_time?.delta ?? 0,
          true,
        ),
        currentWeek:
            dashboard?.avg_investigation_time.current_week ?? "0s",

        previousWeek:
            dashboard?.avg_investigation_time.previous_week ?? "0s",
      },

      {
        title: "AI Confidence Avg",
        value: formatConfidence(
          dashboard?.avg_confidence?.value,
        ),
        tone: "blue",
        icon: "brain",
        delta: deltaText(
          dashboard?.avg_confidence?.delta ?? 0,
        ),
        deltaTone: deltaTone(
          dashboard?.avg_confidence?.delta ?? 0,
        ),
        currentWeek:
            dashboard?.avg_confidence.current_week ?? 0,

        previousWeek:
            dashboard?.avg_confidence.previous_week ?? 0,
      },
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
        text: `AI confidence is currently at ${formatConfidence(dashboard?.avg_confidence.value)} across ${recentIncidents.length} recent incidents.`,
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
            <Box
              className={`dashboard-connection ${
                serviceNowOnline === false
                  ? "is-offline"
                  : serviceNowOnline === true
                    ? "is-online"
                    : "is-checking"
              }`}
              aria-label={`ServiceNow ${
                serviceNowOnline === false
                  ? "offline"
                  : serviceNowOnline === true
                    ? "connected"
                    : "checking"
              }`}
            >
              <span className="dashboard-connection-dot" />
              <NetworkCheckRoundedIcon className="dashboard-connection-icon" />
              <span className="dashboard-connection-text">
                ServiceNow{" "}
                {serviceNowOnline === false
                  ? "Offline"
                  : serviceNowOnline === true
                    ? "Connected"
                    : "Checking"}
              </span>
            </Box>
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
            <Tooltip
              key={stat.title}
              arrow
              placement="top"
              enterDelay={150}
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: "#fff",
                    color: "#111827",
                    borderRadius: 2,
                    boxShadow: "0 10px 30px rgba(0,0,0,.12)",
                    border: "1px solid #E5E7EB",
                    p: 0,
                  },
                },
                arrow: {
                  sx: {
                    color: "#fff",
                  },
                },
              }}
              title={
                <KpiHover
                  title={stat.title}
                  current={stat.currentWeek}
                  previous={stat.previousWeek}
                />
              }
            >
              <Box>
                <KpiCard
                  title={stat.title}
                  value={stat.value}
                  tone={stat.tone}
                  icon={stat.icon}
                  delta={stat.delta}
                  deltaTone={stat.deltaTone}
                />
              </Box>
            </Tooltip>
          ))}
        </Box>

        <Box className="dashboard-grid dashboard-grid-top">
          <Panel className="dashboard-chart-panel">

            <Box className="dashboard-panel-header">
              {sectionTitle({
                title: "Incident Trend",
                subtitle: "Last 7 days",
                compact: true,
              })}

              <Box className="dashboard-legend">
                <Box className="legend-item">
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "#2563eb",
                    }}
                  />
                  <Typography>Created</Typography>
                </Box>

                <Box className="legend-item">
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "#f97316",
                    }}
                  />
                  <Typography>Resolved</Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ width: "100%", height: 340, mt: 2 }}>

              <ResponsiveContainer width="100%" height="100%">

                <LineChart
                  data={trendData}
                  margin={{
                    top: 10,
                    right: 25,
                    left: 0,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="day"
                  />

                  <YAxis
                    allowDecimals={false}
                  />

                  <RechartsTooltip content={<CustomTooltip />} />

                  <Line
                    type="monotone"
                    dataKey="created"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </Box>

          </Panel>

          <Panel className="dashboard-chart-panel">
            {sectionTitle({
              title: "Incidents by Priority",
              subtitle: "Currently open",
              compact: true,
            })}
            <Box
              className="donut-wrap"
              sx={{
                mt: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                height: 220,          // instead of filling the whole panel
                flex: "0 0 auto",     // don't stretch
              }}
            >
              {(() => {
                const total = priorityCounts.reduce((sum, p) => sum + p.value, 0);

                const critical =
                  total === 0 ? 0 : (priorityCounts[0]?.value / total) * 100;

                const high =
                  total === 0 ? 0 : (priorityCounts[1]?.value / total) * 100;

                const medium =
                  total === 0 ? 0 : (priorityCounts[2]?.value / total) * 100;

                const low =
                  total === 0 ? 0 : (priorityCounts[3]?.value / total) * 100;

                return (
                  <>
                    <Box
                      className="donut-chart"
                      sx={{
                        background: `conic-gradient(
                          #ef4444 0 ${critical}%,
                          #eab308 ${critical}% ${critical + high}%,
                          #0284c7 ${critical + high}% ${
                          critical + high + medium
                        }%,
                          #16a34a ${critical + high + medium}% 100%
                        )`,
                      }}
                    >
                      <Box className="donut-hole" />
                    </Box>

                    <Box className="priority-legend">
                      {priorityCounts.map((item) => (
                        <Box
                          key={item.label}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            py: 0.35,
                            minHeight: 30,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                bgcolor: item.color,
                              }}
                            />

                            <Typography
                              sx={{
                                fontSize: 14,
                                fontWeight: 500,
                              }}
                            >
                              {item.label}
                            </Typography>
                          </Box>

                          <Typography
                            sx={{
                              color: "#667085",
                              fontWeight: 600,
                            }}
                          >
                            {item.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                );
              })()}
            </Box>
          </Panel>
        </Box>
      </Box>

      <Box className="dashboard-section">
        <Box
          className="dashboard-grid dashboard-grid-three"
          sx={{ mt: 1 }}
        >
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
