import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

import type { Investigation } from "../../../../types/investigation";

interface Props {
  investigation: Investigation;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function DeploymentContent({ investigation }: Props) {
  const deployment = investigation.deployment ?? {};

  const entries = Object.entries(deployment);

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        AI analyzed deployment activity around the incident timeframe.
      </Alert>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          Deployment Summary
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={2}>
          {entries.length === 0 ? (
            <Typography color="text.secondary">
              No deployment information available.
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

                <Typography color="text.secondary">
                  {formatValue(value)}
                </Typography>
              </Box>
            ))
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          AI Observation
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Typography color="text.secondary">
          Deployment metadata was correlated with the incident timeline to
          identify whether a rollout, image change, configuration update or
          infrastructure modification could have triggered the reported issue.
        </Typography>

        <Box mt={3} display="flex" gap={2} flexWrap="wrap">
          <Chip
            icon={<RocketLaunchIcon />}
            label="Deployment Checked"
            color="primary"
          />

          <Chip
            icon={<CheckCircleIcon />}
            label="Timeline Correlated"
            color="success"
          />

          <Chip
            icon={<ErrorIcon />}
            label="Root Cause Evaluated"
            color="warning"
          />
        </Box>
      </Paper>
    </Stack>
  );
}