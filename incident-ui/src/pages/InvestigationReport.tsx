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
  Grid,
  Stack,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import AppsIcon from "@mui/icons-material/Apps";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import AdjustOutlinedIcon from "@mui/icons-material/AdjustOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import AltRouteOutlinedIcon from "@mui/icons-material/AltRouteOutlined";
import {
  FileText,
  BarChart3,
  Rocket,
  Boxes,
  Network,
  Server,
  CalendarRange,
  Globe,
  Workflow,
  Search,
  Activity,
} from "lucide-react";

import {
  getInvestigation,
  getSimilarIncidents,
  type SimilarIncident,
} from "../services/investigationService";
const API = "http://localhost:8000";

type AnyObj = Record<string, any>;

export default function InvestigationReport() {
  const { investigationId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<AnyObj | null>(null);
  const [incidentPayload, setIncidentPayload] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);
  const [similarIncidents, setSimilarIncidents] = useState<SimilarIncident[]>([]);

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
    if (!investigationId) return;

    let mounted = true;

    async function loadSimilarIncidents() {
      try {
        const incidents = await getSimilarIncidents(investigationId);

        console.log("SIMILAR INCIDENTS:", incidents);

        if (mounted) {
          setSimilarIncidents(incidents);
        }
      } catch (err) {
        console.error("Failed to load similar incidents:", err);

        if (mounted) {
          setSimilarIncidents([]);
        }
      }
    }

    loadSimilarIncidents();

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
  const isFailed = data.reportState === "failed";

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

        {isFailed ? <FailureHero data={data} /> : <Hero data={data} />}

        {isFailed ? (
          <>
            <SectionHeader
              step="01"
              tag="INVESTIGATION"
              title="Investigation Progress"
              subtitle="Shows exactly where the AI investigation stopped."
            />

            <FailureFindingsSection data={data} />

            <SectionHeader
              step="02"
              tag="MISSING DATA"
              title="Missing Investigation Resources"
              subtitle="Resources that could not be investigated because execution stopped."
            />

            <FailureRecoverySection data={data} />

            <SectionHeader
              step="03"
              tag="LOG ANALYSIS"
              title="Loki Logs"
              subtitle="Application logs collected before the investigation terminated."
            />

            <FailureLokiLogsSection data={data} />

            <SectionHeader
              step="04"
              tag="EXECUTION"
              title="Agent Execution Log"
              subtitle="Internal execution log of the investigation agent."
            />

            <FailureAgentLogSection data={data} />
          </>
        ) : (
          <>
            <SectionHeader
              step="01"
              tag="ANSWER FIRST"
              title="Executive Summary"
              subtitle="What happened, why, and what to do next."
            />

            <ExecutiveSummarySection data={data} />

            <SectionHeader
              step="02"
              tag="NEXT STEPS"
              title="AI Investigation"
              subtitle="Reasoning chain, evidence weights and conclusions."
            />

            <AIInvestigationSection data={data} />

            <SectionHeader
              step="03"
              tag="COMPONENT-BY-COMPONENT"
              title="Technical Investigation"
              subtitle="subsystems inspected in parallel. Click any card to drill into evidence."
            />

            <TechnicalInvestigationSection data={data} />

            {/* keep remaining success sections unchanged */}
          </>
        )}

        {!isFailed && (
          <>
            <SectionHeader
              step="04"
              tag="CHRONOLOGY"
              title="Investigation Timeline"
              subtitle="Trace the incident from the first known issue through investigation, root cause and recovery planning."
            />
            <TimelineSection data={data} />

            <SectionHeader
              step="05"
              tag="FIX NOW"
              title="Recovery Actions"
              subtitle="Prioritized, runnable steps to restore service."
            />
            <RecoveryActionsSection data={data} />

            <SectionHeader
              step="06"
              tag="PATTERN INTELLIGENCE"
              title="Similar Incidents"
              subtitle="Historical incidents with matching signatures, ranked by similarity."
            />
            <SimilarIncidentsSection
              data={data}
              rows={similarIncidents}
            />
          </>
        )}
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
    </Box>
  );
}

