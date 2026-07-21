import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";

import type { Investigation } from "../../../../types/investigation";

interface Props {
  investigation: Investigation;
}

export default function MetricsContent({
  investigation,
}: Props) {
  return (
    <Stack spacing={3}>
      <Alert severity="info">
        AI analyzed Prometheus metrics during the investigation.
      </Alert>

      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Metrics Analysis
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Typography
          sx={{
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
          }}
        >
          {JSON.stringify(investigation.metrics, null, 2)}
        </Typography>
      </Paper>

      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Source
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Box display="flex" gap={2}>
          <Chip
            icon={<MonitorHeartIcon />}
            label="Prometheus"
            color="success"
          />

          <Chip
            label="Grafana"
            color="primary"
          />
        </Box>
      </Paper>
    </Stack>
  );
}