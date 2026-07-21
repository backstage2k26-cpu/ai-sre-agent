import {
  Alert,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import MenuBookIcon from "@mui/icons-material/MenuBook";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import type { Investigation } from "../../../../types/investigation";

interface Props {
  investigation: Investigation;
}

export default function KnowledgeContent({ investigation }: Props) {
  const knowledge = investigation.knowledge ?? {};

  const entries = Object.entries(knowledge);

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        AI searched the knowledge base and runbooks to identify similar incidents
        and remediation steps.
      </Alert>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          Knowledge Matches
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {entries.length === 0 ? (
          <Typography color="text.secondary">
            No knowledge base matches were returned.
          </Typography>
        ) : (
          <List>
            {entries.map(([key, value]) => (
              <ListItem key={key}>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>

                <ListItemText
                  primary={key.replace(/_/g, " ").toUpperCase()}
                  secondary={
                    typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value)
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          AI Correlation
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Typography color="text.secondary">
          Relevant operational runbooks and historical incidents were compared
          against the current investigation to identify matching symptoms,
          probable causes and recommended remediation steps.
        </Typography>

        <Box mt={3} display="flex" gap={2} flexWrap="wrap">
          <Chip
            icon={<MenuBookIcon />}
            label="Runbooks"
            color="primary"
          />

          <Chip
            icon={<AutoAwesomeIcon />}
            label="AI Knowledge Search"
            color="secondary"
          />

          <Chip
            icon={<CheckCircleIcon />}
            label="Historical Match"
            color="success"
          />
        </Box>
      </Paper>
    </Stack>
  );
}