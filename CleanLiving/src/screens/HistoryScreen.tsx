import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getHouseScoreAverage, listScansDescending, type ScanRow } from '../db/scansDb';
import { getEffectiveSwapUrl } from '../services/affiliateLinks';
import { openExternalUrl } from '../utils/openExternalUrl';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

function fmtTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString();
}

export function HistoryScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [houseScore, setHouseScore] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, avg] = await Promise.all([listScansDescending(), getHouseScoreAverage()]);
      setRows(list);
      setHouseScore(avg);
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
        <Text style={styles.title}>My Home</Text>
        <Pressable style={styles.headerBtn} onPress={() => navigation.navigate('Scan')}>
          <Text style={styles.headerBtnText}>Scan</Text>
        </Pressable>
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>House score</Text>
        <Text style={styles.scoreValue}>{houseScore ?? '—'}</Text>
        <Text style={styles.scoreHint}>Average purity across saved scans</Text>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Scans</Text>
        <Pressable onPress={() => void load()}>
          <Text style={styles.refresh}>Refresh</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {rows.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No scans yet</Text>
              <Text style={styles.emptyBody}>Scan a label to start building your home audit log.</Text>
              <Pressable style={styles.primary} onPress={() => navigation.navigate('Scan')}>
                <Text style={styles.primaryText}>Scan now</Text>
              </Pressable>
            </View>
          ) : (
            rows.map((row) => (
              <Pressable
                key={row.id}
                style={styles.row}
                onPress={() => navigation.navigate('Result', { scanId: row.id })}
              >
                <View style={styles.rowTop}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {row.productGuess}
                  </Text>
                  <Text style={styles.rowScore}>{row.purityScore}</Text>
                </View>
                <Text style={styles.rowTime}>{fmtTime(row.createdAt)}</Text>
                <View style={styles.swapRow}>
                  <Text style={styles.swapText} numberOfLines={1}>
                    Swap: {row.result.cleanSwap.title}
                  </Text>
                  <Pressable
                    style={styles.swapBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      void openExternalUrl(getEffectiveSwapUrl(row.result));
                    }}
                  >
                    <Text style={styles.swapBtnText}>Open link</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  headerBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  scoreCard: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scoreLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  scoreValue: {
    marginTop: 6,
    fontSize: 40,
    fontWeight: '900',
    color: '#0F172A',
  },
  scoreHint: {
    marginTop: 2,
    fontSize: 12,
    color: '#94A3B8',
  },
  listHeader: {
    marginTop: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  refresh: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
  },
  list: {
    padding: 20,
    gap: 10,
    paddingBottom: 30,
  },
  row: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowScore: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  rowTime: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
  },
  swapRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  swapText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  swapBtn: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  swapBtnText: {
    color: '#4338CA',
    fontSize: 13,
    fontWeight: '900',
  },
  empty: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyBody: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  primary: {
    marginTop: 6,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});

