import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrivacyPolicyFooter } from '../components/PrivacyPolicyFooter';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import {
  getActivityStats,
  getHouseScoreAverage,
  listScansDescending,
  type ScanRow,
} from '../db/scansDb';
import { getEffectiveSwapUrl } from '../services/affiliateLinks';
import { openExternalUrl } from '../utils/openExternalUrl';
import { useAppColors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function fmtTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString();
}

export function HomeScreen({ navigation }: Props) {
  const colors = useAppColors();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [houseScore, setHouseScore] = useState<number | null>(null);
  const [recent, setRecent] = useState<ScanRow[]>([]);
  const [stats, setStats] = useState({ totalScans: 0, weekCount: 0, streakDays: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [avg, rows, activity] = await Promise.all([
        getHouseScoreAverage(),
        listScansDescending(),
        getActivityStats(),
      ]);
      setHouseScore(avg);
      setRecent(rows.slice(0, 5));
      setStats(activity);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [avg, rows, activity] = await Promise.all([
        getHouseScoreAverage(),
        listScansDescending(),
        getActivityStats(),
      ]);
      setHouseScore(avg);
      setRecent(rows.slice(0, 5));
      setStats(activity);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScreenHeader
        title="Home"
        navigation={navigation}
        colors={colors}
        right={
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Text style={[styles.gear, { color: colors.accent }]}>⚙</Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statCell}>
            <Text style={[styles.statVal, { color: colors.text }]}>{stats.weekCount}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>This week</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statVal, { color: colors.text }]}>{stats.streakDays}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Day streak</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statVal, { color: colors.text }]}>{stats.totalScans}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Total</Text>
          </View>
        </View>

        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.scoreBlock}>
            <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>House score</Text>
            {loading ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={[styles.scoreValue, { color: colors.text }]}>{houseScore ?? '—'}</Text>
            )}
            <Text style={[styles.scoreHint, { color: colors.textMuted }]}>
              Average purity across saved scans
            </Text>
          </View>

          <Pressable
            style={[styles.primary, { backgroundColor: colors.inverseBg }]}
            onPress={() => navigation.navigate('Scan')}
          >
            <Text style={[styles.primaryText, { color: colors.inverseText }]}>Scan a product</Text>
          </Pressable>

          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.surface2 }]}
              onPress={() => navigation.navigate('History')}
            >
              <Text style={[styles.actionText, { color: colors.text }]}>View History</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.surface2 }]}
              onPress={() => void load()}
            >
              <Text style={[styles.actionText, { color: colors.text }]}>Refresh</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.exploreBtn, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}
            onPress={() => navigation.navigate('Explore')}
          >
            <Text style={[styles.exploreBtnText, { color: colors.accent }]}>
              Explore clean picks — affiliate ideas
            </Text>
            <Text style={[styles.exploreBtnSub, { color: colors.textMuted }]}>
              Scroll curated swaps without scanning
            </Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent</Text>
          <Pressable onPress={() => navigation.navigate('History')}>
            <Text style={[styles.sectionLink, { color: colors.accent }]}>See all</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading scans…</Text>
          </View>
        ) : recent.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No scans yet</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              Scan your first product to start tracking progress and get one-tap swaps.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {recent.map((row) => (
              <View
                key={row.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Pressable onPress={() => navigation.navigate('Result', { scanId: row.id })}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                      {row.productGuess}
                    </Text>
                    <Text style={[styles.cardScore, { color: colors.text }]}>{row.purityScore}</Text>
                  </View>
                  <Text style={[styles.cardTime, { color: colors.textMuted }]}>{fmtTime(row.createdAt)}</Text>
                </Pressable>

                <View style={styles.cardBottom}>
                  <Text style={[styles.swapTitle, { color: colors.textSecondary }]} numberOfLines={1}>
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
            ))}
          </View>
        )}

        <PrivacyPolicyFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  gear: { fontSize: 22, fontWeight: '700' },
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  statCell: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 20, fontWeight: '900' },
  statLbl: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  hero: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  scoreBlock: { gap: 6 },
  scoreLabel: { fontSize: 13, fontWeight: '800' },
  scoreValue: { fontSize: 44, fontWeight: '900' },
  scoreHint: { fontSize: 12 },
  primary: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { fontSize: 16, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionText: { fontSize: 14, fontWeight: '800' },
  exploreBtn: {
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 4,
  },
  exploreBtnText: { fontSize: 15, fontWeight: '900', textAlign: 'center' },
  exploreBtnSub: { fontSize: 12, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '900' },
  sectionLink: { fontSize: 14, fontWeight: '800' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  loadingText: { fontSize: 14 },
  empty: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900' },
  emptyBody: { fontSize: 14, lineHeight: 20 },
  list: { gap: 10 },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '800' },
  cardScore: { fontSize: 18, fontWeight: '900' },
  cardTime: { marginTop: 6, fontSize: 12 },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  swapTitle: { flex: 1, fontSize: 13, fontWeight: '700' },
  swapBtn: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  swapBtnText: { fontSize: 13, fontWeight: '900' },
});
