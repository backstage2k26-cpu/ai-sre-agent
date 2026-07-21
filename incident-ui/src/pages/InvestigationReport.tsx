import { useEffect, useState } from "react";
import { LinearProgress } from "@mui/material";

import type { Investigation } from "../types/investigation";
import { getInvestigation } from "../services/investigationService";

import KpiRow from "../components/KpiRow";
import { useParams } from "react-router-dom";
import { Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import FindingsGrid from "../components/report/FindingsGrid/FindingsGrid";
import AIInvestigationContent from "../components/report/modules/AIInvestigation/AIInvestigationContent";

import "../styles/dashboard.css";

export default function Dashboard() {
  const [investigation, setInvestigation] =
    useState<Investigation | null>(null);

  const [loading, setLoading] = useState(true);

  const [job, setJob] = useState<any>(null);

  const { investigationId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let timer: number;

    async function load() {
      try {
        const latestJob = await getInvestigation(investigationId!);
        console.log("Latest Job:", latestJob);

        setJob(latestJob);

        console.log("State should become:", latestJob.progress);

        if (!latestJob) {
          setLoading(false);
          return;
        }

        if (
          latestJob.status === "COMPLETED" &&
          latestJob.report
        ) {
          setInvestigation(latestJob.report);
          setLoading(false);

          clearInterval(timer);
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }

    load();

    timer = window.setInterval(load, 2000);

    return () => clearInterval(timer);
  }, [investigationId]);

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Loading...</h2>
      </div>
    );
  }
  if (!loading && !job) {
    return (
        <div
          style={{
            flex: 1,
            padding: 60,
            textAlign: "center",
          }}
        >
          <h2>No Active Investigation</h2>

          <p>
            There are currently no investigations
            running.
          </p>
        </div>
    );
  }

  if (!investigation) {
    return (
        <div
          style={{
            flex: 1,
            padding: 60,
          }}
        >
          <h2>🧠 AI Investigation Running</h2>

          <p>
            Progress: {job?.progress ?? 0}%
          </p>

          <LinearProgress
            variant="determinate"
            value={job?.progress ?? 0}
            sx={{
              height: 10,
              borderRadius: 5,
              mb: 3,
            }}
          />

          <h3>
            Current Step
          </h3>

          <p
            style={{
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {job?.current_step ??
              "Starting Investigation..."}
          </p>

          <p style={{ color: "#888" }}>
            The AI agent is collecting evidence from
            ArgoCD, Kubernetes, Grafana, Prometheus,
            Network and Knowledge Base before generating
            the final investigation report.
          </p>
        </div>
    );
  }

  return (
      <div
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        <div className="dashboard">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/incidents")}
            >
              Back to Incidents
            </Button>

            <h1
              style={{
                margin: 0,
              }}
            >
              Investigation Report
            </h1>

            <div />
          </div>

          <KpiRow investigation={investigation} />

          <FindingsGrid investigation={investigation} />

          <AIInvestigationContent
              investigation={investigation}
          />

        </div>
      </div>
  );
}