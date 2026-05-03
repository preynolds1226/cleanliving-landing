import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { initSentry } from './src/instrumentation/sentry';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { CompareScreen } from './src/screens/CompareScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { MainTabs } from './src/navigation/MainTabs';
import type { AppStackParamList, RootStackParamList } from './src/navigation/types';
import { hasCompletedOnboarding } from './src/utils/onboardingStorage';
import { rootNavigationRef } from './src/navigation/navigationRef';

initSentry();

const RootStack = createNativeStackNavigator<RootStackParamList>();
const InnerStack = createNativeStackNavigator<AppStackParamList>();

function AppStack() {
  return (
    <InnerStack.Navigator screenOptions={{ headerShown: false }}>
      <InnerStack.Screen name="Tabs" component={MainTabs} />
      <InnerStack.Screen name="Result" component={ResultScreen} />
      <InnerStack.Screen name="Compare" component={CompareScreen} />
      <InnerStack.Screen name="Settings" component={SettingsScreen} />
    </InnerStack.Navigator>
  );
}

function AppContent() {
  const [bootReady, setBootReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    void (async () => {
      const done = await hasCompletedOnboarding();
      setInitialRoute(done ? 'AppStack' : 'Onboarding');
      setBootReady(true);
    })();
  }, []);

  if (!bootReady || !initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <NavigationContainer ref={rootNavigationRef}>
          <RootStack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
            <RootStack.Screen name="AppStack" component={AppStack} />
          </RootStack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  const [boundaryKey, setBoundaryKey] = useState(0);
  return (
    <AppErrorBoundary key={boundaryKey} onHardReset={() => setBoundaryKey((k) => k + 1)}>
      <AppContent />
    </AppErrorBoundary>
  );
}
