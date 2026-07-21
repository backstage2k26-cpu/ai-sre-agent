import type { Investigation } from "../types/investigation";

export const investigation = {
  context: {
    incident_number: "INC000001",
    service_name: "Market Service",
    priority: "1",
    problem_type: "Deployment Failure",
  },

  deployment: {
    health_status: "Healthy",
    sync_status: "Synced",

    image_tag: "backstage2026/market:0.0.19",

    revision: "9011c5cab15b03bd3b75e33dcbb3be09735b764e",

    automated_sync: false,

    assessment: {
        summary: "Deployment is unlikely to be the cause of the incident.",
    },
  },

  logs: {
    error_count: 0,
    warning_count: 0,

    assessment: {
        summary: "No ERROR or WARN logs detected.",
    },
  },

  kubernetes: {
    assessment: {
      severity: "LOW",
    },
  },

  metrics: {
    assessment: {
      severity: "LOW",
    },
  },

  knowledge: {
    found: true,
    matches: [
      {
        title: "Market Service Runbook",
        status: "VERIFIED",
        similarity: 0.91,
      },
    ],
  },

  correlation: {
    probable_root_cause:
      "Application appears healthy. Verify Gateway and HTTPRoute.",
    confidence: "High",
  },
};