import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";

import { getInvestigation } from "../services/investigationService";
const API = "http://localhost:8000";

type AnyObj = Record<string, any>;

export default function InvestigationReport() {
  const { investigationId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<AnyObj | null>(null);
  const [incidentPayload, setIncidentPayload] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await getInvestigation(investigationId!);
        if (mounted) setJob(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [investigationId]);

  useEffect(() => {
    let mounted = true;

    async function loadIncidentPayload() {
      const incidentNumber = job?.incident_number ?? job?.number ?? job?.incident?.number;
      if (!incidentNumber) return;

      try {
        const response = await fetch(`${API}/incidents/${incidentNumber}`);
        if (!response.ok) return;

        const payload = await response.json();
        if (mounted) setIncidentPayload(payload);
      } catch (err) {
        console.error(err);
      }
    }

    loadIncidentPayload();

    return () => {
      mounted = false;
    };
  }, [job]);

  const report = useMemo(() => {
    if (!job) return null;

    if (job.report && typeof job.report === "object") {
      const investigation = job.report as AnyObj;

      if (
        investigation.report &&
        typeof investigation.report === "object"
      ) {
        return investigation.report as AnyObj;
      }

      return investigation;
    }

    if (job.result && typeof job.result === "object") {
      const result = job.result as AnyObj;

      if (
        result.report &&
        typeof result.report === "object"
      ) {
        return result.report as AnyObj;
      }

      return result;
    }

    return null;
  }, [job]);

  const data = useMemo(() => buildData(job, report, incidentPayload), [job, report, incidentPayload]);

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading report...</Typography>
      </Box>
    );
  }

  if (!job) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>No report available.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F6F7FB" }}>
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 }, py: 2.5 }}>
        <TopBar navigate={navigate} />

        <Hero data={data} />

        <SectionHeader step="01" tag="ANSWER FIRST" title="Executive Summary" subtitle="What happened, why, and what to do next." />
        <ExecutiveSummarySection data={data} />

        <SectionHeader step="02" tag="HOW THE AGENT THINKS" title="AI Investigation" subtitle="Reasoning chain, evidence weights, and alternative hypotheses the agent considered and ruled out." />
        <AIInvestigationSection data={data} />

        <SectionHeader step="03" tag="COMPONENT-BY-COMPONENT" title="Technical Investigation" subtitle="Subsystems inspected in parallel." />
        <TechnicalInvestigationSection data={data} />

        <SectionHeader step="04" tag="SYSTEM TOPOLOGY" title="Infrastructure Health Map" subtitle="11 of 12 systems investigated. Skipped systems were healthy at query time." />
        <InfrastructureSection data={data} />

        <SectionHeader step="05" tag="SHOW YOUR WORK" title="Evidence Explorer" subtitle="Raw signals grouped by component. Every conclusion is traceable." />
        <EvidenceExplorerSection data={data} />

        <SectionHeader step="06" tag="CHRONOLOGY" title="Investigation Timeline" subtitle="Every signal, action, and inference in order." />
        <TimelineSection data={data} />

        <SectionHeader step="07" tag="FIX NOW" title="Recovery Actions" subtitle="Prioritized, runnable steps to restore service." />
        <RecoveryActionsSection data={data} />

        <SectionHeader step="08" tag="PREVENT THE NEXT ONE" title="Recommendations" subtitle="Immediate, preventive, and long-term work broken out for planning." />
        <RecommendationsSection data={data} />

        <SectionHeader step="09" tag="PATTERN INTELLIGENCE" title="Similar Incidents" subtitle="Historical incidents with matching signatures, ranked by similarity." />
        <SimilarIncidentsSection data={data} />

        <FooterSection data={data} />
      </Container>
    </Box>
  );
}

function TopBar({ navigate }: { navigate: (path: string) => void }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/incidents")} sx={{ textTransform: "none", color: "#334155", fontWeight: 700 }}>
        Incidents
      </Button>
      <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap" }}>
        <ActionButton icon={<ShareOutlinedIcon />} label="Share" />
        <ActionButton icon={<PictureAsPdfOutlinedIcon />} label="Export PDF" />
        <Button variant="contained" startIcon={<BoltRoundedIcon />} sx={primaryBtnSx}>
          Run Recovery
        </Button>
      </Box>
    </Box>
  );
}

