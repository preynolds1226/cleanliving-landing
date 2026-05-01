import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/** Bottom tabs (primary surfaces) */
export type TabParamList = {
  Home: undefined;
  Scan: undefined;
  Explore: undefined;
  History: undefined;
};

/** Stack above tabs: modal-style flows */
export type AppStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Result: { scanId: string } | { resultJson: string };
  Compare: { scanIdA: string; scanIdB: string };
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  AppStack: undefined;
};

export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<AppStackParamList>
>;
export type ScanScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Scan'>,
  NativeStackScreenProps<AppStackParamList>
>;
export type ExploreScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Explore'>,
  NativeStackScreenProps<AppStackParamList>
>;
export type HistoryScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'History'>,
  NativeStackScreenProps<AppStackParamList>
>;

export type ResultScreenProps = NativeStackScreenProps<AppStackParamList, 'Result'>;
export type CompareScreenProps = NativeStackScreenProps<AppStackParamList, 'Compare'>;
export type SettingsScreenProps = NativeStackScreenProps<AppStackParamList, 'Settings'>;
export type OnboardingScreenProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;
