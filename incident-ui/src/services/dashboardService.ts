const API = "http://localhost:8000";

export async function getDashboard() {
  const response = await fetch(`${API}/dashboard`);

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard");
  }

  return await response.json();
}

export interface IncidentTrend {
    day: string;
    created: number;
    resolved: number;
}

export async function getIncidentTrend(): Promise<IncidentTrend[]> {

    const response = await fetch(`${API}/dashboard/incident-trend`);

    if (!response.ok) {
        throw new Error("Failed to fetch incident trend");
    }

    return await response.json();
}