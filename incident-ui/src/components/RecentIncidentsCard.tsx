import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import IncidentDetailsDialog from "./IncidentDetailsDialog";

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

function priorityLabel(priority: string): string {
  return `P${priority}`;
}

function priorityTone(priority: string) {
  const val = priority.toString();
  if (val === "1" || val === "P1") {
    return { bgcolor: "#FEF2F2", color: "#EF4444" };
  }
  if (val === "2" || val === "P2") {
    return { bgcolor: "#FFFBEB", color: "#D97706" };
  }
  return { bgcolor: "#F3F4F6", color: "#6B7280" };
}

function incidentStatusLabel(status?: string | null) {
  if (!status) return "Unknown";

  const raw = status.toString().trim();
  const normalized = raw.toLowerCase();

  if (/^\d+$/.test(raw)) {
    switch (raw) {
      case "1":
        return "New";
      case "2":
        return "In Progress";
      case "3":
        return "On Hold";
      case "6":
        return "Resolved";
      case "7":
        return "Closed";
      case "8":
        return "Canceled";
      default:
        return raw;
    }
  }

  if (normalized.includes("new")) return "New";
  if (normalized.includes("progress") || normalized.includes("work in progress")) return "In Progress";
  if (normalized.includes("hold")) return "On Hold";
  if (normalized.includes("resolv")) return "Resolved";
  if (normalized.includes("close")) return "Closed";
  if (normalized.includes("cancel")) return "Canceled";

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function incidentStatusPalette(status?: string | null) {
  const label = incidentStatusLabel(status).toLowerCase();

  if (label.includes("resolve") || label.includes("close") || label.includes("cancel")) {
    return { dot: "#16A34A", bg: "#ECFDF5", fg: "#16A34A" };
  }

  if (label.includes("progress") || label.includes("hold")) {
    return { dot: "#D97706", bg: "#FFF7E6", fg: "#D97706" };
  }

  if (label.includes("new")) {
    return { dot: "#3B82F6", bg: "#EEF4FF", fg: "#3B82F6" };
  }

  return { dot: "#64748B", bg: "#F3F4F6", fg: "#64748B" };
}

export default function RecentIncidentsCard({
  incidents,
}: Props) {
    const navigate = useNavigate();
    const [selectedIncident, setSelectedIncident] =
      useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);

    const openIncident = (number: string) => {
      setSelectedIncident(number);
      setDialogOpen(true);
    };
  return (
    <Box
      sx={{
        mt: 2,
        gridColumn: "1 / -1",
        borderRadius: "22px",
        background: "rgba(255,255,255,.96)",
        border: "1px solid rgba(226,232,240,.9)",
        boxShadow: "0 12px 34px rgba(15,23,42,.08)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pt: { xs: 2, md: 2.25 },
          pb: { xs: 2, md: 2 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 1,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 500,
              color: "var(--text-strong)",
              lineHeight: 1.1,
            }}
          >
            Recent Incidents
          </Typography>

          <Typography
            sx={{
              mt: 0.55,
              fontSize: 12,
              fontWeight: 400,
              color: "var(--text-soft)",
              lineHeight: 1.2,
            }}
          >
            Last updated just now
          </Typography>
        </Box>

        <Typography
          sx={{
            color: "var(--accent)",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: 13,
            whiteSpace: "nowrap",
            lineHeight: 1,
          }}
          onClick={() => navigate("/incidents")}
        >
          View all
          <Box component="span" sx={{ ml: 1 }}>
            ›
          </Box>
        </Typography>
      </Box>

      {incidents.length === 0 ? (
        <Box sx={{ px: 3, pb: 3 }}>
          <Typography sx={{ color: "var(--text-soft)" }}>
            No incidents found.
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{ px: 0 }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow
                sx={{
                  background: "#F8FAFC",
                  "& .MuiTableCell-root": {
                    color: "#A8B3C7",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    fontSize: 13,
                    borderBottom: "1px solid #E7EBF3",
                  },
                }}
              >
                <TableCell sx={{ pl: { xs: 3, md: 5 } }}>Incident ID</TableCell>
                <TableCell>Summary</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ pr: { xs: 3, md: 5 } }}>Created At</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {incidents.map((incident) => {
                const statusLabel = incidentStatusLabel(incident.state);
                const statusSx = incidentStatusPalette(incident.state);

                return (
                  <TableRow
                    key={incident.number}
                    hover
                    onClick={() => openIncident(incident.number)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "#F8FAFC",
                      },
                      "& .MuiTableCell-root": {
                        borderBottom: "1px solid #EEF2F7",
                        fontSize: 15,
                        fontWeight: 400,
                        py: 2.1,
                      },
                    }}
                  >
                    <TableCell sx={{ pl: { xs: 3, md: 5 }, color: "var(--accent)", fontWeight: 500, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                      {incident.number}
                    </TableCell>
                    <TableCell sx={{ color: "var(--text-strong)", maxWidth: 520, fontWeight: 400 }}>
                      {incident.short_description}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={priorityLabel(incident.priority)}
                        size="small"
                        sx={{
                          fontWeight: 500,
                          borderRadius: 999,
                          ...priorityTone(incident.priority),
                        }}
                      />
                    </TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabel}
                          size="small"
                          sx={{
                            fontWeight: 500,
                            borderRadius: 999,
                            bgcolor: statusSx.bg,
                            color: statusSx.fg,
                          }}
                        />
                      </TableCell>
                    <TableCell sx={{ pr: { xs: 3, md: 5 }, color: "#AAB5CA", fontWeight: 400 }}>
                      {new Date(incident.opened_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <IncidentDetailsDialog
        open={dialogOpen}
        incidentNumber={selectedIncident}
        onClose={() => {
          setDialogOpen(false);
          setSelectedIncident(null);
        }}
      />
    </Box>
  );
}
