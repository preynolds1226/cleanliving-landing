import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppColors } from '../theme/colors';
import { setOnboardingCompleted } from '../utils/onboardingStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const SLIDES = [
  {
    title: 'Live label scan',
    body: 'Frame the ingredient panel with the overlay. We capture one photo and analyze it securely.',
  },
  {
    title: 'Highlights & score',
    body: 'See flagged ingredients, hormone notes when relevant, and a 1–100 purity score to compare products fast.',
  },
  {
    title: 'Swaps & history',
    body: 'Open curated swap links, track scans in My Home, and export your data anytime in Settings.',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const colors = useAppColors();
  const [index, setIndex] = useState(0);

  const finish = useCallback(async () => {
    await setOnboardingCompleted();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }, [navigation]);

  const next = useCallback(() => {
    if (index >= SLIDES.length - 1) {
      void finish();
    } else {
      setIndex((i) => i + 1);
    }
  }, [index, finish]);

  const slide = SLIDES[index];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === index ? colors.accent : colors.border },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{slide.body}</Text>
      <Pressable style={[styles.primary, { backgroundColor: colors.inverseBg }]} onPress={next}>
        <Text style={[styles.primaryText, { color: colors.inverseText }]}>
          {index >= SLIDES.length - 1 ? 'Get started' : 'Next'}
        </Text>
      </Pressable>
      <Pressable onPress={() => void finish()} hitSlop={12}>
        <Text style={[styles.skip, { color: colors.accent }]}>Skip</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 28, justifyContent: 'center', gap: 20 },
  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center' },
  body: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  primary: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  primaryText: { fontSize: 17, fontWeight: '800' },
  skip: { textAlign: 'center', fontSize: 16, fontWeight: '700', paddingVertical: 8 },
});
