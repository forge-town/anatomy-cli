export const formatAgentError = (error: Error): string => JSON.stringify({
  contractVersion: 1, operation: "error",
  error: { code: error.name, message: error.message, ...("path" in error ? { path: error.path } : {}) },
}, null, 2);
