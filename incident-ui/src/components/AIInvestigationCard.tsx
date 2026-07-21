import {
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
} from "@mui/material";

interface Props {
  investigation: any;
}

export default function AIInvestigationCard({ investigation }: Props) {
  const ai = investigation.ai_result;

  if (!ai) return null;

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>

        <Typography
          variant="h5"
          sx={{ fontWeight: 700 }}
        >
          🧠 AI Investigation
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Generated using Gemini
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="subtitle2">
          Diagnosis
        </Typography>

        <Typography sx={{ mb: 3 }}>
          {ai.diagnosis}
        </Typography>

        <Typography variant="subtitle2">
          Root Cause
        </Typography>

        <Typography sx={{ mb: 3 }}>
          {ai.root_cause}
        </Typography>

        <Stack
          direction="row"
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Chip
            color="primary"
            label={`Confidence ${ai.confidence}%`}
          />

          <Chip
            color="secondary"
            label={ai.estimated_recovery_time}
          />
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Typography
          variant="h6"
          gutterBottom
        >
          AI Reasoning
        </Typography>

        <List dense>
          {ai.reasoning.map((r: string, index: number) => (
            <ListItem key={index}>
              <ListItemText primary={r} />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography
          variant="h6"
          gutterBottom
        >
          Resolution Plan
        </Typography>

        <List dense>
          {ai.resolution_plan.map((r: string, index: number) => (
            <ListItem key={index}>
              <ListItemText primary={r} />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography
          variant="h6"
          gutterBottom
        >
          Prevention
        </Typography>

        <List dense>
          {ai.prevention.map((r: string, index: number) => (
            <ListItem key={index}>
              <ListItemText primary={r} />
            </ListItem>
          ))}
        </List>

      </CardContent>
    </Card>
  );
}