const API = "http://localhost:8000";

export async function getRecentIncidents() {
  const response = await fetch(`${API}/dashboard/recent`);

  if (!response.ok) {
    throw new Error("Failed to fetch recent incidents");
  }

  return await response.json();
}