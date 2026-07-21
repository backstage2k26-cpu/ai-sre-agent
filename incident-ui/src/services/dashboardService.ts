const API = "http://localhost:8000";

export async function getDashboard() {
  const response = await fetch(`${API}/dashboard`);

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard");
  }

  return await response.json();
}