import {
  Box,
  Container,
  Typography
} from "@mui/material";

import AIInvestigationCard from "../components/AIInvestigationCard";

export default function InvestigationPage() {
  return (
    <Container maxWidth="xl">

      <Typography
        variant="h4"
        sx={{ mt: 4, mb: 3 }}
      >
        AI Investigation
      </Typography>

      <AIInvestigationCard />

    </Container>
  );
}