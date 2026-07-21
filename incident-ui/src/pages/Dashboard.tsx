import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

import KpiCard from "../components/KpiCard";
import { getDashboard } from "../services/dashboardService";
import RunningInvestigationsCard from "../components/RunningInvestigationsCard";
import { getRunningInvestigations } from "../services/runningInvestigationService";
import RecentIncidentsCard from "../components/RecentIncidentsCard";
import { getRecentIncidents } from "../services/recentIncidentService";

export default function Dashboard() {
  const [runningInvestigations, setRunningInvestigations] = useState<any[]>([]);  
  const [dashboard, setDashboard] = useState<any>(null);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getDashboard();
        setDashboard(data);
        const running = await getRunningInvestigations();
        setRunningInvestigations(running);
        const recent = await getRecentIncidents();
        setRecentIncidents(recent);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      }
    }

    loadDashboard();
  }, []);

  if (!dashboard) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4">
          Loading Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
      <Box
        sx={{
          flex: 1,
          p: 4,
        }}
      >
        <Typography
          variant="h3"
          sx={{
            mb: 4,
            fontWeight: "bold",
          }}
        >
          AI SRE Dashboard
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 3,
          }}
        >
          <KpiCard
            title="Total Incidents"
            value={dashboard.total_incidents}
          />

          <KpiCard
            title="Running Investigations"
            value={dashboard.running_investigations}
          />

          <KpiCard
            title="AI Resolved"
            value={dashboard.resolved}
          />

          <KpiCard
            title="Failed Investigations"
            value={dashboard.failed}
          />

          <KpiCard
            title="High Priority"
            value={dashboard.high_priority}
          />

          <KpiCard
            title="Avg Investigation Time"
            value={dashboard.avg_investigation_time}
          />

          <KpiCard
            title="Avg Confidence"
            value={`${dashboard.avg_confidence}%`}
          />
          <RunningInvestigationsCard
            investigations={runningInvestigations}
          />
          <RecentIncidentsCard
            incidents={recentIncidents}
          />
        </Box>
      </Box>
  );
}