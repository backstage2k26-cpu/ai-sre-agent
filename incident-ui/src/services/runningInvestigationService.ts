const API = "http://localhost:8000";

export async function getRunningInvestigations() {
  const response = await fetch(`${API}/dashboard/running`);

  if (!response.ok) {
    throw new Error("Failed to fetch running investigations");
  }

  return response.json();
}