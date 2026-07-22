import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Box,
  CircularProgress,
  IconButton,
} from "@mui/material";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
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
      second: "2-digit",
      hour12: false,
    }).format(date);
  };

  const loadIncident = async () => {
    if (!incidentNumber) return;

    try {
      setLoading(true);

      const data = await getIncidentDetails(incidentNumber);
      console.log("Incident:", data.incident);
      console.log("Investigations:", data.investigations);
      console.log("Application fields:", {
        service: data.incident.service,
        application: data.incident.application,
        app_name: data.incident.app_name,
        application_name: data.incident.application_name,
      });

      setDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    if (!details) return;

    const confirmed = window.confirm(
      "Restarting will replace the current investigation report.\n\nContinue?"
    );

    if (!confirmed) return;

    try {
      setRestarting(true);

      await restartInvestigation(details.incident.number);

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

    const interval = setInterval(() => {
      loadIncident();
    }, 5000);

    return () => clearInterval(interval);
  }, [open, incidentNumber]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(18px)",
          },
        },
        paper: {
          sx: {
            width: "min(780px, calc(100vw - 24px))",
            maxWidth: "780px",
            borderRadius: "20px",
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
            color: "#1F2937",
            boxShadow: "0 16px 36px rgba(15, 23, 42, 0.22)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          position: "relative",
          px: { xs: 2, md: 3 },
          pt: { xs: 2, md: 2.25 },
          pb: { xs: 2, md: 2.25 },
        }}
      >
        <Box sx={{ pr: 7 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.14em",
              color: "#FF6B00",
            }}
          >
            INCIDENT DETAILS
          </Typography>

          <Typography
            sx={{
              mt: 1,
              fontSize: { xs: 22, md: 26 },
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#172033",
            }}
          >
            {details?.incident?.number ?? incidentNumber ?? "-"}
          </Typography>

          <Typography
            sx={{
              mt: 1,
              fontSize: { xs: 13, md: 15 },
              lineHeight: 1.45,
              color: "#718096",
              fontWeight: 500,
            }}
          >
            {details?.incident?.short_description ?? "Loading incident details..."}
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: { xs: 10, md: 12 },
            top: { xs: 10, md: 12 },
            width: 44,
            height: 44,
            bgcolor: "#F3F4F6",
            color: "#7C8597",
            "&:hover": {
              bgcolor: "#E5E7EB",
            },
          }}
        >
          <CloseIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          px: { xs: 2, md: 3 },
          pb: { xs: 2, md: 2.5 },
          pt: 0,
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 4,
            }}
          >
            <CircularProgress />
          </Box>
        ) : details ? (
          <Box
            sx={{
              pt: { xs: 1.5, md: 2 },
              borderTop: "1px solid #E9EEF5",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                columnGap: 5,
                rowGap: 2.5,
              }}
            >
              <DetailItem
                label="SERVICE"
                value={resolveServiceName(details.incident)}
                badge
                badgeColor="#E8EEF8"
                badgeTextColor="#64748B"
              />

              <DetailItem
                label="PRIORITY"
                value={resolvePriority(details.incident.priority)}
                badgeColor="#FDE8E8"
                badgeTextColor="#C62828"
                badge
              />

              <DetailItem
                label="STATUS"
                value={details.incident.state ?? "-"}
                badgeColor="#D7E7FF"
                badgeTextColor="#1D4ED8"
                badge
              />

              <DetailItem
                label="INVESTIGATION STATUS"
                value={resolveInvestigationLabel(
                  details?.investigations?.[0]?.status,
                )}
                badge
                badgeColor={investigationBadgeColor(
                  details?.investigations?.[0]?.status,
                )}
                badgeTextColor={investigationBadgeTextColor(
                  details?.investigations?.[0]?.status,
                )}
              />

              <DetailItem
                label="CREATED AT"
                value={formatDateTime(details.incident.opened_at)}
              />
            </Box>
          </Box>
        ) : (
          <Typography>No data available.</Typography>
        )}
      </DialogContent>

      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pb: { xs: 2, md: 2.5 },
        }}
      >
        <Box
          sx={{
            pt: { xs: 1.5, md: 2 },
            borderTop: "1px solid #E9EEF5",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          <Button
            variant="outlined"
            disabled={restarting}
            onClick={handleRestart}
            startIcon={<ReplayRoundedIcon />}
            sx={{
              minHeight: 44,
              px: 2,
              borderRadius: "12px",
              borderWidth: 2,
              borderColor: "#FF6B00",
              color: "#FF6B00",
              fontSize: 13,
              fontWeight: 800,
              textTransform: "none",
              "& .MuiButton-startIcon": {
                marginRight: 0.75,
              },
              "& svg": {
                fontSize: 18,
              },
              "&:hover": {
                borderWidth: 2,
                borderColor: "#E55C00",
                bgcolor: "rgba(255, 107, 0, 0.06)",
              },
            }}
          >
            {restarting ? "Rerunning..." : "Rerun Investigation"}
          </Button>

          <Button
            variant="contained"
            disabled={!details?.investigations?.[0]?.investigation_id}
            onClick={() => {
              const investigationId =
                details?.investigations?.[0]?.investigation_id;

              if (!investigationId) return;

              navigate(`/reports/${investigationId}`);
            }}
            startIcon={<DescriptionOutlinedIcon />}
            sx={{
              minHeight: 44,
              px: 2,
              borderRadius: "12px",
              bgcolor: "#FF6B00",
              fontSize: 13,
              fontWeight: 800,
              textTransform: "none",
              boxShadow: "none",
              "& .MuiButton-startIcon": {
                marginRight: 0.75,
              },
              "& svg": {
                fontSize: 18,
              },
              "&:hover": {
                bgcolor: "#E55C00",
                boxShadow: "none",
              },
              "&.Mui-disabled": {
                bgcolor: "#F3A36D",
                color: "#FFFFFF",
              },
            }}
          >
            Show Report
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}

function DetailItem({
  label,
  value,
  badge = false,
  badgeColor = "#F3F4F6",
  badgeTextColor = "#1F2937",
}: {
  label: string;
  value: string;
  badge?: boolean;
  badgeColor?: string;
  badgeTextColor?: string;
}) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.04em",
          color: "#A0AAB8",
          mb: 1,
        }}
      >
        {label}
      </Typography>

      {badge ? (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1.2,
            px: 2,
            py: 0.85,
            borderRadius: "999px",
            bgcolor: badgeColor,
            color: badgeTextColor,
            fontSize: 15,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: badgeTextColor,
              opacity: 0.92,
            }}
          />
          {value}
        </Box>
      ) : (
        <Typography
          sx={{
            fontSize: 18,
            lineHeight: 1.3,
            fontWeight: 800,
            color: "#2A3444",
            wordBreak: "break-word",
          }}
        >
          {value}
        </Typography>
      )}
    </Box>
  );
}

