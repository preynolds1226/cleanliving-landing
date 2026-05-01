import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import { getScanById, type ScanRow } from '../db/scansDb';
import { useAppColors } from '../theme/colors';
import type { RiskLevel } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Compare'>;

function countRisk(ingredients: { risk: RiskLevel }[], level: RiskLevel): number {
  return ingredients.filter((i) => i.risk === level).length;
}

export function CompareScreen({ navigation, route }: Props) {
  const colors = useAppColors();
  const { scanIdA, scanIdB } = route.params;
  const [a, setA] = useState<ScanRow | null>(null);
  const [b, setB] = useState<ScanRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      try {
        const [rowA, rowB] = await Promise.all([getScanById(scanIdA), getScanById(scanIdB)]);
        if (alive) {
          setA(rowA);
          setB(rowB);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [scanIdA, scanIdB]);

  const summary = useMemo(() => {
    if (!a || !b) return null;
    return {
      aAvoid: countRisk(a.result.ingredients, 'avoid'),
      aCaution: countRisk(a.result.ingredients, 'caution'),
      bAvoid: countRisk(b.result.ingredients, 'avoid'),
      bCaution: countRisk(b.result.ingredients, 'caution'),
    };
  }, [a, b]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScreenHeader title="Compare" navigation={navigation} colors={colors} />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : !a || !b ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.textSecondary }}>Could not load both scans.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.row2}>
            <View style={[styles.cell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.product, { color: colors.text }]} numberOfLines={2}>
                {a.productGuess}
              </Text>
              <Text style={[styles.score, { color: colors.text }]}>{a.purityScore}</Text>
              <Text style={[styles.hint, { color: colors.textMuted }]}>Purity</Text>
            </View>
            <View style={[styles.cell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.product, { color: colors.text }]} numberOfLines={2}>
                {b.productGuess}
              </Text>
              <Text style={[styles.score, { color: colors.text }]}>{b.purityScore}</Text>
              <Text style={[styles.hint, { color: colors.textMuted }]}>Purity</Text>
            </View>
          </View>

          {summary ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Ingredient flags</Text>
              <View style={styles.tableRow}>
                <Text style={[styles.tLabel, { color: colors.textMuted }]}>Avoid</Text>
                <Text style={[styles.tVal, { color: colors.text }]}>{summary.aAvoid}</Text>
                <Text style={[styles.tVal, { color: colors.text }]}>{summary.bAvoid}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tLabel, { color: colors.textMuted }]}>Caution</Text>
                <Text style={[styles.tVal, { color: colors.text }]}>{summary.aCaution}</Text>
                <Text style={[styles.tVal, { color: colors.text }]}>{summary.bCaution}</Text>
              </View>
            </View>
          ) : null}

          <Text style={[styles.note, { color: colors.textSecondary }]}>
            Lower “avoid” and “caution” counts usually mean a cleaner label. Always verify on the
            package.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  row2: { flexDirection: 'row', gap: 12 },
  cell: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1, gap: 6 },
  product: { fontSize: 14, fontWeight: '800', minHeight: 40 },
  score: { fontSize: 36, fontWeight: '900' },
  hint: { fontSize: 12, fontWeight: '600' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '900' },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tLabel: { width: 72, fontSize: 14, fontWeight: '700' },
  tVal: { flex: 1, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  note: { fontSize: 13, lineHeight: 18 },
});
