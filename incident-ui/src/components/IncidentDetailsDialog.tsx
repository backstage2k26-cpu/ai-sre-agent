import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

import {
  getIncidentDetails,
  restartInvestigation,
} from "../services/incidentService";

interface Props {
  open: boolean;
  incidentNumber: string | null;
  onClose: () => void;
}

export default function IncidentDetailsDialog({
  open,
  incidentNumber,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [restarting, setRestarting] = useState(false);

  const navigate = useNavigate();

  const incident = details?.incident;
  const investigation = details?.investigations?.[0];

  const resolvedService = useMemo(() => resolveApplicationName(incident), [incident]);
  const resolvedPriority = useMemo(() => resolvePriority(incident?.priority), [incident?.priority]);
  const incidentStatus = useMemo(() => normalizeStatus(incident?.state), [incident?.state]);
  const investigationStatus = useMemo(
    () => resolveInvestigationLabel(investigation?.status),
    [investigation?.status],
  );

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  };

  const loadIncident = async () => {
    if (!incidentNumber) return;

    try {
      setLoading(true);
      const data = await getIncidentDetails(incidentNumber);
      setDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    if (!incident?.number) return;

    const confirmed = window.confirm(
      "Restarting will replace the current investigation report.\n\nContinue?",
    );
    if (!confirmed) return;

    try {
      setRestarting(true);
      await restartInvestigation(incident.number);
      await loadIncident();
    } catch (err) {
      console.error(err);
      alert("Failed to restart investigation.");
    } finally {
      setRestarting(false);
    }
  };

  useEffect(() => {
    if (!open || !incidentNumber) return;

    loadIncident();

    const interval = setInterval(loadIncident, 5000);
    return () => clearInterval(interval);
  }, [open, incidentNumber]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(3, 7, 18, 0.62)",
            backdropFilter: "blur(1px)",
          },
        },
        paper: {
          sx: {
            margin: 0,
            width: "100vw",
            maxWidth: "100vw",
            height: "100vh",
            borderRadius: 0,
            overflow: "hidden",
            backgroundColor: "transparent",
          },
        },
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.15fr 0.85fr" },
          width: "100%",
          height: "100%",
          bgcolor: "transparent",
        }}
      >
        <Box
          sx={{
            display: { xs: "none", lg: "block" },
            bgcolor: "rgba(3, 7, 18, 0.55)",
          }}
        />

        <Box
          sx={{
            position: "relative",
            bgcolor: "#FFFFFF",
            color: "#1F2937",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            boxShadow: "-12px 0 40px rgba(15, 23, 42, 0.24)",
          }}
        >
          <IconButton
            onClick={onClose}
            aria-label="Close dialog"
            sx={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 40,
              height: 40,
              border: "2px solid #94A3B8",
              color: "#64748B",
              bgcolor: "#FFFFFF",
              zIndex: 2,
              "&:hover": {
                bgcolor: "#F8FAFC",
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 24 }} />
          </IconButton>

          <Box sx={{ px: { xs: 2.5, md: 3.5 }, pt: { xs: 3, md: 4 }, pb: 2.2 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: "#F3F4F6",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <ErrorOutlineRoundedIcon sx={{ color: "#334155", fontSize: 24 }} />
              </Box>

              <Box sx={{ pt: 0.1 }}>
                <Typography
                  sx={{
                    fontFamily: '"SFMono-Regular", ui-monospace, monospace',
                    fontSize: 13,
                    letterSpacing: "0.08em",
                    color: "#64748B",
                    mb: 0.25,
                  }}
                >
                  {incident?.number ?? incidentNumber ?? "-"}
                </Typography>

                <Typography
                  sx={{
                    fontSize: { xs: 24, md: 28 },
                    lineHeight: 1.08,
                    fontWeight: 800,
                    letterSpacing: "-0.05em",
                    color: "#111827",
                  }}
                >
                  {resolvedService}
                </Typography>

                <Box sx={{ display: "flex", gap: 0.9, mt: 1.1, flexWrap: "wrap" }}>
                  <StatusChip
                    label={resolvedPriority}
                    dotColor="#EF4444"
                    bg="#FEF2F2"
                    text="#DC2626"
                  />
                  <StatusChip
                    label={incidentStatus}
                    dotColor="#3B82F6"
                    bg="#EFF6FF"
                    text="#2563EB"
                  />
                </Box>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ borderColor: "#E5E7EB" }} />

          <Box
            sx={{
              px: { xs: 2.5, md: 3.5 },
              py: 2.25,
              overflowY: "auto",
              flex: 1,
            }}
          >
            {loading ? (
              <Box sx={{ display: "grid", placeItems: "center", minHeight: 360 }}>
                <CircularProgress />
              </Box>
            ) : details ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.8 }}>
                <Box>
                  <SectionTitle>INCIDENT DETAILS</SectionTitle>

                  <Box
                    sx={{
                      mt: 1.3,
                      p: { xs: 1.8, md: 2.1 },
                      borderRadius: 2.5,
                      border: "1px solid #E5E7EB",
                      bgcolor: "#FAFBFC",
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                        columnGap: 5,
                        rowGap: 2.1,
                      }}
                    >
                      <DetailItem label="APPLICATION" value={resolvedService} />
                      <DetailItem label="ENVIRONMENT" value={resolveEnvironment(incident)} />
                      <DetailItem label="PRIORITY" value={resolvePriority(incident?.priority)} />
                      <DetailItem label="STATUS" value={normalizeStatus(incident?.state)} />
                      <DetailItem
                        label="CREATED"
                        value={formatDateTime(incident?.opened_at)}
                      />
                      <DetailItem
                        label="INVESTIGATION STATUS"
                        value={investigationStatus}
                      />
                    </Box>
                  </Box>
                </Box>

                <Box>
                  <SectionTitle>ISSUE</SectionTitle>
                  <Typography
                    sx={{
                      mt: 0.9,
                      fontSize: { xs: 17, md: 18 },
                      lineHeight: 1.3,
                      fontWeight: 500,
                      color: "#1F2937",
                    }}
                  >
                    {incident?.short_description ?? "-"}
                  </Typography>
                </Box>

                <Box>
                  <SectionTitle>DESCRIPTION</SectionTitle>
                  <Typography
                    sx={{
                      mt: 0.9,
                      fontSize: { xs: 14, md: 15 },
                      lineHeight: 1.45,
                      color: "#374151",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {resolveDescription(details)}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography sx={{ color: "#64748B" }}>No data available.</Typography>
            )}
          </Box>

          <Divider sx={{ borderColor: "#E5E7EB" }} />

          <Box
            sx={{
              px: { xs: 2, md: 3 },
              py: 1.5,
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              flexWrap: "wrap",
              bgcolor: "#FFFFFF",
            }}
          >
            <Button
              variant="outlined"
              disabled={restarting}
              onClick={handleRestart}
              startIcon={<ReplayRoundedIcon />}
              sx={{
                minHeight: 46,
                px: 2.5,
                borderRadius: "14px",
                borderWidth: 1,
                borderColor: "#D1D5DB",
                color: "#111827",
                fontSize: 15,
                fontWeight: 700,
                textTransform: "none",
                bgcolor: "#FFFFFF",
                "&:hover": {
                  borderColor: "#9CA3AF",
                  bgcolor: "#F9FAFB",
                },
              }}
            >
              {restarting ? "Restarting..." : "Restart Investigation"}
            </Button>

            <Button
              variant="contained"
              disabled={!investigation?.investigation_id}
              onClick={() => {
                if (!investigation?.investigation_id) return;
                navigate(`/reports/${investigation.investigation_id}`);
              }}
              startIcon={<DescriptionOutlinedIcon />}
              sx={{
                minHeight: 46,
                px: 2.75,
                borderRadius: "14px",
                bgcolor: "#F97316",
                fontSize: 15,
                fontWeight: 700,
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#EA580C",
                  boxShadow: "none",
                },
                "&.Mui-disabled": {
                  bgcolor: "#FDBA74",
                  color: "#FFFFFF",
                },
              }}
            >
              View Investigation Report
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Typography
      sx={{
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.04em",
        color: "#6B7280",
      }}
    >
      {children}
    </Typography>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.05em",
          color: "#6B7280",
          mb: 0.3,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 15,
          lineHeight: 1.3,
          fontWeight: 600,
          color: "#111827",
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function StatusChip({
  label,
  dotColor,
  bg,
  text,
}: {
  label: string;
  dotColor: string;
  bg: string;
  text: string;
}) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        px: 1.25,
        py: 0.45,
        borderRadius: "999px",
        bgcolor: bg,
        color: text,
        border: "1px solid rgba(0,0,0,0.06)",
        fontSize: 12.5,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: dotColor,
        }}
      />
      {label}
    </Box>
  );
}

