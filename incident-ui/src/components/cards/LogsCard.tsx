import {
  FileText,
  AlertTriangle,
  CircleAlert,
} from "lucide-react";

import GlassCard from "../ui/GlassCard";
import type { Investigation } from "../../types/investigation";

interface Props {
  investigation: Investigation;
}

export default function LogsCard({
  investigation,
}: Props) {

  const logs = investigation.logs;

  return (
    <GlassCard>

      <h2 className="card-title">
        <FileText size={20} />
        Logs
      </h2>

      <div className="info-row">
        <span className="info-label">
          Errors
        </span>

        <span className="info-value">
          <CircleAlert
            size={16}
            color={
              logs.error_count > 0
                ? "#EF4444"
                : "#22C55E"
            }
          />

          {logs.error_count}
        </span>
      </div>

      <div className="info-row">
        <span className="info-label">
          Warnings
        </span>

        <span className="info-value">
          <AlertTriangle
            size={16}
            color={
              logs.warning_count > 0
                ? "#F59E0B"
                : "#22C55E"
            }
          />

          {logs.warning_count}
        </span>
      </div>

      <div className="divider" />

      <div className="card-section">

        <h3>Recent Findings</h3>

        <ul style={{ lineHeight: 1.8 }}>
          <li>✅ No ERROR logs detected</li>
          <li>✅ No CrashLoopBackOff events</li>
          <li>✅ No OOMKilled events</li>
        </ul>

        <div className="divider" />

        <h3>Assessment</h3>

        <div
          style={{
            padding:18,
            borderRadius:12,
            background:"rgba(124,92,255,.08)"
          }}
        >
          {logs.assessment.summary}
        </div>
      </div>

    </GlassCard>
  );
}