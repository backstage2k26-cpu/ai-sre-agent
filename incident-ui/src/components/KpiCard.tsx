import { Card, CardContent, Typography } from "@mui/material";

interface Props {
  title: string;
  value: string | number;
}

export default function KpiCard({ title, value }: Props) {
  return (
    <Card
      sx={{
        flex: 1,
        minWidth: 180,
        minHeight: 150,
        backgroundColor: "#1b2333",
        color: "#fff",
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Typography
          variant="subtitle2"
          sx={{ color: "#9ca3af" }}
        >
          {title}
        </Typography>

        <Typography
          variant="h4"
          sx={{
            mt: 2,
            fontWeight: "bold",
          }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}