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
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";

type FilterKey = "all" | "new" | "progress" | "resolved";
type PriorityFilter = "all" | "critical" | "high" | "medium" | "low";

const PAGE_SIZE = 8;
const TABLE_COLUMNS = [
  { label: "Incident ID", width: "14.285%" },
  { label: "Service", width: "14.285%" },
  { label: "Priority", width: "14.285%" },
  { label: "Status", width: "14.285%" },
  { label: "Investigation Status", width: "14.285%" },
  { label: "Created At", width: "14.285%" },
  { label: "Summary", width: "14.285%" },
] as const;

function priorityLabel(priority: string) {
  const value = priority.toString().trim().toUpperCase();
  if (value === "1" || value === "P1" || value === "CRITICAL") return "Critical";
  if (value === "2" || value === "P2" || value === "HIGH") return "High";
  if (value === "3" || value === "P3" || value === "MEDIUM" || value === "MODERATE") return "Medium";
  if (value === "4" || value === "P4" || value === "LOW") return "Low";
  return priority;
}

function priorityFilterValue(priority: string) {
  const label = priorityLabel(priority).toLowerCase();
  if (label.includes("critical")) return "critical";
  if (label.includes("high")) return "high";
  if (label.includes("medium")) return "medium";
  if (label.includes("low")) return "low";
  return "all";
}

