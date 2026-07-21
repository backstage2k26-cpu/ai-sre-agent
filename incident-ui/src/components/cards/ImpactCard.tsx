import type { Investigation } from "../../types/investigation";

interface Props {
  investigation: Investigation;
}

export default function ImpactCard({
  investigation,
}: Props) {

  const impact = investigation.impact;

  return (
    <div className="card">
      <h2>Impact Analysis</h2>

      <table
        style={{
          width: "100%",
          borderSpacing: 12,
        }}
      >
        <tbody>
          <tr>
            <td><b>Affected Service</b></td>
            <td>{impact.affected_service}</td>
          </tr>

          <tr>
            <td><b>User Impact</b></td>
            <td>{impact.user_impact}</td>
          </tr>

          <tr>
            <td><b>Availability</b></td>
            <td>{impact.availability}</td>
          </tr>

          <tr>
            <td><b>Affected Pods</b></td>
            <td>{impact.affected_pods}</td>
          </tr>

          <tr>
            <td><b>Blast Radius</b></td>
            <td>{impact.blast_radius}</td>
          </tr>

          <tr>
            <td><b>Business Impact</b></td>
            <td>{impact.business_impact}</td>
          </tr>
        </tbody>
      </table>

      <div className="divider" />

      <h3>Dependent Services</h3>

      <ul>
        {impact.dependent_services.map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
    </div>
  );
}