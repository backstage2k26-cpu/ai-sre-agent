import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import FactCheckIcon from "@mui/icons-material/FactCheck";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PersonIcon from "@mui/icons-material/Person";

import type { Investigation } from "../../../../types/investigation";

interface Props {
  investigation: Investigation;
}

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      py={1}
    >
      <Typography fontWeight={600}>{label}</Typography>
      <Typography color="text.secondary" textAlign="right">
        {value}
      </Typography>
    </Box>
  );
}

export default function VerdictContent({
  investigation,
}: Props) {
  const verdict = investigation.verdict;

  return (
    <Stack spacing={3}>
      <Alert severity="success">
        AI has completed the investigation and generated the final verdict.
      </Alert>

      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Investigation Verdict
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={1}>
          <InfoRow
            label="Status"
            value={
              <Chip
                label={verdict.status}
                color="success"
                size="small"
              />
            }
          />

          <InfoRow
            label="Confidence"
            value={`${verdict.confidence}%`}
          />

          <InfoRow
            label="Root Cause"
            value={verdict.root_cause}
          />

          <InfoRow
            label="Recommended Owner"
            value={verdict.owner}
          />

          <InfoRow
            label="Investigation Time"
            value={verdict.investigation_time}
          />
        </Stack>
      </Paper>

      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
        }}
      >
        <Typography variant="h6" gutterBottom>
          AI Summary
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Typography color="text.secondary">
          Based on deployment analysis, Kubernetes inspection,
          metrics, logs, networking and historical knowledge,
          the AI identified the most probable root cause with
          <strong> {verdict.confidence}% </strong>
          confidence.
        </Typography>

        <Box
          mt={3}
          display="flex"
          gap={2}
          flexWrap="wrap"
        >
          <Chip
            icon={<FactCheckIcon />}
            label="Final Verdict"
            color="primary"
          />

          <Chip
            icon={<CheckCircleIcon />}
            label="Investigation Complete"
            color="success"
          />

          <Chip
            icon={<PersonIcon />}
            label={verdict.owner}
            color="secondary"
          />

          <Chip
            icon={<ScheduleIcon />}
            label={verdict.investigation_time}
            color="warning"
          />
        </Box>
      </Paper>
    </Stack>
  );
}