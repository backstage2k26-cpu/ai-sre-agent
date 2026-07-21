import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
} from "@mui/material";

interface Incident {
  number: string;
  short_description: string;
  priority: string;
  state: string;
  opened_at: string;
}

interface Props {
  incidents: Incident[];
}

function priorityColor(priority: string) {
  switch (priority) {
    case "1":
    case "P1":
      return "error";
    case "2":
    case "P2":
      return "warning";
    default:
      return "primary";
  }
}

export default function RecentIncidentsCard({
  incidents,
}: Props) {
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
          Recent Incidents
        </Typography>

        {incidents.length === 0 ? (
          <Typography color="gray">
            No incidents found.
          </Typography>
        ) : (
          incidents.map((incident) => (
            <Box
              key={incident.number}
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 2,
                backgroundColor: "#27324a",
              }}
            >
              <Typography variant="h6">
                {incident.number}
              </Typography>

              <Typography sx={{ mb: 1 }}>
                {incident.short_description}
              </Typography>

              <Chip
                label={incident.priority}
                color={priorityColor(incident.priority)}
                size="small"
                sx={{ mr: 1 }}
              />

              <Chip
                label={incident.state}
                size="small"
              />

              <Typography
                variant="body2"
                color="gray"
                sx={{ mt: 1 }}
              >
                {new Date(
                  incident.opened_at
                ).toLocaleString()}
              </Typography>
            </Box>
          ))
        )}
      </CardContent>
    </Card>
  );
}