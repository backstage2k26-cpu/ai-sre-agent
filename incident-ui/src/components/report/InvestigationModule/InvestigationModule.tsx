import type { ReactNode } from "react";

import {
  Paper,
  Typography,
  Chip,
  Box,
} from "@mui/material";

import { statusMap } from "./status";

export interface InvestigationModuleProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  status: "success" | "error" | "warning" | "unknown";
  onClick: () => void;
}

export default function InvestigationModule({
  title,
  subtitle,
  icon,
  status,
  onClick,
}: InvestigationModuleProps) {
  const config = statusMap[status];

  return (
    <Paper
      elevation={2}
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: "#161b22",
        color: "#fff",
        cursor: "pointer",
        borderLeft: `6px solid ${config.borderColor}`,
        transition: "all 0.2s ease",

        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 8,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {icon}

          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
            }}
          >
            {title}
          </Typography>
        </Box>

        <Chip
          label={config.label}
          color={config.color}
          size="small"
        />
      </Box>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mt: 2,
        }}
      >
        {subtitle}
      </Typography>
    </Paper>
  );
}