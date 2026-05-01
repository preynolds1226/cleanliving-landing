import AsyncStorage from '@react-native-async-storage/async-storage';
import { listScansDescending } from '../db/scansDb';

const KEY = '@cleanliving_onboarding_done';

export async function hasCompletedOnboarding(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY);
  if (v === '1') return true;
  /** Upgrades: no flag yet but user already has data — don’t force intro again */
  const rows = await listScansDescending();
  if (rows.length > 0) {
    await AsyncStorage.setItem(KEY, '1');
    return true;
  }
  return false;
}

export async function setOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(KEY, '1');
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
