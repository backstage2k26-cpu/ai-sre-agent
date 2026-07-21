export const statusMap = {
  success: {
    label: "Healthy",
    color: "success" as const,
    borderColor: "#2e7d32",
  },

  error: {
    label: "Issue",
    color: "error" as const,
    borderColor: "#d32f2f",
  },

  warning: {
    label: "Warning",
    color: "warning" as const,
    borderColor: "#ed6c02",
  },

  unknown: {
    label: "Unknown",
    color: "default" as const,
    borderColor: "#9e9e9e",
  },
};