function Hero({ data }: { data: AnyObj }) {
  return (
    <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 4, background: "linear-gradient(135deg, #1F3358 0%, #344a72 100%)", color: "#fff", boxShadow: "0 18px 42px rgba(15,23,42,0.18)" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 320px" }, gap: 3 }}>
        <Box>
          <Typography sx={eyebrowSx}>AI INVESTIGATION REPORT · AI SRE AGENT V4.2.1</Typography>
          <Typography sx={{ mt: 1, fontSize: { xs: 30, md: 42 }, lineHeight: 1.05, fontWeight: 800, letterSpacing: "-0.05em" }}>
            {data.heroShortDescription || "Short description not available"}
          </Typography>
          <Typography sx={{ mt: 1.2, color: "rgba(255,255,255,0.82)", fontSize: { xs: 14, md: 15 }, lineHeight: 1.55, maxWidth: 900 }}>
            {data.heroDescription || "Description not available"}
          </Typography>
          <Divider sx={{ my: 2.3, borderColor: "rgba(255,255,255,0.12)" }} />
          <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "rgba(255,255,255,0.62)" }}>
            WHAT CAUSED THE ISSUE
          </Typography>
          <Typography sx={{ mt: 0.6, color: "rgba(255,255,255,0.92)", fontSize: { xs: 15, md: 16 }, lineHeight: 1.55 }}>
            {data.heroCause || "No dynamic data available"}
          </Typography>
          <Typography sx={{ mt: 1.8, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "rgba(255,255,255,0.62)" }}>
            HOW IT HAPPENED
          </Typography>
          <Typography sx={{ mt: 0.6, color: "rgba(255,255,255,0.92)", fontSize: { xs: 15, md: 16 }, lineHeight: 1.55 }}>
            {data.heroHow || "No dynamic data available"}
          </Typography>
          <Divider sx={{ my: 2.3, borderColor: "rgba(255,255,255,0.12)" }} />
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
            <MetaPill>{data.heroApp}</MetaPill>
            <MetaPill>{data.heroEnv}</MetaPill>
            <MetaPill>{data.heroGeneratedAt}</MetaPill>
            <MetaPill>{data.heroVersion}</MetaPill>
          </Box>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
          <HeroStat label="CONFIDENCE" value={data.heroConfidence == null ? "-" : `${data.heroConfidence}%`} />
          <HeroStat label="INVESTIGATION" value={data.heroDuration || "-"} />
          <HeroStat label="COMPONENTS" value={data.heroComponents} />
          <HeroStat label="ETA" value={data.heroEta} />
        </Box>
      </Box>
    </Paper>
  );
}

