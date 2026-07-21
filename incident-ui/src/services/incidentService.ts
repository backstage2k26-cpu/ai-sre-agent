import type { Incident } from "../types/incident";

export async function getIncidents(): Promise<Incident[]> {
  const res = await fetch("http://localhost:8000/incidents");

  if (!res.ok) {
    throw new Error("Failed to fetch incidents");
  }
  // const data = await res.json();
  // console.log(data);

  return res.json();
}

export async function getIncidentDetails(number: string) {
  const res = await fetch(
    `http://localhost:8000/incidents/${number}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch incident details");
  }

  return res.json();
}

export async function restartInvestigation(
  incidentNumber: string,
) {
  const response = await fetch(
    `http://localhost:8000/investigations/${incidentNumber}/restart`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to restart investigation");
  }

  return response.json();
}