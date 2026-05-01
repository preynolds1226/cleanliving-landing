export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Scan: undefined;
  Result: { scanId: string } | { resultJson: string };
  History: undefined;
  Compare: { scanIdA: string; scanIdB: string };
  Settings: undefined;
};
