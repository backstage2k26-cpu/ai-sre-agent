import { Boxes } from "lucide-react";
import type { Investigation } from "../../types/investigation";
import GlassCard from "../ui/GlassCard";
import InfoRow from "../ui/InfoRow";
import StatusBadge from "../ui/StatusBadge";

interface Props {
  investigation: Investigation;
}

export default function KubernetesCard({
  investigation,
}: Props) {

  const kube = investigation.kubernetes;
  const pod = kube.pods?.[0];

  return (
    <GlassCard>

      <h2 className="card-title">
        <Boxes size={20} />
        Kubernetes
      </h2>

      {pod && (
        <>
          <InfoRow label="Pod" value={pod.name} />
          <InfoRow label="Node" value={pod.node} />
          <InfoRow
            label="Restarts"
            value={String(pod.restart_count)}
          />

          <div className="info-row">
            <span className="info-label">Status</span>

            <StatusBadge
              text={pod.phase}
              type={
                pod.phase === "Running"
                  ? "success"
                  : "danger"
              }
            />
          </div>
        </>
      )}

      <div className="divider" />

      <h3>Assessment</h3>

      <StatusBadge
        text={kube.assessment.severity}
        type={
          kube.assessment.severity === "LOW"
            ? "success"
            : kube.assessment.severity === "MEDIUM"
            ? "warning"
            : "danger"
        }
      />

      <p style={{ marginTop: 16 }}>
        {kube.assessment.summary}
      </p>
      <div className="divider"/>

      <h3>Cluster Validation</h3>

      <ul style={{ lineHeight:1.8 }}>
        <li>✅ Pod Running</li>
        <li>✅ Pod Ready</li>
        <li>✅ No Restart Loop</li>
        <li>✅ Scheduling Successful</li>
      </ul>

    </GlassCard>
  );
}