function resolveApplicationName(incident: any) {
  const candidates = [
    incident?.application_name,
    incident?.app_name,
    incident?.service,
    incident?.business_service,
    incident?.configuration_item,
  ];

  const found = candidates.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  if (found) return cleanValue(found);

  const description = incident?.short_description ?? "";
  const summaryMatch = description.match(/^([^-–—]+?)\s+service\b/i);

  if (summaryMatch?.[1]) {
    return cleanValue(summaryMatch[1]);
  }

  const firstWord = description.trim().split(/\s+/).slice(0, 2).join(" ");

  if (firstWord) {
    return cleanValue(firstWord);
  }

  return "-";
}

function resolveEnvironment(incident: any) {
  const text = [
    incident?.environment,
    incident?.short_description,
    incident?.description,
    incident?.service,
  ]
    .filter(Boolean)
    .join(" ");

  const match = text.match(/\b(prod|production|qa|uat|stage|staging|dev|development|test)\b/i);
  if (!match?.[1]) return "Production";

  const value = match[1].toLowerCase();
  return value === "prod" ? "Production" : value.charAt(0).toUpperCase() + value.slice(1);
}

function resolvePriority(priority?: string | null) {
  if (!priority) return "-";
  const normalized = priority.toString().trim().toUpperCase();
  if (normalized.startsWith("P")) return normalized;
  if (/^\d+$/.test(normalized)) return `P${normalized}`;
  return normalized;
}

function normalizeStatus(status?: string | null) {
  if (!status) return "-";
  const value = status.toString().replace(/_/g, " ").trim();
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function resolveInvestigationLabel(status?: string) {
  switch (status) {
    case "RUNNING":
      return "In Progress";
    case "COMPLETED":
      return "Completed";
    case "FAILED":
      return "Failed";
    default:
      return "New";
  }
}

function resolveDescription(details: any) {
  const candidates = [
    details?.incident?.description,
    details?.incident?.comments,
    details?.incident?.work_notes,
    details?.incident?.short_description,
  ];

  const found = candidates.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  return found ? found.trim() : "-";
}

function cleanValue(value: string) {
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : "-";
}
