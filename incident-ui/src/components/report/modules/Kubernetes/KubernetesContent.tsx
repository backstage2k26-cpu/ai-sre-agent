import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import DnsIcon from "@mui/icons-material/Dns";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import type { Investigation } from "../../../../types/investigation";

interface Props {
  investigation: Investigation;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function KubernetesContent({ investigation }: Props) {
  const kubernetes = investigation.kubernetes ?? {};

  const entries = Object.entries(kubernetes);

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        AI inspected Kubernetes resources, pod status and cluster events during
        the investigation.
      </Alert>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          Kubernetes Analysis
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={2}>
          {entries.length === 0 ? (
            <Typography color="text.secondary">
              No Kubernetes analysis available.
            </Typography>
          ) : (
            entries.map(([key, value]) => (
              <Box
                key={key}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "background.default",
                }}
              >
                <Typography fontWeight={600}>
                  {key.replace(/_/g, " ").toUpperCase()}
                </Typography>

                <Typography color="text.secondary" textAlign="right">
                  {formatValue(value)}
                </Typography>
              </Box>
            ))
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          AI Assessment
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Typography color="text.secondary">
          Kubernetes objects including Pods, ReplicaSets, Deployments, Services,
          ConfigMaps and cluster events were correlated with the incident to
          detect scheduling failures, restarts, configuration issues or rollout
          problems.
        </Typography>

        <Box mt={3} display="flex" gap={2} flexWrap="wrap">
          <Chip
            icon={<DnsIcon />}
            label="Cluster Checked"
            color="primary"
          />

          <Chip
            icon={<CheckCircleIcon />}
            label="Resources Verified"
            color="success"
          />

          <Chip
            icon={<WarningAmberIcon />}
            label="Events Analyzed"
            color="warning"
          />
        </Box>
      </Paper>
    </Stack>
  );
}