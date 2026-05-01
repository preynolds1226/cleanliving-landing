import Constants from 'expo-constants';

/** Public privacy policy URL from `app.json` → `extra.privacyPolicyUrl` (for in-app links). */
export function getPrivacyPolicyUrl(): string | undefined {
  const v = Constants.expoConfig?.extra?.privacyPolicyUrl;
  return typeof v === 'string' && v.startsWith('http') ? v : undefined;
}
