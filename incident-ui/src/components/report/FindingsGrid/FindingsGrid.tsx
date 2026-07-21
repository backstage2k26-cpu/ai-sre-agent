import { useState } from "react";

import Grid from "@mui/material/Grid";

import TimelineIcon from "@mui/icons-material/Timeline";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ArticleIcon from "@mui/icons-material/Article";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import DnsIcon from "@mui/icons-material/Dns";
import LanIcon from "@mui/icons-material/Lan";

import InvestigationModule from "../InvestigationModule";
import InvestigationDialog from "../InvestigationDialog/InvestigationDialog";

import TimelineContent from "../modules/Timeline/TimelineContent";
import LogsContent from "../modules/Logs/LogsContent";
import MetricsContent from "../modules/Metrics/MetricsContent";
import DeploymentContent from "../modules/Deployment/DeploymentContent";
import KubernetesContent from "../modules/Kubernetes/KubernetesContent";
import NetworkContent from "../modules/Network/NetworkContent";

import type { Investigation } from "../../../types/investigation";

interface Props {
  investigation: Investigation;
}

type DialogType =
  | "timeline"
  | "deployment"
  | "logs"
  | "metrics"
  | "kubernetes"
  | "network"
  | null;

export default function FindingsGrid({ investigation }: Props) {
  const [dialog, setDialog] = useState<DialogType>(null);

  const closeDialog = () => setDialog(null);

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <InvestigationModule
            title="Timeline"
            subtitle={`${investigation.timeline.length} Events`}
            icon={<TimelineIcon color="primary" />}
            status="success"
            onClick={() => setDialog("timeline")}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <InvestigationModule
            title="Deployment"
            subtitle="Deployment Analysis"
            icon={<RocketLaunchIcon color="primary" />}
            status="success"
            onClick={() => setDialog("deployment")}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <InvestigationModule
            title="Logs"
            subtitle="Application Logs"
            icon={<ArticleIcon color="primary" />}
            status="success"
            onClick={() => setDialog("logs")}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <InvestigationModule
            title="Metrics"
            subtitle="Prometheus Metrics"
            icon={<MonitorHeartIcon color="primary" />}
            status="success"
            onClick={() => setDialog("metrics")}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <InvestigationModule
            title="Kubernetes"
            subtitle="Cluster Analysis"
            icon={<DnsIcon color="primary" />}
            status="success"
            onClick={() => setDialog("kubernetes")}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <InvestigationModule
            title="Network"
            subtitle={investigation.network.assessment}
            icon={<LanIcon color="primary" />}
            status="success"
            onClick={() => setDialog("network")}
          />
        </Grid>
      </Grid>

      <InvestigationDialog
        open={dialog === "timeline"}
        title="Timeline"
        icon={<TimelineIcon color="primary" />}
        onClose={closeDialog}
      >
        <TimelineContent investigation={investigation} />
      </InvestigationDialog>

      <InvestigationDialog
        open={dialog === "logs"}
        title="Application Logs"
        icon={<ArticleIcon color="primary" />}
        onClose={closeDialog}
      >
        <LogsContent investigation={investigation} />
      </InvestigationDialog>

      <InvestigationDialog
        open={dialog === "metrics"}
        title="Metrics Analysis"
        icon={<MonitorHeartIcon color="primary" />}
        onClose={closeDialog}
      >
        <MetricsContent investigation={investigation} />
      </InvestigationDialog>

      <InvestigationDialog
        open={dialog === "deployment"}
        title="Deployment Analysis"
        icon={<RocketLaunchIcon color="primary" />}
        onClose={closeDialog}
      >
        <DeploymentContent investigation={investigation} />
      </InvestigationDialog>

      <InvestigationDialog
        open={dialog === "kubernetes"}
        title="Kubernetes Analysis"
        icon={<DnsIcon color="primary" />}
        onClose={closeDialog}
      >
        <KubernetesContent investigation={investigation} />
      </InvestigationDialog>

      <InvestigationDialog
        open={dialog === "network"}
        title="Network Analysis"
        icon={<LanIcon color="primary" />}
        onClose={closeDialog}
      >
        <NetworkContent investigation={investigation} />
      </InvestigationDialog>
    </>
  );
}