function statusTone(status: string) {
  const value = status.toLowerCase();
  if (value.includes("progress")) return "warning";
  if (value.includes("resolve")) return "success";
  return "info";
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

function investigationLabel(status?: string | null) {
  switch (status) {
    case "RUNNING":
      return { label: "In Progress", tone: "info" as const, dot: "#3B82F6", bg: "#EEF4FF", fg: "#3B82F6" };
    case "COMPLETED":
      return { label: "Completed", tone: "default" as const, dot: "#94A3B8", bg: "#F3F4F6", fg: "#64748B" };
    case "FAILED":
      return { label: "Failed", tone: "error" as const, dot: "#EF4444", bg: "#FEF2F2", fg: "#EF4444" };
    default:
      return { label: "New", tone: "default" as const, dot: "#94A3B8", bg: "#F3F4F6", fg: "#64748B" };
  }
}

function statusPillPalette(status: string) {
  const value = status.toLowerCase();

  if (value.includes("critical") || status === "1") {
    return { dot: "#EF4444", bg: "#FEF2F2", fg: "#EF4444" };
  }

  if (value.includes("high") || status === "2") {
    return { dot: "#3B2B10", bg: "#FFF7E6", fg: "#1F2937" };
  }

  if (value.includes("medium") || value.includes("moderate") || status === "3") {
    return { dot: "#0F8ACB", bg: "#EEF4FF", fg: "#0F6FB2" };
  }

  if (value.includes("low") || status === "4") {
    return { dot: "#16A34A", bg: "#ECFDF5", fg: "#16A34A" };
  }

  if (value.includes("resolved")) {
    return { dot: "#16A34A", bg: "#ECFDF5", fg: "#16A34A" };
  }

  if (value.includes("hold")) {
    return { dot: "#D97706", bg: "#FFFBEB", fg: "#D97706" };
  }

  return { dot: "#64748B", bg: "#F3F4F6", fg: "#64748B" };
}

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState(1);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
        priority === "all" || priorityFilterValue(incident.priority) === priority;

      const state = incidentStatusLabel(incident.state).toLowerCase();
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
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
        <Box>
          <Typography
            sx={{
              fontSize: { xs: 24, md: 30 },
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
              mt: 0.6,
              fontSize: { xs: 12.5, md: 14 },
              fontWeight: 600,
              color: "var(--text-soft)",
            }}
          >
            Manage and investigate all incidents
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All", count: incidents.length },
            { key: "new", label: "New", count: incidents.filter((i) => incidentStatusLabel(i.state) === "New").length },
            { key: "progress", label: "In Progress", count: incidents.filter((i) => incidentStatusLabel(i.state) === "In Progress").length },
            { key: "resolved", label: "Resolved", count: incidents.filter((i) => incidentStatusLabel(i.state) === "Resolved").length },
          ].map((item) => {
            const active = filter === item.key;
            const tone =
              item.key === "all"
                ? "#FF5B1F"
                : item.key === "new"
                  ? "#3B82F6"
                  : item.key === "progress"
                    ? "#F59E0B"
                    : "#10B981";
            const toneBg =
              item.key === "all"
                ? "#FFF1EA"
                : item.key === "new"
                  ? "#EEF4FF"
                  : item.key === "progress"
                    ? "#FFF7E5"
                    : "#ECFDF5";
            return (
              <Chip
                key={item.key}
                label={
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.55,
                    }}
                  >
                    <Box
                      sx={{
                        width: 6.5,
                        height: 6.5,
                        borderRadius: "50%",
                        bgcolor: active ? tone : tone,
                      }}
                    />

                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: 12,
                        color: active ? tone : "#64748B",
                      }}
                    >
                      {item.label}
                    </Typography>

                    <Box
                      sx={{
                        minWidth: 18,
                        height: 18,
                        px: 0.45,
                        borderRadius: "999px",
                        bgcolor: "#EEF2F7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10.25,
                        fontWeight: 500,
                        color: "#64748B",
                      }}
                    >
                      {item.count}
                    </Box>
                  </Box>
                }
                onClick={() => setFilter(item.key as FilterKey)}
                  sx={{
                    height: 30,
                    px: 0.2,
                    borderRadius: 999,
                    fontWeight: 500,
                    fontSize: 11.5,
                    bgcolor: active ? toneBg : "#fff",
                  color: active ? tone : "#64748B",
                  border: active ? `1px solid ${tone}` : "1px solid rgba(226,232,240,.95)",
                  boxShadow: "0 6px 16px rgba(15,23,42,.06)",
                  "&:hover": {
                    borderColor: tone,
                    bgcolor: active ? toneBg : "#fff",
                  },
                  "& .MuiChip-label": {
                    px: 0.9,
                  },
                }}
              />
            );
          })}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 150px" },
            gap: 1.1,
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.2,
              minHeight: 38,
              borderRadius: 1.5,
              bgcolor: "rgba(255,255,255,.96)",
              border: "1px solid rgba(226,232,240,.9)",
              boxShadow: "0 10px 22px rgba(15,23,42,.06)",

            }}
          >
            <SearchRoundedIcon
              sx={{
                color: "#94A3B8",
                fontSize: 22,
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
                  py: 0.65,
                  fontSize: 13,
                  color: "var(--text-strong)",
                },
              }}
            />
          </Box>

          <Box sx={{ width: 150, justifySelf: "end" }}>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              size="small"
              fullWidth
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
                    },
                  },
                },
              }}
              sx={{
                height: 38,
                width: "100%",
                minWidth: 0,
                "& .MuiSelect-select": {
                  px: 1.2,
                  py: 0.25,
                  fontSize: 12.5,
                  lineHeight: 1.1,
                  display: "flex",
                  alignItems: "center",
                },
                "& .MuiSelect-icon": {
                  top: "calc(50% - 0.4em)",
                },
                bgcolor: "#fff",
                borderRadius: "12px",
                "& fieldset": {
                  borderColor: "#E5E7EB",
                },
              }}
            >
              <MenuItem value="all">All Priorities</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </Box>
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
              px: 2,
              py: 0.75,
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #EDF2F7",
            }}
          >
            <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: "#64748B" }}>
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
                borderRadius: 1.5,
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
                          px: 0.85,
                          py: 1.05,
                          fontSize: 12,
                          color: "#B1BBCB",
                          letterSpacing: "0.08em",
                          fontWeight: 500,
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
                    return (
                      <Box
                        component="tr"
                        key={incident.number}
                      sx={{
                          "&:hover": { bgcolor: "#FBFDFF" },
                          cursor: "pointer",
                          borderBottom: "1px solid #F1F5F9",
                          "& td": {
                            fontSize: 13.5,
                            fontWeight: 400,
                          },
                        }}
                        onClick={() => openIncident(incident.number)}
                      >
                          <Box component="td" sx={{ px: 0.85, py: 1.15, fontWeight: 500, color: "#0F172A", fontSize: 18, letterSpacing: "-0.03em", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                            {incident.number}
                          </Box>
                          <Box component="td" sx={{ px: 0.85, py: 1.15 }}>
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                minHeight: 24,
                                px: 1,
                                borderRadius: 999,
                                bgcolor: "#F3F4F6",
                                color: "#111827",
                                fontWeight: 500,
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
                        <Box component="td" sx={{ px: 0.85, py: 1.15 }}>
                          {(() => {
                            const p = statusPillPalette(priorityLabel(incident.priority));
                            return (
                              <Chip
                                label={priorityLabel(incident.priority)}
                                size="small"
                                icon={<Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: p.dot, ml: 0.75 }} />}
                                sx={{
                                  borderRadius: 999,
                                  fontWeight: 500,
                                  fontSize: 11.5,
                                  height: 28,
                                  bgcolor: p.bg,
                                  color: p.fg,
                                  "& .MuiChip-icon": { color: "inherit" },
                                }}
                              />
                            );
                          })()}
                        </Box>
                        <Box component="td" sx={{ px: 0.85, py: 1.15 }}>
                          <Chip
                            label={incidentStatusLabel(incident.state)}
                            size="small"
                            icon={<Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "currentColor", ml: 0.75 }} />}
                            sx={{
                              borderRadius: 999,
                              fontWeight: 500,
                              fontSize: 11.5,
                              height: 28,
                              bgcolor: incidentStatusPalette(incident.state).bg,
                              color: incidentStatusPalette(incident.state).fg,
                              "& .MuiChip-icon": {
                                color: "inherit",
                              },
                            }}
                          />
                        </Box>
                        <Box component="td" sx={{ px: 0.85, py: 1.15 }}>
                          {(() => {
                            const inv = investigationLabel(incident.investigation_status);
                            return (
                          <Chip
                            label={inv.label}
                            size="small"
                            icon={<Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: inv.dot, ml: 0.75 }} />}
                            sx={{
                              fontWeight: 500,
                              fontSize: 11.5,
                              height: 28,
                              maxWidth: "100%",
                              borderRadius: 999,
                              bgcolor: inv.bg,
                              color: inv.fg,
                              "& .MuiChip-icon": { color: "inherit" },
                            }}
                          />
                            );
                          })()}
                        </Box>
                        <Box component="td" sx={{ px: 0.85, py: 1.15, color: "#A7B4C8", fontSize: 12.25, lineHeight: 1.3, wordBreak: "break-word", fontWeight: 400 }}>
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
                        <Box component="td" sx={{ px: 0.85, py: 1.15, color: "#111827", fontSize: 13, lineHeight: 1.3, fontWeight: 400 }}>
                          {incident.short_description || "-"}
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
              px: 2,
              py: 1,
              minHeight: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid #EDF2F7",
            }}
          >
            <Typography sx={{ color: "#B2BED1", fontWeight: 400, fontSize: 13.5 }}>
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
                  fontWeight: 500,
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
