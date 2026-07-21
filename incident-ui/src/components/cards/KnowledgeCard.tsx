import { BookOpen } from "lucide-react";
import type { Investigation } from "../../types/investigation";
import GlassCard from "../ui/GlassCard";
import InfoRow from "../ui/InfoRow";
import StatusBadge from "../ui/StatusBadge";

interface Props {
  investigation: Investigation;
}

export default function KnowledgeCard({
  investigation,
}: Props) {

  if (!investigation.knowledge.found) {
    return null;
  }

  const match = investigation.knowledge.matches[0];

  return (

    <GlassCard>

      <h2 className="card-title">
        <BookOpen size={20} />
        Knowledge Base
      </h2>

      <InfoRow
        label="Runbook"
        value={match.title}
      />

      <div className="info-row">
        <span className="info-label">
          Status
        </span>

        <StatusBadge
          text={match.status}
          type="info"
        />
      </div>

      <InfoRow
        label="Similarity"
        value={`${Math.round(match.similarity * 100)}%`}
      />

      <div className="divider" />

      <p>{match.recommendation}</p>

    </GlassCard>

  );
}