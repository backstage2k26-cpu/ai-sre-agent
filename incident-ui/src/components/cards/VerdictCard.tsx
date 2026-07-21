import { Brain } from "lucide-react";
import type { Investigation } from "../../types/investigation";
import GlassCard from "../ui/GlassCard";
import StatusBadge from "../ui/StatusBadge";

interface Props {
  investigation: Investigation;
}

export default function VerdictCard({
  investigation,
}: Props) {
  const v = investigation.investigation_result;

  return (
    <GlassCard>
      <h2 className="card-title">
        <Brain size={20} />
        AI Verdict
      </h2>

      <div className="info-row">
        <span className="info-label">Status</span>

        <StatusBadge
          text={v.status}
          type="success"
        />
      </div>

      <div className="info-row">
        <span className="info-label">Confidence</span>

        <span className="info-value">
          {v.confidence}%
        </span>
      </div>

      <div className="info-row">
        <span className="info-label">Root Cause</span>

        <span className="info-value">
          {v.root_cause}
        </span>
      </div>

      <div className="info-row">
        <span className="info-label">
          Recommended Owner
        </span>

        <span className="info-value">
          {v.owner}
        </span>
      </div>

      <div className="info-row">
        <span className="info-label">
          Investigation Time
        </span>

        <span className="info-value">
          {v.investigation_time}
        </span>
      </div>
    </GlassCard>
  );
}