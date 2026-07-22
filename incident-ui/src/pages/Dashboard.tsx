import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import KpiCard from "../components/KpiCard";
import { getDashboard } from "../services/dashboardService";
import RecentIncidentsCard from "../components/RecentIncidentsCard";
import { getRecentIncidents } from "../services/recentIncidentService";

export default function Dashboard() {  
  const [dashboard, setDashboard] = useState<any>(null);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");

  const loadDashboard = async () => {
    try {
      const data = await getDashboard();
      setDashboard(data);
      const recent = await getRecentIncidents();
      setRecentIncidents(recent);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const formatTime = () =>
      new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(new Date());

    setUpdatedAt(formatTime());

    const timer = window.setInterval(() => {
      setUpdatedAt(formatTime());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  if (!updatedAt) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ color: "var(--text-primary)" }}>
          Loading Dashboard...
        </Typography>
      </Box>
    );
  }

  if (loading || !dashboard) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ color: "var(--text-primary)" }}>
          Loading Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        px: { xs: 1, md: 1.5 },
        py: { xs: 1.5, md: 2 },
      }}
    >
      <Box
        className="dashboard-scale-wrap"
        sx={{
          transform: { xs: "scale(0.95)", md: "scale(0.9)" },
          transformOrigin: "top left",
          width: { xs: "105.26%", md: "111.11%" },
        }}
      >
        <Box className="dashboard-shell">
          <Box className="dashboard-topbar">
            <Box>
              <Typography className="dashboard-title">
                AI SRE Dashboard
              </Typography>
              <Typography className="dashboard-subtitle">
                Real-time incident monitoring & AI resolution
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Box className="dashboard-datetime">
                <CalendarMonthOutlinedIcon fontSize="small" />
                <Typography>{updatedAt}</Typography>
              </Box>

              <Button
                className="dashboard-refresh"
                startIcon={<RefreshRoundedIcon />}
                onClick={loadDashboard}
              >
                Refresh
              </Button>
            </Stack>
          </Box>

          <Box className="kpi-grid">
            <KpiCard title="Total Incidents" value={dashboard.total_incidents} tone="indigo" icon="clipboard" />
            <KpiCard title="AI Resolved" value={dashboard.resolved} tone="green" icon="check" />
            <KpiCard title="Failed Investigations" value={dashboard.failed} tone="red" icon="close" />
            <KpiCard title="High Priority" value={dashboard.running_investigations + dashboard.failed} tone="amber" icon="flag" />
            <KpiCard title="Avg Investigation Time" value={`${dashboard.avg_investigation_time}m`} tone="violet" icon="clock" />
            <KpiCard title="Avg Confidence" value={`${dashboard.avg_confidence}%`} tone="blue" icon="pulse" />
          </Box>

          <RecentIncidentsCard incidents={recentIncidents} />
        </Box>
      </Box>
    </Box>
  );
}
