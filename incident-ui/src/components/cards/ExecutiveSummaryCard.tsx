import { Sparkles, CheckCircle2, User } from "lucide-react";
import type { Investigation } from "../../types/investigation";
import GlassCard from "../ui/GlassCard";

interface Props {
  investigation: Investigation;
}

export default function ExecutiveSummaryCard({
  investigation,
}: Props) {
  const e = investigation.executive;

  return (
    <GlassCard>
      <h2 className="card-title">
        <Sparkles size={20} />
        AI Executive Summary
      </h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {e.summary.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <CheckCircle2
              size={18}
              color="#22c55e"
              style={{ marginTop: 2, flexShrink: 0 }}
            />

            <span
              style={{
                color: "#D1D5DB",
                lineHeight: 1.7,
              }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>

      <div className="divider" />

      <div className="info-row">
        <span className="info-label">
          Likely Cause
        </span>

        <span className="info-value">
          {e.likely_cause}
        </span>
      </div>

      <div className="info-row">
        <span className="info-label">
          Recommended Owner
        </span>

        <span
          className="info-value"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <User size={16} />
          {e.recommended_owner}
        </span>
      </div>
    </GlassCard>
  );
}