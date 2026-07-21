import type { Investigation } from "../../types/investigation";

interface Props {
  investigation: Investigation;
}

function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
          fontWeight: 600,
        }}
      >
        <span>{label}</span>
        <span>{value}%</span>
      </div>

      <div
        style={{
          width: "100%",
          height: 10,
          background: "#e5e7eb",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background:
              value >= 90
                ? "#22c55e"
                : value >= 70
                ? "#f59e0b"
                : "#ef4444",
            borderRadius: 8,
          }}
        />
      </div>
    </div>
  );
}

export default function EvidenceScoreCard({
  investigation,
}: Props) {
  const e = investigation.evidence;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <h2
        style={{
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        Evidence Score
      </h2>

      <ScoreBar label="Deployment" value={e.deployment} />
      <ScoreBar label="Logs" value={e.logs} />
      <ScoreBar label="Kubernetes" value={e.kubernetes} />
      <ScoreBar label="Metrics" value={e.metrics} />
      <ScoreBar label="Network" value={e.network} />
      <ScoreBar label="Knowledge" value={e.knowledge} />

      <hr style={{ margin: "24px 0" }} />

      <div
        style={{
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: "#6b7280",
          }}
        >
          Overall Confidence
        </div>

        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            color:
              e.overall >= 90
                ? "#16a34a"
                : e.overall >= 70
                ? "#f59e0b"
                : "#dc2626",
          }}
        >
          {e.overall}%
        </div>
      </div>
    </div>
  );
}