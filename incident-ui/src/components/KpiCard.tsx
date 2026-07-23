import { Box, Typography } from "@mui/material";

interface Props {
  title: string;
  value: string | number;
  delta?: string;
  deltaTone?: "green" | "red";
}

export default function KpiCard({
  title,
  value,
  delta,
  deltaTone = "green",
}: Props) {
  const trendColor = deltaTone === "red" ? "#ef4444" : "#16a34a";
  const trendArrow = deltaTone === "red" ? "↘" : "↗";

  return (
    <Box
      sx={{
        height: 100,
        borderRadius: "14px",
        bgcolor: "#fff",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 6px rgba(15,23,42,.05)",
        px: 1.8,
        py: 1.4,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
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
        }}
      >
        {title}
      </Typography>

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
            gap: .3,
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