import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
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

  const created = payload.find((p: any) => p.dataKey === "created")?.value ?? 0;
  const resolved = payload.find((p: any) => p.dataKey === "resolved")?.value ?? 0;
  const net = created - resolved;

  return (
    <Box
      sx={{
        background: "rgba(255,255,255,0.98)",
        backdropFilter: "blur(8px)",
        border: "1px solid #e5e7eb",
        borderRadius: 3,
        px: 2,
        py: 1.5,
        minWidth: 170,
        boxShadow: "0 16px 40px rgba(15,23,42,0.16)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 3,
          pb: 1,
          mb: 1,
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <Typography
          sx={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}
        >
          {label}
        </Typography>

        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 1,
            py: 0.25,
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 800,
            color: net === 0 ? "#64748b" : net > 0 ? "#dc2626" : "#16a34a",
            bgcolor:
              net === 0
                ? "#f1f5f9"
                : net > 0
                  ? "#fef2f2"
                  : "#ecfdf5",
          }}
        >
          {net > 0 ? "▲" : net < 0 ? "▼" : "◆"} {Math.abs(net)} net
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 9, height: 9, borderRadius: 999, bgcolor: "#2563eb" }} />
          <Typography sx={{ fontSize: 13, color: "#64748b", flex: 1 }}>
            Created
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
            {created}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 9, height: 9, borderRadius: 999, bgcolor: "#f97316" }} />
          <Typography sx={{ fontSize: 13, color: "#64748b", flex: 1 }}>
            Resolved
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
            {resolved}
          </Typography>
        </Box>
      </Box>
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
  const navigate = useNavigate();
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
      const [dashboardData, incidents, trend] = await Promise.all([
        getDashboard(),
        getRecentIncidents(20),
        getIncidentTrend(),
      ]);

      setTrendData(trend);

      setDashboard(dashboardData);
      setRecentIncidents(incidents);
      setUpdatedAt(formatClockLabel(new Date()));

      // Also refresh the ServiceNow connection status
      getServiceNowStatus()
        .then((status) => setServiceNowOnline(status.online))
        .catch(() => setServiceNowOnline(false));
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    getServiceNowStatus()
      .then((status) => setServiceNowOnline(status.online))
      .catch(() => setServiceNowOnline(false));
  }, []);

  useEffect(() => {
      const timer = window.setInterval(() => {
          setUpdatedAt(formatClockLabel(new Date()));
      }, 30000);

      const serviceNowTimer = window.setInterval(() => {
          getServiceNowStatus()
              .then((status) => setServiceNowOnline(status.online))
              .catch(() => setServiceNowOnline(false));
      }, 60000);

      setUpdatedAt(formatClockLabel(new Date()));

      return () => {
          window.clearInterval(timer);
          window.clearInterval(serviceNowTimer);
      };
  }, []);

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
    const counts = new Map<string, { value: number; incidentNumber: string }>();

    for (const incident of recentIncidents) {
      const key = incident.service?.trim() || "Unknown";
      const current = counts.get(key);
      counts.set(key, {
        value: (current?.value ?? 0) + 1,
        incidentNumber: current?.incidentNumber ?? incident.number,
      });
    }

    return Array.from(counts.entries())
      .map(([name, item]) => ({ name, value: item.value, incidentNumber: item.incidentNumber }))
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
      .slice(0, 5);
  }, [recentIncidents]);

  const visibleRecentIncidents = useMemo(() => {
    return recentIncidents.slice(0, 5);
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
              <span className="dashboard-connection-text">
                {serviceNowOnline === false
                  ? "Offline"
                  : serviceNowOnline === true
                    ? "Online"
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

              <Box className="trend-summary">
                <Box className="trend-summary-chip trend-chip-created">
                  <Typography className="trend-chip-label">Created</Typography>
                  <Typography className="trend-chip-value">
                    {trendData.reduce((s, d) => s + d.created, 0)}
                  </Typography>
                </Box>

                <Box className="trend-summary-chip trend-chip-resolved">
                  <Typography className="trend-chip-label">Resolved</Typography>
                  <Typography className="trend-chip-value">
                    {trendData.reduce((s, d) => s + d.resolved, 0)}
                  </Typography>
                </Box>

                <Box className="trend-summary-chip trend-chip-rate">
                  <Typography className="trend-chip-label">Res. Rate</Typography>
                  <Typography className="trend-chip-value">
                    {(() => {
                      const created = trendData.reduce((s, d) => s + d.created, 0);
                      const resolved = trendData.reduce((s, d) => s + d.resolved, 0);
                      return created === 0
                        ? "0%"
                        : `${Math.round((resolved / created) * 100)}%`;
                    })()}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ width: "100%", flex: 1, minHeight: 0, mt: 2 }}>

              <ResponsiveContainer width="100%" height="100%">

                <ComposedChart
                  data={trendData}
                  margin={{
                    top: 10,
                    right: 25,
                    left: 0,
                    bottom: 10,
                  }}
                >

                  <defs>
                    <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.26} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#eef2f7"
                  />

                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }}
                    dy={8}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }}
                    width={30}
                  />

                  <RechartsTooltip
                    content={<CustomTooltip />}
                    cursor={{
                      stroke: "#cbd5e1",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="created"
                    stroke="none"
                    fill="url(#gradCreated)"
                  />

                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stroke="none"
                    fill="url(#gradResolved)"
                  />

                  <Line
                    type="monotone"
                    dataKey="created"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#2563eb" }}
                    activeDot={{
                      r: 7,
                      fill: "#2563eb",
                      stroke: "#fff",
                      strokeWidth: 3,
                    }}
                    animationDuration={900}
                  />

                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#f97316" }}
                    activeDot={{
                      r: 7,
                      fill: "#f97316",
                      stroke: "#fff",
                      strokeWidth: 3,
                    }}
                    animationDuration={900}
                  />

                </ComposedChart>

              </ResponsiveContainer>

            </Box>

          </Panel>

          <Panel className="dashboard-chart-panel">
            {sectionTitle({
              title: "Incidents by Priority",
              subtitle: "Currently open",
              compact: true,
            })}

            {(() => {
              const total = priorityCounts.reduce((sum, p) => sum + p.value, 0);
              const withData = priorityCounts.filter((p) => p.value > 0);
              const chartData = withData.length > 0 ? withData : priorityCounts.map((p) => ({ ...p, value: 1 }));

              return total === 0 ? (
                <Box className="donut-empty">
                  <Typography>No open incidents by priority.</Typography>
                </Box>
              ) : (
                <Box className="donut-wrap">
                  <Box className="donut-chart rich-donut" sx={{ position: "relative" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          <linearGradient id="donutCritical" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#f87171" />
                            <stop offset="100%" stopColor="#dc2626" />
                          </linearGradient>
                          <linearGradient id="donutHigh" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#d97706" />
                          </linearGradient>
                          <linearGradient id="donutMedium" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#0284c7" />
                          </linearGradient>
                          <linearGradient id="donutLow" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#4ade80" />
                            <stop offset="100%" stopColor="#16a34a" />
                          </linearGradient>
                        </defs>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={54}
                          outerRadius={78}
                          paddingAngle={3}
                          cornerRadius={10}
                          stroke="none"
                          animationDuration={800}
                        >
                          {chartData.map((item) => (
                            <Cell
                              key={item.label}
                              fill={`url(#donut${item.label})`}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    <Box className="donut-center">
                      <Typography className="donut-center-value">{total}</Typography>
                      <Typography className="donut-center-label">Open</Typography>
                    </Box>
                  </Box>

                  <Box className="priority-legend">
                    {priorityCounts.map((item) => {
                      const pct = total === 0 ? 0 : Math.round((item.value / total) * 100);
                      return (
                        <Box key={item.label} className="priority-item">
                          <Box className="priority-label">
                            <Box
                              className="priority-dot"
                              sx={{ bgcolor: item.color }}
                            />
                            <span>{item.label}</span>
                          </Box>

                          <Box className="priority-meta">
                            <Typography className="priority-value">{item.value}</Typography>
                            <Typography className="priority-pct">{pct}%</Typography>
                          </Box>

                          <Box className="priority-bar-track">
                            <Box
                              className="priority-bar-fill"
                              sx={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${item.color}cc, ${item.color})`,
                              }}
                            />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              );
            })()}
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
                  <Box
                    key={app.name}
                    className="app-item"
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate("/incidents", { state: { openIncident: app.incidentNumber } })}
                  >
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
              {visibleRecentIncidents.length === 0 ? (
                <Typography className="dashboard-subtitle">No incidents available.</Typography>
              ) : (
                visibleRecentIncidents.map((incident) => {
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
                    <Box
                      key={item.number}
                      className="ai-item"
                      sx={{ cursor: "pointer" }}
                      onClick={() => navigate("/incidents", { state: { openIncident: item.number } })}
                    >
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
