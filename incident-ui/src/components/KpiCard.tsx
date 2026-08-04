import { Box, Typography } from "@mui/material";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PsychologyAltRoundedIcon from "@mui/icons-material/PsychologyAltRounded";

interface Props {
  title: string;
  value: string | number;
  icon?: "pulse" | "alert" | "search" | "check" | "clock" | "brain";
  delta?: string;
  deltaTone?: "green" | "red";
}

export default function KpiCard({
  title,
  value,
  icon,
  delta,
  deltaTone = "green",
}: Props) {
  const trendColor = deltaTone === "red" ? "#ef4444" : "#16a34a";
  const trendArrow = deltaTone === "red" ? "↘" : "↗";

  const Icon = (() => {
    switch (icon) {
      case "alert":
        return ErrorOutlineRoundedIcon;
      case "search":
        return SearchRoundedIcon;
      case "check":
        return CheckCircleOutlineRoundedIcon;
      case "clock":
        return AccessTimeRoundedIcon;
      case "brain":
        return PsychologyAltRoundedIcon;
      default:
        return FavoriteBorderRoundedIcon;
    }
  })();

  return (
    <Box
      sx={{
        height: 104,
        borderRadius: "14px",
        bgcolor: "#fff",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 6px rgba(15,23,42,.05)",
        px: 1.8,
        py: 1.45,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            color: "#6B7280",
            textTransform: "uppercase",
            letterSpacing: ".08em",
            lineHeight: 1.2,
            pr: 1,
          }}
        >
          {title}
        </Typography>

        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            color:
              icon === "alert"
                ? "#ef4444"
                : icon === "search"
                  ? "#4b5563"
                  : icon === "check"
                    ? "#16a34a"
                    : icon === "clock"
                      ? "#16a34a"
                      : icon === "brain"
                        ? "#10b981"
                        : "#4b5563",
          }}
        >
          <Icon sx={{ fontSize: 16 }} />
        </Box>
      </Box>

      <Typography
        sx={{
          fontSize: 22,
          fontWeight: 800,
          color: "#111827",
          lineHeight: 1,
          mt: 0.3,
        }}
      >
        {value}
      </Typography>

      {delta && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.35,
            fontSize: 12,
            fontWeight: 700,
            color: trendColor,
          }}
        >
          <span>{trendArrow}</span>
          <span>{delta}</span>

          <Typography
            sx={{
              fontSize: 12,
              color: "#6B7280",
            }}
          >
            vs last 7d
          </Typography>
        </Box>
      )}
    </Box>
  );
}
