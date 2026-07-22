import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Incident } from "../types/incident";
import { getIncidents } from "../services/incidentService";
import IncidentDetailsDialog from "../components/IncidentDetailsDialog";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Pagination,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";

type FilterKey = "all" | "new" | "progress" | "resolved";

const PAGE_SIZE = 8;
const TABLE_COLUMNS = [
  { label: "Incident ID", width: "14.285%" },
  { label: "Service", width: "14.285%" },
  { label: "Priority", width: "14.285%" },
  { label: "Status", width: "14.285%" },
  { label: "Investigation Status", width: "14.285%" },
  { label: "Created At", width: "14.285%" },
  { label: "Actions", width: "14.285%" },
] as const;

function priorityLabel(priority: string) {
  if (priority === "1") return "P1";
  if (priority === "2") return "P2";
  if (priority === "3") return "P3";
  return priority;
}

function statusTone(status: string) {
  const value = status.toLowerCase();
  if (value.includes("progress")) return "warning";
  if (value.includes("resolve")) return "success";
  return "info";
}

function investigationTone(status?: string | null) {
  switch (status) {
    case "RUNNING":
      return { label: "Running", tone: "info" as const };

    case "COMPLETED":
      return { label: "Completed", tone: "success" as const };

    case "FAILED":
      return { label: "Failed", tone: "error" as const };

    default:
      return { label: "New", tone: "default" as const };
  }
}

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState(1);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const navigate = useNavigate();

  const loadIncidents = async () => {
    try {
      const data = await getIncidents();
      setIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const openIncident = (number: string) => {
    setSelectedIncident(number);
    setDialogOpen(true);
  };

  const filteredIncidents = useMemo(() => {
    const q = search.toLowerCase();

    return incidents.filter((incident) => {
      const matchesSearch =
        (incident.number ?? "").toLowerCase().includes(q) ||
        (incident.service ?? "").toLowerCase().includes(q) ||
        (incident.short_description ?? "").toLowerCase().includes(q);

      const matchesPriority =
        priority === "all" || incident.priority.toUpperCase() === priority.toUpperCase();

      const state = incident.state.toLowerCase();
      const matchesFilter =
        filter === "all" ||
        (filter === "new" && !state.includes("progress") && !state.includes("resolve")) ||
        (filter === "progress" && state.includes("progress")) ||
        (filter === "resolved" && state.includes("resolve"));

      return matchesSearch && matchesPriority && matchesFilter;
    });
  }, [incidents, search, priority, filter]);

  useEffect(() => {
    setPage(1);
  }, [search, priority, filter]);

  const pageCount = Math.max(1, Math.ceil(filteredIncidents.length / PAGE_SIZE));
  const pagedIncidents = filteredIncidents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCsv = () => {
    const headers = [
      "number",
      "service",
      "short_description",
      "priority",
      "state",
      "investigation_status",
      "investigation_id",
    ];

    const rows = filteredIncidents.map((incident) =>
      [
        incident.number,
        incident.service,
        incident.short_description,
        incident.priority,
        incident.state,
        incident.investigation_status ?? "",
        incident.investigation_id ?? "",
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "incidents.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2.25,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: { xs: 30, md: 38 },
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.05em",
              color: "var(--text-strong)",
            }}
          >
            Incidents
          </Typography>

          <Typography
            sx={{
              mt: 1,
              fontSize: { xs: 14, md: 16 },
              fontWeight: 600,
              color: "var(--text-soft)",
            }}
          >
            Manage and investigate all incidents
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All", count: incidents.length },
            { key: "new", label: "New", count: incidents.filter((i) => !i.state.toLowerCase().includes("progress") && !i.state.toLowerCase().includes("resolve")).length },
            { key: "progress", label: "In Progress", count: incidents.filter((i) => i.state.toLowerCase().includes("progress")).length },
            { key: "resolved", label: "Resolved", count: incidents.filter((i) => i.state.toLowerCase().includes("resolve")).length },
          ].map((item) => {
            const active = filter === item.key;
            return (
              <Chip
                key={item.key}
                label={
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor:
                          item.key === "all"
                            ? "#FF5B1F"
                            : item.key === "new"
                            ? "#3B82F6"
                            : item.key === "progress"
                            ? "#F59E0B"
                            : "#10B981",
                      }}
                    />

                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      {item.label}
                    </Typography>

                    <Box
                      sx={{
                        minWidth: 24,
                        height: 24,
                        px: 0.8,
                        borderRadius: "999px",
                        bgcolor: "#EEF2F7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#64748B",
                      }}
                    >
                      {item.count}
                    </Box>
                  </Box>
                }
                onClick={() => setFilter(item.key as FilterKey)}
                sx={{
                  height: 38,
                  px: 0.5,
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: 13.5,
                  bgcolor: active ? "#FFF5EF" : "#fff",
                  color: active ? "#FF5B1F" : "#64748B",
                  border: active ? "1px solid #FF5B1F" : "1px solid rgba(226,232,240,.95)",
                  boxShadow: "0 6px 16px rgba(15,23,42,.06)",
                  "& .MuiChip-label": {
                    px: 1.25,
                  },
                }}
              />
            );
          })}
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              minHeight: 44,
              borderRadius: 1.75,
              bgcolor: "rgba(255,255,255,.96)",
              border: "1px solid rgba(226,232,240,.9)",
              boxShadow: "0 10px 22px rgba(15,23,42,.06)",

            }}
          >
            <SearchRoundedIcon
              sx={{
                color: "#94A3B8",
                fontSize: 28,
              }}
            />
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, summary or service..."
              variant="standard"
              fullWidth
              InputProps={{ disableUnderline: true }}
              sx={{
                "& .MuiInput-root:before": {
                  borderBottom: "none !important",
                },
                "& .MuiInput-root:hover:not(.Mui-disabled):before": {
                  borderBottom: "none !important",
                },
                "& .MuiInput-root:after": {
                  borderBottom: "none !important",
                },
                "& input": {
                  py: 0.85,
                  fontSize: 14.5,
                  color: "var(--text-strong)",
                },
              }}
            />
          </Box>

          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            size="small"
            MenuProps={{
              slotProps: {
                paper: {
                  sx: {
                    mt: 0.5,
                    width: 128,
                    minWidth: 128,
                    p: 0.35,
                    borderRadius: "12px",
                    bgcolor: "#3E3E3E",
                    boxShadow: "0 12px 28px rgba(0,0,0,.35)",
                    border: "1px solid rgba(255,255,255,.10)",

                    "& .MuiMenu-list": {
                      p: 0,
                    },

                    "& .MuiMenuItem-root": {
                      minHeight: 28,
                      height: 28,
                      px: 1.2,
                      my: 0.15,
                      mx: 0.15,
                      borderRadius: "8px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#FFFFFF",
                    },

                    "& .Mui-selected": {
                      bgcolor: "#5B8EF1 !important",
                      color: "#fff",
                    },
                  }
                },
              },
            }}
            sx={{
              minWidth: 170,
              height: 52,
              bgcolor: "#fff",
              borderRadius: "16px",
              "& fieldset": {
                borderColor: "#E5E7EB",
              },
            }}
          >
            <MenuItem value="all">All Priorities</MenuItem>
            <MenuItem value="P1">P1</MenuItem>
            <MenuItem value="P2">P2</MenuItem>
            <MenuItem value="P3">P3</MenuItem>
          </Select>
        </Box>

        <Box
          sx={{
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,.96)",
            border: "1px solid rgba(226,232,240,.9)",
            boxShadow: "0 18px 48px rgba(15,23,42,.08)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 1,
              minHeight: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #EDF2F7",
            }}
          >
            <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: "#64748B" }}>
              <Box component="span" sx={{ color: "var(--text-strong)" }}>
                {filteredIncidents.length}
              </Box>{" "}
              incidents found
            </Typography>

            <Button
              variant="outlined"
              onClick={exportCsv}
              startIcon={<DownloadRoundedIcon />}
              sx={{
                textTransform: "none",
                borderRadius: 1.75,
                fontWeight: 700,
                color: "#94A3B8",
                borderColor: "#D7DFEA",
                bgcolor: "#fff",
              }}
            >
              Export
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ py: 10, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ overflowX: "hidden" }}>
              <Box
                component="table"
                sx={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                }}
              >
                <Box component="thead">
                  <Box component="tr" sx={{ bgcolor: "#FAFBFD" }}>
                    {TABLE_COLUMNS.map((column) => (
                      <Box
                        key={column.label}
                        component="th"
                        sx={{
                          textAlign: "left",
                          px: 3,
                          py: 1.5,
                          fontSize: 13,
                          color: "#B1BBCB",
                          letterSpacing: "0.08em",
                          fontWeight: 800,
                          borderBottom: "1px solid #EDF2F7",
                          width: column.width,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {column.label}
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box component="tbody">
                  {pagedIncidents.map((incident) => {
                    const investigation = investigationTone(incident.investigation_status);

                    return (
                      <Box
                        component="tr"
                        key={incident.number}
                        sx={{
                          "&:hover": { bgcolor: "#FBFDFF" },
                          cursor: "pointer",
                          borderBottom: "1px solid #F1F5F9",
                        }}
                        onClick={() => openIncident(incident.number)}
                      >
                        <Box component="td" sx={{ px: 3, py: 2.1, fontWeight: 800, color: "#FF5B1F", fontSize: 14, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                          {incident.number}
                        </Box>
                        <Box component="td" sx={{ px: 3, py: 2.1 }}>
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              minHeight: 28,
                              px: 1.25,
                              borderRadius: 999,
                              bgcolor: "#EEF3FA",
                              color: "#64748B",
                              fontWeight: 800,
                              fontSize: 12.5,
                              whiteSpace: "nowrap",
                              maxWidth: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {incident.service ||
                              incident.short_description
                                ?.split(" service")[0]
                                ?.split(" check")[0] ||
                              "-"}
                          </Box>
                        </Box>
                        <Box component="td" sx={{ px: 3, py: 2.1 }}>
                          <Chip
                            label={priorityLabel(incident.priority)}
                            size="small"
                            sx={{
                              borderRadius: 999,
                              fontWeight: 800,
                              fontSize: 12,
                              bgcolor:
                                incident.priority === "1" || incident.priority === "P1"
                                  ? "#FEF2F2"
                                  : incident.priority === "2" || incident.priority === "P2"
                                    ? "#FFFBEB"
                                    : "#F3F4F6",
                              color:
                                incident.priority === "1" || incident.priority === "P1"
                                  ? "#EF4444"
                                  : incident.priority === "2" || incident.priority === "P2"
                                    ? "#D97706"
                                    : "#6B7280",
                            }}
                          />
                        </Box>
                        <Box component="td" sx={{ px: 3, py: 2.1 }}>
                          <Chip
                            label={
                              incident.state.toLowerCase().includes("progress")
                                ? "In Progress"
                                : incident.state.toLowerCase().includes("resolve")
                                  ? "Resolved"
                                  : "New"
                            }
                            size="small"
                            sx={{
                              borderRadius: 999,
                              fontWeight: 800,
                              fontSize: 12,
                              bgcolor:
                                statusTone(incident.state) === "success"
                                  ? "#ECFDF5"
                                  : statusTone(incident.state) === "warning"
                                    ? "#FFF7E6"
                                    : "#EEF4FF",
                              color:
                                statusTone(incident.state) === "success"
                                  ? "#10B981"
                                  : statusTone(incident.state) === "warning"
                                    ? "#D97706"
                                    : "#3B82F6",
                              "& .MuiChip-icon": {
                                color: "inherit",
                              },
                            }}
                            icon={<Box component="span" sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "currentColor", ml: 0.75 }} />}
                          />
                        </Box>
                         <Box component="td" sx={{ px: 3, py: 2.1 }}>
                          <Chip
                            label={investigation.label}
                            size="small"
                            color={investigation.tone}
                            sx={{ fontWeight: 800, fontSize: 12, maxWidth: "100%" }}
                          />
                        </Box>
                        <Box component="td" sx={{ px: 3, py: 2.1, color: "#A7B4C8", fontSize: 13.5, lineHeight: 1.4, wordBreak: "break-word" }}>
                          {new Date(
                            (incident as Incident & { opened_at?: string }).opened_at ??
                              new Date().toISOString()
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Box>
                        <Box component="td" sx={{ px: 3, py: 2.1 }}>
                          <Button
                            variant="contained"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (incident.investigation_id) {
                                navigate(`/reports/${incident.investigation_id}`);
                              } else {
                                openIncident(incident.number);
                              }
                            }}
                            startIcon={<VisibilityOutlinedIcon />}
                            sx={{
                              bgcolor: "#2E8540",
                              color: "#fff",
                              textTransform: "none",
                              fontWeight: 800,
                              borderRadius: 1.5,
                              minWidth: 88,
                              height: 32,
                              fontSize: 11.5,
                              px: 0.8,
                              boxShadow: "none",
                              whiteSpace: "nowrap",
                               "& .MuiButton-startIcon": {
                                marginRight: 0.3,
                              },
                            }}
                          >
                            Report
                          </Button>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}

          <Box
            sx={{
              px: 3,
              py: 1,
              minHeight: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid #EDF2F7",
            }}
          >
            <Typography sx={{ color: "#B2BED1", fontWeight: 600, fontSize: 13.5 }}>
              Showing {filteredIncidents.length} of {incidents.length} incidents
            </Typography>

            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, value) => setPage(value)}
              shape="rounded"
              sx={{
                "& .MuiPaginationItem-root": {
                  minWidth: 34,
                  height: 34,
                  fontWeight: 700,
                  color: "#94A3B8",
                  borderColor: "#D7DFEA",
                },
                "& .Mui-selected": {
                  bgcolor: "#FFF5EF !important",
                  color: "#FF5B1F !important",
                  borderColor: "#FF5B1F !important",
                },
              }}
            />
          </Box>
        </Box>
      </Box>

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