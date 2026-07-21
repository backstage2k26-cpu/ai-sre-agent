import {
  Target,
  CheckCircle2,
  XCircle,
  Brain,
  Server,
  Globe,
} from "lucide-react";

import GlassCard from "../ui/GlassCard";
import type { Investigation } from "../../types/investigation";

interface Props {
  investigation: Investigation;
}

export default function RootCauseCard({
  investigation,
}: Props) {

  const deploymentHealthy =
    investigation.deployment.assessment.severity === "LOW";

  const logsHealthy =
    investigation.logs.error_count === 0;

  const kubernetesHealthy =
    investigation.kubernetes.assessment.severity === "LOW";

  const metricsHealthy =
    investigation.metrics.assessment.severity === "LOW";

  const networkHealthy =
    investigation.network.gateway_ok &&
    investigation.network.route_ok &&
    investigation.network.endpoint_ok;

  const Status = ({ ok }: { ok: boolean }) =>
    ok ? (
      <CheckCircle2 size={18} color="#22c55e" />
    ) : (
      <XCircle size={18} color="#ef4444" />
    );

  return (
    <GlassCard>

      <h2 className="card-title">
        <Target size={20} />
        Root Cause Analysis
      </h2>

      <div className="card-section">

        <h3 className="section-title">
          <Server size={17} />
          Application Layer
        </h3>

        <div className="info-row">
          <span className="info-label">Deployment</span>
          <Status ok={deploymentHealthy} />
        </div>

        <div className="info-row">
          <span className="info-label">Logs</span>
          <Status ok={logsHealthy} />
        </div>

        <div className="info-row">
          <span className="info-label">Kubernetes</span>
          <Status ok={kubernetesHealthy} />
        </div>

        <div className="info-row">
          <span className="info-label">Metrics</span>
          <Status ok={metricsHealthy} />
        </div>

      </div>

      <div className="divider" />

      <div className="card-section">

        <h3 className="section-title">
          <Globe size={17} />
          Network Layer
        </h3>

        <div className="info-row">
          <span className="info-label">
            Gateway / Routes / Endpoints
          </span>

          <Status ok={networkHealthy} />
        </div>

      </div>

      <div className="divider" />

      <div className="card-section">

        <h3 className="section-title">
          <Brain size={17} />
          AI Conclusion
        </h3>

        <div
          style={{
            marginTop: 14,
            padding: 18,
            borderRadius: 16,
            background: "rgba(124,92,255,.08)",
            border: "1px solid rgba(124,92,255,.15)",
            color: "#E5E7EB",
            lineHeight: 1.7,
          }}
        >
          {investigation.correlation.probable_root_cause}
        </div>

      </div>

    </GlassCard>
  );
}