import {
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  Divider,
} from "@mui/material";

import PsychologyIcon from "@mui/icons-material/Psychology";
import GppGoodIcon from "@mui/icons-material/GppGood";
import PlaceIcon from "@mui/icons-material/Place";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import type { Investigation } from "../../../../types/investigation";

interface Props {
  investigation: Investigation;
}

export default function AIInvestigationContent({
  investigation,
}: Props) {
  return (
    <Card
      elevation={6}
      sx={{
        mt: 4,
        borderRadius: 4,
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Stack direction="row" spacing={2} alignItems="center" mb={4}>
          <PsychologyIcon
            color="primary"
            sx={{ fontSize: 42 }}
          />

          <Box>
            <Typography variant="h4" fontWeight={700}>
              AI Investigation
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              AI analyzed Kubernetes, Deployment, Logs, Metrics,
              Network and Timeline before generating this
              investigation.
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={3}>
          {/* Root Cause */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 3,
                height: "100%",
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <GppGoodIcon color="success" />

                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    Root Cause
                  </Typography>
                </Stack>

                <Typography
                  variant="body1"
                  sx={{
                    lineHeight: 1.9,
                  }}
                >
                  {investigation.verdict.root_cause}
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          {/* Location */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 3,
                height: "100%",
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <PlaceIcon color="primary" />

                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    Problem Location
                  </Typography>
                </Stack>

                <Typography
                  variant="h5"
                  fontWeight={700}
                >
                  {investigation.verdict.owner}
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          {/* Confidence */}
          <Grid size={12}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 3,
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <TrendingUpIcon color="primary" />

                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    AI Confidence
                  </Typography>
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={investigation.verdict.confidence}
                  sx={{
                    height: 12,
                    borderRadius: 10,
                  }}
                />

                <Typography
                  variant="h4"
                  color="primary"
                  fontWeight={700}
                  align="center"
                >
                  {investigation.verdict.confidence}%
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          {/* Next Steps */}
          <Grid size={12}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 3,
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                mb={3}
              >
                Suggested Next Steps
              </Typography>

              <Stack spacing={3}>
                {investigation.recommendations.recommendations.map(
                  (item) => (
                    <Box key={item.priority}>
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="flex-start"
                      >
                        <CheckCircleIcon
                          color="success"
                          sx={{ mt: 0.3 }}
                        />

                        <Box>
                          <Typography
                            fontWeight={700}
                          >
                            {item.action}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            {item.reason}
                          </Typography>
                        </Box>
                      </Stack>

                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  )
                )}

                <Typography
                  variant="caption"
                  color="text.secondary"
                  align="right"
                >
                  Estimated Resolution Time:{" "}
                  {investigation.recommendations.estimated_time}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}