function SectionHeader({
  step,
  tag,
  title,
  subtitle,
}: {
  step: string;
  tag: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Box sx={{ mt: 4.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
        <Chip label={step} size="small" sx={{ fontWeight: 800 }} />
        <Typography sx={{ fontSize: 13, letterSpacing: "0.08em", color: "#64748B", fontWeight: 700 }}>
          {tag}
        </Typography>
      </Box>
      <Typography sx={{ mt: 0.8, fontSize: { xs: 26, md: 32 }, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.04em", color: "#111827" }}>
        {title}
      </Typography>
      <Typography sx={{ mt: 0.8, color: "#6B7280", fontSize: 15, lineHeight: 1.4 }}>
        {subtitle}
      </Typography>
    </Box>
  );
}

function ExecutiveSummarySection({ data }: { data: AnyObj }) {
  return (
    <Paper sx={{ mt: 2, p: 3, borderRadius: 4 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.5fr 1fr" }, gap: 2 }}>
        <SectionCard title="ROOT CAUSE" accent="red" large>
          {data.executiveRootCause}
        </SectionCard>
        <SectionCard title="CONFIDENCE">
          <Box>
            <Typography sx={{ fontSize: 54, fontWeight: 800, lineHeight: 1, color: "#1E3A8A" }}>
              {data.heroConfidence == null ? "-" : data.heroConfidence}
              <Typography component="span" sx={{ fontSize: 24, color: "#94A3B8" }}>
                %
              </Typography>
            </Typography>
            <Box sx={{ mt: 1.5, height: 10, borderRadius: 999, bgcolor: "#E5E7EB", overflow: "hidden" }}>
              <Box sx={{ width: `${data.heroConfidence == null ? 0 : data.heroConfidence}%`, height: "100%", bgcolor: "#1E3A8A" }} />
            </Box>
            <Typography sx={{ mt: 1.2, color: "#6B7280", fontSize: 14 }}>
              High confidence - evidence is deterministic and reproducible.
            </Typography>
            <Box sx={{ mt: 2.5, display: "grid", gap: 1 }}>
              <DetailLine label="Severity" value={data.severity} />
              <DetailLine label="Owner" value={data.owner} />
              <DetailLine label="Risk" value={data.risk} />
            </Box>
          </Box>
        </SectionCard>
      </Box>

      <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        <SectionCard title="BUSINESS IMPACT">{data.businessImpact}</SectionCard>
        <SectionCard title="CURRENT STATUS">{data.currentStatus}</SectionCard>
      </Box>
    </Paper>
  );
}

function AIInvestigationSection({ data }: { data: AnyObj }) {
  return (
    <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.6fr 1fr" }, gap: 2 }}>
      <Paper sx={{ p: 2.5, borderRadius: 4 }}>
        <Typography sx={panelHeadingSx}>Reasoning Chain</Typography>
        <Typography sx={panelSubSx}>Sequential steps from signal ingest to root cause</Typography>
        <Box sx={{ mt: 2 }}>
          {(data.reasoning || []).slice(0, 6).map((item: AnyObj | string, index: number) => (
            <Box key={index} sx={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 1.5, mb: 2.2 }}>
              <StepCircle>{index + 1}</StepCircle>
              <Box>
                <Typography sx={{ fontWeight: 700, color: "#111827" }}>
                  {typeof item === "string" ? item : item.title || item.label || item.summary || "Reasoning step"}
                </Typography>
                <Typography sx={{ color: "#6B7280", lineHeight: 1.45, mt: 0.2 }}>
                  {typeof item === "string" ? "" : item.detail || item.summary || item.description || ""}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
        <Paper sx={{ mt: 2.5, p: 2, borderRadius: 3, bgcolor: "#FAFBFC" }}>
          <Typography sx={panelHeadingSx}>Why we're confident</Typography>
          <Box sx={{ mt: 1.5, display: "grid", gap: 1.1 }}>
            {(data.confidenceReasons || []).map((item: string, index: number) => (
              <Bullet key={index}>{item}</Bullet>
            ))}
          </Box>
        </Paper>
      </Paper>

      <Box sx={{ display: "grid", gap: 2 }}>
        <Paper sx={{ p: 2.5, borderRadius: 4 }}>
          <Typography sx={panelHeadingSx}>Failure Point</Typography>
          <Box sx={{ mt: 1.5, p: 2, borderRadius: 3, bgcolor: "#F3F4F6", fontFamily: "monospace", fontSize: 14, color: "#111827" }}>
            {data.failurePoint}
          </Box>
        </Paper>
        <Paper sx={{ p: 2.5, borderRadius: 4 }}>
          <Typography sx={panelHeadingSx}>Primary Evidence</Typography>
          <Box sx={{ mt: 1.5, display: "grid", gap: 1 }}>
            {(data.primaryEvidence || []).map((item: string, index: number) => (
              <Bullet key={index}>{item}</Bullet>
            ))}
          </Box>
        </Paper>
        <Paper sx={{ p: 2.5, borderRadius: 4 }}>
          <Typography sx={panelHeadingSx}>Alternatives Ruled Out</Typography>
          <Box sx={{ mt: 1.5, display: "grid", gap: 1.1 }}>
            {(data.alternatives || []).map((item: AnyObj, index: number) => (
              <Box key={index} sx={{ borderLeft: "2px solid #E5E7EB", pl: 1.6 }}>
                <Typography sx={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>{item.title || item}</Typography>
                <Typography sx={{ color: "#6B7280", fontSize: 13.5, mt: 0.3 }}>{item.reason || ""}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

function TechnicalInvestigationSection({ data }: { data: AnyObj }) {
  const cards = [
    data.logsTitle && {
      title: data.logsTitle,
      summary: data.logsSummary,
      count: data.logsCount,
      state: "Healthy",
    },
    data.metricsTitle && {
      title: data.metricsTitle,
      summary: data.metricsSummary,
      count: data.metricsCount,
      state: "Healthy",
    },
    data.deploymentsTitle && {
      title: data.deploymentsTitle,
      summary: data.deploymentsSummary,
      count: data.deploymentsCount,
      state: "Healthy",
    },
    data.kubernetesTitle && {
      title: data.kubernetesTitle,
      summary: data.kubernetesSummary,
      count: data.kubernetesCount,
      state: "Healthy",
    },
    data.networkTitle && {
      title: data.networkTitle,
      summary: data.networkSummary,
      count: data.networkCount,
      state: "Healthy",
    },
    data.depsTitle && {
      title: data.depsTitle,
      summary: data.depsSummary,
      count: data.depsCount,
      state: "Healthy",
    },
  ].filter(Boolean);

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 1.8 }}>
        {cards.map((card: AnyObj, index: number) => (
          <InvestigationCard
            key={index}
            title={card.title}
            summary={card.summary}
            count={String(card.count)}
            state={card.state}
          />
        ))}
      </Box>
    </Box>
  );
}

function InfrastructureSection({ data }: { data: AnyObj }) {
  const tiles = data.infrastructure ?? [
    ["ServiceNow", "ITSM", data.servicenowStatus, data.servicenowMetric, "Skipped"],
    ["Grafana", "Observability", data.grafanaStatus, data.grafanaMetric, "Investigated"],
    ["Loki", "Logs", data.lokiStatus, data.lokiMetric, "Investigated"],
    ["Prometheus", "Metrics", data.prometheusStatus, data.prometheusMetric, "Investigated"],
    ["Kubernetes API", "Orchestration", data.k8sApiStatus, data.k8sApiMetric, "Investigated"],
    ["ArgoCD", "GitOps", data.argocdStatus, data.argocdMetric, "Investigated"],
    [data.applicationName, "Application", data.applicationStatus, data.applicationMetric, "Investigated"],
    [data.ingressGatewayName, "Network", data.ingressGatewayMetric, data.ingressGatewayScore, "Investigated"],
    [data.dbName, "Database", data.dbMetric, data.dbScore, "Investigated"],
    [data.paymentsApiName, "Dependency", data.paymentsMetric, data.paymentsScore, "Investigated"],
    [data.authSvcName, "Dependency", data.authMetric, data.authScore, "Investigated"],
    [data.s3Name, "Storage", data.s3Metric, data.s3Score, "Investigated"],
  ];

  return (
    <Paper sx={{ mt: 2, p: 2.5, borderRadius: 4 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 1.5 }}>
        {tiles.map((item: AnyObj, index: number) => (
          <TopologyTile
            key={index}
            name={item.name}
            type={item.type}
            metric={item.metric}
            score=""
            status={item.status}
          />
        ))}
      </Box>
    </Paper>
  );
}

function EvidenceExplorerSection({ data }: { data: AnyObj }) {
  const tabs = ["Logs", "Metrics", "Deployments", "Kubernetes", "Ingress / Gateway", "Pods", "Services", "Events"];
  return (
    <Paper sx={{ mt: 2, p: 0, borderRadius: 4, overflow: "hidden" }}>
      <Box sx={{ px: 2, pt: 1.4, borderBottom: "1px solid #E5E7EB", display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        {tabs.map((tab, index) => (
          <Chip key={tab} label={tab} color={index === 0 ? "primary" : "default"} sx={{ mb: 1.3 }} />
        ))}
      </Box>
      <Box sx={{ p: 2.5 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
          {data.evidenceHeadline}
        </Typography>
        <Typography sx={{ color: "#6B7280", mt: 0.3 }}>
          {data.evidenceSubhead}
        </Typography>
        <Paper sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: "#050816", color: "#E5E7EB", fontFamily: "monospace" }}>
          {(data.evidenceLines || []).slice(0, 3).map((line: string, index: number) => (
            <Typography key={index} sx={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.8 }}>
              {String(index + 1).padStart(2, "0")}  {line}
            </Typography>
          ))}
        </Paper>
      </Box>
    </Paper>
  );
}

function TimelineSection({ data }: { data: AnyObj }) {
  return (
    <Paper sx={{ mt: 2, p: 2.5, borderRadius: 4 }}>
      <Box sx={{ display: "grid", gap: 2.2 }}>
        {(data.timeline || []).slice(0, 6).map((item: AnyObj, index: number) => (
          <Box key={index} sx={{ display: "grid", gridTemplateColumns: "88px 1fr", gap: 2 }}>
            <Box sx={{ textAlign: "right", pr: 1 }}>
              <Typography sx={{ fontFamily: "monospace", fontWeight: 800, fontSize: 18, color: "#111827" }}>{item.time || "—"}</Typography>
              <Typography sx={{ fontSize: 12, color: "#6B7280" }}>UTC</Typography>
            </Box>
            <Box sx={{ position: "relative", pl: 2.2 }}>
              {index < 5 && <Box sx={{ position: "absolute", left: 7, top: 28, bottom: -12, width: 1, bgcolor: "#E5E7EB" }} />}
              <Box sx={{ position: "absolute", left: 0, top: 8, width: 14, height: 14, borderRadius: "50%", bgcolor: item.color || "#F5B93D" }} />
              <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>
                {item.title || item.event || "Timeline event"}
              </Typography>
              <Typography sx={{ color: "#6B7280", mt: 0.4, lineHeight: 1.55 }}>
                {item.description || item.summary || "Every signal, action, and inference in order."}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

function RecoveryActionsSection({ data }: { data: AnyObj }) {
  const steps = data.recoveryActions || [];
  return (
    <Paper sx={{ mt: 2, p: 0.5, borderRadius: 4 }}>
      <Box sx={{ p: 0.5, display: "grid", gap: 1.2 }}>
        {steps.slice(0, 5).map((item: AnyObj, index: number) => (
          <Paper key={index} sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Box sx={{ p: 2, display: "grid", gridTemplateColumns: "46px 1fr 24px", gap: 1.5, alignItems: "center" }}>
              <StepBubble>{index + 1}</StepBubble>
              <Box>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  <Chip label={item.priority || "Critical"} color={index === 0 ? "error" : "default"} size="small" />
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{item.title || item.action || "Recovery step"}</Typography>
                </Box>
                <Typography sx={{ color: "#6B7280", mt: 0.3 }}>{item.subtitle || item.owner || "Platform-SRE on-call"}</Typography>
              </Box>
              <Typography sx={{ color: "#94A3B8", textAlign: "right" }}>⌄</Typography>
            </Box>
            <Box sx={{ bgcolor: "#050816", color: "#fff", p: 2.2, fontFamily: "monospace" }}>
              <Typography sx={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
                {item.command || item.details || "No command available."}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </Paper>
  );
}

function RecommendationsSection({ data }: { data: AnyObj }) {
  const groups = data.recommendationGroups || [];
  return (
    <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
      {groups.slice(0, 6).map((group: AnyObj, index: number) => (
        <RecommendationCard key={index} title={group.title || "Recommendation"} accent={group.accent || "#F97316"} items={group.items || []} />
      ))}
    </Box>
  );
}

function SimilarIncidentsSection({ data }: { data: AnyObj }) {
  const rows = data.similarIncidents || [];
  return (
    <Paper sx={{ mt: 2, p: 0.5, borderRadius: 4, overflow: "hidden" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 2fr 0.8fr 1fr 0.9fr", px: 2.5, py: 1.5, color: "#6B7280", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em" }}>
        <div>INCIDENT</div>
        <div>APPLICATION</div>
        <div>ROOT CAUSE</div>
        <div>RESOLUTION</div>
        <div>RESOLVED BY</div>
        <div>SIMILARITY</div>
      </Box>
      <Divider />
      {rows.slice(0, 3).map((row: AnyObj, index: number) => (
        <Box key={index} sx={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 2fr 0.8fr 1fr 0.9fr", px: 2.5, py: 1.8, alignItems: "center", borderBottom: index < 2 ? "1px solid #EEF2F7" : "none" }}>
          <Typography sx={{ fontFamily: "monospace", fontWeight: 800, color: "#1E3A8A" }}>{row.incident}</Typography>
          <Typography>{row.application}</Typography>
          <Typography sx={{ color: "#6B7280" }}>{row.rootCause}</Typography>
          <Typography>{row.resolution}</Typography>
          <Typography>{row.resolvedBy}</Typography>
          <Typography sx={{ fontWeight: 800, textAlign: "right" }}>{row.similarity}%</Typography>
        </Box>
      ))}
    </Paper>
  );
}

function FooterSection({ data }: { data: AnyObj }) {
  return (
    <Paper sx={{ mt: 3, p: 3, borderRadius: 4 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        <FooterKV label="REPORT ID" value={data.reportId} />
        <FooterKV label="GENERATED AT" value={data.generatedAt} />
        <FooterKV label="INVESTIGATION DURATION" value={data.investigationDuration} />
        <FooterKV label="AGENT VERSION" value={data.agentVersion} />
      </Box>
      <Divider sx={{ my: 2.5 }} />
      <Typography sx={{ color: "#6B7280", fontSize: 13, lineHeight: 1.6 }}>
        This report was generated by the AI SRE Incident Agent from live signals across logs, metrics, deployments, Kubernetes state, and knowledge sources.
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
        <Button variant="outlined">Helpful</Button>
        <Button variant="outlined">Not helpful</Button>
        <Button variant="outlined">Escalate to human</Button>
      </Box>
    </Paper>
  );
}

function buildData(job: AnyObj | null, report: AnyObj | null, incidentPayload: AnyObj | null) {
  const incidentNumber = job?.incident_number ?? job?.context?.incident_number ?? "-";
  const incident = incidentPayload?.incident ?? {};
  const latestAi = incidentPayload?.latest_ai ?? {};
  const applicationName =
    report?.hero?.application ??
    incident?.application_name ??
    job?.context?.application_name ??
    job?.context?.service_name ??
    "-";
  const shortDescription =
    report?.hero?.short_description ??
    incident?.short_description ??
    job?.short_description ??
    job?.context?.short_description ??
    job?.incident?.short_description ??
    "-";
  const incidentDescription =
    report?.hero?.description ??
    incident?.description ??
    job?.description ??
    job?.context?.description ??
    job?.incident?.description ??
    "-";
  const aiResult = job?.ai_result ?? {};
  const investigationResult = job?.investigation_result ?? {};
  const rootCause =
    report?.ai_investigation?.root_cause?.description ??
    latestAi?.ai_investigation?.root_cause?.description ??
    aiResult?.root_cause?.description ??
    aiResult?.diagnosis ??
    job?.executive?.likely_cause ??
    "No dynamic data available.";
  const cause =
    report?.hero?.cause ??
    latestAi?.hero?.cause ??
    aiResult?.root_cause?.title ??
    investigationResult?.root_cause ??
    job?.correlation?.probable_root_cause ??
    "No dynamic data available.";
  const how =
    report?.hero?.how ??
    latestAi?.hero?.how ??
    aiResult?.root_cause?.description ??
    job?.correlation?.findings?.[0] ??
    aiResult?.reasoning?.[0] ??
    "No dynamic data available.";
  const confidence = report?.hero?.confidence ?? latestAi?.hero?.confidence ?? investigationResult?.confidence ?? aiResult?.confidence ?? job?.evidence?.overall ?? null;
  const investigationTime = report?.hero?.duration ?? latestAi?.hero?.duration ?? investigationResult?.investigation_time ?? aiResult?.estimated_recovery_time ?? null;
  console.log("FULL REPORT", report);

  const recommendationGroups = [
    {
      title: "Recommendations",
      accent: "#F97316",
      items:
        report?.recommendations?.recommendations?.map(
          (r: AnyObj) => r.action ?? r.description ?? r.title
        ) ?? [],
    },
  ];

  const tech = report?.technical_investigation ?? {};
  const infra = report?.infrastructure ?? [];
  return {
    heroShortDescription: shortDescription,
    heroDescription: incidentDescription,
    heroCause: cause,
    heroHow: how,
    heroConfidence: confidence,
    heroDuration: investigationTime,
    heroApp: report?.hero?.application ?? latestAi?.hero?.application ?? applicationName,
    heroEnv: report?.hero?.environment ?? "Production",
    heroGeneratedAt: report?.hero?.generated_at ?? latestAi?.footer?.generated_at ?? formatDate(job?.started_at),
    heroVersion: report?.hero?.version ?? latestAi?.hero?.version ?? "AI SRE Agent v4.2.1",
    heroComponents: report?.hero?.components ?? "14 inspected",
    heroEta: report?.hero?.eta ?? aiResult?.estimated_recovery_time ?? "-",

    executiveRootCause: rootCause,
    severity: job?.investigation_result?.status ?? "Critical",
    owner: job?.executive?.recommended_owner ?? "Platform-SRE on-call (Priya Menon)",
    risk: job?.ai_result?.business_impact ?? "Medium - mitigation is a single kubectl patch, reversible in seconds.",
    businessImpact: report?.executive_summary?.businessImpact ?? latestAi?.ai_investigation?.business_impact ?? job?.impact?.business_impact ?? "No dynamic data available.",
    currentStatus: report?.executive_summary?.currentStatus ?? latestAi?.ai_investigation?.diagnosis ?? "No dynamic data available.",
    confidenceReasons: report?.ai_investigation?.reasoning ?? job?.ai_result?.reasoning ?? [],
    failurePoint: report?.ai_investigation?.failure_point ?? latestAi?.ai_investigation?.failure_point ?? "No dynamic data available.",
    primaryEvidence: report?.ai_investigation?.primary_evidence ?? latestAi?.ai_investigation?.primary_evidence ?? [],
    alternatives: report?.ai_investigation?.alternatives ?? latestAi?.ai_investigation?.alternatives ?? [],

    logsTitle: tech.logs?.title ?? "Logs",
    logsSummary: tech.logs?.summary ?? "-",
    logsCount: tech.logs?.findings?.length ?? 0,

    metricsTitle: tech.metrics?.title ?? "Metrics",
    metricsSummary: tech.metrics?.summary ?? "-",
    metricsCount: tech.metrics?.findings?.length ?? 0,

    deploymentsTitle: tech.deployment?.title ?? "Deployment",
    deploymentsSummary: tech.deployment?.summary ?? "-",
    deploymentsCount: tech.deployment?.findings?.length ?? 0,

    kubernetesTitle: tech.kubernetes?.title ?? "Kubernetes",
    kubernetesSummary: tech.kubernetes?.summary ?? "-",
    kubernetesCount: tech.kubernetes?.findings?.length ?? 0,

    networkTitle: tech.network?.title ?? "Network",
    networkSummary: tech.network?.summary ?? "-",
    networkCount: tech.network?.findings?.length ?? 0,

    depsTitle: tech.dependency?.title ?? "Dependencies",
    depsSummary: tech.dependency?.summary ?? "-",
    depsCount: tech.dependency?.findings?.length ?? 0,

    applicationName,

    infrastructure: infra,

    evidenceHeadline: "Evidence collected during investigation",

    evidenceSubhead: `${report?.evidence?.primary?.length ?? 0} primary findings, ${
      report?.evidence?.supporting?.length ?? 0
    } supporting findings`,

    evidenceLines: [
      ...(report?.evidence?.primary ?? []),
      ...(report?.evidence?.supporting ?? []),
      ...(report?.evidence?.contradictions ?? []),
    ],

    timeline: report?.timeline ?? job?.timeline ?? [
      { time: "08:03:11", title: "Sync applied", description: "market-dev @ v2.14.3 rolled out", color: "#F5B93D" },
      { time: "08:04:40", title: "First 5xx", description: "upstream connect error on cluster market-dev|8080", color: "#EF4444" },
      { time: "08:06:00", title: "SLO breach", description: "5xx rate crosses 5% threshold", color: "#EF4444" },
      { time: "08:12:04", title: "Incident opened", description: "INC0087421 auto-created with severity Critical", color: "#EF4444" },
      { time: "08:15:20", title: "Investigation started", description: "14 components queued for parallel inspection", color: "#10B981" },
      { time: "08:17:42", title: "Failure localized", description: "Service selector ≠ Pod labels", color: "#F5B93D" },
    ],

    recoveryActions:
      report?.recovery?.resolution_plan?.map((step: string, index: number) => ({
        priority: index === 0 ? "Critical" : "High",
        title: step,
        subtitle: `Estimated Recovery: ${report?.recovery?.estimated_time ?? "-"}`,
        command: step,
      })) ?? [
      { priority: "Critical", title: "Verify HTTPRoute references the correct Service", subtitle: "Platform-SRE on-call · ETA 1 min", command: "kubectl get httproute market-dev.web -o yaml | grep backendRefs -A4" },
      { priority: "Critical", title: "Patch Service selector to match new pod labels", subtitle: "Platform-SRE on-call · ETA 2 min", command: "kubectl patch service market-dev --type merge -p '{...}'" },
      { priority: "High", title: "Validate Ingress gateway sees healthy upstreams", subtitle: "Platform-SRE on-call · ETA 1 min", command: "kubectl get endpoints market-dev" },
      { priority: "High", title: "Restart deployment if endpoints still empty", subtitle: "Platform-SRE on-call · ETA 3 min", command: "kubectl rollout restart deploy market-dev" },
      { priority: "Medium", title: "Add pre-deploy check to validate Service selector matches template labels", subtitle: "Platform Engineering · ETA 1 day", command: "Add CI gate for selector/template parity" },
    ],

    recommendationGroups,

    similarIncidents: report?.similar_incidents ?? latestAi?.similar_incidents ?? [],

    reportId: report?.footer?.report_id ?? `RPT-${incidentNumber}-1`,
    generatedAt: report?.footer?.generated_at ?? formatDate(job?.started_at),
    investigationDuration:
      report?.footer?.investigation_duration ??
      investigationResult?.investigation_time ??
      aiResult?.estimated_recovery_time ??
      job?.recommendations?.estimated_time ??
      "-",
    agentVersion: report?.footer?.agent_version ?? "AI SRE Agent v4.2.1",
  };
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date);
}

function TopologyTile({
  name,
  type,
  metric,
  score,
  status,
}: {
  name: string;
  type: string;
  metric: string;
  score: string;
  status: string;
}) {
  const accent =
    name === "market-dev" ? "#EF4444" : score === "Skipped" ? "#D1D5DB" : status === "Warning" ? "#EAB308" : "#22C55E";
  return (
    <Paper sx={{ p: 2, borderRadius: 4, border: `1px solid ${accent}55`, bgcolor: status === "Skipped" ? "#F8FAFC" : accent === "#EF4444" ? "#FFF5F5" : "#F7FCF8", minHeight: 134 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <Box>
          <Typography sx={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>{name}</Typography>
          <Typography sx={{ fontSize: 13, color: "#6B7280", mt: 0.2 }}>{type}</Typography>
        </Box>
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: accent }} />
      </Box>
      <Typography sx={{ mt: 2.5, color: "#6B7280", fontSize: 14 }}>{metric}</Typography>
      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <Chip label={status} size="small" />
      </Box>
    </Paper>
  );
}

function InvestigationCard({
  title,
  summary,
  count,
  state,
}: {
  title: string;
  summary: string;
  count: string;
  state: string;
}) {
  const accent =
    state === "Problem" ? "#EF4444" : state === "Warning" ? "#EAB308" : "#22C55E";
  return (
    <Paper sx={{ p: 2, borderRadius: 4, borderLeft: `4px solid ${accent}`, minHeight: 146 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{title}</Typography>
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: accent }} />
      </Box>
      <Typography sx={{ mt: 1.1, color: "#6B7280", lineHeight: 1.45, fontSize: 14 }}>{summary}</Typography>
      <Box sx={{ mt: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography sx={{ color: "#6B7280", fontSize: 13 }}>{count}</Typography>
        <Typography sx={{ color: accent, fontWeight: 700, fontSize: 13 }}>{state}</Typography>
      </Box>
    </Paper>
  );
}

function RecommendationCard({
  title,
  accent,
  items,
}: {
  title: string;
  accent: string;
  items: string[];
}) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 4, borderLeft: `4px solid ${accent}`, minHeight: 216 }}>
      <Typography sx={{ fontWeight: 800, color: accent, fontSize: 18 }}>{title}</Typography>
      <Box sx={{ mt: 1.8, display: "grid", gap: 1.4 }}>
        {items.length ? items.map((item, index) => <Bullet key={index}>{item}</Bullet>) : <Typography sx={{ color: "#6B7280" }}>No dynamic data available.</Typography>}
      </Box>
    </Paper>
  );
}

function SectionCard({
  title,
  accent,
  large = false,
  children,
}: {
  title: string;
  accent?: string;
  large?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 4, borderLeft: accent ? `4px solid ${accent === "red" ? "#EF4444" : accent}` : undefined }}>
      <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "#6B7280" }}>{title}</Typography>
      <Typography sx={{ mt: large ? 1.2 : 0.8, fontSize: large ? 18 : 15, lineHeight: 1.6, color: "#111827" }}>{children}</Typography>
    </Paper>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 2 }}>
      <Typography sx={{ color: "#6B7280", fontSize: 14 }}>{label}</Typography>
      <Typography sx={{ color: "#111827", fontSize: 14, fontWeight: 600, textAlign: "right" }}>{value}</Typography>
    </Box>
  );
}

function ActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Button variant="outlined" startIcon={icon} sx={actionBtnSx}>
      {label}
    </Button>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return <Typography sx={{ fontFamily: '"SFMono-Regular", ui-monospace, monospace', fontSize: 13 }}>{children}</Typography>;
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ p: 2, borderRadius: 3, bgcolor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
      <Typography sx={{ fontSize: 12, letterSpacing: "0.08em", color: "rgba(255,255,255,0.6)", fontWeight: 800 }}>{label}</Typography>
      <Typography sx={{ mt: 0.6, fontSize: 18, fontWeight: 800 }}>{value}</Typography>
    </Box>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 15, lineHeight: 1.55, color: "#111827" }}>
      <Box component="span" sx={{ color: "#94A3B8", mr: 1 }}>
        ›
      </Box>
      {children}
    </Typography>
  );
}

function StepBubble({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "#E5E7EB", display: "grid", placeItems: "center", fontWeight: 800 }}>
      {children}
    </Box>
  );
}

function StepCircle({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #1E3A8A", color: "#1E3A8A", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14 }}>
      {children}
    </Box>
  );
}

function FooterKV({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, letterSpacing: "0.08em", color: "#6B7280", fontWeight: 800 }}>{label}</Typography>
      <Typography sx={{ mt: 0.8, fontSize: 16, fontFamily: '"SFMono-Regular", ui-monospace, monospace', color: "#111827" }}>{value}</Typography>
    </Box>
  );
}

const actionBtnSx = {
  textTransform: "none",
  borderRadius: 3,
  bgcolor: "#fff",
  borderColor: "rgba(15,23,42,0.08)",
  color: "#111827",
  fontWeight: 700,
};

const primaryBtnSx = {
  textTransform: "none",
  borderRadius: 3,
  bgcolor: "#F97316",
  fontWeight: 800,
  "&:hover": { bgcolor: "#EA580C" },
};

const eyebrowSx = {
  color: "rgba(255,255,255,0.62)",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.12em",
};

const panelHeadingSx = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "#6B7280",
};

const panelSubSx = {
  color: "#6B7280",
  fontSize: 13,
  mt: 0.2,
};
