import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { AppColors } from '../theme/colors';

export function ScreenHeader({
  title,
  navigation,
  colors,
  right,
}: {
  title: string;
  navigation: NavigationProp<ParamListBase>;
  colors: AppColors;
  right?: ReactNode;
}) {
  const canBack = navigation.canGoBack();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      {canBack ? (
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backLabel, { color: colors.accent }]}>← Back</Text>
        </Pressable>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.rightSlot}>{right ?? <View style={styles.backPlaceholder} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { minWidth: 72 },
  backPlaceholder: { minWidth: 72 },
  backLabel: { fontSize: 16, fontWeight: '700' },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800' },
  rightSlot: { minWidth: 72, alignItems: 'flex-end' },
});
