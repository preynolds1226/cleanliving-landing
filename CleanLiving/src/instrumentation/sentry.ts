/**
 * Sentry stub — @sentry/react-native is not installed.
 * Re-add the package and configure EXPO_PUBLIC_SENTRY_DSN to enable crash reporting.
 */

export function initSentry(): void {
  // no-op until Sentry is configured
}

export const Sentry = {
  captureException: (_error: unknown, _hint?: unknown): void => {
    // no-op
  },
};
