import { useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import PsychologyIcon from "@mui/icons-material/Psychology";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

import type { Investigation } from "../../../../types/investigation";
import AIAnalysisDialog from "./AIAnalysisDialog";

interface Props {
  investigation: Investigation;
}

export default function AIInvestigationContent({
  investigation,
}: Props) {
  const [open, setOpen] = useState(false);

  const ai = investigation.ai_result;

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
    <>
      <Card
        elevation={6}
        sx={{
          mt: 4,
          borderRadius: 4,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            mb={4}
          >
            <PsychologyIcon
              color="primary"
              sx={{ fontSize: 42 }}
            />

            <Box>
              <Typography
                variant="h4"
                fontWeight={700}
              >
                AI Investigation
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                AI analyzed Kubernetes, Deployment,
                Logs, Metrics, Network and Timeline
                before generating this investigation.
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={3}>
            {/* Root Cause */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  minHeight: 180,
                }}
              >
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <ErrorOutlineIcon color="warning" />

                    <Typography
                      variant="h6"
                      fontWeight={700}
                    >
                      Root Cause
                    </Typography>
                  </Stack>

                  <Stack spacing={2}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      color="text.primary"
                    >
                      {ai.root_cause.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.8,
                      }}
                    >
                      {ai.root_cause.description}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>

            {/* Business Impact */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  minHeight: 220,
                }}
              >
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <BusinessCenterIcon color="primary" />

                    <Typography
                      variant="h6"
                      fontWeight={700}
                    >
                      Business Impact
                    </Typography>
                  </Stack>

                  <Typography
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.8,
                    }}
                  >
                    {ai.business_impact}
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
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
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

                    <Chip
                      color={confidenceColor}
                      label={`${ai.confidence}% ${confidenceLabel}`}
                    />
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={ai.confidence}
                    sx={{
                      height: 12,
                      borderRadius: 8,
                    }}
                  />
                </Stack>
              </Paper>
            </Grid>

            {/* Investigation Summary */}
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
                  mb={2}
                >
                  Investigation Summary
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.8,
                    textAlign: "left",
                  }}
                >
                  {ai.diagnosis}
                </Typography>
              </Paper>
            </Grid>

            {/* Recovery Actions */}
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
                  Immediate Recovery Actions
                </Typography>

                <Stack spacing={3}>
                  {ai.resolution_plan.map(
                    (
                      item: string,
                      index: number
                    ) => (
                      <Box key={index}>
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="flex-start"
                        >
                          <Box
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: "50%",
                              bgcolor:
                                "success.main",
                              color: "white",
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              fontWeight: 700,
                              fontSize: 14,
                              flexShrink: 0,
                            }}
                          >
                            {index + 1}
                          </Box>

                          <Typography
                            color="text.secondary"
                            sx={{
                              lineHeight: 1.8,
                            }}
                          >
                            {item}
                          </Typography>
                        </Stack>

                        {index <
                          ai.resolution_plan
                            .length -
                            1 && (
                          <Divider
                            sx={{ mt: 2 }}
                          />
                        )}
                      </Box>
                    )
                  )}
                </Stack>
              </Paper>
            </Grid>

            {/* Button */}
            <Grid size={12}>
              <Box textAlign="center">
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={
                    <PsychologyIcon />
                  }
                  onClick={() =>
                    setOpen(true)
                  }
                  sx={{
                    mt: 2,
                    px: 4,
                    borderRadius: 2,
                  }}
                >
                  AI Analysis
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <AIAnalysisDialog
        open={open}
        onClose={() => setOpen(false)}
        ai={ai}
      />
    </>
  );
}