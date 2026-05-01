import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@cleanliving_onboarding_done';

export async function hasCompletedOnboarding(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY);
  return v === '1';
}

export async function setOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(KEY, '1');
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
