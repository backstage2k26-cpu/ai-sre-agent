const API = "http://localhost:8000";

export async function getRecentIncidents(limit = 20) {
  const response = await fetch(`${API}/dashboard/recent?limit=${limit}`);

  if (!response.ok) {
    throw new Error("Failed to fetch recent incidents");
  }

  return await response.json();
}
