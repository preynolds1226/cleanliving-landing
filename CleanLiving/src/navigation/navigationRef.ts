import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetToOnboarding(): void {
  rootNavigationRef.dispatch(
    CommonActions.reset({ index: 0, routes: [{ name: 'Onboarding' }] })
  );
}
