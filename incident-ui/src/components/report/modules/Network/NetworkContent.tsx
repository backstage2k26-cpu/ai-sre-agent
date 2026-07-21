import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import LanIcon from "@mui/icons-material/Lan";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

import type { Investigation } from "../../../../types/investigation";

interface Props {
  investigation: Investigation;
}

export default function NetworkContent({ investigation }: Props) {
  const network = investigation.network;

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        AI analyzed the service networking components during the investigation.
      </Alert>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          Network Summary
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between">
            <Typography fontWeight={600}>Gateway</Typography>
            <Chip
              size="small"
              color={network.gateway_ok ? "success" : "error"}
              label={network.gateway_ok ? "Healthy" : "Failed"}
            />
          </Box>

          <Box display="flex" justifyContent="space-between">
            <Typography fontWeight={600}>Route</Typography>
            <Chip
              size="small"
              color={network.route_ok ? "success" : "error"}
              label={network.route_ok ? "Healthy" : "Failed"}
            />
          </Box>

          <Box display="flex" justifyContent="space-between">
            <Typography fontWeight={600}>Service Endpoints</Typography>
            <Typography>{network.service_endpoints}</Typography>
          </Box>

          <Box display="flex" justifyContent="space-between">
            <Typography fontWeight={600}>Gateway Name</Typography>
            <Typography>{network.gateway_name ?? "-"}</Typography>
          </Box>

          <Box display="flex" justifyContent="space-between">
            <Typography fontWeight={600}>Gateway Namespace</Typography>
            <Typography>{network.gateway_namespace ?? "-"}</Typography>
          </Box>

          <Box display="flex" justifyContent="space-between">
            <Typography fontWeight={600}>Route Name</Typography>
            <Typography>{network.route_name ?? "-"}</Typography>
          </Box>

          <Box display="flex" justifyContent="space-between">
            <Typography fontWeight={600}>Route Accepted</Typography>
            <Chip
              size="small"
              color={network.route_accepted ? "success" : "error"}
              label={network.route_accepted ? "Yes" : "No"}
            />
          </Box>

          <Box display="flex" justifyContent="space-between">
            <Typography fontWeight={600}>Route Programmed</Typography>
            <Chip
              size="small"
              color={network.route_programmed ? "success" : "error"}
              label={network.route_programmed ? "Yes" : "No"}
            />
          </Box>

          <Box display="flex" justifyContent="space-between">
            <Typography fontWeight={600}>Service</Typography>
            <Typography>{network.service_name}</Typography>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          AI Assessment
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Typography color="text.secondary">
          {network.assessment}
        </Typography>

        <Box mt={3} display="flex" gap={2} flexWrap="wrap">
          <Chip
            icon={<LanIcon />}
            label="Network Checked"
            color="primary"
          />

          <Chip
            icon={<CheckCircleIcon />}
            label="Connectivity Verified"
            color="success"
          />

          <Chip
            icon={<ErrorIcon />}
            label="Ingress Evaluated"
            color="warning"
          />
        </Box>
      </Paper>
    </Stack>
  );
}