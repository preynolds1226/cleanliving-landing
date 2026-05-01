import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ScanResult } from '../types';
import { ScanResultPanel } from '../components/ScanResultPanel';
import { getScanById } from '../db/scansDb';
import { PrivacyPolicyFooter } from '../components/PrivacyPolicyFooter';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

function parseResultJson(param: unknown): ScanResult | null {
  if (typeof param !== 'string') return null;
  try {
    return JSON.parse(param) as ScanResult;
  } catch {
    return null;
  }
}

export function ResultScreen({ navigation, route }: Props) {
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

  const onScanAgain = useCallback(() => {
    navigation.navigate('Scan');
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading result…</Text>
        <PrivacyPolicyFooter />
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Result not found.</Text>
        <Pressable style={styles.link} onPress={() => navigation.navigate('History')}>
          <Text style={styles.linkText}>Go to History</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={onScanAgain}>
          <Text style={styles.linkText}>Scan again</Text>
        </Pressable>
        <PrivacyPolicyFooter />
      </View>
    );
  }

  return <ScanResultPanel result={result} onScanAgain={onScanAgain} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
  },
  link: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
});

