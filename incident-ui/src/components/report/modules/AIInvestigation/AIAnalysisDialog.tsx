import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  IconButton,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import PsychologyIcon from "@mui/icons-material/Psychology";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SecurityIcon from "@mui/icons-material/Security";

interface Props {
  open: boolean;
  onClose: () => void;
  ai: any;
}

export default function AIAnalysisDialog({
  open,
  onClose,
  ai,
}: Props) {
  if (!ai) return null;

  const confidenceColor =
    ai.confidence >= 90
      ? "success"
      : ai.confidence >= 70
      ? "warning"
      : "error";

  const confidenceLabel =
    ai.confidence >= 90
      ? "High"
      : ai.confidence >= 70
      ? "Medium"
      : "Low";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <PsychologyIcon color="primary" />

          <Typography
            variant="h6"
            fontWeight={700}
          >
            AI Analysis
          </Typography>
        </Stack>

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>

        {/* Confidence Explanation */}

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 3,
            mb: 3,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            mb={2}
          >
            <TrendingUpIcon color="primary" />

            <Typography
              variant="h6"
              fontWeight={700}
            >
              Confidence Explanation
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            mb={3}
          >
            <Typography fontWeight={700}>
              AI Confidence
            </Typography>

            <Chip
              color={confidenceColor}
              label={`${ai.confidence}% ${confidenceLabel}`}
            />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <List dense>
            {ai.reasoning.map(
              (item: string, index: number) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={item}
                  />
                </ListItem>
              )
            )}
          </List>
        </Paper>

        {/* Prevention */}

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 3,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            mb={2}
          >
            <SecurityIcon color="success" />

            <Typography
              variant="h6"
              fontWeight={700}
            >
              Future Prevention
            </Typography>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <List dense>
            {ai.prevention.map(
              (item: string, index: number) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={item}
                  />
                </ListItem>
              )
            )}
          </List>
        </Paper>

      </DialogContent>
    </Dialog>
  );
}