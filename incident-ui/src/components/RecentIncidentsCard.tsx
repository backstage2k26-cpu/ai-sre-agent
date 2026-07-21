import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
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
        gridColumn: "1 / -1",
        backgroundColor: "#1b2333",
        color: "white",
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 600 }}
          >
            Recent Incidents
          </Typography>

          <Typography
            sx={{
              color: "#5DADE2",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            View All →
          </Typography>
        </Box>

        {incidents.length === 0 ? (
          <Typography color="gray">
            No incidents found.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: "#9CA3AF", fontWeight: 600 }}>
                    Incident ID
                  </TableCell>

                  <TableCell sx={{ color: "#9CA3AF", fontWeight: 600 }}>
                    Summary
                  </TableCell>

                  <TableCell sx={{ color: "#9CA3AF", fontWeight: 600 }}>
                    Priority
                  </TableCell>

                  <TableCell sx={{ color: "#9CA3AF", fontWeight: 600 }}>
                    Status
                  </TableCell>

                  <TableCell sx={{ color: "#9CA3AF", fontWeight: 600 }}>
                    Created At
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                                {incidents.map((incident) => (
                  <TableRow
                    key={incident.number}
                    hover
                    sx={{
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "#27324a",
                      },
                    }}
                  >
                    <TableCell sx={{ color: "white" }}>
                      {incident.number}
                    </TableCell>

                    <TableCell
                      sx={{
                        color: "white",
                        maxWidth: 450,
                      }}
                    >
                      {incident.short_description}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={incident.priority}
                        color={priorityColor(incident.priority)}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={incident.state}
                        size="small"
                        sx={{
                          backgroundColor: "#374151",
                          color: "white",
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ color: "#C7CEDB" }}>
                      {new Date(
                        incident.opened_at
                      ).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}