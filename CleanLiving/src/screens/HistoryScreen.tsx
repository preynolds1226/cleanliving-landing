import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrivacyPolicyFooter } from '../components/PrivacyPolicyFooter';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import {
  deleteScan,
  getHouseScoreAverage,
  listScansDescending,
  setScanFavorite,
  type ScanRow,
} from '../db/scansDb';
import { getEffectiveSwapUrl } from '../services/affiliateLinks';
import { openExternalUrl } from '../utils/openExternalUrl';
import { useAppColors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

function fmtTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString();
}

export function HistoryScreen({ navigation }: Props) {
  const colors = useAppColors();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [houseScore, setHouseScore] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [list, avg] = await Promise.all([listScansDescending(), getHouseScoreAverage()]);
      setRows(list);
      setHouseScore(avg);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let r = rows;
    if (favoritesOnly) r = r.filter((x) => x.isFavorite);
    const q = search.trim().toLowerCase();
    if (q) r = r.filter((x) => x.productGuess.toLowerCase().includes(q));
    return r;
  }, [rows, search, favoritesOnly]);

  const confirmDelete = useCallback(
    (id: string) => {
      Alert.alert('Delete scan?', 'Remove this scan from your device.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await deleteScan(id);
              setSelectedIds((s) => s.filter((x) => x !== id));
              await load();
            })();
          },
        },
      ]);
    },
    [load]
  );

  const toggleCompareSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[0], id];
      return [...prev, id];
    });
  }, []);

  const exitCompare = useCallback(() => {
    setCompareMode(false);
    setSelectedIds([]);
  }, []);

  const toggleFavorite = useCallback(
    async (row: ScanRow) => {
      await setScanFavorite(row.id, !row.isFavorite);
      await load();
    },
    [load]
  );

  const headerRight = (
    <View style={styles.headerRight}>
      {compareMode ? (
        <Pressable onPress={exitCompare} hitSlop={8}>
          <Text style={[styles.headerLink, { color: colors.accent }]}>Cancel</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => {
            setCompareMode(true);
            setSelectedIds([]);
          }}
          hitSlop={8}
        >
          <Text style={[styles.headerLink, { color: colors.accent }]}>Compare</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScreenHeader title="My Home" navigation={navigation} colors={colors} right={headerRight} />

      <View style={[styles.scoreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>House score</Text>
        <Text style={[styles.scoreValue, { color: colors.text }]}>{houseScore ?? '—'}</Text>
        <Text style={[styles.scoreHint, { color: colors.textMuted }]}>
          Average purity across saved scans
        </Text>
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search products…"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <Pressable
        style={[styles.favToggle, { backgroundColor: favoritesOnly ? colors.accentSoft : colors.surface2 }]}
        onPress={() => setFavoritesOnly((v) => !v)}
      >
        <Text style={[styles.favToggleText, { color: colors.text }]}>
          {favoritesOnly ? '★ Favorites only' : '☆ Show all'}
        </Text>
      </Pressable>

      {compareMode ? (
        <Text style={[styles.compareHint, { color: colors.textSecondary }]}>
          Tap two scans to compare ({selectedIds.length}/2)
        </Text>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <Text style={{ color: colors.textMuted }}>Loading…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
          }
        >
          {filtered.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No scans match</Text>
              <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
                {rows.length === 0
                  ? 'Scan a label to start building your home audit log.'
                  : 'Try another search or filter.'}
              </Text>
              {rows.length === 0 ? (
                <Pressable
                  style={[styles.primary, { backgroundColor: colors.inverseBg }]}
                  onPress={() => navigation.navigate('Scan')}
                >
                  <Text style={[styles.primaryText, { color: colors.inverseText }]}>Scan now</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            filtered.map((row) => {
              const selected = selectedIds.includes(row.id);
              return (
                <Swipeable
                  key={row.id}
                  renderRightActions={() => (
                    <View style={styles.swipeActions}>
                      <Pressable
                        style={[styles.swipeDelete, { backgroundColor: colors.danger }]}
                        onPress={() => confirmDelete(row.id)}
                      >
                        <Text style={styles.swipeDeleteText}>Delete</Text>
                      </Pressable>
                    </View>
                  )}
                >
                  <View
                    style={[
                      styles.row,
                      {
                        backgroundColor: colors.surface,
                        borderColor: selected ? colors.accent : colors.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                  >
                    <View style={styles.rowHead}>
                      <Pressable
                        style={styles.rowMain}
                        onPress={() => {
                          if (compareMode) {
                            toggleCompareSelect(row.id);
                          } else {
                            navigation.navigate('Result', { scanId: row.id });
                          }
                        }}
                      >
                        <View style={styles.rowTop}>
                          <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                            {row.productGuess}
                          </Text>
                          <Text style={[styles.rowScore, { color: colors.text }]}>{row.purityScore}</Text>
                        </View>
                        <Text style={[styles.rowTime, { color: colors.textMuted }]}>{fmtTime(row.createdAt)}</Text>
                      </Pressable>
                      <Pressable
                        style={styles.starBtn}
                        onPress={() => void toggleFavorite(row)}
                        hitSlop={10}
                      >
                        <Text style={styles.star}>{row.isFavorite ? '★' : '☆'}</Text>
                      </Pressable>
                    </View>
                    <View style={styles.swapRow}>
                      <Text style={[styles.swapText, { color: colors.textSecondary }]} numberOfLines={1}>
                        Swap: {row.result.cleanSwap.title}
                      </Text>
                      <Pressable
                        style={[styles.swapBtn, { backgroundColor: colors.accentSoft }]}
                        onPress={() => void openExternalUrl(getEffectiveSwapUrl(row.result))}
                      >
                        <Text style={[styles.swapBtnText, { color: colors.accent }]}>Open link</Text>
                      </Pressable>
                    </View>
                  </View>
                </Swipeable>
              );
            })
          )}
          <PrivacyPolicyFooter />
        </ScrollView>
      )}

      {compareMode && selectedIds.length === 2 ? (
        <Pressable
          style={[styles.compareBar, { backgroundColor: colors.inverseBg }]}
          onPress={() =>
            navigation.navigate('Compare', { scanIdA: selectedIds[0], scanIdB: selectedIds[1] })
          }
        >
          <Text style={[styles.compareBarText, { color: colors.inverseText }]}>Compare selected</Text>
        </Pressable>
      ) : null}

      {!compareMode ? (
        <View style={styles.fabRow}>
          <Pressable
            style={[styles.fabScan, { backgroundColor: colors.inverseBg }]}
            onPress={() => navigation.navigate('Scan')}
          >
            <Text style={[styles.fabScanText, { color: colors.inverseText }]}>Scan</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRight: { minWidth: 72, alignItems: 'flex-end' },
  headerLink: { fontSize: 15, fontWeight: '800' },
  scoreCard: {
    marginHorizontal: 20,
    marginTop: 4,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  scoreLabel: { fontSize: 13, fontWeight: '700' },
  scoreValue: { marginTop: 6, fontSize: 40, fontWeight: '900' },
  scoreHint: { marginTop: 2, fontSize: 12 },
  searchRow: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: { paddingVertical: 12, fontSize: 16 },
  favToggle: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  favToggleText: { fontSize: 14, fontWeight: '800' },
  compareHint: { marginHorizontal: 20, marginTop: 8, fontSize: 13 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, gap: 10, paddingBottom: 120 },
  swipeActions: { justifyContent: 'center' },
  swipeDelete: { justifyContent: 'center', paddingHorizontal: 20, borderRadius: 14, marginLeft: 8 },
  swipeDeleteText: { color: '#fff', fontWeight: '800' },
  row: { borderRadius: 14, padding: 14 },
  rowHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  rowMain: { flex: 1 },
  starBtn: { paddingTop: 2 },
  star: { fontSize: 22, color: '#EAB308' },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  rowScore: { fontSize: 18, fontWeight: '900' },
  rowTime: { marginTop: 6, fontSize: 12 },
  swapRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  swapText: { flex: 1, fontSize: 13, fontWeight: '700' },
  swapBtn: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  swapBtnText: { fontSize: 13, fontWeight: '900' },
  empty: { borderRadius: 16, padding: 18, borderWidth: 1, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyBody: { fontSize: 14, lineHeight: 20 },
  primary: { marginTop: 6, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  primaryText: { fontSize: 16, fontWeight: '800' },
  compareBar: {
    position: 'absolute',
    bottom: 28,
    left: 20,
    right: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  compareBarText: { fontSize: 16, fontWeight: '900' },
  fabRow: {
    position: 'absolute',
    bottom: 28,
    right: 20,
  },
  fabScan: { paddingVertical: 14, paddingHorizontal: 22, borderRadius: 14 },
  fabScanText: { fontSize: 16, fontWeight: '900' },
});
