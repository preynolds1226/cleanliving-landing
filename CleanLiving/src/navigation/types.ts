export type RootStackParamList = {
  Home: undefined;
  Scan: undefined;
  Result: { scanId: string } | { resultJson: string };
  History: undefined;
};

