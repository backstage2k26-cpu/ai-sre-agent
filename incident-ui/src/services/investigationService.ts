const API = "http://localhost:8000";

export async function getLatestCompletedInvestigation() {
  const response = await fetch(`${API}/investigations`);

  if (!response.ok) {
    throw new Error("Failed to fetch investigations");
  }

  const jobs = await response.json();
  console.log("API Response:", jobs);
  console.log("Is Array:", Array.isArray(jobs));

  if (!jobs.length) {
    return null;
  }

  // Pick the latest completed investigation
  const completed = jobs
    .filter((j: any) => j.status === "COMPLETED" && j.result)
    .pop();

  if (!completed) {
    return null;
  }

  return completed.result;
}

export async function getLatestJob() {
  const response = await fetch(`${API}/investigations`);

  if (!response.ok) {
    throw new Error("Failed to fetch investigations");
  }

  const jobs = await response.json();

  if (!jobs.length) {
    return null;
  }

  return jobs.sort(
    (a: any, b: any) =>
      new Date(b.started_at).getTime() -
      new Date(a.started_at).getTime()
  )[0];
}

export async function startInvestigation(
  incidentNumber: string
) {
  const response = await fetch(`${API}/investigations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      incident_number: incidentNumber,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to start investigation");
  }

  return response.json();
}

export async function getInvestigation(investigationId: string) {
  const response = await fetch(
    `${API}/investigations/${investigationId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch investigation");
  }

  return response.json();
}