function resolveServiceName(incident: any) {
  const candidates = [
    incident?.service,
    incident?.configuration_item,
    incident?.caller,
    incident?.assignment_group,
    incident?.application_name,
    incident?.app_name,
    incident?.business_service,
  ];

  const found = candidates.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  if (found) return cleanServiceName(found);

  const description = incident?.short_description ?? "";
  const match = description.match(/^([^-–—]+?)\s+service\b/i);

  if (match?.[1]) {
    return cleanServiceName(`${match[1].trim()}-${resolveEnvironment(description)}`);
  }

  const derived = incident?.short_description?.trim();

  if (derived) {
    return cleanServiceName(derived.split(/\s+/).slice(0, 2).join(" "));
  }

  return "-";
}

function cleanServiceName(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "-";

  const withoutSuffix = trimmed
    .replace(/\s+service$/i, "")
    .replace(/\s+service\s+down$/i, "")
    .replace(/\s+service\s+error$/i, "")
    .replace(/\s+service\s+issue$/i, "")
    .trim();

  return withoutSuffix || trimmed;
}

function resolveEnvironment(text: string) {
  const match = text.match(/\b(prod|production|qa|uat|stage|staging|dev|development|test)\b/i);

  if (!match?.[1]) return "";

  return match[1].toLowerCase();
}

function resolvePriority(priority?: string | null) {
  if (!priority) return "-";

  const normalized = priority.toString().trim().toUpperCase();

  if (normalized.startsWith("P")) return normalized;

  if (/^\d+$/.test(normalized)) {
    return `P${normalized}`;
  }

  return normalized;
}

function resolveInvestigationLabel(status?: string) {
  switch (status) {
    case "RUNNING":
      return "Running";
    case "COMPLETED":
      return "Completed";
    case "FAILED":
      return "Failed";
    case "RECEIVED":
      return "Received";
    default:
      return "-";
  }
}

function investigationBadgeColor(status?: string) {
  switch (status) {
    case "COMPLETED":
      return "#E4F4E6";
    case "FAILED":
      return "#FDE8E8";
    case "RUNNING":
    case "RECEIVED":
      return "#E8EEF8";
    default:
      return "#F3F4F6";
  }
}

function investigationBadgeTextColor(status?: string) {
  switch (status) {
    case "COMPLETED":
      return "#2E7D32";
    case "FAILED":
      return "#C62828";
    case "RUNNING":
    case "RECEIVED":
      return "#1D4ED8";
    default:
      return "#64748B";
  }
}
