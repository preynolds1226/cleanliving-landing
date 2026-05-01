import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();

/** Call once at app startup. No-op when DSN is unset (local dev). */
export function initSentry(): void {
  if (!dsn) return;

  Sentry.init({
    dsn,
    enableAutoSessionTracking: true,
    debug: __DEV__,
  });
}

export { Sentry };
