export const formatAgentError = (error: Error, compact = false): string => JSON.stringify({
  operation: "error",
  error: { code: error.name, message: error.message, ...("path" in error ? { path: error.path } : {}) },
}, null, compact ? undefined : 2);
