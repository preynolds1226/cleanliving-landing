import { Pressable, StyleSheet, Text } from 'react-native';
import { openExternalUrl } from '../utils/openExternalUrl';
import { getPrivacyPolicyUrl } from '../utils/privacyPolicyUrl';
import { useAppColors } from '../theme/colors';

export function PrivacyPolicyFooter() {
  const colors = useAppColors();
  const url = getPrivacyPolicyUrl();
  if (!url) return null;
  return (
    <Pressable
      style={styles.wrap}
      onPress={() => void openExternalUrl(url)}
      accessibilityRole="link"
      accessibilityLabel="Open privacy policy in browser"
    >
      <Text style={[styles.text, { color: colors.accent }]}>Privacy Policy</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 8 },
  text: { fontSize: 13, fontWeight: '800' },
});
