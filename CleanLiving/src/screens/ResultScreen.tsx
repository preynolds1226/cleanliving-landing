import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { CommonActions } from '@react-navigation/native';
import type { ScanResult } from '../types';
import { ScanResultPanel } from '../components/ScanResultPanel';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrivacyPolicyFooter } from '../components/PrivacyPolicyFooter';
import { getScanById, listScansDescending, type ScanRow } from '../db/scansDb';
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
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareCandidates, setCompareCandidates] = useState<ScanRow[]>([]);
  const [compareListLoading, setCompareListLoading] = useState(false);

  const scanId = useMemo(() => {
    const p = route.params as { scanId?: string; resultJson?: string };
    return p?.scanId ?? null;
  }, [route.params]);
  const resultJson = useMemo(() => {
    const p = route.params as { scanId?: string; resultJson?: string };
    return p?.resultJson ?? null;
  }, [route.params]);

  const openComparePicker = useCallback(() => {
    if (!scanId) return;
    setCompareOpen(true);
    setCompareListLoading(true);
    void (async () => {
      try {
        const rows = await listScansDescending();
        setCompareCandidates(rows.filter((r) => r.id !== scanId));
      } finally {
        setCompareListLoading(false);
      }
    })();
  }, [scanId]);

  const onPickCompare = useCallback(
    (otherId: string) => {
      if (!scanId) return;
      setCompareOpen(false);
      navigation.navigate('Compare', { scanIdA: scanId, scanIdB: otherId });
    },
    [navigation, scanId]
  );

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

  const showCompare = Boolean(scanId && result);

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
      <ScanResultPanel
        result={result}
        onScanAgain={onScanAgain}
        onCompare={showCompare ? openComparePicker : undefined}
      />

      <Modal
        visible={compareOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCompareOpen(false)}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Compare with</Text>
            <Pressable onPress={() => setCompareOpen(false)} hitSlop={12} accessibilityLabel="Close">
              <Text style={[styles.modalClose, { color: colors.accent }]}>Cancel</Text>
            </Pressable>
          </View>
          {compareListLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : compareCandidates.length === 0 ? (
            <View style={styles.modalEmpty}>
              <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                Save another scan in My Home first — you need at least two scans to compare.
              </Text>
            </View>
          ) : (
            <FlatList
              data={compareCandidates}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.compareRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => onPickCompare(item.id)}
                >
                  <Text style={[styles.compareRowTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.productGuess}
                  </Text>
                  <Text style={[styles.compareRowMeta, { color: colors.textMuted }]}>
                    Score {item.purityScore} · tap to compare
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>
      </Modal>
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
  modalRoot: { flex: 1, paddingTop: 8 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalClose: { fontSize: 16, fontWeight: '800' },
  modalLoading: { padding: 40, alignItems: 'center' },
  modalEmpty: { padding: 24 },
  modalEmptyText: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  modalList: { padding: 16, gap: 10 },
  compareRow: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  compareRowTitle: { fontSize: 16, fontWeight: '800' },
  compareRowMeta: { fontSize: 13, marginTop: 6, fontWeight: '600' },
});
