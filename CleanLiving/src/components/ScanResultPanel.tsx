import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { HormoneInfo, IngredientItem, ScanResult } from '../types';
import { PrivacyPolicyFooter } from './PrivacyPolicyFooter';
import { getEffectiveSwapUrl } from '../services/affiliateLinks';
import { openExternalUrl } from '../utils/openExternalUrl';

function riskColor(risk: IngredientItem['risk']): string {
  if (risk === 'avoid') return '#FEE2E2';
  if (risk === 'caution') return '#FEF9C3';
  return '#ECFDF5';
}

function riskBorder(risk: IngredientItem['risk']): string {
  if (risk === 'avoid') return '#EF4444';
  if (risk === 'caution') return '#EAB308';
  return '#22C55E';
}

function PurityGauge({ score }: { score: number }) {
  const clamped = Math.max(1, Math.min(100, score));
  const hue = (clamped / 100) * 120;
  const barColor = `hsl(${hue}, 70%, 42%)`;
  return (
    <View style={styles.gaugeCard}>
      <Text style={styles.gaugeLabel}>Purity score</Text>
      <View style={styles.gaugeTrack}>
        <View style={[styles.gaugeFill, { width: `${clamped}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={styles.gaugeValue}>{clamped}</Text>
      <Text style={styles.gaugeHint}>1 = highest concern · 100 = cleanest</Text>
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
  const [hormoneDetail, setHormoneDetail] = useState<HormoneInfo | null>(null);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{result.productGuess}</Text>

        <PurityGauge score={result.purityScore} />

        {result.microplasticWarning ? (
          <View style={styles.microCard}>
            <Text style={styles.microTitle}>Microplastic exposure</Text>
            <Text style={styles.microBody}>{result.microplasticWarning}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Ingredients</Text>
        <View style={styles.ingredientList}>
          {result.ingredients.map((ing, index) => (
            <View
              key={`${ing.name}-${index}`}
              style={[
                styles.ingredientRow,
                { backgroundColor: riskColor(ing.risk), borderLeftColor: riskBorder(ing.risk) },
              ]}
            >
              <Text style={styles.ingredientName}>{ing.name}</Text>
              {ing.reason ? <Text style={styles.ingredientReason}>{ing.reason}</Text> : null}
            </View>
          ))}
        </View>

        {result.hormoneNotes.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Hormone impact</Text>
            <Text style={styles.sectionSub}>Tap an item for how it may affect the body</Text>
            <View style={styles.hormoneRow}>
              {result.hormoneNotes.map((h) => (
                <Pressable
                  key={h.chemical}
                  style={styles.hormoneChip}
                  onPress={() => setHormoneDetail(h)}
                >
                  <Text style={styles.hormoneChipIcon}>◇</Text>
                  <Text style={styles.hormoneChipText} numberOfLines={1}>
                    {h.chemical}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.swapCard}>
          <Text style={styles.swapEyebrow}>Clean alternative</Text>
          <Text style={styles.swapTitle}>{result.cleanSwap.title}</Text>
          <Text style={styles.swapDesc}>{result.cleanSwap.description}</Text>
          {result.cleanSwap.dealNote ? (
            <View style={styles.dealBadge}>
              <Text style={styles.dealText}>{result.cleanSwap.dealNote}</Text>
            </View>
          ) : null}
          <Pressable
            style={styles.swapButton}
            onPress={() => void openExternalUrl(getEffectiveSwapUrl(result))}
          >
            <Text style={styles.swapButtonText}>View swap (affiliate)</Text>
          </Pressable>
          <Text style={styles.affiliateDisclaimer}>
            {result.cleanSwap.partner === 'impact'
              ? 'Partner link (Impact). If you buy through it, we may earn a commission at no extra cost to you.'
              : 'Affiliate link — if you buy through it, we may earn a commission at no extra cost to you.'}
          </Text>
        </View>

        <Pressable style={styles.secondaryBtn} onPress={onScanAgain}>
          <Text style={styles.secondaryBtnText}>Scan another product</Text>
        </Pressable>

        <PrivacyPolicyFooter />
      </ScrollView>

      <Modal visible={!!hormoneDetail} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setHormoneDetail(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{hormoneDetail?.chemical}</Text>
            <Text style={styles.modalBody}>{hormoneDetail?.explanation}</Text>
            <Pressable style={styles.modalClose} onPress={() => setHormoneDetail(null)}>
              <Text style={styles.modalCloseText}>Got it</Text>
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
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  gaugeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gaugeLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  gaugeTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 6,
  },
  gaugeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  gaugeHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  microCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  microTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 6,
  },
  microBody: {
    fontSize: 14,
    color: '#1E3A5F',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: '#64748B',
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
    color: '#0F172A',
  },
  ingredientReason: {
    fontSize: 13,
    color: '#475569',
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
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    maxWidth: '100%',
  },
  hormoneChipIcon: {
    color: '#6366F1',
    fontSize: 14,
  },
  hormoneChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flexShrink: 1,
  },
  swapCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  swapEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  swapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  swapDesc: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 12,
  },
  dealBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
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
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  swapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  affiliateDisclaimer: {
    marginTop: 10,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
    textAlign: 'center',
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalClose: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4338CA',
  },
});
