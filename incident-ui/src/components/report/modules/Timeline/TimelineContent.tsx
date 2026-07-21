import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import AccessTimeIcon from "@mui/icons-material/AccessTime";

import type { Investigation } from "../../../../types/investigation";

interface Props {
  investigation: Investigation;
}

export default function TimelineContent({
  investigation,
}: Props) {
  return (
    <Stack spacing={2}>
      {investigation.timeline.map((item, index) => (
        <Paper
          key={index}
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: "#ffffff",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography
              variant="subtitle1"
              fontWeight={700}
            >
              {item.event}
            </Typography>

            <Chip
              icon={<AccessTimeIcon />}
              label={item.time}
              size="small"
              color="primary"
            />
          </Box>

          <Typography color="text.secondary">
            Investigation event recorded by the AI agent.
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}