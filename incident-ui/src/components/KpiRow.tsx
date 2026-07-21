import type { Investigation } from "../types/investigation";
import KpiCard from "./ui/KpiCard";

interface Props {
  investigation: Investigation;
}

export default function KpiRow({
  investigation,
}: Props) {

  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        marginBottom: 30,
        flexWrap: "wrap",
      }}
    >
      <KpiCard
        title="Incident"
        value={investigation.context.incident_number}
      />

      <KpiCard
        title="Investigation Result"
        value={investigation.investigation_result.status}
        color="#22C55E"
      />

      <KpiCard
        title="Confidence"
        value={`${investigation.investigation_result.confidence}%`}
        color="#8B5CF6"
      />

      <KpiCard
        title="Duration"
        value={investigation.investigation_result.investigation_time}
        color="#F59E0B"
      />
    </div>
  );
}