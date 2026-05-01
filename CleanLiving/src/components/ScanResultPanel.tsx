import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, useColorScheme, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { HormoneInfo, IngredientItem, ScanResult } from '../types';
import { PrivacyPolicyFooter } from './PrivacyPolicyFooter';
import { getEffectiveSwapUrl } from '../services/affiliateLinks';
import { openExternalUrl } from '../utils/openExternalUrl';
import { buildIngredientsCopyText, buildScanShareText } from '../utils/scanShare';
import { useAppColors } from '../theme/colors';
import type { AppColors } from '../theme/colors';

function riskBg(risk: IngredientItem['risk'], dark: boolean): string {
  if (risk === 'avoid') return dark ? 'rgba(127,29,29,0.45)' : '#FEE2E2';
  if (risk === 'caution') return dark ? 'rgba(113,63,18,0.45)' : '#FEF9C3';
  return dark ? 'rgba(20,83,45,0.35)' : '#ECFDF5';
}

function riskBorder(risk: IngredientItem['risk']): string {
  if (risk === 'avoid') return '#EF4444';
  if (risk === 'caution') return '#EAB308';
  return '#22C55E';
}

function countByRisk(ingredients: IngredientItem[], risk: IngredientItem['risk']): number {
  return ingredients.filter((i) => i.risk === risk).length;
}

