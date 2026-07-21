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
        sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 1,
        }}
    >
      <Typography
          sx={{
              fontWeight: 600,
          }}
      >

      <Box textAlign="right">
        {value}
      </Box>
    </Box>
  );
}

export default function VerdictContent({
  investigation,
}: Props) {

  const result = investigation.investigation_result;

  const confidence =
    investigation.ai_result?.confidence ?? 0;

  if (!result) {
    return null;
  }

  const getResultColor = (
    status: string,
  ):
    | "success"
    | "warning"
    | "error"
    | "default" => {

    switch (status) {

      case "Confirmed":
        return "success";

      case "Likely":
        return "warning";

      case "Rejected":
        return "error";

      default:
        return "default";
    }
  };

  return (
    <Stack spacing={3}>

      <Alert severity="success">
        AI has completed the investigation and generated the final investigation result.
      </Alert>

      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Investigation Result
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={1}>

          <InfoRow
            label="Status"
            value={
              <Chip
                label={result.status.toUpperCase()}
                color={getResultColor(result.status)}
              />
            }
          />

          <InfoRow
            label="Confidence"
            value={`${confidence}%`}
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
          Summary
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Typography color="text.secondary">
          {result.summary}
        </Typography>

        <Box
          mt={3}
          display="flex"
          gap={2}
          flexWrap="wrap"
        >

          <Chip
            icon={<FactCheckIcon />}
            label={result.status}
            color={getResultColor(result.status)}
          />

          <Chip
            icon={<CheckCircleIcon />}
            label="Investigation Complete"
            color="success"
          />

        </Box>

      </Paper>

    </Stack>
  );
}