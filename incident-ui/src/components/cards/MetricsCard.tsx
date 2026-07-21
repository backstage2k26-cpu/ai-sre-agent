import { Activity } from "lucide-react";
import type { Investigation } from "../../types/investigation";
import GlassCard from "../ui/GlassCard";
import StatusBadge from "../ui/StatusBadge";

interface Props {
  investigation: Investigation;
}

export default function MetricsCard({
  investigation,
}: Props) {

  const metrics = investigation.metrics;

  return (
    <GlassCard>

      <h2 className="card-title">
        <Activity size={20}/>
        Metrics
      </h2>

      <StatusBadge
        text={metrics.assessment.severity}
        type={
          metrics.assessment.severity === "LOW"
            ? "success"
            : metrics.assessment.severity === "MEDIUM"
            ? "warning"
            : "danger"
        }
      />

      <div className="divider"/>

      <h3>Resource Health</h3>

      <ul style={{ lineHeight:1.8 }}>
        <li>CPU usage within threshold</li>
        <li>Memory usage stable</li>
        <li>No resource saturation</li>
        <li>No throttling detected</li>
      </ul>

      <div className="divider"/>

      <p>{metrics.assessment.summary}</p>

    </GlassCard>
  );
}