import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@cleanliving/pending_scan_b64';

export type PendingScanPayload = { base64: string; savedAt: number };

export async function savePendingScanBase64(base64: string): Promise<void> {
  const payload: PendingScanPayload = { base64, savedAt: Date.now() };
  await AsyncStorage.setItem(KEY, JSON.stringify(payload));
}

export async function getPendingScanBase64(): Promise<PendingScanPayload | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as PendingScanPayload;
    if (typeof p.base64 === 'string' && typeof p.savedAt === 'number') return p;
    return null;
  } catch {
    return null;
  }
}

export async function clearPendingScanBase64(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
