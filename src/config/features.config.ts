export const FEATURE_FLAGS = {
  AI_COPILOT_ENABLED: true,
  AI_TASK_CONTEXT: true,
  AI_APPOINTMENT_CONTEXT: true,
  AI_CUSTOMER_INSIGHTS: true,
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;