function PurityGauge({ score, c }: { score: number; c: AppColors }) {
  const clamped = Math.max(1, Math.min(100, score));
  const hue = (clamped / 100) * 120;
  const barColor = `hsl(${hue}, 70%, 42%)`;
  return (
    <View style={[styles.gaugeCard, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Text style={[styles.gaugeLabel, { color: c.textMuted }]}>Purity score</Text>
      <View style={[styles.gaugeTrack, { backgroundColor: c.surface2 }]}>
        <View style={[styles.gaugeFill, { width: `${clamped}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.gaugeValue, { color: c.text }]}>{clamped}</Text>
      <Text style={[styles.gaugeHint, { color: c.textMuted }]}>
        1 = highest concern · 100 = cleanest
      </Text>
    </View>
  );
}

export function ScanResultPanel({
  result,
  onScanAgain,
}: {
  result: ScanResult;
  onScanAgain: () => void;
}) {
  const c = useAppColors();
  const dark = useColorScheme() === 'dark';
  const [hormoneDetail, setHormoneDetail] = useState<HormoneInfo | null>(null);
  const [scoreDetailOpen, setScoreDetailOpen] = useState(false);

  const riskCounts = useMemo(
    () => ({
      avoid: countByRisk(result.ingredients, 'avoid'),
      caution: countByRisk(result.ingredients, 'caution'),
      ok: countByRisk(result.ingredients, 'ok'),
    }),
    [result.ingredients]
  );

  const onCopyIngredients = async () => {
    await Clipboard.setStringAsync(buildIngredientsCopyText(result));
  };

  const onShare = async () => {
    await Share.share({ message: buildScanShareText(result), title: result.productGuess });
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: c.text }]}>{result.productGuess}</Text>

        <View style={styles.shareRow}>
          <Pressable
            style={[styles.shareBtn, { backgroundColor: c.surface2, borderColor: c.border }]}
            onPress={() => void onCopyIngredients()}
            accessibilityRole="button"
            accessibilityLabel="Copy ingredients list"
          >
            <Text style={[styles.shareBtnText, { color: c.text }]}>Copy ingredients</Text>
          </Pressable>
          <Pressable
            style={[styles.shareBtn, { backgroundColor: c.surface2, borderColor: c.border }]}
            onPress={() => void onShare()}
            accessibilityRole="button"
            accessibilityLabel="Share scan summary"
          >
            <Text style={[styles.shareBtnText, { color: c.text }]}>Share summary</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setScoreDetailOpen((v) => !v)}
          style={[styles.scoreBreakdown, { backgroundColor: c.surface2, borderColor: c.border }]}
          accessibilityRole="button"
          accessibilityLabel="Why this score"
          accessibilityHint="Shows how ingredient flags relate to the purity score"
        >
          <Text style={[styles.scoreBreakdownTitle, { color: c.text }]}>Why this score?</Text>
          <Text style={[styles.scoreBreakdownLine, { color: c.textSecondary }]}>
            Avoid {riskCounts.avoid} · Caution {riskCounts.caution} · OK {riskCounts.ok}
            <Text style={{ color: c.textMuted }}> {scoreDetailOpen ? '▼' : '▶'}</Text>
          </Text>
          {scoreDetailOpen ? (
            <Text style={[styles.scoreBreakdownExplain, { color: c.textSecondary }]}>
              More “avoid” and “caution” ingredients usually lower the 1–100 purity score. The list below
              shows each ingredient and flag — always verify on the product label.
            </Text>
          ) : null}
        </Pressable>

        <PurityGauge score={result.purityScore} c={c} />

        {result.microplasticWarning ? (
          <View style={[styles.microCard, { backgroundColor: c.accentSoft, borderColor: c.border }]}>
            <Text style={[styles.microTitle, { color: c.accent }]}>Microplastic exposure</Text>
            <Text style={[styles.microBody, { color: c.textSecondary }]}>{result.microplasticWarning}</Text>
          </View>
        ) : null}

        <Text style={[styles.sectionTitle, { color: c.text }]}>Ingredients</Text>
        <View style={styles.ingredientList}>
          {result.ingredients.map((ing, index) => (
            <View
              key={`${ing.name}-${index}`}
              style={[
                styles.ingredientRow,
                {
                  backgroundColor: riskBg(ing.risk, dark),
                  borderLeftColor: riskBorder(ing.risk),
                },
              ]}
            >
              <Text style={[styles.ingredientName, { color: c.text }]}>{ing.name}</Text>
              {ing.reason ? (
                <Text style={[styles.ingredientReason, { color: c.textSecondary }]}>{ing.reason}</Text>
              ) : null}
            </View>
          ))}
        </View>

        {result.hormoneNotes.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Hormone impact</Text>
            <Text style={[styles.sectionSub, { color: c.textMuted }]}>
              Tap an item for how it may affect the body
            </Text>
            <View style={styles.hormoneRow}>
              {result.hormoneNotes.map((h) => (
                <Pressable
                  key={h.chemical}
                  style={[styles.hormoneChip, { backgroundColor: c.surface2 }]}
                  onPress={() => setHormoneDetail(h)}
                >
                  <Text style={[styles.hormoneChipIcon, { color: c.accent }]}>◇</Text>
                  <Text style={[styles.hormoneChipText, { color: c.textSecondary }]} numberOfLines={1}>
                    {h.chemical}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <View style={[styles.swapCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.swapEyebrow, { color: '#10B981' }]}>Clean alternative</Text>
          <Text style={[styles.swapTitle, { color: c.text }]}>{result.cleanSwap.title}</Text>
          <Text style={[styles.swapDesc, { color: c.textSecondary }]}>{result.cleanSwap.description}</Text>
          {result.cleanSwap.dealNote ? (
            <View style={[styles.dealBadge, { backgroundColor: c.surface2 }]}>
              <Text style={styles.dealText}>{result.cleanSwap.dealNote}</Text>
            </View>
          ) : null}
          <Pressable
            style={[styles.swapButton, { backgroundColor: c.inverseBg }]}
            onPress={() => void openExternalUrl(getEffectiveSwapUrl(result))}
          >
            <Text style={[styles.swapButtonText, { color: c.inverseText }]}>View swap (affiliate)</Text>
          </Pressable>
          <Text style={[styles.affiliateDisclaimer, { color: c.textMuted }]}>
            {result.cleanSwap.partner === 'impact'
              ? 'Partner link (Impact). If you buy through it, we may earn a commission at no extra cost to you.'
              : 'Affiliate link — if you buy through it, we may earn a commission at no extra cost to you.'}
          </Text>
        </View>

        <Pressable onPress={onScanAgain}>
          <Text style={[styles.secondaryBtnText, { color: c.textSecondary }]}>Scan another product</Text>
        </Pressable>

        <PrivacyPolicyFooter />
      </ScrollView>

      <Modal visible={!!hormoneDetail} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setHormoneDetail(null)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: c.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: c.text }]}>{hormoneDetail?.chemical}</Text>
            <Text style={[styles.modalBody, { color: c.textSecondary }]}>{hormoneDetail?.explanation}</Text>
            <Pressable
              style={[styles.modalClose, { backgroundColor: c.accentSoft }]}
              onPress={() => setHormoneDetail(null)}
            >
              <Text style={[styles.modalCloseText, { color: c.accent }]}>Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  shareRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  shareBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  shareBtnText: { fontSize: 14, fontWeight: '800' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  gaugeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gaugeLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  gaugeTrack: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 6,
  },
  gaugeValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  gaugeHint: {
    fontSize: 12,
    marginTop: 4,
  },
  scoreBreakdown: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  scoreBreakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  scoreBreakdownLine: {
    fontSize: 13,
    fontWeight: '600',
  },
  scoreBreakdownExplain: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  microCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
  },
  microTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  microBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    marginBottom: 10,
  },
  ingredientList: {
    gap: 8,
    marginBottom: 20,
  },
  ingredientRow: {
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '600',
  },
  ingredientReason: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  hormoneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  hormoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    maxWidth: '100%',
  },
  hormoneChipIcon: {
    fontSize: 14,
  },
  hormoneChipText: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  swapCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  swapEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  swapTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  swapDesc: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  dealBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 14,
  },
  dealText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
  },
  swapButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  swapButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  affiliateDisclaimer: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalClose: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
