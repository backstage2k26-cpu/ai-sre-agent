import type { Investigation } from "../../types/investigation";

interface Props {
  investigation: Investigation;
}

export default function EvidenceScoreCard({ investigation }: Props) {

  const e = investigation.evidence;

  return (
    <div className="card">
      <h2>Evidence Score</h2>

      <p>Deployment : {e.deployment}%</p>

      <p>Logs : {e.logs}%</p>

      <p>Kubernetes : {e.kubernetes}%</p>

      <p>Metrics : {e.metrics}%</p>

      <p>Network : {e.network}%</p>

      <p>Knowledge : {e.knowledge}%</p>

      <div className="divider" />

      <h3>Overall : {e.overall}%</h3>
    </div>
  );
}