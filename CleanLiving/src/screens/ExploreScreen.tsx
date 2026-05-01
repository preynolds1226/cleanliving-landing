import { useCallback, useMemo, useState, memo } from 'react';
import {
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ExplorePick } from '../data/explorePicks';
import { EXPLORE_PICKS } from '../data/explorePicks';
import { PrivacyPolicyFooter } from '../components/PrivacyPolicyFooter';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import {
  getExploreSavedPickIds,
  removeExplorePick,
  saveExplorePick,
} from '../db/scansDb';
import { getAffiliateSwapForCategory } from '../services/affiliateLinks';
import { openExternalUrl } from '../utils/openExternalUrl';
import { useAppColors, type AppColors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Explore'>;

type FilterTab = 'all' | 'saved';

const ExploreListHeader = memo(function ExploreListHeader({
  query,
  onQuery,
  tab,
  onTab,
  savedCount,
  colors,
}: {
  query: string;
  onQuery: (q: string) => void;
  tab: FilterTab;
  onTab: (t: FilterTab) => void;
  savedCount: number;
  colors: AppColors;
}) {
  return (
    <View style={styles.headerBlock}>
      <Text style={[styles.lede, { color: colors.textSecondary }]}>
        100 curated directions for a cleaner routine. Tap ☆ to save for later. Shopping links may be{' '}
        <Text style={{ fontWeight: '800', color: colors.text }}>affiliate links</Text>.
      </Text>

      <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          value={query}
          onChangeText={onQuery}
          placeholder="Search ideas…"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[
            styles.tab,
            tab === 'all' && { backgroundColor: colors.inverseBg },
            { borderColor: colors.border },
          ]}
          onPress={() => onTab('all')}
        >
          <Text
            style={[styles.tabText, { color: tab === 'all' ? colors.inverseText : colors.text }]}
          >
            All ({EXPLORE_PICKS.length})
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            tab === 'saved' && { backgroundColor: colors.inverseBg },
            { borderColor: colors.border },
          ]}
          onPress={() => onTab('saved')}
        >
          <Text
            style={[
              styles.tabText,
              { color: tab === 'saved' ? colors.inverseText : colors.text },
            ]}
          >
            Saved ({savedCount})
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

export function ExploreScreen({ navigation }: Props) {
  const colors = useAppColors();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const [savedOrder, setSavedOrder] = useState<string[]>([]);

  const reloadSaved = useCallback(async () => {
    const ids = await getExploreSavedPickIds();
    setSavedOrder(ids);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reloadSaved();
    }, [reloadSaved])
  );

  const savedSet = useMemo(() => new Set(savedOrder), [savedOrder]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = EXPLORE_PICKS;
    if (tab === 'saved') {
      const rank = new Map(savedOrder.map((id, i) => [id, i]));
      list = EXPLORE_PICKS.filter((p) => savedSet.has(p.id)).sort(
        (a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999)
      );
    }
    if (!q) return list;
    return list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q)
    );
  }, [query, tab, savedSet, savedOrder]);

  const toggleSave = useCallback(
    async (pickId: string) => {
      if (savedSet.has(pickId)) {
        await removeExplorePick(pickId);
      } else {
        await saveExplorePick(pickId);
      }
      await reloadSaved();
    },
    [reloadSaved, savedSet]
  );

  const renderItem: ListRenderItem<ExplorePick> = useCallback(
    ({ item: pick }) => {
      const swap = getAffiliateSwapForCategory(pick.category);
      const saved = savedSet.has(pick.id);
      return (
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.cardTopRow}>
            <View style={styles.cardTextBlock}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{pick.title}</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{pick.subtitle}</Text>
            </View>
            <Pressable
              onPress={() => void toggleSave(pick.id)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={saved ? 'Remove from saved' : 'Save for later'}
              style={styles.saveBtn}
            >
              <Text style={styles.saveIcon}>{saved ? '★' : '☆'}</Text>
            </Pressable>
          </View>
          {swap.dealNote ? (
            <Text style={[styles.deal, { color: colors.textMuted }]}>{swap.dealNote}</Text>
          ) : null}
          <View style={styles.cardFooter}>
            <Text style={[styles.partner, { color: colors.textMuted }]}>
              {swap.partner === 'impact' ? 'Partner (Impact)' : 'Amazon search'}
            </Text>
            <Pressable
              style={[styles.cta, { backgroundColor: colors.inverseBg }]}
              onPress={() => void openExternalUrl(swap.affiliateUrl)}
            >
              <Text style={[styles.ctaText, { color: colors.inverseText }]}>Browse</Text>
            </Pressable>
          </View>
        </View>
      );
    },
    [colors, savedSet, toggleSave]
  );

  const listFooter = useMemo(
    () => (
      <View style={styles.footerBlock}>
        <View style={[styles.disclosure, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <Text style={[styles.disclosureText, { color: colors.textSecondary }]}>
            Editorial suggestions only — verify ingredients and sellers. Links use your Amazon Associates tag
            and optional Impact URLs from env.
          </Text>
        </View>
        <PrivacyPolicyFooter />
      </View>
    ),
    [colors]
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScreenHeader title="Explore" navigation={navigation} colors={colors} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <ExploreListHeader
            query={query}
            onQuery={setQuery}
            tab={tab}
            onTab={setTab}
            savedCount={savedOrder.length}
            colors={colors}
          />
        }
        ListFooterComponent={listFooter}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        windowSize={7}
        extraData={{ savedOrder, tab, query }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            {tab === 'saved'
              ? 'Nothing saved yet — tap ☆ on any idea to keep it here.'
              : 'No matches — try a different search.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
  headerBlock: { paddingTop: 4, paddingBottom: 16, gap: 12 },
  lede: { fontSize: 15, lineHeight: 22 },
  searchWrap: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  searchInput: { paddingVertical: 12, fontSize: 16 },
  tabRow: { flexDirection: 'row', gap: 10 },
  tab: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabText: { fontSize: 14, fontWeight: '800' },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  cardTopRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardTextBlock: { flex: 1, gap: 6 },
  saveBtn: { paddingTop: 2 },
  saveIcon: { fontSize: 26, color: '#EAB308' },
  cardTitle: { fontSize: 17, fontWeight: '900' },
  cardSub: { fontSize: 14, lineHeight: 20 },
  deal: { fontSize: 12, lineHeight: 16, fontStyle: 'italic' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 12,
  },
  partner: { fontSize: 12, fontWeight: '700', flex: 1 },
  cta: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  ctaText: { fontSize: 14, fontWeight: '900' },
  footerBlock: { paddingTop: 8, gap: 8 },
  disclosure: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  disclosureText: { fontSize: 12, lineHeight: 17 },
  empty: { textAlign: 'center', paddingVertical: 28, fontSize: 15 },
});
