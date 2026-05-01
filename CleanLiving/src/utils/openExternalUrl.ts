import { Alert, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

/** Strip common LLM junk around URLs */
export function sanitizeHttpUrl(raw: string): string | null {
  let s = raw.trim().replace(/^[\s`'"[(<]+|[\s`'")\]>]+$/g, '');
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    return new URL(s).href;
  } catch {
    try {
      return new URL(s.replace(/\s+/g, '%20')).href;
    } catch {
      return null;
    }
  }
}

/**
 * Opens HTTPS links in an in-app browser when possible (more reliable in Expo Go),
 * falls back to the system handler, and always surfaces failures.
 */
export async function openExternalUrl(raw: string): Promise<void> {
  const url = sanitizeHttpUrl(raw);
  if (!url) {
    Alert.alert('Link problem', 'This scan did not include a valid web link.');
    return;
  }

  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  } catch (e1) {
    try {
      await Linking.openURL(url);
    } catch (e2) {
      const msg =
        e2 instanceof Error ? e2.message : e1 instanceof Error ? e1.message : 'Unknown error';
      Alert.alert("Couldn't open link", msg);
    }
  }
}
