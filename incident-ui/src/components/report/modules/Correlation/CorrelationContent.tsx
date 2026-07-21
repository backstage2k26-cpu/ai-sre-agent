import {
  Alert,
  Box,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import HubIcon from "@mui/icons-material/Hub";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import type { Investigation } from "../../../../types/investigation";

interface Props {
  investigation: Investigation;
}

interface ScoreRowProps {
  label: string;
  value: number;
}

function ScoreRow({ label, value }: ScoreRowProps) {
  const color =
    value >= 80
      ? "success"
      : value >= 60
      ? "warning"
      : "error";

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        mb={0.5}
      >
        <Typography fontWeight={600}>{label}</Typography>
        <Typography>{value}%</Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={value}
        color={color}
        sx={{
          height: 10,
          borderRadius: 5,
        }}
      />
    </Box>
  );
}

export default function CorrelationContent({
  investigation,
}: Props) {
  const evidence = investigation.evidence;

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        AI correlated evidence collected from deployments, logs, Kubernetes,
        metrics, networking and historical knowledge.
      </Alert>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          Evidence Correlation Score
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={3}>
          <ScoreRow
            label="Deployment"
            value={evidence.deployment}
          />

          <ScoreRow
            label="Logs"
            value={evidence.logs}
          />

          <ScoreRow
            label="Kubernetes"
            value={evidence.kubernetes}
          />

          <ScoreRow
            label="Metrics"
            value={evidence.metrics}
          />

          <ScoreRow
            label="Network"
            value={evidence.network}
          />

          <ScoreRow
            label="Knowledge"
            value={evidence.knowledge}
          />

          <Divider />

          <ScoreRow
            label="Overall Confidence"
            value={evidence.overall}
          />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          AI Correlation Summary
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Typography color="text.secondary">
          Multiple telemetry sources were compared to identify consistent
          patterns and eliminate unrelated events. The overall evidence score
          represents AI confidence in the investigation findings.
        </Typography>

        <Box
          mt={3}
          display="flex"
          gap={2}
          flexWrap="wrap"
        >
          <Chip
            icon={<HubIcon />}
            label="Evidence Correlated"
            color="primary"
          />

          <Chip
            icon={<CheckCircleIcon />}
            label={`${evidence.overall}% Confidence`}
            color="success"
          />
        </Box>
      </Paper>
    </Stack>
  );
}