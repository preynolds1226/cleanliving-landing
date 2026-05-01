import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrivacyPolicyFooter } from '../components/PrivacyPolicyFooter';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getHouseScoreAverage, listScansDescending, type ScanRow } from '../db/scansDb';
import { getEffectiveSwapUrl } from '../services/affiliateLinks';
import { openExternalUrl } from '../utils/openExternalUrl';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function fmtTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString();
}

export function HomeScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [houseScore, setHouseScore] = useState<number | null>(null);
  const [recent, setRecent] = useState<ScanRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [avg, rows] = await Promise.all([getHouseScoreAverage(), listScansDescending()]);
      setHouseScore(avg);
      setRecent(rows.slice(0, 5));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.brand}>CleanLiving</Text>
        <Text style={styles.title}>Home</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreLabel}>House score</Text>
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.scoreValue}>{houseScore ?? '—'}</Text>
            )}
            <Text style={styles.scoreHint}>Average purity across saved scans</Text>
          </View>

          <Pressable style={styles.primary} onPress={() => navigation.navigate('Scan')}>
            <Text style={styles.primaryText}>Scan a product</Text>
          </Pressable>

          <View style={styles.actions}>
            <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('History')}>
              <Text style={styles.actionText}>View History</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => void load()}>
              <Text style={styles.actionText}>Refresh</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <Pressable onPress={() => navigation.navigate('History')}>
            <Text style={styles.sectionLink}>See all</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Loading scans…</Text>
          </View>
        ) : recent.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No scans yet</Text>
            <Text style={styles.emptyBody}>
              Scan your first product to start tracking progress and get one-tap swaps.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {recent.map((row) => (
              <View key={row.id} style={styles.card}>
                <Pressable onPress={() => navigation.navigate('Result', { scanId: row.id })}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {row.productGuess}
                    </Text>
                    <Text style={styles.cardScore}>{row.purityScore}</Text>
                  </View>
                  <Text style={styles.cardTime}>{fmtTime(row.createdAt)}</Text>
                </Pressable>

                <View style={styles.cardBottom}>
                  <Text style={styles.swapTitle} numberOfLines={1}>
                    Swap: {row.result.cleanSwap.title}
                  </Text>
                  <Pressable
                    style={styles.swapBtn}
                    onPress={() => void openExternalUrl(getEffectiveSwapUrl(row.result))}
                  >
                    <Text style={styles.swapBtnText}>Open link</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        <PrivacyPolicyFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingTop: 18, paddingHorizontal: 20, paddingBottom: 8 },
  brand: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#64748B',
  },
  title: { marginTop: 6, fontSize: 30, fontWeight: '900', color: '#0F172A' },
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },
  hero: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  scoreBlock: { gap: 6 },
  scoreLabel: { fontSize: 13, color: '#64748B', fontWeight: '800' },
  scoreValue: { fontSize: 44, fontWeight: '900', color: '#0F172A' },
  scoreHint: { fontSize: 12, color: '#94A3B8' },
  primary: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionText: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  sectionLink: { fontSize: 14, fontWeight: '800', color: '#3B82F6' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  loadingText: { color: '#64748B', fontSize: 14 },
  empty: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  emptyBody: { fontSize: 14, color: '#475569', lineHeight: 20 },
  list: { gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#0F172A' },
  cardScore: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  cardTime: { marginTop: 6, fontSize: 12, color: '#64748B' },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  swapTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: '#475569' },
  swapBtn: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  swapBtnText: { color: '#4338CA', fontSize: 13, fontWeight: '900' },
});

