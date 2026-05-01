import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EXPLORE_PICKS } from '../data/explorePicks';
import { PrivacyPolicyFooter } from '../components/PrivacyPolicyFooter';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import { getAffiliateSwapForCategory } from '../services/affiliateLinks';
import { openExternalUrl } from '../utils/openExternalUrl';
import { useAppColors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Explore'>;

export function ExploreScreen({ navigation }: Props) {
  const colors = useAppColors();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScreenHeader title="Explore" navigation={navigation} colors={colors} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.lede, { color: colors.textSecondary }]}>
          Curated directions for a cleaner routine. Tap a card to open shopping links — some may be{' '}
          <Text style={{ fontWeight: '800', color: colors.text }}>affiliate links</Text> (we may earn
          a commission at no extra cost to you).
        </Text>

        {EXPLORE_PICKS.map((pick) => {
          const swap = getAffiliateSwapForCategory(pick.category);
          return (
            <View
              key={pick.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>{pick.title}</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{pick.subtitle}</Text>
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
                  <Text style={[styles.ctaText, { color: colors.inverseText }]}>Browse picks</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        <View style={[styles.disclosure, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <Text style={[styles.disclosureText, { color: colors.textSecondary }]}>
            Editorial suggestions only — always read labels and seller info before you buy. Links use
            your configured Amazon Associates tag and optional Impact URLs when set in app env.
          </Text>
        </View>

        <PrivacyPolicyFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 36, gap: 14 },
  lede: { fontSize: 15, lineHeight: 22, marginBottom: 4 },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: '900' },
  cardSub: { fontSize: 14, lineHeight: 20 },
  deal: { fontSize: 12, lineHeight: 16, fontStyle: 'italic', marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
  partner: { fontSize: 12, fontWeight: '700', flex: 1 },
  cta: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  ctaText: { fontSize: 14, fontWeight: '900' },
  disclosure: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  disclosureText: { fontSize: 12, lineHeight: 17 },
});
