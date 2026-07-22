import { Box, Typography } from "@mui/material";
import ClipboardOutlinedIcon from "@mui/icons-material/ContentPasteOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";

interface Props {
  title: string;
  value: string | number;
  tone?: "indigo" | "green" | "red" | "amber" | "violet" | "blue";
  icon?: "clipboard" | "check" | "close" | "flag" | "clock" | "pulse";
}

const toneStyles = {
  indigo: {
    bg: "#EEF2FF",
    fg: "#4F46E5",
    line: "#C7D2FE",
  },
  green: {
    bg: "#ECFDF5",
    fg: "#10B981",
    line: "#BBF7D0",
  },
  red: {
    bg: "#FEF2F2",
    fg: "#F43F5E",
    line: "#FECACA",
  },
  amber: {
    bg: "#FFFBEB",
    fg: "#F59E0B",
    line: "#FDE68A",
  },
  violet: {
    bg: "#F5F3FF",
    fg: "#8B5CF6",
    line: "#DDD6FE",
  },
  blue: {
    bg: "#EFF6FF",
    fg: "#0EA5E9",
    line: "#BAE6FD",
  },
} as const;

function pickIcon(icon?: Props["icon"], color?: string) {
  const shared = { fontSize: "1.2rem" as const, sx: { color } };

  switch (icon) {
    case "check":
      return <CheckCircleOutlineOutlinedIcon {...shared} />;
    case "close":
      return <CancelOutlinedIcon {...shared} />;
    case "flag":
      return <FlagOutlinedIcon {...shared} />;
    case "clock":
      return <AccessTimeOutlinedIcon {...shared} />;
    case "pulse":
      return <InsightsOutlinedIcon {...shared} />;
    default:
      return <ClipboardOutlinedIcon {...shared} />;
  }
}

export default function KpiCard({ title, value, tone = "indigo", icon }: Props) {
  const style = toneStyles[tone];

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        minHeight: 172,
        borderRadius: "20px",
        background: "rgba(255,255,255,.96)",
        border: "1px solid rgba(226,232,240,.9)",
        boxShadow: "0 10px 22px rgba(15,23,42,.08)",
        px: 2.25,
        py: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "13px",
          display: "grid",
          placeItems: "center",
          background: style.bg,
        }}
      >
        {pickIcon(icon, style.fg)}
      </Box>

      <Box>
        <Typography
          sx={{
            mt: 1,
            fontSize: { xs: 24, md: 30 },
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "var(--text-strong)",
          }}
        >
          {value}
        </Typography>

        <Typography
          sx={{
            mt: 0.45,
            fontSize: 15,
            lineHeight: 1.15,
            fontWeight: 600,
            color: "var(--text-soft)",
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box sx={{ mt: 1, height: 3, borderRadius: 999, background: style.line }} />
    </Box>
  );
}