function Hero({ data }: { data: AnyObj }) {
  const inspectedComponents = buildTechnicalCards(data).length;
  return (
    <Paper sx={{ p: { xs: 1.75, md: 2.1 }, borderRadius: 4, background: "linear-gradient(135deg, #1F3358 0%, #344a72 100%)", color: "#fff", boxShadow: "0 18px 42px rgba(15,23,42,0.18)" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 280px" }, gap: 1.75 }}>
        <Box>
          <Typography sx={{ ...eyebrowSx, fontSize: 10.5 }}>
            AI INVESTIGATION REPORT · {data.heroIncidentNumber || data.reportId || "INCIDENT"}
          </Typography>
          <Typography sx={{ mt: 0.55, fontSize: { xs: 23, md: 28 }, lineHeight: 1.02, fontWeight: 800, letterSpacing: "-0.05em" }}>
            {data.heroShortDescription || "Short description not available"}
          </Typography>
          <Typography sx={{ mt: 0.65, color: "rgba(255,255,255,0.82)", fontSize: { xs: 12, md: 13 }, lineHeight: 1.35, maxWidth: 900 }}>
            {data.heroDescription || "Description not available"}
          </Typography>
          <Divider sx={{ my: 1.3, borderColor: "rgba(255,255,255,0.12)" }} />
          <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", color: "rgba(255,255,255,0.62)" }}>
            WHAT CAUSED THE ISSUE
          </Typography>
          <Typography sx={{ mt: 0.3, color: "rgba(255,255,255,0.92)", fontSize: { xs: 12.5, md: 13.5 }, lineHeight: 1.32 }}>
            {data.heroCause || "No dynamic data available"}
          </Typography>
          <Typography sx={{ mt: 0.85, fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", color: "rgba(255,255,255,0.62)" }}>
            HOW IT HAPPENED
          </Typography>
          <Typography sx={{ mt: 0.3, color: "rgba(255,255,255,0.92)", fontSize: { xs: 12.5, md: 13.5 }, lineHeight: 1.32 }}>
            {data.heroHow || "No dynamic data available"}
          </Typography>
          
          <Box
            sx={{
              mt: 1,
              pt: 1,
              borderTop: "1px solid rgba(255,255,255,0.12)",
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              color: "rgba(255,255,255,0.72)",
              fontSize: 12,
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AppsIcon sx={{ fontSize: 15, opacity: 0.8 }} />
              {data.heroApp}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <DnsOutlinedIcon sx={{ fontSize: 15, opacity: 0.8 }} />
              {data.heroEnv}
              {data.heroLocation && ` • ${data.heroLocation}`}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccessTimeOutlinedIcon sx={{ fontSize: 15, opacity: 0.8 }} />
              Generated {data.heroGeneratedAt}
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.1 }}>
          <HeroStat label="CONFIDENCE" value={data.heroConfidence == null ? "-" : `${data.heroConfidence}%`} />
          <HeroStat label="INVESTIGATION" value={data.heroDuration || "-"} />
          <HeroStat label="COMPONENTS" value={inspectedComponents} />
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
  rightSlot,
}: {
  step: string;
  tag: string;
  title: string;
  subtitle: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <Box sx={{ mt: 4.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Chip label={step} size="small" sx={{ fontWeight: 800, height: 26, "& .MuiChip-label": { px: 1 } }} />
          <Typography sx={{ fontSize: 10.5, letterSpacing: "0.08em", color: "#64748B", fontWeight: 700 }}>
            {tag}
          </Typography>
        </Box>
        {rightSlot}
      </Box>
      <Typography sx={{ mt: 0.5, fontSize: { xs: 18, md: 22 }, lineHeight: 1.06, fontWeight: 800, letterSpacing: "-0.04em", color: "#111827" }}>
        {title}
      </Typography>
      <Typography sx={{ mt: 0.35, color: "#6B7280", fontSize: 11.5, lineHeight: 1.25 }}>
        {subtitle}
      </Typography>
    </Box>
  );
}

function ExecutiveSummarySection({ data }: { data: AnyObj }) {
  const confidence = normalizeConfidence(data.heroConfidence);
  const severity = formatSeverity(data.severity);
  const risk = formatRisk(data.risk, confidence, severity);

  return (
    <Paper sx={{ mt: 2, p: { xs: 2, md: 2.25 }, borderRadius: 4 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.45fr 1fr" }, gap: 1.5 }}>
        <SectionCard title="ROOT CAUSE" accent="red" large>
          <Box sx={{ display: "grid", gap: 1.6 }}>
            <Typography sx={{ color: "#111827", fontSize: { xs: 15, md: 16 }, lineHeight: 1.55 }}>
              {data.executiveRootCause}
            </Typography>
            <Box sx={{ pt: 1.6, borderTop: "1px solid #E5E7EB" }}>
              <MiniInfoCard label="BUSINESS IMPACT" value={data.businessImpact} />
            </Box>
          </Box>
        </SectionCard>
        <SectionCard title="CONFIDENCE">
          <Box>
            <Typography sx={{ fontSize: { xs: 44, md: 48 }, fontWeight: 800, lineHeight: 1, color: "#1E3A8A" }}>
              {confidence == null ? "-" : confidence}
              <Typography component="span" sx={{ fontSize: 18, color: "#94A3B8" }}>
                %
              </Typography>
            </Typography>
            <Box sx={{ mt: 1.25, height: 8, borderRadius: 999, bgcolor: "#E5E7EB", overflow: "hidden" }}>
              <Box sx={{ width: `${confidence == null ? 0 : confidence}%`, height: "100%", bgcolor: "#1E3A8A" }} />
            </Box>
            <Typography sx={{ mt: 1, color: "#6B7280", fontSize: 12.5, lineHeight: 1.35 }}>
              High confidence - evidence is deterministic and reproducible.
            </Typography>
            <Box sx={{ mt: 1.8, display: "grid", gap: 0.95 }}>
              <MetricLine label="Severity" value={severity} tone="severity" />
              <MetricLine label="Risk" value={risk} tone="risk" />
            </Box>
          </Box>
        </SectionCard>
      </Box>
    </Paper>
  );
}

function AIInvestigationSection({ data }: { data: AnyObj }) {
  const reasoning = normalizeReasoningSteps(data.reasoning);
  const failurePoint = formatFailurePoint(data);
  const alternatives = normalizeAlternativeExclusions(data.alternatives, data);

  return (
    <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.55fr 1fr" }, gap: 1.5 }}>
      <Paper sx={{ p: 1.75, borderRadius: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 3,
              bgcolor: "#1F2F57",
              color: "#FFFFFF",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <ChecklistOutlinedIcon sx={{ fontSize: 21 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
              Reasoning Chain
            </Typography>
            <Typography sx={{ mt: 0.35, color: "#6B7280", fontSize: 11.5, lineHeight: 1.2 }}>
              Sequential steps from signal ingest to root cause
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 1.5, display: "grid", gap: 1 }}>
          {reasoning.map((item, index) => (
            <Box
              key={`${item.title}-${index}`}
              sx={{
                display: "grid",
                gridTemplateColumns: "30px 1fr",
                gap: 1,
                alignItems: "start",
              }}
            >
              <Box sx={{ pt: 0.45, display: "flex", justifyContent: "center" }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    bgcolor: index === reasoning.length - 1 ? "#1E3A8A" : "#E2E8F0",
                    color: index === reasoning.length - 1 ? "#FFFFFF" : "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    lineHeight: 1,
                    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  {index + 1}
                </Box>
              </Box>
              <Box
                sx={{
                  p: 1.35,
                  borderRadius: 3,
                  bgcolor: index === reasoning.length - 1 ? "#EEF4FF" : "#FCFDFE",
                  border: "1px solid #E7ECF3",
                }}
              >
                <Typography sx={{ fontWeight: 750, color: "#111827", fontSize: 13, lineHeight: 1.35 }}>
                  {item.title}
                </Typography>
                {item.detail && (
                  <Typography sx={{ color: "#64748B", lineHeight: 1.45, mt: 0.35, fontSize: 12.25 }}>
                    {item.detail}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
        <Paper sx={{ mt: 1.75, p: 1.5, borderRadius: 3, bgcolor: "#FAFBFC" }}>
          <HeaderLabel icon={<ChecklistOutlinedIcon sx={{ fontSize: 16 }} />} text="Why we're confident" />
          <Box sx={{ mt: 1, display: "grid", gap: 0.85 }}>
            {(data.confidenceReasons || []).map((item: string, index: number) => (
              <Bullet key={index}>{item}</Bullet>
            ))}
          </Box>
        </Paper>
      </Paper>

      <Box sx={{ display: "grid", gap: 1.5 }}>
        <Paper sx={{ p: 1.75, borderRadius: 4 }}>
          <HeaderLabel icon={<AdjustOutlinedIcon sx={{ fontSize: 16 }} />} text="Failure Point" />
          <Box sx={{ mt: 1.1, p: 1.5, borderRadius: 3, bgcolor: "#F3F4F6", fontFamily: "monospace", fontSize: 12.5, color: "#111827" }}>
            {failurePoint}
          </Box>
        </Paper>
        <Paper sx={{ p: 1.75, borderRadius: 4 }}>
          <HeaderLabel icon={<ChecklistOutlinedIcon sx={{ fontSize: 16 }} />} text="Primary Evidence" />
          <Box sx={{ mt: 1, display: "grid", gap: 0.6 }}>
            {normalizePrimaryEvidence(data.primaryEvidence, data).map((item, index) => (
              <Box key={`${item}-${index}`} sx={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 1, alignItems: "start" }}>
                <Box sx={{ mt: 0.95, width: 8, height: 8, borderRadius: "50%", bgcolor: "#1E3A8A" }} />
                <Typography
                  sx={{
                    fontFamily: '"SFMono-Regular", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#111827",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {item}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
        <Paper sx={{ p: 1.75, borderRadius: 4 }}>
          <HeaderLabel icon={<AltRouteOutlinedIcon sx={{ fontSize: 16 }} />} text="Alternatives Ruled Out" />
          <Box sx={{ mt: 1, display: "grid", gap: 0.85 }}>
            {alternatives.length ? (
              alternatives.map((item, index) => (
                <Box key={`${item.title}-${index}`} sx={{ borderLeft: "2px solid #E5E7EB", pl: 1.6 }}>
                  <Typography sx={{ fontWeight: 700, color: "#111827", fontSize: 13 }}>{item.title}</Typography>
                  <Typography sx={{ color: "#6B7280", fontSize: 12.5, mt: 0.2 }}>{item.reason}</Typography>
                </Box>
              ))
            ) : (
              <Typography sx={{ color: "#6B7280", fontSize: 12.5 }}>
                No alternative root causes were retained after the evidence review.
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

function TechnicalInvestigationSection({ data }: { data: AnyObj }) {
  const cards = buildTechnicalCards(data);

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ mt: 2.2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 1.25 }}>
        {cards.map((card, index) => (
          <TechnicalCard key={index} title={card.title} summary={card.summary} detail={card.detail} state={card.state} icon={card.icon} />
        ))}
      </Box>
    </Box>
  );
}

type TechState = "Problem" | "Warning" | "Healthy" | "Unknown";

function mapBackendTechState(
  status: unknown,
  fallbackSummary?: unknown,
  fallbackCount = 0,
  kind = ""
): TechState {
  const normalized = compactText(status).toUpperCase();

  if (
    normalized === "PROBLEM" ||
    normalized === "FAILED" ||
    normalized === "ERROR" ||
    normalized === "UNHEALTHY" ||
    normalized === "CRITICAL"
  ) {
    return "Problem";
  }

  if (
    normalized === "WARNING" ||
    normalized === "DEGRADED" ||
    normalized === "PARTIAL"
  ) {
    return "Warning";
  }

  if (
    normalized === "HEALTHY" ||
    normalized === "SUCCESS" ||
    normalized === "OK" ||
    normalized === "PASS"
  ) {
    return "Healthy";
  }

  if (
    normalized === "UNKNOWN" ||
    normalized === "NO_DATA" ||
    normalized === "NOT_COLLECTED"
  ) {
    return "Unknown";
  }

  // Backward compatibility for old reports without structured status
  return inferTechState(
    fallbackSummary,
    fallbackCount,
    kind
  );
}

function shouldShowTechnicalCard(status: unknown, discovered = true) {
  const normalized = compactText(status).toUpperCase();

  if (
    normalized === "SKIPPED" ||
    normalized === "NOT_APPLICABLE" ||
    normalized === "NOT_DISCOVERED"
  ) {
    return false;
  }

  return discovered;
}

function buildTechnicalCards(data: AnyObj) {
  const cards = [
    {
      show: true,
      title: data.logsTitle || "Logs",
      summary: data.logsSummary || "-",
      detail: buildLogsDetail(data),
      state: mapBackendTechState(
        data.logsStatus,
        data.logsSummary,
        data.logsCount,
        "logs"
      ),
      icon: <FileText size={18} />,
    },

    {
      show: true,
      title: "Resource Utilization",
      summary: data.metricsSummary || "Resource usage checked",
      detail: buildResourceUtilizationDetail(data),
      state: mapBackendTechState(
        data.metricsStatus,
        data.metricsSummary,
        data.metricsCount,
        "metrics"
      ),
      icon: <Activity size={18} />,
    },

    {
      show: true,
      title: data.metricsTitle || "Metrics",
      summary: data.metricsSummary || "-",
      detail: buildMetricsDetail(data),
      state: mapBackendTechState(
        data.metricsStatus,
        data.metricsSummary,
        data.metricsCount,
        "metrics"
      ),
      icon: <BarChart3 size={18} />,
    },

    {
      show: true,
      title: data.deploymentsTitle || "Deployments",
      summary: data.deploymentsSummary || "-",
      detail: buildDeploymentDetail(data),
      state: mapBackendTechState(
        data.deploymentsStatus,
        data.deploymentsSummary,
        data.deploymentsCount,
        "deployment"
      ),
      icon: <Rocket size={18} />,
    },

    {
      show: true,
      title: data.kubernetesTitle || "Kubernetes",
      summary: data.kubernetesSummary || "-",
      detail: buildKubernetesDetail(data),
      state: mapBackendTechState(
        data.kubernetesStatus,
        data.kubernetesSummary,
        data.kubernetesCount,
        "kubernetes"
      ),
      icon: <Boxes size={18} />,
    },

    {
      show: true,
      title: data.networkTitle || "Ingress / Gateway",
      summary: data.networkSummary || "-",
      detail: buildNetworkDetail(data),
      state: mapBackendTechState(
        data.networkStatus,
        data.networkSummary,
        data.networkCount,
        "network"
      ),
      icon: <Network size={18} />,
    },

    {
      show: true,
      title: "Pods",
      summary: data.kubernetesSummary || "Pod readiness checked",
      detail: buildPodsDetail(data),
      state: mapBackendTechState(
        data.podsStatus || data.kubernetesStatus,
        data.kubernetesSummary,
        data.kubernetesCount,
        "pods"
      ),
      icon: <Server size={18} />,
    },

    {
      show: shouldShowTechnicalCard(
        data.databaseStatus,
        Boolean(data.databaseImpact || data.database)
      ),
      title: "Database",
      summary:
        data.databaseImpact?.summary ||
        data.database?.summary ||
        "Database impact checked",
      detail: buildDatabaseDetail(data),
      state: mapBackendTechState(
        data.databaseStatus,
        data.databaseImpact?.summary || data.database?.summary,
        0,
        "database"
      ),
      icon: <Workflow size={18} />,
    },

    {
      show: shouldShowTechnicalCard(
        data.pubsubStatus,
        Boolean(data.pubsubRaw)
      ),
      title: data.pubsubTitle || "Pub/Sub",
      summary: data.pubsubSummary || "-",
      detail: buildPubSubDetail(data),
      state: mapBackendTechState(
        data.pubsubStatus,
        data.pubsubSummary,
        data.pubsubCount,
        "pubsub"
      ),
      icon: <CalendarRange size={18} />,
    },

    {
      show: shouldShowTechnicalCard(
        data.redisStatus,
        Boolean(
          findDependencyByKeywords(
            data.dependencyItems,
            ["redis", "cache", "memory store"]
          )
        )
      ),
      title: "Redis",
      summary: data.depsSummary || "Cache dependency checked",
      detail: buildRedisDetail(data),
      state: mapBackendTechState(
        data.redisStatus,
        data.depsSummary,
        data.depsCount,
        "redis"
      ),
      icon: <Search size={18} />,
    },
  ];

  return cards.filter((card) => card.show) as Array<{
    title: string;
    summary: string;
    detail: string;
    state: TechState;
    icon: React.ReactNode;
  }>;
}

function inferTechState(summary: unknown, count: number, kind: string) {
  const text = String(summary || "").toLowerCase();
  if (
    text.includes("degraded") ||
    text.includes("outofsync") ||
    text.includes("not found") ||
    text.includes("mismatch") ||
    text.includes("0 endpoints") ||
    text.includes("error") ||
    text.includes("failed") ||
    text.includes("unhealthy") ||
    text.includes("not attached") ||
    text.includes("missing")
  ) {
    return "Problem";
  }
  if (
    text.includes("warning") ||
    text.includes("partial") ||
    text.includes("drift") ||
    text.includes("change") ||
    text.includes("rolled out") ||
    text.includes("inspected") ||
    (kind === "security" && count > 0)
  ) {
    return "Warning";
  }
  if (count > 0 || text.includes("healthy") || text.includes("ready") || text.includes("pass")) {
    return "Healthy";
  }
  return "Warning";
}

function StatusSummaryPill({
  label,
  tone,
}: {
  label: string;
  tone: "problem" | "warning" | "healthy";
}) {
  const colors = {
    problem: { bg: "#FFF1F2", fg: "#DC2626", dot: "#EF4444" },
    warning: { bg: "#FFFBEB", fg: "#B45309", dot: "#F59E0B" },
    healthy: { bg: "#F0FDF4", fg: "#15803D", dot: "#22C55E" },
  }[tone];

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 0.8,
        borderRadius: 999,
        border: "1px solid #E5E7EB",
        bgcolor: "#FFFFFF",
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: colors.dot }} />
      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{label}</Typography>
    </Box>
  );
}

function TechnicalCard({
  title,
  summary,
  detail,
  state,
  icon,
}: {
  title: string;
  summary: string;
  detail: string;
  count?: number;
  state: TechState;
  icon: React.ReactNode;
}) {
  const accent =
    state === "Problem"
      ? "#EF4444"
      : state === "Warning"
        ? "#EAB308"
        : state === "Healthy"
          ? "#16A34A"
          : "#94A3B8";

  const softBg =
    state === "Problem"
      ? "#FFF5F5"
      : state === "Warning"
        ? "#FFFBEB"
        : state === "Healthy"
          ? "#F0FDF4"
          : "#F8FAFC";

  return (
    <Paper
      sx={{
        p: 1.25,
        borderRadius: 4,
        borderLeft: `4px solid ${accent}`,
        minHeight: 124,
        boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 2,
              bgcolor: softBg,
              color: accent,
              display: "grid",
              placeItems: "center",
              "& svg": { display: "block" },
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Typography sx={{ fontSize: 13.25, fontWeight: 700, color: "#111827", lineHeight: 1.15 }}>{title}</Typography>
        </Box>
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: accent, mt: 0.35 }} />
      </Box>

      <Typography sx={{ mt: 0.8, color: "#4B5563", fontSize: 11.75, lineHeight: 1.45, minHeight: 34 }}>
        {detail || summary}
      </Typography>

      <Box
        sx={{
          mt: 1.1,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Typography sx={{ color: accent, fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>
          {state}
        </Typography>
      </Box>
    </Paper>
  );
}

function buildMetricsDetail(data: AnyObj) {
  const metrics = data.metricsRaw || {};
  const cpu = describeCpuMetric(metrics.cpu);
  const rate = describeRateMetric(metrics, data.metricsFindings, data.metricsSummary);
  const latency = describeLatencyMetric(metrics, data.metricsFindings, data.metricsSummary);
  return compactJoin([
    cpu ? `CPU ${cpu}` : "",
    rate ? rate : "",
    latency ? `latency ${latency}` : "",
  ]) || firstSentence([data.metricsFindings, data.metricsSummary]) || "Metrics reviewed.";
}

function buildResourceUtilizationDetail(data: AnyObj) {
  const metrics = data.metricsRaw || {};
  const cpu = describeCpuUtilization(metrics.cpu, data.metricsFindings, data.metricsSummary);
  const memory = describeMemoryUtilization(metrics.memory, data.metricsFindings, data.metricsSummary);
  const cpuStatus = utilizationStatus(cpu);
  const memoryStatus = utilizationStatus(memory);

  const cpuText = cpu != null ? `CPU ${cpu}% ${cpuStatus}` : "";
  const memoryText = memory != null ? `memory ${memory}% ${memoryStatus}` : "";
  const limitText = cpuStatus === "within limits" && memoryStatus === "within limits"
    ? "well within limits"
    : "check limits";

  return compactJoin([
    cpuText,
    memoryText,
    `utilization ${limitText}`,
  ]) || "Resource utilization reviewed.";
}

function buildKubernetesDetail(data: AnyObj) {
  const pods = Array.isArray(data.kubernetesPods) ? data.kubernetesPods : [];
  const running = pods.filter((pod) => isPodRunning(pod)).length;
  const total = pods.length;
  const state = summarizePodState(pods, data.kubernetesSummary, data.kubernetesFindings);
  const fallback = firstSentence([data.kubernetesFindings, data.kubernetesSummary]) || "Pods inspected.";
  return compactJoin([
    total ? `${running}/${total} pods running` : fallback,
    state ? state : "",
  ]) || fallback;
}

function buildDeploymentDetail(data: AnyObj) {
  const history = Array.isArray(data.deploymentHistory) ? data.deploymentHistory : [];
  const last = history[0];
  const deployedAt = firstText([last?.deployed_at, data.deploymentRaw?.deployed_at]);
  const revision = firstText([last?.revision, data.deploymentRaw?.revision]);
  const app = firstText([data.deploymentRaw?.application, data.applicationName, data.heroApp]);
  return compactJoin([
    app ? `${app} deployed` : "",
    revision ? `revision ${revision}` : "",
    deployedAt ? `at ${formatDate(deployedAt)}` : "",
  ]) || firstSentence([data.deploymentsFindings, data.deploymentsSummary]) || "Deployment history reviewed.";
}

function buildPodsDetail(data: AnyObj) {
  const pods = Array.isArray(data.kubernetesPods) ? data.kubernetesPods : [];
  const total = pods.length;
  const readyPods = pods.filter((pod) => isPodReady(pod)).length;
  const runningPods = pods.filter((pod) => isPodRunning(pod)).length;
  const readiness = summarizeProbeStatus(pods, "readiness");
  const liveness = summarizeProbeStatus(pods, "liveness");
  const states = pods.map((pod) => compactText(pod.phase || pod.status || pod.state)).filter(Boolean);
  const stateText = states.length ? Array.from(new Set(states)).slice(0, 2).join(", ") : "";
  const podNames = pods.map((pod) => compactText(pod.name || pod.metadata?.name)).filter(Boolean);
  const podText = podNames.length ? podNames.slice(0, 3).join(", ") : "";
  const fallback = firstSentence([data.kubernetesFindings, data.kubernetesSummary]) || "Pod health reviewed.";
  return compactJoin([
    total ? `${total} pods discovered` : fallback,
    total ? `${readyPods} ready, ${runningPods} running` : "",
    stateText ? `state ${stateText}` : "",
    liveness ? `liveness ${liveness}` : "",
    readiness ? `readiness ${readiness}` : "",
    podText ? `pods ${podText}` : "",
  ]) || fallback;
}

function buildDatabaseDetail(data: AnyObj) {
  const db = data.databaseImpact || data.database || {};
  const name = firstText([db.database_name, db.name]) || "Database";
  const status = firstText([db.status]) || "checked";
  const metric = firstText([db.metric, db.summary]) || "";
  return compactJoin([
    name,
    metric,
    status,
  ]) || "Database checked.";
}

function buildLogsDetail(data: AnyObj) {
  const findings = Array.isArray(data.logsFindings) ? data.logsFindings : [];
  const firstFinding = firstSentence(findings);
  const summary = firstSentence([data.logsSummary]);
  return compactJoin([firstFinding, summary]) || "Log stream inspected for errors and warnings.";
}

function buildNetworkDetail(data: AnyObj) {
  const findings = Array.isArray(data.networkFindings) ? data.networkFindings : [];
  const firstFinding = firstSentence(findings);
  const summary = firstSentence([data.networkSummary]);
  return compactJoin([firstFinding, summary]) || "Gateway and routing path checked for reachability.";
}

function buildPubSubDetail(data: AnyObj) {
  const pubsub = data.pubsubRaw || {};

  const findings = Array.isArray(data.pubsubFindings)
    ? data.pubsubFindings
    : [];

  const firstFinding = firstSentence(findings);

  const topic = firstText([
    pubsub.topic,
    pubsub.topic_name,
  ]);

  const subscription = firstText([
    pubsub.subscription,
    pubsub.subscription_name,
  ]);

  return (
    compactJoin([
      topic ? `Topic ${topic}` : "",
      subscription ? `Subscription ${subscription}` : "",
      firstFinding,
      data.pubsubSummary,
    ]) || "Pub/Sub investigation completed."
  );
}

function buildRedisDetail(data: AnyObj) {
  const candidate = findDependencyByKeywords(data.dependencyItems, ["redis", "cache", "memory store"]);
  const name = firstText([candidate?.name, candidate?.kind]) || "Redis";
  const message = firstText([candidate?.message, data.depsSummary, data.depsFindings]) || "Cache dependency checked.";
  return compactJoin([name, message]) || "Cache dependency checked.";
}

function describeCpuMetric(cpu: unknown) {
  const obj = cpu && typeof cpu === "object" ? (cpu as AnyObj) : null;
  const candidates = [
    obj?.value,
    obj?.current,
    obj?.usage,
    obj?.average,
    obj?.max,
    obj?.summary,
    obj?.text,
    cpu,
  ];
  const text = firstText(candidates);
  if (!text) return "";
  const match = text.match(/(\d+(?:\.\d+)?\s*(?:cores?|%|millicores?))/i);
  return match?.[1] || text;
}

function describeRateMetric(metrics: AnyObj, findings: unknown, summary: unknown) {
  const candidates = [
    metrics.rate,
    metrics.rps,
    metrics.request_rate,
    metrics.requests_per_sec,
    metrics.throughput,
    findings,
    summary,
  ];
  const text = firstText(candidates);
  if (!text) return "";
  const match = text.match(/(\d+(?:\.\d+)?\s*(?:rps|req\/s|requests?\/s|rpm|qps))/i);
  return match?.[1] ? `rate ${match[1]}` : text;
}

function describeLatencyMetric(metrics: AnyObj, findings: unknown, summary: unknown) {
  const candidates = [
    metrics.latency,
    metrics.p99,
    metrics.p95,
    metrics.p90,
    metrics.response_time,
    findings,
    summary,
  ];
  const text = firstText(candidates);
  if (!text) return "";
  const match = text.match(/(?:latency|p99|p95|p90)?[^0-9]*(\d+(?:\.\d+)?\s*(?:ms|s|sec|seconds?))/i);
  return match?.[1] || text;
}

function describeCpuUtilization(cpu: unknown, findings: unknown, summary: unknown) {
  const text = firstText([extractValue(cpu), findings, summary]);
  const value = extractPercent(text);
  return value;
}

function describeMemoryUtilization(memory: unknown, findings: unknown, summary: unknown) {
  const text = firstText([extractValue(memory), findings, summary]);
  const value = extractPercent(text);
  return value;
}

function extractValue(value: unknown) {
  if (value && typeof value === "object") {
    const obj = value as AnyObj;
    return obj.value ?? obj.current ?? obj.usage ?? obj.average ?? obj.max ?? obj.summary ?? obj.text ?? obj.utilization;
  }
  return value;
}

function extractPercent(text: unknown) {
  const value = String(text || "");
  const match = value.match(/(\d+(?:\.\d+)?)\s*%/);
  if (match?.[1]) return Number(match[1]);

  const numeric = value.match(/(\d+(?:\.\d+)?)/);
  if (numeric?.[1] && /cpu|memory|utilization|usage|limit/i.test(value)) {
    return Number(numeric[1]);
  }

  return null;
}

function utilizationStatus(value: number | null) {
  if (value == null) return "within limits";
  if (value < 70) return "within limits";
  if (value < 90) return "near limit";
  return "over limit";
}

function isPodRunning(pod: AnyObj) {
  const phase = compactText(pod.phase || pod.status || pod.state).toLowerCase();
  const ready = compactText(pod.ready || pod.ready_status || pod.readiness).toLowerCase();
  return phase.includes("running") || ready === "true" || ready === "ready";
}

function isPodReady(pod: AnyObj) {
  const phase = compactText(pod.phase || pod.status || pod.state).toLowerCase();
  const ready = compactText(pod.ready || pod.ready_status || pod.readiness).toLowerCase();
  return ready === "true" || ready === "ready" || phase.includes("running");
}

function summarizeProbeStatus(pods: AnyObj[], probe: "liveness" | "readiness") {
  const values = pods
    .map((pod) => compactText(pod?.[probe] || pod?.[`${probe}_probe`] || pod?.[`${probe}Probe`] || pod?.[`${probe}_status`]))
    .filter(Boolean);
  if (!values.length) return "";
  const healthy = values.filter((value) => /pass|ok|healthy|true|ready/i.test(value)).length;
  if (healthy === values.length) return "passing";
  if (healthy === 0) return "failing";
  return "mixed";
}

function summarizePodState(pods: AnyObj[], summary: unknown, findings: unknown) {
  const total = pods.length;
  const readyPods = pods.filter((pod) => isPodReady(pod)).length;
  const runningPods = pods.filter((pod) => isPodRunning(pod)).length;
  if (total > 0) {
    return `${readyPods}/${total} ready, ${runningPods}/${total} running`;
  }
  return firstSentence([findings, summary]) || "";
}

function findDependencyByKeywords(items: AnyObj[], keywords: string[]) {
  return (Array.isArray(items) ? items : []).find((item) => {
    const text = `${item?.name || ""} ${item?.kind || ""} ${item?.message || ""}`.toLowerCase();
    return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
  }) || null;
}

function compactJoin(items: unknown[]) {
  return items
    .map((item) => String(item || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" · ");
}

function compactText(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function TimelineSection({ data }: { data: AnyObj }) {
  const timeline = Array.isArray(data.timeline) ? data.timeline : [];
  const visibleTimeline = timeline.slice(0, 6);

  return (
    <Paper sx={{ mt: 2, p: 1.3, borderRadius: 3.25 }}>
      <Box sx={{ display: "grid", gap: 1.35 }}>
        {visibleTimeline.map((item: AnyObj, index: number) => (
          <Box
            key={index}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "72px 1fr", md: "92px 1fr" },
              gap: 1.1,
              alignItems: "start",
            }}
          >
            {/* DATE + TIME */}
            <Box sx={{ textAlign: "right", pr: 0.15 }}>
              <Typography
                sx={{
                  fontFamily: "monospace",
                  fontWeight: 800,
                  fontSize: { xs: 11.5, md: 13 },
                  color: "#111827",
                  lineHeight: 1,
                }}
              >
                {item.time || "—"}
              </Typography>

              {item.date && item.date !== "—" && (
                <Typography
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 9.5,
                    color: "#64748B",
                    mt: 0.3,
                  }}
                >
                  {item.date}
                </Typography>
              )}
            </Box>

            {/* TIMELINE CONTENT */}
            <Box
              sx={{
                position: "relative",
                pl: 1.6,
                pb: index < timeline.slice(0, 6).length - 1 ? 1.2 : 0,
                minHeight: 0,
              }}
            >
              {index < visibleTimeline.length - 1 && (
                <Box
                  sx={{
                    position: "absolute",
                    left: "5px",
                    top: "22px",
                    bottom: "-14px",
                    width: "1px",
                    bgcolor: "#E5E7EB",
                  }}
                />
              )}

              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  top: 6,
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  bgcolor: item.color || "#94A3B8",
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.7,
                  flexWrap: "wrap",
                }}
              >
                <Chip
                  label={item.source || "SYSTEM"}
                  size="small"
                  sx={{
                    height: 18,
                    bgcolor: "#F3F4F6",
                    color: "#4B5563",
                    fontSize: 9.5,
                    fontWeight: 700,
                    "& .MuiChip-label": {
                      px: 0.8,
                    },
                  }}
                />

                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: 12.5, md: 13.5 },
                    color: "#111827",
                    lineHeight: 1.15,
                  }}
                >
                  {item.title || "Timeline event"}
                </Typography>

                {item.category && (
                  <Typography
                    sx={{
                      color: "#64748B",
                      fontSize: 10.5,
                    }}
                  >
                    · {item.category}
                  </Typography>
                )}
              </Box>

              {item.description && (
                <Typography
                  sx={{
                    color: "#334155",
                    mt: 0.35,
                    lineHeight: 1.3,
                    fontSize: 11,
                  }}
                >
                  {item.description}
                </Typography>
              )}

              {item.note && (
                <Typography
                  sx={{
                    color: "#64748B",
                    mt: 0.15,
                    lineHeight: 1.25,
                    fontSize: 10.5,
                    fontStyle: "italic",
                  }}
                >
                  {item.note}
                </Typography>
              )}

              {Array.isArray(item.details) && item.details.length > 0 && (
                <Box
                  sx={{
                    mt: 0.35,
                    display: "grid",
                    gap: 0.15,
                  }}
                >
                  {item.details.slice(0, 2).map(
                    (detail: string, detailIndex: number) => (
                      <Typography
                        key={detailIndex}
                        sx={{
                          color: "#475569",
                          fontSize: 10,
                          lineHeight: 1.2,
                        }}
                      >
                        {detail}
                      </Typography>
                    )
                  )}
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}


function RecoveryActionsSection({ data }: { data: AnyObj }) {
  const steps = data.recoveryActions || [];
  console.log("RECOVERY DATA:", data);
  console.log("RECOVERY applicationName:", data.applicationName);
  console.log("RECOVERY environment:", data.environment);
  console.log("RECOVERY actions:", data.recoveryActions);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function copyCommand(command: string, index: number) {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedIndex(index);
      window.setTimeout(() => {
        setCopiedIndex((current) => (current === index ? null : current));
      }, 1400);
    } catch (error) {
      console.error("Failed to copy recovery command", error);
    }
  }

  return (
    <Paper sx={{ mt: 1.5, p: 0.35, borderRadius: 3 }}>
      <Box sx={{ p: 0.35, display: "grid", gap: 0.8 }}>
        {steps.slice(0, 5).map((item: AnyObj, index: number) => (
          <Paper
            key={index}
            sx={{
              borderRadius: 2.5,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
            }}
          >
            <Box
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              sx={{
                p: 1.25,
                display: "grid",
                gridTemplateColumns: { xs: "38px 1fr 18px", md: "40px 1fr 18px" },
                gap: 1,
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <StepBubble>{index + 1}</StepBubble>
              <Box>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  <Chip
                    label={item.priority || "Critical"}
                    color={index === 0 ? "error" : item.priority === "Medium" ? "info" : "default"}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: 10,
                      fontWeight: 800,
                      borderRadius: 999,
                    }}
                  />
                  <Typography sx={{ fontSize: { xs: 12.5, md: 13.25 }, fontWeight: 700, color: "#111827", lineHeight: 1.15 }}>
                    {item.title || item.action || "Recovery step"}
                  </Typography>
                </Box>
                <Typography sx={{ color: "#6B7280", mt: 0.2, fontSize: 11 }}>
                  {item.subtitle || item.owner || "Platform-SRE on-call"}
                </Typography>
              </Box>
              <Typography sx={{ color: "#94A3B8", textAlign: "right", fontSize: 18, lineHeight: 1 }}>
                {expandedIndex === index ? "⌃" : "⌄"}
              </Typography>
            </Box>
            {expandedIndex === index ? (
              <Box sx={{ bgcolor: "#050816", color: "#E2E8F0", px: 1.4, py: 1.35 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 1.6 }}>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", color: "#7DD3FC" }}>
                    COMMAND
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Button
                      size="small"
                      variant="text"
                      onClick={(event) => {
                        event.stopPropagation();
                        copyCommand(buildRecoveryCommand(item, data), index);
                      }}
                      startIcon={<ContentCopyOutlinedIcon sx={{ fontSize: 14 }} />}
                      sx={{
                        textTransform: "none",
                        color: "#E2E8F0",
                        fontWeight: 500,
                        minWidth: "auto",
                        px: 1.25,
                        "&:hover": {
                          bgcolor: "rgba(148, 163, 184, 0.08)",
                        },
                      }}
                    >
                      {copiedIndex === index ? "Copied" : "Copy"}
                    </Button>
                  </Box>
                </Box>
                <Box
                  sx={{
                    fontFamily: '"SFMono-Regular", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    borderRadius: 2,
                    bgcolor: "#020617",
                    border: "1px solid #1E293B",
                    px: 1.25,
                    py: 1.15,
                  }}
                >
                  <Typography
                    component="pre"
                    sx={{
                      m: 0,
                      color: "#E2E8F0",
                      fontSize: "inherit",
                      lineHeight: "inherit",
                      whiteSpace: "pre-wrap",
                      fontFamily: "inherit",
                    }}
                  >
                    {buildRecoveryCommand(item, data)}
                  </Typography>
                </Box>
              </Box>
            ) : null}
          </Paper>
        ))}
      </Box>
    </Paper>
  );
}

function buildRecoveryCommand(item: AnyObj, data: AnyObj) {
  if (item?.command && String(item.command).trim()) {
    return String(item.command).trim();
  }

  const title = compactText(
    item?.title || item?.action || item?.subtitle || "recovery step"
  ).toLowerCase();

  return inferCommandFromTask(title, item, data);
}

function inferCommandFromTask(
  title: string,
  item: AnyObj,
  data: AnyObj
) {
  const scope = inferCommandScope(item);
  const name = inferCommandName(item, data);
  const namespace = inferCommandNamespace(item, data);

  const deploymentName = inferDeploymentName(data);
  const serviceName = inferServiceName(data);
  const podSelector = buildPodSelector(data);

  const lower = title.toLowerCase();

  // --------------------------------------------------
  // External / upstream dependency investigation
  // --------------------------------------------------
  if (
    lower.includes("upstream") ||
    lower.includes("external dependenc") ||
    lower.includes("data source") ||
    lower.includes("message queue") ||
    lower.includes("database") ||
    lower.includes("file share")
  ) {
    return [
      `$ kubectl get pods -n ${namespace} -l '${podSelector}'`,
      `$ kubectl logs -n ${namespace} -l '${podSelector}' --tail=200 | grep -Ei 'connection|timeout|database|queue|upstream|error|exception'`,
    ].join("\n");
  }

  // --------------------------------------------------
  // Scheduler / trigger / batch processing
  // --------------------------------------------------
  if (
    lower.includes("scheduler") ||
    lower.includes("trigger") ||
    lower.includes("batch job") ||
    lower.includes("cron")
  ) {
    return [
      `$ kubectl get cronjobs,jobs -n ${namespace}`,
      `$ kubectl get pods -n ${namespace} -l '${podSelector}'`,
      `$ kubectl logs -n ${namespace} -l '${podSelector}' --tail=200`,
    ].join("\n");
  }

  // --------------------------------------------------
  // HTTPRoute
  // --------------------------------------------------
  if (lower.includes("httproute") || lower.includes("route")) {
    if (lower.includes("verify") || lower.includes("check")) {
      return `$ kubectl get httproute ${name} -n ${namespace} -o yaml`;
    }

    return `$ kubectl describe httproute ${name} -n ${namespace}`;
  }

  // --------------------------------------------------
  // Service selector
  // --------------------------------------------------
  if (
    lower.includes("service selector") ||
    (lower.includes("service") &&
      (lower.includes("patch") || lower.includes("update")))
  ) {
    return [
      `$ kubectl get service ${serviceName} -n ${namespace} -o yaml`,
      podSelector
        ? `$ kubectl get pods -n ${namespace} -l '${podSelector}' --show-labels`
        : `$ kubectl get pods -n ${namespace} --show-labels`,
    ].join("\n");
  }

  // --------------------------------------------------
  // Endpoint / upstream health
  // --------------------------------------------------
  if (lower.includes("endpoint")) {
    return [
      `$ kubectl get endpoints ${serviceName} -n ${namespace}`,
      `$ kubectl describe service ${serviceName} -n ${namespace}`,
    ].join("\n");
  }

  // --------------------------------------------------
  // Restart deployment
  // --------------------------------------------------
  if (lower.includes("restart") || lower.includes("deployment")) {
    return [
      `$ kubectl rollout restart deployment/${deploymentName} -n ${namespace}`,
      `$ kubectl rollout status deployment/${deploymentName} -n ${namespace}`,
    ].join("\n");
  }

  // --------------------------------------------------
  // Application configuration
  // --------------------------------------------------
  if (
    lower.includes("configuration") ||
    lower.includes("config") ||
    lower.includes("environment variable") ||
    lower.includes("startup parameter")
  ) {
    return [
      `$ kubectl get deployment ${name} -n ${namespace} -o yaml`,
      `$ kubectl get configmap -n ${namespace}`,
      `$ kubectl describe deployment ${name} -n ${namespace}`,
    ].join("\n");
  }

  // --------------------------------------------------
  // Pods
  // --------------------------------------------------
  if (lower.includes("pod")) {
    return [
      `$ kubectl get pods -n ${namespace} -l '${podSelector}' -o wide`,
      `$ kubectl logs -n ${namespace} -l '${podSelector}' --tail=100`,
    ].join("\n");
  }

  // --------------------------------------------------
  // Logs
  // --------------------------------------------------
  if (lower.includes("log") || lower.includes("error")) {
    return `$ kubectl logs -n ${namespace} -l '${podSelector}' --tail=100 | grep -Ei 'error|warn'`;
  }

  // --------------------------------------------------
  // Gateway / ingress
  // --------------------------------------------------
  if (lower.includes("gateway") || lower.includes("ingress")) {
    return [
      `$ kubectl get gateway -n ${namespace}`,
      `$ kubectl get httproute -n ${namespace}`,
    ].join("\n");
  }

  // --------------------------------------------------
  // Scale
  // --------------------------------------------------
  if (lower.includes("scale")) {
    return `$ kubectl scale deployment/${name} -n ${namespace} --replicas=<desired-replicas>`;
  }

  // --------------------------------------------------
  // Generic validation
  // --------------------------------------------------
  if (
    lower.includes("check") ||
    lower.includes("validate") ||
    lower.includes("verify")
  ) {
    return `$ kubectl get ${scope} ${name} -n ${namespace} -o wide`;
  }

  // --------------------------------------------------
  // Final fallback
  // --------------------------------------------------
  return `$ kubectl get ${scope} ${name} -n ${namespace} -o wide`;
}

function inferCommandScope(item: AnyObj) {
  const text = compactText([item?.title, item?.action, item?.subtitle, item?.details, item?.owner].filter(Boolean).join(" ")).toLowerCase();
  if (text.includes("httproute") || text.includes("route")) return "httproute";
  if (text.includes("deployment") || text.includes("restart")) return "deployment";
  if (text.includes("service")) return "service";
  if (text.includes("pod")) return "pod";
  if (text.includes("gateway")) return "gateway";
  if (text.includes("ingress")) return "ingress";
  if (text.includes("configmap")) return "configmap";
  if (text.includes("secret")) return "secret";
  if (text.includes("endpoints")) return "endpoints";
  return "resource";
}

function inferCommandName(item: AnyObj, data: AnyObj) {
  const explicitCandidates = [
    item?.resource,
    item?.name,
    item?.target,
    item?.service,
    item?.object,
  ];

  for (const candidate of explicitCandidates) {
    const text = compactText(candidate);

    if (text && text !== "-") {
      return text;
    }
  }

  const applicationName = compactText(data?.applicationName);

  if (applicationName && applicationName !== "-") {
    return applicationName;
  }

  return "<name>";
}

function inferCommandNamespace(item: AnyObj, data: AnyObj) {
  const explicitCandidates = [
    item?.namespace,
    item?.kubernetes_namespace,
    item?.target_namespace,
  ];

  for (const candidate of explicitCandidates) {
    const text = compactText(candidate);

    if (text && text !== "-") {
      return text;
    }
  }

  const discoveredNamespace = compactText(
    data?.kubernetesResources?.namespace ||
    data?.kubernetes_resources?.namespace
  );

  if (discoveredNamespace && discoveredNamespace !== "-") {
    return discoveredNamespace;
  }

  const namespace = compactText(data?.namespace);

  if (namespace && namespace !== "-") {
    return namespace;
  }

  return "<namespace>";
}

function inferDeploymentName(data: AnyObj) {
  return compactText(
    data?.deploymentName ||
    data?.kubernetesResources?.deployment ||
    data?.applicationName ||
    "<deployment>"
  );
}

function inferServiceName(data: AnyObj) {
  return compactText(
    data?.serviceName ||
    data?.kubernetesResources?.service ||
    data?.applicationName ||
    "<service>"
  );
}

function buildPodSelector(data: AnyObj) {
  const selector =
    data?.podSelector ||
    data?.kubernetesResources?.pod_selector;

  if (!selector || typeof selector !== "object") {
    return "";
  }

  return Object.entries(selector)
    .map(([key, value]) => `${key}=${value}`)
    .join(",");
}

function SimilarIncidentsSection({
  data,
  rows,
}: {
  data: AnyObj;
  rows: SimilarIncident[];
}) {
  const normalizedRows = rows.slice(0, 3).map((row) => {
    let rootCause = row.root_cause || "-";

    // Extract title if backend returns a serialized root-cause object
    if (typeof rootCause === "string") {
      const titleMatch = rootCause.match(
        /['"]title['"]\s*:\s*['"]([^'"]+)['"]/
      );

      if (titleMatch?.[1]) {
        rootCause = titleMatch[1];
      }
    }

    const similarity =
      typeof row.similarity === "number"
        ? Math.round(row.similarity * 100)
        : 0;

    return {
      incident: row.incident || "-",
      application:
        row.application ||
        data.applicationName ||
        "-",
      rootCause,
      resolution: row.resolution || "-",
      status: row.status || "Unknown",
      similarity,
    };
  });

  return (
    <Paper
      sx={{
        mt: 2,
        p: 0.5,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            "1.1fr 1fr 2.2fr 0.9fr 0.9fr 1.2fr",
          px: 2.5,
          py: 1.5,
          color: "#6B7280",
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.08em",
        }}
      >
        <div>INCIDENT</div>
        <div>APPLICATION</div>
        <div>ROOT CAUSE</div>
        <div>RESOLUTION</div>
        <div>STATUS</div>
        <div>SIMILARITY</div>
      </Box>

      <Divider />

      {normalizedRows.length === 0 ? (
        <Box
          sx={{
            px: 2.5,
            py: 2,
            color: "#6B7280",
          }}
        >
          No similar incidents found for this investigation.
        </Box>
      ) : (
        normalizedRows.map((row) => (
          <Box
            key={row.incident}
            sx={{
              display: "grid",
              gridTemplateColumns:
                "1.1fr 1fr 2.2fr 0.9fr 0.9fr 1.2fr",
              px: 2.5,
              py: 1.8,
              alignItems: "center",
              borderBottom: "1px solid #EEF2F7",
            }}
          >
            <Typography
              sx={{
                fontFamily: "monospace",
                fontWeight: 800,
                color: "#1E3A8A",
              }}
            >
              {row.incident}
            </Typography>

            <Typography>
              {row.application}
            </Typography>

            <Typography sx={{ color: "#6B7280" }}>
              {row.rootCause}
            </Typography>

            <Typography>
              {row.resolution}
            </Typography>

            <Chip
              label={row.status}
              size="small"
              sx={{
                width: "fit-content",
                fontWeight: 700,
              }}
            />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  height: 6,
                  bgcolor: "#E5E7EB",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${row.similarity}%`,
                    height: "100%",
                    bgcolor: "#1E3A8A",
                    borderRadius: 999,
                  }}
                />
              </Box>

              <Typography
                sx={{
                  minWidth: 38,
                  fontWeight: 800,
                  textAlign: "right",
                }}
              >
                {row.similarity}%
              </Typography>
            </Box>
          </Box>
        ))
      )}
    </Paper>
  );
}

function inferIssueStartedDescription(
  report: AnyObj | null,
  applicationName: string
) {
  const rootCause = firstText([
    report?.ai_investigation?.root_cause?.title,
    report?.ai_investigation?.root_cause?.description,
    report?.root_cause?.title,
    report?.root_cause?.description,
    report?.technical_investigation?.root_cause,
  ]);

  if (!rootCause) {
    return `${applicationName} started experiencing service disruption.`;
  }

  return `${applicationName} started failing due to ${rootCause}.`;
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
  const environment =
    compactText(
      report?.hero?.environment ||
      report?.environment ||
      incident?.environment ||
      job?.context?.environment ||
      job?.incident?.environment
    ) || "-";
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
  const reportState = job?.status?.toString?.().toLowerCase?.() ?? "unknown";
  const isFailed = reportState === "failed" || (!report && !!job && reportState !== "completed");
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

  const failureReason = job?.error ?? job?.current_step ?? report?.ai_investigation?.failure_point ?? latestAi?.ai_investigation?.failure_point ?? null;
  const failureSummary =
    report?.ai_investigation?.failure_summary ??
    latestAi?.ai_investigation?.failure_summary ??
    job?.error ??
    job?.current_step ??
    null;
  const partialFindings = extractStrings(
    report?.ai_investigation?.primary_evidence,
    latestAi?.ai_investigation?.primary_evidence,
    report?.evidence?.primary,
    report?.evidence?.supporting,
    report?.evidence?.contradictions,
    job?.ai_result?.reasoning,
    job?.timeline,
  );
  const suggestedRecovery = extractStrings(
    report?.recovery?.resolution_plan,
    latestAi?.ai_investigation?.resolution_plan,
    job?.recommendations?.actions,
    job?.recommendations?.items,
  );
  const agentLog = extractStrings(
    report?.diagnostic_trail,
    report?.agent_log,
    job?.agent_log,
    job?.timeline,
  );
  const failureTitle =
    report?.hero?.failure_title ??
    latestAi?.hero?.failure_title ??
    incident?.short_description ??
    job?.incident?.short_description ??
    job?.current_step ??
    "Investigation failed";
  const tech = report?.technical_investigation ?? {};
  const infra = report?.infrastructure ?? [];
  const kubernetesResources =
    report?.kubernetes_resources ??
    latestAi?.kubernetes_resources ??
    {};
  const deploymentHistory = Array.isArray(job?.deployment?.history)
    ? job.deployment.history
    : Array.isArray(report?.deployment?.history)
      ? report.deployment.history
      : [];
  const dependencyItems = Array.isArray(job?.dependency?.dependencies)
    ? job.dependency.dependencies
    : Array.isArray(report?.dependency?.dependencies)
      ? report.dependency.dependencies
      : [];
  const kubernetesPods = Array.isArray(job?.kubernetes?.pods)
    ? job.kubernetes.pods
    : Array.isArray(report?.kubernetes?.pods)
      ? report.kubernetes.pods
      : [];
  const kubernetesEvents = Array.isArray(job?.kubernetes?.events)
    ? job.kubernetes.events
    : Array.isArray(report?.kubernetes?.events)
      ? report.kubernetes.events
      : [];
  console.log(
    "REPORT HERO",
    JSON.stringify(report?.hero, null, 2)
  );
  console.log("INCIDENT", incident);
  console.log("JOB CONTEXT", job?.context);
  return {
    reportState,
    isFailed,
    heroShortDescription: shortDescription,
    heroDescription: incidentDescription,
    heroCause: isFailed ? failureSummary ?? cause : cause,
    heroHow: isFailed ? failureReason ?? how : how,
    heroConfidence: isFailed ? null : confidence,
    heroDuration: isFailed ? investigationTime ?? job?.completed_at ?? "0s" : investigationTime,
    heroApp: report?.hero?.application ?? latestAi?.hero?.application ?? applicationName,
    heroEnv:
      report?.hero?.environment ??
      incident?.environment ??
      job?.context?.environment ??
      "Unknown",

    heroLocation:
      report?.hero?.location ??
      incident?.location ??
      job?.context?.location ??
      "",
    heroGeneratedAt: formatDate(
      report?.footer?.generated_at ??
      job?.completed_at ??
      report?.hero?.generated_at ??
      latestAi?.footer?.generated_at ??
      job?.started_at
    ),
    heroIncidentNumber: incidentNumber,
    heroComponents:
      report?.hero?.components ??
      latestAi?.hero?.components ??
      "-",
    heroEta: formatEta(
      report?.hero?.eta ??
      latestAi?.hero?.eta ??
      aiResult?.estimated_recovery_time ??
      "-"
    ),

    executiveRootCause: isFailed ? rootCause : rootCause,
    severity: deriveSeverity(job, report, latestAi),
    risk: deriveRisk(job, report, latestAi),
    businessImpact:
      report?.executive_summary?.businessImpact ??
      report?.ai_investigation?.business_impact ??
      latestAi?.ai_investigation?.business_impact ??
      job?.impact?.business_impact ??
      job?.impact?.user_impact ??
      job?.impact?.availability ??
      "-",
    serviceStatus:
      incident?.state ??
      incidentPayload?.incident?.state ??
      job?.incident?.state ??
      job?.context?.state ??
      job?.current_status ??
      "-",
    confidenceReasons: report?.ai_investigation?.reasoning ?? job?.ai_result?.reasoning ?? [],
    failurePoint: failureReason ?? report?.ai_investigation?.failure_point ?? latestAi?.ai_investigation?.failure_point ?? "-",
    primaryEvidence: report?.ai_investigation?.primary_evidence ?? latestAi?.ai_investigation?.primary_evidence ?? [],
    alternatives: report?.ai_investigation?.alternatives ?? latestAi?.ai_investigation?.alternatives ?? [],
    partialFindings: isFailed ? partialFindings : [],
    suggestedRecovery: isFailed ? suggestedRecovery : [],
    agentLog: isFailed ? agentLog : [],
    failureTitle,

    logsTitle: tech.logs?.title ?? "Logs",
    logsStatus: tech.logs?.status ?? null,
    logsSummary: tech.logs?.summary ?? "-",
    logsCount: tech.logs?.findings?.length ?? 0,
    logsFindings: extractStrings(tech.logs?.findings),

    metricsTitle: tech.metrics?.title ?? "Metrics",
    metricsStatus: tech.metrics?.status ?? null,
    metricsSummary: tech.metrics?.summary ?? "-",
    metricsCount: tech.metrics?.findings?.length ?? 0,
    metricsFindings: extractStrings(tech.metrics?.findings),
    metricsRaw: job?.metrics ?? report?.metrics ?? null,

    deploymentsTitle: tech.deployment?.title ?? "Deployment",
    deploymentsStatus: tech.deployment?.status ?? null,
    deploymentsSummary: tech.deployment?.summary ?? "-",
    deploymentsCount: tech.deployment?.findings?.length ?? 0,
    deploymentsFindings: extractStrings(tech.deployment?.findings),
    deploymentHistory,
    deploymentRaw: job?.deployment ?? report?.deployment ?? null,

    kubernetesTitle: tech.kubernetes?.title ?? "Kubernetes",
    kubernetesStatus: tech.kubernetes?.status ?? null,
    kubernetesSummary: tech.kubernetes?.summary ?? "-",
    kubernetesCount: tech.kubernetes?.findings?.length ?? 0,
    kubernetesFindings: extractStrings(tech.kubernetes?.findings),
    kubernetesPods,
    kubernetesEvents,
    kubernetesRaw: job?.kubernetes ?? report?.kubernetes ?? null,
    podsStatus: tech.pods?.status ?? tech.kubernetes?.status ?? null,

    networkTitle: tech.network?.title ?? "Network",
    networkStatus: tech.network?.status ?? null,
    networkSummary: tech.network?.summary ?? "-",
    networkCount: tech.network?.findings?.length ?? 0,
    networkFindings: extractStrings(tech.network?.findings),

    depsTitle: tech.dependency?.title ?? "Dependencies",
    depsSummary: tech.dependency?.summary ?? "-",
    depsCount: tech.dependency?.findings?.length ?? 0,
    depsFindings: extractStrings(tech.dependency?.findings),
    dependencyItems,

    pubsubTitle: tech.pubsub?.title ?? "Pub/Sub",
    pubsubStatus: tech.pubsub?.status ?? "SKIPPED",
    pubsubSummary: tech.pubsub?.summary ?? "-",
    pubsubCount: tech.pubsub?.findings?.length ?? 0,
    pubsubFindings: extractStrings(tech.pubsub?.findings),
    pubsubRaw: tech.pubsub ?? null,

    databaseImpact: report?.database ?? job?.database ?? null,
    databaseStatus:
      tech.database?.status ??
      report?.database?.status ??
      job?.database?.status ??
      null,
    dependencyRaw: job?.dependency ?? report?.dependency ?? null,

    redisStatus:
      tech.redis?.status ??
      findDependencyByKeywords(
        dependencyItems,
        ["redis", "cache", "memory store"]
      )?.status ??
      null,

    applicationName,
    environment,
    kubernetesResources,

    namespace:
      kubernetesResources?.namespace ??
      "-",

    deploymentName:
      kubernetesResources?.deployment ??
      "-",

    serviceName:
      kubernetesResources?.service ??
      "-",

    podSelector:
      kubernetesResources?.pod_selector ??
      {},

    infrastructure: infra,

    evidenceHeadline: "Evidence collected during investigation",

    evidenceSubhead: `${report?.evidence?.primary?.length ?? 0} primary findings, ${report?.evidence?.supporting?.length ?? 0
      } supporting findings`,

    evidenceLines: [
      ...(report?.evidence?.primary ?? []),
      ...(report?.evidence?.supporting ?? []),
      ...(report?.evidence?.contradictions ?? []),
    ],

    timeline: buildIncidentTimeline({
      report,
      job,
      incidentPayload,
      applicationName,
      incidentNumber,
      failurePoint: failureReason ?? report?.ai_investigation?.failure_point ?? latestAi?.ai_investigation?.failure_point ?? "",
      rootCause,
      cause,
      how,
      confidence,
      investigationTime,
    }),

    recoveryActions:
      report?.recovery?.resolution_plan?.map((step: string, index: number) => ({
        priority: index === 0 ? "Critical" : "High",
        title: step,
        subtitle: `Estimated Recovery: ${report?.recovery?.estimated_time ?? "-"}`,
      })) ?? [
        { priority: "Critical", title: "Verify HTTPRoute references the correct Service", subtitle: "Platform-SRE on-call · ETA 1 min", command: "kubectl get httproute market-dev.web -o yaml | grep backendRefs -A4" },
        { priority: "Critical", title: "Patch Service selector to match new pod labels", subtitle: "Platform-SRE on-call · ETA 2 min", command: "kubectl patch service market-dev --type merge -p '{...}'" },
        { priority: "High", title: "Validate Ingress gateway sees healthy upstreams", subtitle: "Platform-SRE on-call · ETA 1 min", command: "kubectl get endpoints market-dev" },
        { priority: "High", title: "Restart deployment if endpoints still empty", subtitle: "Platform-SRE on-call · ETA 3 min", command: "kubectl rollout restart deploy market-dev" },
        { priority: "Medium", title: "Add pre-deploy check to validate Service selector matches template labels", subtitle: "Platform Engineering · ETA 1 day", command: "Add CI gate for selector/template parity" },
      ],

    similarIncidents: report?.similar_incidents ?? latestAi?.similar_incidents ?? [],
    knowledgeMatches: report?.knowledge?.matches ?? latestAi?.knowledge?.matches ?? [],

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

function formatTimelineTimeIST(value: string | null | undefined) {
  if (!value) {
    return {
      date: "—",
      time: "—",
    };
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return {
      date: "—",
      time: value,
    };
  }

  return {
    date: parsed.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
    }),
    time: parsed.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

function buildIncidentTimeline({
  report,
  job,
  incidentPayload,
  applicationName,
  incidentNumber,
  failurePoint,
  rootCause,
  cause,
  how,
  confidence,
  investigationTime,
}: {
  report: AnyObj | null;
  job: AnyObj | null;
  incidentPayload: AnyObj | null;
  applicationName: string;
  incidentNumber: string;
  failurePoint: unknown;
  rootCause: unknown;
  cause: unknown;
  how: unknown;
  confidence: unknown;
  investigationTime: unknown;
}) {
  const incident = incidentPayload?.incident ?? {};

  const issueStartedAt =
    report?.timeline?.issue_started_at ||
    report?.issue_started_at ||
    job?.issue_started_at ||
    job?.detected_at ||
    incident?.detected_at ||
    incident?.opened_at ||
    "";

  const incidentRaisedAt =
    incident?.opened_at ||
    job?.incident?.opened_at ||
    job?.created_at ||
    "";

  const investigationStartedAt =
    job?.started_at ||
    job?.created_at ||
    "";

  const investigationCompletedAt =
    job?.completed_at ||
    report?.footer?.generated_at ||
    report?.hero?.generated_at ||
    "";

  // Exact incident symptom
  const issue =
    firstText([
      incident?.short_description,
      job?.incident?.short_description,
      job?.short_description,
      report?.hero?.short_description,
    ]) || `Issue detected in ${applicationName}.`;

  // Exact localized failure
  const localizedFailure =
    firstText([
      failurePoint,
      report?.ai_investigation?.failure_point,
    ]) || "Failure location identified.";

  // Exact root cause
  const rootCauseTitle =
    firstText([
      report?.ai_investigation?.root_cause?.title,
      cause,
    ]);

  const rootCauseDescription =
    firstText([
      report?.ai_investigation?.root_cause?.description,
      rootCause,
      how,
    ]);

  // Recovery plan
  const recoveryPlan = extractStrings(
    report?.recovery?.resolution_plan,
    report?.ai_investigation?.resolution_plan,
    incidentPayload?.latest_ai?.ai_investigation?.resolution_plan,
    job?.recommendations?.actions,
    job?.recommendations?.items,
  );

  const confidenceText =
    typeof confidence === "number"
      ? `${Math.round(confidence)}% confidence`
      : "";

  return [
    {
      ...formatTimelineTimeIST(issueStartedAt),
      source: "APPLICATION",
      category: "Issue",
      title: "Issue started",
      description: inferIssueStartedDescription(
        report,
        applicationName
      ),
      note: "",
      details: [],
      color: "#EF4444",
    },

    {
      ...formatTimelineTimeIST(incidentRaisedAt),
      source: "SERVICENOW",
      category: "Incident",
      title: "Incident raised",
      description:
        incidentNumber && incidentNumber !== "-"
          ? `${incidentNumber} raised for ${applicationName}.`
          : `Incident raised for ${applicationName}.`,
      note: "",
      details: [],
      color: "#EF4444",
    },

    {
      ...formatTimelineTimeIST(investigationStartedAt),
      source: "AI SRE AGENT",
      category: "Investigation",
      title: "Investigation started",
      description: `Investigation started for ${applicationName}.`,
      note: "",
      details: [],
      color: "#16A34A",
    },

    {
      ...formatTimelineTimeIST(investigationCompletedAt),
      source: "AI SRE AGENT",
      category: "Localization",
      title: "Failure localized",
      description: localizedFailure,
      note: "",
      details: [],
      color: "#EAB308",
    },

    {
      ...formatTimelineTimeIST(investigationCompletedAt),
      source: "AI SRE AGENT",
      category: "Root Cause",
      title: "Root cause identified",
      description:
        rootCauseTitle ||
        rootCauseDescription ||
        "Root cause identified.",
      note:
        rootCauseTitle &&
        rootCauseDescription &&
        rootCauseTitle !== rootCauseDescription
          ? rootCauseDescription
          : confidenceText,
      details: [],
      color: "#16A34A",
    },

    {
      ...formatTimelineTimeIST(investigationCompletedAt),
      source: "AI SRE AGENT",
      category: "Recovery",
      title: "Recovery plan generated",
      description:
        recoveryPlan[0] ||
        "Recovery actions generated from the identified root cause.",
      note:
        recoveryPlan.length > 1
          ? `+${recoveryPlan.length - 1} additional recovery action${
              recoveryPlan.length > 2 ? "s" : ""
            }`
          : "",
      details: [],
      color: "#1E3A8A",
    },
  ];
}

function inferChangeDescription(report: AnyObj | null, job: AnyObj | null, applicationName: string) {
  const summary = firstText([
    report?.technical_investigation?.deployment?.summary,
    job?.deployment?.assessment?.summary,
  ]);
  const findings = firstText([
    report?.technical_investigation?.deployment?.findings,
    job?.deployment?.assessment?.findings,
  ]);
  const changeRef = firstText([
    job?.deployment?.revision,
    job?.deployment?.image_tag,
    report?.hero?.application,
    job?.context?.application_name,
    job?.context?.service_name,
  ]);

  return [
    summary || "Deployment change was detected.",
    findings,
    changeRef ? `Affected service: ${changeRef}` : "",
  ].filter(Boolean).join(" ");
}

function inferSymptomDescription(report: AnyObj | null, job: AnyObj | null, failurePoint: unknown) {
  const summary = firstText([
    report?.technical_investigation?.network?.summary,
    report?.technical_investigation?.logs?.summary,
    report?.technical_investigation?.metrics?.summary,
    job?.error,
    job?.current_step,
  ]);
  const ref = firstText([failurePoint]);

  return [
    ref || "Ingress symptoms detected.",
    summary,
  ].filter(Boolean).join(" ");
}

function inferLocalizationDescription(rootCause: unknown, failurePoint: unknown, how: unknown) {
  return firstText([failurePoint, how, rootCause]) || "Failure localized from correlated signals.";
}

function inferRootCauseDescription(cause: unknown, rootCause: unknown, confidence: unknown) {
  const text = firstText([cause, rootCause]) || "Root cause unavailable.";
  const conf = typeof confidence === "number" ? ` (${confidence}% confidence)` : "";
  return `${text}${conf}`;
}

function inferChangeNote(report: AnyObj | null, job: AnyObj | null) {
  return [
    firstText([report?.technical_investigation?.deployment?.summary, job?.deployment?.assessment?.summary]),
    firstText([report?.technical_investigation?.deployment?.findings, job?.deployment?.assessment?.findings]),
  ].filter(Boolean).join(" · ") || "No deployment detail was captured.";
}

function inferSymptomNote(report: AnyObj | null, job: AnyObj | null) {
  return [
    firstText([report?.technical_investigation?.network?.findings, job?.network?.assessment?.findings]),
    firstText([report?.technical_investigation?.logs?.findings, job?.logs?.assessment?.findings]),
    firstText([report?.technical_investigation?.metrics?.findings, job?.metrics?.assessment?.findings]),
  ].filter(Boolean).join(" · ") || "No symptom detail was captured.";
}

function inferIncidentNote(incidentPayload: AnyObj | null, job: AnyObj | null) {
  return [
    firstText([incidentPayload?.incident?.state, job?.incident?.state, job?.current_status]),
    firstText([job?.context?.priority]),
  ].filter(Boolean).join(" · ") || "Incident state was not available.";
}

function inferInvestigationDescription(report: AnyObj | null, job: AnyObj | null) {
  return [
    firstText([
      report?.technical_investigation?.logs?.summary,
      report?.technical_investigation?.metrics?.summary,
      report?.technical_investigation?.deployment?.summary,
      report?.technical_investigation?.kubernetes?.summary,
    ]),
    firstText([report?.hero?.components, job?.recommendations?.estimated_time, report?.hero?.eta, job?.ai_result?.estimated_recovery_time]),
  ].filter(Boolean).join(" · ") || "AI investigation started.";
}

function inferInvestigationNote(report: AnyObj | null, job: AnyObj | null, investigationTime: unknown) {
  return [
    firstText([
      report?.technical_investigation?.logs?.findings,
      report?.technical_investigation?.metrics?.findings,
      report?.technical_investigation?.deployment?.findings,
      report?.technical_investigation?.kubernetes?.findings,
      report?.technical_investigation?.network?.findings,
      job?.ai_result?.reasoning,
    ]),
    formatDurationText(investigationTime),
  ].filter(Boolean).join(" · ") || "Parallel evidence collection ran across the available signals.";
}

function inferLocalizationNote(report: AnyObj | null, job: AnyObj | null) {
  return [
    firstText([report?.ai_investigation?.failure_point, job?.correlation?.probable_root_cause]),
    firstText([report?.ai_investigation?.primary_evidence, job?.correlation?.findings]),
  ].filter(Boolean).join(" · ") || "Localization evidence was not explicit.";
}

function inferRootCauseNote(report: AnyObj | null, job: AnyObj | null) {
  return [
    firstText([report?.recovery?.resolution_plan, report?.ai_investigation?.resolution_plan, job?.recommendations?.actions]),
    firstText([report?.executive_summary?.businessImpact, report?.ai_investigation?.business_impact]),
  ].filter(Boolean).join(" · ") || "Recovery plan was generated from the available evidence.";
}

function inferChangeDetails(report: AnyObj | null, job: AnyObj | null, applicationName: string) {
  return compactDetails([
    firstText([report?.technical_investigation?.deployment?.summary, job?.deployment?.assessment?.summary]),
    firstText([report?.technical_investigation?.deployment?.findings, job?.deployment?.assessment?.findings]),
    firstText([job?.deployment?.revision, job?.deployment?.image_tag]),
    applicationName ? `Service: ${applicationName}` : "",
  ]);
}

function inferSymptomDetails(report: AnyObj | null, job: AnyObj | null, failurePoint: unknown) {
  return compactDetails([
    firstText([failurePoint]),
    firstText([report?.technical_investigation?.network?.summary, job?.network?.assessment?.summary]),
    firstText([report?.technical_investigation?.logs?.summary, job?.logs?.assessment?.summary]),
    firstText([report?.technical_investigation?.metrics?.summary, job?.metrics?.assessment?.summary]),
  ]);
}

function inferIncidentDetails(incidentPayload: AnyObj | null, job: AnyObj | null) {
  return compactDetails([
    firstText([incidentPayload?.incident?.short_description, job?.short_description]),
    firstText([incidentPayload?.incident?.priority, job?.context?.priority]),
    firstText([incidentPayload?.incident?.state, job?.incident?.state, job?.current_status]),
  ]);
}

function inferInvestigationDetails(report: AnyObj | null, job: AnyObj | null, investigationTime: unknown) {
  return compactDetails([
    firstText([report?.technical_investigation?.logs?.summary]),
    firstText([report?.technical_investigation?.metrics?.summary]),
    firstText([report?.technical_investigation?.deployment?.summary]),
    firstText([report?.technical_investigation?.kubernetes?.summary]),
    firstText([formatDurationText(investigationTime)]),
  ]);
}

function inferLocalizationDetails(report: AnyObj | null, job: AnyObj | null) {
  return compactDetails([
    firstText([report?.ai_investigation?.failure_point]),
    firstText([report?.ai_investigation?.primary_evidence]),
    firstText([job?.correlation?.findings]),
  ]);
}

function inferRootCauseDetails(report: AnyObj | null, job: AnyObj | null, confidence: unknown) {
  return compactDetails([
    firstText([report?.ai_investigation?.root_cause?.title, report?.ai_investigation?.root_cause?.description]),
    firstText([report?.recovery?.resolution_plan, report?.ai_investigation?.resolution_plan, job?.recommendations?.actions]),
    typeof confidence === "number" ? `${confidence}% confidence` : "",
  ]);
}

function compactDetails(items: unknown[]) {
  const lines = items
    .map((item) => String(item || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return lines.length ? Array.from(new Set(lines)).slice(0, 3) : ["No detail available."];
}

function firstSentence(values: unknown[]) {
  const text = firstText(values);
  if (!text) return "";
  return text.split(/[.!?]/)[0]?.trim() || text;
}

function firstText(values: unknown[]) {
  for (const value of values) {
    const text = Array.isArray(value) ? firstText(value) : String(value || "").replace(/\s+/g, " ").trim();
    if (text && text !== "-" && text !== "No dynamic data available.") {
      return text;
    }
  }
  return "";
}

function formatTimelineTime(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).format(date);
}

function formatOffsetTime(base: string, seconds: number) {
  if (!base || base === "—") return "";
  const date = new Date(base);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).format(new Date(date.getTime() + seconds * 1000));
}

function timelineColorFor(text: string) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("incident")) return "#EF4444";
  if (lower.includes("investigation") || lower.includes("root")) return "#16A34A";
  if (lower.includes("change") || lower.includes("sync")) return "#EAB308";
  return "#94A3B8";
}

function formatDurationText(value: unknown) {
  const text = String(value || "").trim();
  return text || "";
}

function normalizeConfidence(value: unknown) {
  if (value == null || value === "") return null;
  const num = typeof value === "string" ? Number.parseFloat(value) : Number(value);
  if (Number.isNaN(num)) return null;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizeReasoningSteps(value: unknown) {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return raw
    .map((item: AnyObj | string, index: number) => {
      if (typeof item === "string") {
        const text = compactReasoningText(item.trim());
        return {
          title: text || `Reasoning step ${index + 1}`,
          detail: "",
        };
      }

      const title = compactReasoningText(item.title || item.label || item.summary || `Reasoning step ${index + 1}`);
      const detail = compactReasoningText(item.detail || item.description || item.reason || item.explanation || "");
      return { title, detail };
    })
    .filter((item) => item.title && String(item.title).trim())
    .slice(0, 6);
}

function compactReasoningText(text: string) {
  return String(text)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function formatFailurePoint(data: AnyObj) {
  const applicationName = data.applicationName && data.applicationName !== "-" ? data.applicationName : "service";
  const candidates = [
    data.failurePoint,
    data.failureTitle,
    data.networkSummary,
    data.deploymentsSummary,
    data.kubernetesSummary,
    data.logsSummary,
    data.metricsSummary,
    data.cause,
    data.executiveRootCause,
  ];

  for (const candidate of candidates) {
    if (candidate == null) continue;
    const text = String(candidate).trim();
    if (!text || text === "-") continue;

    if (/completed/i.test(text)) continue;

    if (/httproute|route|gateway|ingress|selector|service|pod|deployment/i.test(text)) {
      return formatFailurePointFromText(text, applicationName);
    }
  }

  const serviceHints = [
    data.applicationName,
    data.heroApp,
    data.serviceName,
    data.executiveRootCause,
  ].filter((value) => value && String(value).trim() && String(value).trim() !== "-");

  if (serviceHints.length) {
    return `${serviceHints[0]} - failure location not explicitly identified`;
  }

  return "Failure location not explicitly identified";
}

function formatFailurePointFromText(text: string, applicationName: string) {
  const serviceMatch =
    text.match(/HTTPRoute\s+([^,\n]+)/i) ||
    text.match(/Service\/([^\s(]+)/i) ||
    text.match(/service\s+([A-Za-z0-9._-]+)/i) ||
    text.match(/deployment\s+([A-Za-z0-9._-]+)/i) ||
    text.match(/pod\s+([A-Za-z0-9._-]+)/i);

  if (serviceMatch?.[1]) {
    return `kube-system → ${serviceMatch[1].trim()} (${text})`;
  }

  if (applicationName && applicationName !== "service") {
    return `kube-system → ${applicationName} (${text})`;
  }

  return text;
}

function normalizePrimaryEvidence(value: unknown, data: AnyObj) {
  const items = Array.isArray(value) ? value : [];
  const normalized = items
    .map((item: AnyObj | string) => {
      if (typeof item === "string") {
        return item.trim();
      }
      return item.title || item.label || item.summary || item.description || item.reason || "";
    })
    .filter((item) => item && String(item).trim());

  if (normalized.length) {
    return normalized.slice(0, 5);
  }

  return [
    data.networkSummary && `Network: ${data.networkSummary}`,
    data.deploymentsSummary && `Deployment: ${data.deploymentsSummary}`,
    data.logsSummary && `Logs: ${data.logsSummary}`,
    data.metricsSummary && `Metrics: ${data.metricsSummary}`,
    data.kubernetesSummary && `Kubernetes: ${data.kubernetesSummary}`,
  ].filter(Boolean) as string[];
}

function normalizeAlternativeExclusions(value: unknown, data: AnyObj) {
  const items = Array.isArray(value) ? value : [];
  const normalized = items
    .map((item: AnyObj | string) => {
      if (typeof item === "string") {
        return { title: item.trim(), reason: "" };
      }
      return {
        title: item.title || item.name || item.label || "",
        reason: item.reason || item.detail || item.summary || item.description || "",
      };
    })
    .filter((item) => item.title || item.reason);

  if (normalized.length) {
    return normalized.slice(0, 4);
  }

  const fallback = [
    data.deploymentsSummary && {
      title: "Deployment failure",
      reason: data.deploymentsSummary,
    },
    data.metricsSummary && {
      title: "Metrics saturation",
      reason: data.metricsSummary,
    },
    data.logsSummary && {
      title: "Application logs",
      reason: data.logsSummary,
    },
    data.networkSummary && {
      title: "Ingress / routing",
      reason: data.networkSummary,
    },
  ].filter(Boolean) as Array<{ title: string; reason: string }>;

  return fallback.slice(0, 4);
}

function formatSeverity(value: unknown) {
  if (value == null || value === "") return "-";
  const text = String(value).trim();
  return text ? text.toUpperCase() : "-";
}

function formatRisk(value: unknown, confidence: number | null, severity: string) {
  if (value != null && String(value).trim()) {
    return String(value).trim();
  }

  if (confidence != null) {
    if (confidence >= 90 || severity === "Critical") return "High - mitigation should be handled immediately.";
    if (confidence >= 70 || severity === "High") return "Medium - mitigation is a single controlled change.";
    return "Low - monitor and verify after remediation.";
  }

  return "-";
}

function deriveSeverity(job: AnyObj | null, report: AnyObj | null, latestAi: AnyObj | null) {
  const candidates = [
    report?.executive_summary?.severity,
    report?.ai_investigation?.severity,
    latestAi?.ai_investigation?.severity,
    latestAi?.severity,
    job?.ai_result?.severity,
    job?.severity,
    job?.incident?.priority,
    job?.context?.priority,
  ];

  for (const candidate of candidates) {
    if (candidate == null || candidate === "") continue;
    const text = String(candidate).toLowerCase();
    if (text.includes("critical") || text === "1") return "Critical";
    if (text.includes("high") || text === "2") return "High";
    if (text.includes("medium") || text === "3") return "Medium";
    if (text.includes("low") || text === "4") return "Low";
    return formatSeverity(candidate);
  }

  return "-";
}

function deriveRisk(job: AnyObj | null, report: AnyObj | null, latestAi: AnyObj | null) {
  const candidates = [
    report?.executive_summary?.risk,
    report?.ai_investigation?.business_impact,
    latestAi?.ai_investigation?.business_impact,
    job?.ai_result?.business_impact,
    job?.impact?.business_impact,
  ];

  for (const candidate of candidates) {
    if (candidate == null) continue;
    const text = String(candidate).trim();
    if (text) return text;
  }

  return "-";
}

function FailureHero({ data }: { data: AnyObj }) {

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 2.25 },
        borderRadius: 4,
        background:
          "linear-gradient(135deg,#FEF2F2 0%,#FFF7ED 100%)",
        border: "1px solid #FECACA",
        mb: 1,
      }}
    >
      <Stack spacing={1.25}>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={2}
        >
          <Box>
            <Typography
              sx={{
                fontSize: { xs: 22, md: 26 },
                fontWeight: 800,
                color: "#991B1B",
                lineHeight: 1.05,
              }}
            >
              Investigation Terminated
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                color: "#7F1D1D",
                fontSize: { xs: 13, md: 14 },
                lineHeight: 1.45,
                maxWidth: 1000,
              }}
            >
              The investigation could not complete because the application
              could not be validated.
            </Typography>
          </Box>

          <Chip
            color="error"
            label="FAILED"
            size="small"
            sx={{ fontWeight: 700, height: 28 }}
          />
        </Stack>

        <Divider />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3,1fr)",
            },
            gap: 1.5,
          }}
        >
          <Paper
            variant="outlined"
            sx={{ p: 1.5, borderRadius: 3 }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Failure Stage
            </Typography>

            <Typography
              fontWeight={700}
              mt={0.5}
              fontSize={14}
            >
              Application Validation
            </Typography>
          </Paper>

          <Paper
            variant="outlined"
            sx={{ p: 1.5, borderRadius: 3 }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Application
            </Typography>

            <Typography
              fontWeight={700}
              mt={0.5}
              fontSize={14}
            >
              {data.heroApp || "Unknown"}
            </Typography>
          </Paper>

          <Paper
            variant="outlined"
            sx={{ p: 1.5, borderRadius: 3 }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Environment
            </Typography>

            <Typography
              fontWeight={700}
              mt={0.5}
              fontSize={14}
            >
              {data.heroEnvironment || "Unknown"}
            </Typography>
          </Paper>
        </Box>
        <Paper
          variant="outlined"
          sx={{
            mt: 1.5,
            p: 1.75,
            borderRadius: 3,
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 16,
              mb: 0.75,
            }}
          >
            Root Cause
          </Typography>

          <Typography
            sx={{
              color: "#64748B",
              lineHeight: 1.5,
              fontSize: 14,
              whiteSpace: "pre-wrap",
            }}
          >
            {data.failurePoint || "Application validation failed."}
          </Typography>
        </Paper>
      </Stack>
    </Paper>
  );

}

function FailureFindingsSection({ data }: { data: AnyObj }) {

  const stages = data.stages ?? [
    {
      name: "Incident Retrieved",
      status: "SUCCESS",
      reason: "Incident payload received successfully."
    },
    {
      name: "Incident Parsed",
      status: "SUCCESS",
      reason: "Incident fields extracted."
    },
    {
      name: "Application Identified",
      status: data.heroApp ? "SUCCESS" : "FAILED",
      reason: data.heroApp
        ? data.heroApp
        : "Application could not be identified."
    },
    {
      name: "Application Validation",
      status: "FAILED",
      reason: data.failurePoint || "Validation failed."
    },
    {
      name: "Namespace Discovery",
      status: "SKIPPED",
      reason: "Depends on application validation."
    },
    {
      name: "Loki",
      status: data.lokiLogs?.length ? "SUCCESS" : "SKIPPED",
      reason: data.lokiLogs?.length
        ? "Logs collected."
        : "Logs not collected."
    },
    {
      name: "Prometheus",
      status: "SKIPPED",
      reason: "Metrics were not queried."
    },
    {
      name: "Kubernetes",
      status: "SKIPPED",
      reason: "Resources not inspected."
    },
    {
      name: "ArgoCD",
      status: "SKIPPED",
      reason: "Deployment history unavailable."
    },
    {
      name: "AI Diagnosis",
      status: "SKIPPED",
      reason: "Investigation stopped before reasoning."
    }
  ];
  return (
    <Paper
      sx={{
        mt: 2,
        p: { xs: 2, md: 2.25 },
        borderRadius: 4,
      }}
    >
      <Typography
        sx={{
          fontSize: { xs: 20, md: 22 },
          fontWeight: 800,
        }}
      >
        Investigation Progress
      </Typography>

      <Typography
        sx={{
          mt: 0.75,
          color: "#64748B",
          fontSize: 13,
        }}
      >
        Investigation execution stopped before all diagnostics completed.
      </Typography>

      <Box sx={{ mt: 2 }}>

        {stages.map((stage, index) => {

          const color =
            stage.status === "SUCCESS"
              ? "#22C55E"
              : stage.status === "FAILED"
                ? "#EF4444"
                : "#94A3B8";

          const icon =
            stage.status === "SUCCESS"
              ? "✓"
              : stage.status === "FAILED"
                ? "✕"
                : "○";

          return (

            <Paper
              key={index}
              elevation={0}
              sx={{
                mb: 1,
                p: 1.5,
                borderRadius: 3,
                border: "1px solid #E5E7EB",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: color,
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                    }}
                  >
                    {icon}
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {stage.name}
                    </Typography>

                    <Typography
                      sx={{
                        color: "#64748B",
                        fontSize: 13,
                      }}
                    >
                      {stage.reason}
                    </Typography>
                  </Box>
                </Box>

                <Chip
                  label={stage.status}
                  color={
                    stage.status === "SUCCESS"
                      ? "success"
                      : stage.status === "FAILED"
                        ? "error"
                        : "default"
                  }
                />
              </Box>
            </Paper>

          );

        })}

      </Box>
    </Paper>
  );

}

function FailureRecoverySection({ data }: { data: AnyObj }) {

  const resources = [
    {
      name: "Namespace",
      status: "NOT AVAILABLE",
      reason: "Application validation failed.",
    },
    {
      name: "Prometheus",
      status: "NOT COLLECTED",
      reason: "Metrics investigation did not start.",
    },
    {
      name: "Kubernetes",
      status: "NOT COLLECTED",
      reason: "Cluster investigation did not start.",
    },
    {
      name: "ArgoCD",
      status: "NOT COLLECTED",
      reason: "Deployment investigation did not start.",
    },
    {
      name: "AI Diagnosis",
      status: "NOT EXECUTED",
      reason: "Investigation terminated before reasoning.",
    },
  ];

  return (
    <Paper
      sx={{
        mt: 2,
        p: { xs: 2, md: 2.25 },
        borderRadius: 4,
      }}
    >
      <Typography
        sx={{
          fontSize: { xs: 20, md: 22 },
          fontWeight: 800,
        }}
      >
        Missing Investigation Resources
      </Typography>

      <Typography
        sx={{
          mt: 0.75,
          color: "#64748B",
          fontSize: 13,
        }}
      >
        The following investigation resources were unavailable because the investigation stopped early.
      </Typography>

      <Box
        sx={{
          mt: 2,
          display: "flex",
          gap: 1.2,
          flexWrap: { xs: "wrap", md: "nowrap" },
          overflowX: { xs: "visible", md: "auto" },
          pb: 0.5,
        }}
      >
        {resources.map((resource) => (
          <Paper
            key={resource.name}
            elevation={0}
            sx={{
              p: 1.25,
              borderRadius: 3,
              border: "1px solid #E5E7EB",
              minWidth: { xs: "100%", md: 180 },
              flex: { xs: "1 1 100%", md: "1 1 0" },
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {resource.name}
            </Typography>

            <Chip
              label={resource.status}
              color="warning"
              size="small"
              sx={{ mt: 0.75, mb: 0.75, height: 20, fontSize: 10.5 }}
            />

            <Typography
              sx={{
                color: "#64748B",
                fontSize: 12,
                lineHeight: 1.35,
              }}
            >
              {resource.reason}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Paper>
  );

}

function FailureLokiLogsSection({ data }: { data: AnyObj }) {
  const logs = data.lokiLogs ?? [];

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid #E5E7EB",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: "#0F172A",
          color: "#fff",
        }}
      >
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 800,
          }}
        >
          Loki Logs
        </Typography>

        <Typography
          sx={{
            mt: 0.5,
            color: "rgba(255,255,255,.7)",
          }}
        >
          Logs collected before the investigation terminated.
        </Typography>
      </Box>

      {logs.length === 0 ? (
        <Box sx={{ p: 2.5 }}>
          <Typography
            sx={{
              fontWeight: 700,
              color: "#111827",
            }}
          >
            No logs collected
          </Typography>

          <Typography
            sx={{
              mt: 1,
              color: "#6B7280",
            }}
          >
            Loki was not queried or no log entries were returned before
            the investigation stopped.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            bgcolor: "#020617",
            color: "#E5E7EB",
            fontFamily: "monospace",
            p: 2,
            maxHeight: 360,
            overflow: "auto",
          }}
        >
          {logs.map((line: any, index: number) => (
            <Typography
              key={index}
              sx={{
                fontFamily: "inherit",
                fontSize: 13,
                whiteSpace: "pre-wrap",
                py: 0.35,
              }}
            >
              {typeof line === "string"
                ? line
                : line.message ??
                line.log ??
                JSON.stringify(line)}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  );
}

function FailureAgentLogSection({ data }: { data: AnyObj }) {
  const logs =
    data.agentLog && data.agentLog.length
      ? data.agentLog
      : [
        "Investigation started.",
        "Parsing ServiceNow incident payload.",
        "Application context identified.",
        "Connecting to observability platform.",
        "Querying Grafana metrics.",
        "Querying Loki logs.",
        "Collecting Kubernetes resources.",
        "Investigation terminated unexpectedly.",
      ];

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        borderRadius: 5,
        overflow: "hidden",
        border: "1px solid #1F2937",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#111827",
          color: "#fff",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 14,
              lineHeight: 1.1,
            }}
          >
            AI Agent Execution Log
          </Typography>

          <Typography
            sx={{
              mt: 0.35,
              color: "rgba(255,255,255,.65)",
              fontSize: 12,
              lineHeight: 1.35,
            }}
          >
            Complete execution timeline captured before the investigation
            stopped.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            size="small"
            sx={{
              color: "#fff",
              borderColor: "rgba(255,255,255,.25)",
              textTransform: "none",
              fontSize: 12,
              py: 0.4,
              px: 1.2,
            }}
          >
            Copy Logs
          </Button>

          <Button
            variant="contained"
            size="small"
            sx={{
              textTransform: "none",
              fontSize: 12,
              py: 0.4,
              px: 1.2,
            }}
          >
            Download
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          bgcolor: "#020617",
          p: 1.75,
          fontFamily: "monospace",
          maxHeight: 320,
          overflow: "auto",
        }}
      >
        {logs.map((line: string, index: number) => {
          const level =
            line.toLowerCase().includes("error") ||
              line.toLowerCase().includes("terminated")
              ? "ERROR"
              : line.toLowerCase().includes("warning")
                ? "WARNING"
                : line.toLowerCase().includes("success")
                  ? "SUCCESS"
                  : "INFO";

          const levelColor =
            level === "ERROR"
              ? "#EF4444"
              : level === "WARNING"
                ? "#F59E0B"
                : level === "SUCCESS"
                  ? "#10B981"
                  : "#3B82F6";

          return (
            <Box
              key={index}
              sx={{
                display: "grid",
                gridTemplateColumns: "76px 86px 1fr",
                gap: 1.5,
                alignItems: "center",
                py: 0.9,
                borderBottom:
                  index === logs.length - 1
                    ? "none"
                    : "1px solid rgba(255,255,255,.06)",
              }}
            >
              <Typography
                sx={{
                  color: "#94A3B8",
                  fontSize: 12,
                  fontFamily: "inherit",
                }}
              >
                12:0{Math.min(index + 1, 9)}:1{index}
              </Typography>

              <Chip
                size="small"
                label={level}
                sx={{
                  width: 84,
                  height: 24,
                  fontSize: 11,
                  bgcolor: levelColor,
                  color: "#fff",
                  fontWeight: 700,
                }}
              />

              <Typography
                sx={{
                  color: "#E5E7EB",
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {line}
              </Typography>
            </Box>
          );
        })}

        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: 2,
            bgcolor: "#0F172A",
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 3,
          }}
        >
          <Typography
            sx={{
              color: "#F8FAFC",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Execution Summary
          </Typography>

          <Box
            sx={{
              mt: 2,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(4,1fr)",
              },
              gap: 1.5,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                bgcolor: "#111827",
                borderRadius: 2,
              }}
            >
              <Typography
                sx={{
                  fontSize: 10.5,
                  color: "#94A3B8",
                  letterSpacing: ".08em",
                }}
              >
                TOTAL STEPS
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 24,
                }}
              >
                {logs.length}
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: "#111827",
                borderRadius: 2,
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  color: "#94A3B8",
                  letterSpacing: ".08em",
                }}
              >
                STATUS
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  color: "#EF4444",
                  fontWeight: 800,
                }}
              >
                Failed
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: "#111827",
                borderRadius: 2,
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  color: "#94A3B8",
                  letterSpacing: ".08em",
                }}
              >
                DURATION
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  color: "#fff",
                  fontWeight: 800,
                }}
              >
                12 sec
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: "#111827",
                borderRadius: 2,
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  color: "#94A3B8",
                  letterSpacing: ".08em",
                }}
              >
                ENGINE
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  color: "#10B981",
                  fontWeight: 800,
                }}
              >
                AI SRE Agent
              </Typography>
            </Paper>
          </Box>

          <Typography
            sx={{
              mt: 3,
              color: "#CBD5E1",
              lineHeight: 1.8,
            }}
          >
            The investigation stopped before completing all planned
            diagnostic stages. Review the execution log above to identify
            the failing step, resolve the underlying issue, and rerun the
            investigation for a complete AI-generated diagnosis.
          </Typography>
        </Paper>
      </Box>
    </Paper>
  );
}

function extractStrings(...sources: any[]) {
  const values: string[] = [];

  const push = (value: any) => {
    if (!value) return;

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) values.push(trimmed);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(push);
      return;
    }

    if (typeof value === "object") {
      const candidates = [
        value.title,
        value.summary,
        value.description,
        value.detail,
        value.reason,
        value.message,
        value.event,
        value.action,
        value.command,
      ];
      candidates.forEach(push);
    }
  };

  sources.forEach(push);
  return Array.from(new Set(values));
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}, ${date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })} IST`;
}

function formatEta(value?: string | null) {
  if (!value) return "-";

  const text = String(value).trim();
  if (!text) return "-";

  const timeMatch = text.match(/\b\d+(?:\.\d+)?\s*(?:ms|s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours)\b/i);
  if (timeMatch) {
    return timeMatch[0].replace(/\s+/g, " ");
  }

  const firstToken = text.split(/[,\.;]/)[0]?.trim();
  return firstToken || "-";
}

function TopologyTile({
  name,
  type,
  metric,
  score,
  status,
  tone,
}: {
  name: string;
  type: string;
  metric: string;
  score: string;
  status: string;
  tone?: "healthy" | "warning" | "problem";
}) {
  const accent =
    tone === "problem" ? "#F87171" : tone === "warning" ? "#EAB308" : "#22C55E";
  const surface =
    tone === "problem" ? "#FFF7F7" : tone === "warning" ? "#FFFCF2" : "#F7FBF7";
  return (
    <Paper sx={{ p: 1.15, borderRadius: 4, border: `1px solid ${accent}55`, bgcolor: surface, minHeight: 108, boxShadow: "0 10px 24px rgba(15,23,42,0.05)" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>{name}</Typography>
          <Typography sx={{ fontSize: 12, color: "#64748B", mt: 0.15 }}>{type}</Typography>
        </Box>
        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: accent, mt: 0.35 }} />
      </Box>
      <Typography sx={{ mt: 1.1, color: "#4B5563", fontSize: 12.5, lineHeight: 1.3 }}>
        {metric}
      </Typography>
      <Box sx={{ mt: 1.2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ color: "#64748B", fontSize: 11.5 }}>{score}</Typography>
        <Chip
          label={status}
          size="small"
          sx={{
            bgcolor: "#E5E7EB",
            color: "#334155",
            fontWeight: 500,
            height: 24,
            "& .MuiChip-label": { px: 1 },
          }}
        />
      </Box>
    </Paper>
  );
}

function DatabaseCard({
  name,
  type,
  metric,
  score,
  status,
  healthy,
}: {
  name: string;
  type: string;
  metric: string;
  score: string;
  status: string;
  healthy: boolean;
}) {
  const indicatorColor = healthy ? "#16a34a" : "#f97316";
  const statusBg = status === "Investigated" ? "#e5e7eb" : "#f1f5f9";

  return (
    <Paper
      sx={{
        p: 1.15,
        borderRadius: 4,
        border: `1px solid ${indicatorColor}55`,
        bgcolor: "#F7FBF7",
        boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
        display: "grid",
        minHeight: 108,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>
            {name}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#64748B", mt: 0.15 }}>
            {type}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: indicatorColor,
            mt: 0.35,
            flexShrink: 0,
          }}
        />
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mt: 1.1 }}>
        <Typography sx={{ color: "#475569", fontSize: 12.5, lineHeight: 1.3 }}>
          {metric && score ? `${metric} · ${score}` : metric || score || "-"}
        </Typography>

        <Box
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 999,
            bgcolor: statusBg,
            color: "#1e293b",
            fontSize: 11,
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          {status}
        </Box>
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
    <Paper sx={{ p: 1.5, borderRadius: 4, borderLeft: accent ? `4px solid ${accent === "red" ? "#EF4444" : accent}` : undefined }}>
      <Typography sx={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.08em", color: "#6B7280" }}>{title}</Typography>
      <Typography sx={{ mt: large ? 0.8 : 0.6, fontSize: large ? 13.5 : 11.8, lineHeight: 1.4, color: "#111827" }}>{children}</Typography>
    </Paper>
  );
}

function MiniInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 3,
        bgcolor: "#F8FAFC",
        border: "1px solid #E5E7EB",
        minHeight: 138,
      }}
    >
      <Typography sx={{ color: "#64748B", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em" }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.7, color: "#111827", fontSize: 13.5, lineHeight: 1.55, maxWidth: 540 }}>
        {value || "-"}
      </Typography>
    </Box>
  );
}

function MetricLine({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "severity" | "risk";
}) {
  const normalized = (value || "").toLowerCase();
  const isSeverity = tone === "severity";
  const pillBg =
    isSeverity && normalized.includes("critical")
      ? "#FEE2E2"
      : isSeverity && normalized.includes("high")
        ? "#FEF3C7"
        : isSeverity && normalized.includes("medium")
          ? "#E0F2FE"
          : "#F1F5F9";
  const pillFg =
    isSeverity && normalized.includes("critical")
      ? "#DC2626"
      : isSeverity && normalized.includes("high")
        ? "#B45309"
        : isSeverity && normalized.includes("medium")
          ? "#0369A1"
          : "#334155";

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center" }}>
      <Typography sx={{ color: "#6B7280", fontSize: 12.5 }}>{label}</Typography>
      <Box
        sx={{
          px: 1.2,
          py: 0.35,
          borderRadius: 999,
          bgcolor: pillBg,
          color: pillFg,
          fontWeight: 800,
          fontSize: 11.5,
          lineHeight: 1.2,
          textAlign: "right",
          maxWidth: "65%",
        }}
      >
        {value}
      </Box>
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
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "14px 1fr",
        gap: 1,
        alignItems: "start",
      }}
    >
      <Box
        sx={{
          mt: 0.95,
          width: 4,
          height: 4,
          borderRadius: "50%",
          bgcolor: "#94A3B8",
          justifySelf: "center",
        }}
      />
      <Typography
        sx={{
          fontSize: 13.5,
          lineHeight: 1.7,
          color: "#1F2937",
          letterSpacing: "-0.01em",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

function HeaderLabel({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#475569" }}>
      {icon}
      <Typography sx={{ ...panelHeadingSx, fontSize: 11 }}>{text}</Typography>
    </Box>
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
