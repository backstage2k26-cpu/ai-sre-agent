import { GitMerge } from "lucide-react";
import type { Investigation } from "../../types/investigation";
import GlassCard from "../ui/GlassCard";
import InfoRow from "../ui/InfoRow";

interface Props {
  investigation: Investigation;
}

export default function CorrelationCard({
  investigation,
}: Props) {

  const c = investigation.correlation;

  return (

    <GlassCard>

      <h2 className="card-title">
        <GitMerge size={20}/>
        Correlation
      </h2>

      <InfoRow
        label="Confidence"
        value={`${c.confidence}%`}
      />

      <div className="divider"/>

      <h3>Likely Root Cause</h3>

      <p>{c.probable_root_cause}</p>

      <div className="divider"/>

      <h3>Evidence</h3>

      <ul>
        {c.findings.map((f,i)=>(
          <li key={i}>{f}</li>
        ))}
      </ul>

    </GlassCard>

  );
}