import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CommonActions } from '@react-navigation/native';
import type { ScanResult } from '../types';
import { ScanResultPanel } from '../components/ScanResultPanel';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrivacyPolicyFooter } from '../components/PrivacyPolicyFooter';
import { getScanById } from '../db/scansDb';
import type { ResultScreenProps } from '../navigation/types';
import { useAppColors } from '../theme/colors';

type Props = ResultScreenProps;

function parseResultJson(param: unknown): ScanResult | null {
  if (typeof param !== 'string') return null;
  try {
    return JSON.parse(param) as ScanResult;
  } catch {
    return null;
  }
}

export function ResultScreen({ navigation, route }: Props) {
  const colors = useAppColors();
  const hapticDone = useRef(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ScanResult | null>(null);
  const scanId = useMemo(() => {
    const p = route.params as { scanId?: string; resultJson?: string };
    return p?.scanId ?? null;
  }, [route.params]);
  const resultJson = useMemo(() => {
    const p = route.params as { scanId?: string; resultJson?: string };
    return p?.resultJson ?? null;
  }, [route.params]);

  useEffect(() => {
    let alive = true;
    hapticDone.current = false;
    (async () => {
      setLoading(true);
      try {
        if (scanId) {
          const row = await getScanById(scanId);
          if (alive) setResult(row?.result ?? null);
        } else {
          const parsed = parseResultJson(resultJson);
          if (alive) setResult(parsed);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [scanId, resultJson]);

  useEffect(() => {
    if (!loading && result && !hapticDone.current) {
      hapticDone.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [loading, result]);

  const onScanAgain = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Tabs',
            state: { routes: [{ name: 'Scan' }], index: 0 },
          },
        ],
      })
    );
  }, [navigation]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ScreenHeader title="Result" navigation={navigation} colors={colors} />
        <View style={styles.centerBody}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading result…</Text>
          <PrivacyPolicyFooter />
        </View>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ScreenHeader title="Result" navigation={navigation} colors={colors} />
        <View style={styles.centerBody}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            We couldn’t load this result. It may have been deleted from My Home.
          </Text>
          <Pressable
            style={styles.link}
            onPress={() => navigation.navigate('Tabs', { screen: 'History' })}
          >
            <Text style={[styles.linkText, { color: colors.accent }]}>Go to History</Text>
          </Pressable>
          <Pressable style={styles.link} onPress={onScanAgain}>
            <Text style={[styles.linkText, { color: colors.accent }]}>Scan again</Text>
          </Pressable>
          <PrivacyPolicyFooter />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
      <ScreenHeader title="Result" navigation={navigation} colors={colors} />
      <ScanResultPanel result={result} onScanAgain={onScanAgain} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  centered: { flex: 1 },
  centerBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  link: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
