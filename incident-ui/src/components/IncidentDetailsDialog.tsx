import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Grid,
  IconButton,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
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
      maxWidth="md"
      fullWidth
    >
      <DialogTitle
        sx={{
          position: "relative",
          pb: 2,
          borderBottom: 1,
          borderColor: "divider",
          fontSize: 24,
          fontWeight: 600,
          px: 4,
          py: 3,
        }}
      >
        Incident Overview

        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          px: 4,
          py: 5,
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 6,
            }}
          >
            <CircularProgress />
          </Box>
        ) : details ? (
          <Grid container rowSpacing={5}>
            <Grid size={{ xs: 3 }}>
              <Typography
                color="text.secondary"
                fontWeight={500}
              >
                Incident ID
              </Typography>
            </Grid>

            <Grid size={{ xs: 9 }}>
              <Typography
                fontWeight={600}
                color="text.primary"
              >
                {details.incident.number}
              </Typography>
            </Grid>

            <Grid size={{ xs: 3 }}>
              <Typography
                color="text.secondary"
                fontWeight={500}
              >
                Application
              </Typography>
            </Grid>

            <Grid size={{ xs: 9 }}>
              <Typography
                fontWeight={600}
                color="text.primary"
              >
                {
                  details.incident.service ??
                  details.incident.short_description?.split(" service")[0] ??
                  "-"
                }
              </Typography>
            </Grid>

            <Grid size={{ xs: 3 }}>
              <Typography
                color="text.secondary"
                fontWeight={500}
              >
                Issue
              </Typography>
            </Grid>

            <Grid size={{ xs: 9 }}>
              <Typography
                fontWeight={600}
                color="text.primary"
              >
                {details.incident.short_description}
              </Typography>
            </Grid>

            <Grid size={{ xs: 3 }}>
              <Typography
                color="text.secondary"
                fontWeight={500}
              >
                Created
              </Typography>
            </Grid>

            <Grid size={{ xs: 9 }}>
              <Typography
                fontWeight={600}
                color="text.primary"
              >
                {new Date(
                  details.incident.opened_at ??
                    details.incident.created_at
                ).toLocaleString()}
              </Typography>
            </Grid>

            <Grid size={{ xs: 3 }}>
              <Typography
                color="text.secondary"
                fontWeight={500}
              >
                Priority
              </Typography>
            </Grid>

            <Grid size={{ xs: 9 }}>
              <Typography
                fontWeight={600}
                color="text.primary"
              >
                {`P${details.incident.priority}`}
              </Typography>
            </Grid>

            <Grid size={{ xs: 3 }}>
              <Typography
                color="text.secondary"
                fontWeight={500}
              >
                Status
              </Typography>
            </Grid>

            <Grid size={{ xs: 9 }}>
              <Typography fontWeight={600}>
                {details.incident.state}
              </Typography>
            </Grid>
          </Grid>
        ) : (
          <Typography>No data available.</Typography>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: 1,
          borderColor: "divider",
          px: 4,
          py: 2,
          justifyContent: "space-between",
        }}
      >
        <Button
          color="warning"
          startIcon={<ReplayIcon />}
          disabled={restarting}
          onClick={handleRestart}
        >
          {restarting
            ? "Restarting..."
            : "Restart Investigation"}
        </Button>

        {details?.investigations?.[0]?.status ===
          "COMPLETED" && (
          <Button
            variant="contained"
            onClick={() =>
              navigate(
                `/reports/${details.investigations[0].investigation_id}`
              )
            }
          >
            View Investigation
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}