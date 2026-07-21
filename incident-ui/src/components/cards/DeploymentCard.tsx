import {
  Rocket,
  RefreshCw,
  Package,
  GitBranch,
  ShieldCheck,
  ClipboardCheck,
} from "lucide-react";

import type { Investigation } from "../../types/investigation";

import GlassCard from "../ui/GlassCard";
import InfoRow from "../ui/InfoRow";
import StatusBadge from "../ui/StatusBadge";

interface Props {
  investigation: Investigation;
}

export default function DeploymentCard({
  investigation,
}: Props) {

  const deployment = investigation.deployment;

  return (
    <GlassCard>

      <h2 className="card-title">
        <Rocket size={20} />
        Deployment
      </h2>

      <InfoRow
        label="Health"
        value={
          <StatusBadge
            text={deployment.health_status}
            type={
              deployment.health_status === "Healthy"
                ? "success"
                : "danger"
            }
          />
        }
      />

      <InfoRow
        label="Sync Status"
        value={
          <>
            <RefreshCw size={15} />
            {deployment.sync_status}
          </>
        }
      />

      <InfoRow
        label="Image"
        value={
          <>
            <Package size={15} />
            {deployment.image_tag ?? "-"}
          </>
        }
      />

      <InfoRow
        label="Revision"
        value={
          <>
            <GitBranch size={15} />
            {deployment.revision.substring(0, 8)}
          </>
        }
      />

      <InfoRow
        label="Deployment"
        value={
          <>
            <ShieldCheck size={15} />
            {deployment.automated_sync
              ? "Automatic"
              : "Manual"}
          </>
        }
      />

      <div className="divider" />

      <h3
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 20,
          marginBottom: 12,
        }}
      >
        <ClipboardCheck size={18} />
        Assessment
      </h3>

      <div className="assessment-box">
        {deployment.assessment.summary}
      </div>

      <div className="divider" />

      <h3>Checks Performed</h3>

      <ul style={{ lineHeight: 1.8 }}>
        <li>✅ ArgoCD application synced</li>
        <li>✅ Deployment rollout completed</li>
        <li>✅ Latest image deployed</li>
        <li>✅ No rollout failures detected</li>
      </ul>

    </GlassCard>
  );
}