import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

interface RunningInvestigation {
  investigation_id: string;
  incident_number: string;
  service: string;
  progress: number;
  current_step: string;
}

interface Props {
  investigations: RunningInvestigation[];
}

export default function RunningInvestigationsCard({
  investigations,
}: Props) {
  const navigate = useNavigate();
  return (
    <Card
      sx={{
        mt: 4,
        backgroundColor: "#1b2333",
        color: "white",
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Typography
          variant="h5"
          sx={{ mb: 3 }}
        >
          Running Investigations
        </Typography>

        {investigations.length === 0 && (
          <Typography>
            No investigations running.
          </Typography>
        )}

        {investigations.map((job) => (
          <Box
            key={job.investigation_id}
            onClick={() =>
                navigate(`/reports/${job.investigation_id}`)
            }
            sx={{
              mb: 4,
              cursor: "pointer",
              p: 2,
              borderRadius: 2,
              transition: "0.2s",
              "&:hover": {
                backgroundColor: "#27324a",
            },
            }}
          >
            <Typography variant="h6">
              {job.incident_number}
            </Typography>

            <Typography color="gray">
              {job.service}
            </Typography>

            <LinearProgress
              variant="determinate"
              value={job.progress}
              sx={{
                mt: 2,
                mb: 1,
                height: 8,
                borderRadius: 5,
              }}
            />

            <Typography>
              {job.progress}%
            </Typography>

            <Typography color="#90caf9">
              {job.current_step}
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}