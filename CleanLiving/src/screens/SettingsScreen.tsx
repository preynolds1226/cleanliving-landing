import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Application from 'expo-application';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrivacyPolicyFooter } from '../components/PrivacyPolicyFooter';
import type { RootStackParamList } from '../navigation/types';
import { clearAllScans, exportAllScansJson } from '../db/scansDb';
import { useAppColors } from '../theme/colors';
import { resetOnboarding } from '../utils/onboardingStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const colors = useAppColors();
  const [exporting, setExporting] = useState(false);

  const version = Application.nativeApplicationVersion ?? '—';

  const onClear = useCallback(() => {
    Alert.alert(
      'Clear all scans?',
      'This removes every saved scan from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await clearAllScans();
              Alert.alert('Done', 'All scans were removed from this device.');
            })();
          },
        },
      ]
    );
  }, []);

  const onReplayOnboarding = useCallback(() => {
    Alert.alert('Show intro again?', 'You’ll see the three welcome screens.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Show intro',
        onPress: () => {
          void (async () => {
            await resetOnboarding();
            navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
          })();
        },
      },
    ]);
  }, [navigation]);

  const onExport = useCallback(() => {
    void (async () => {
      setExporting(true);
      try {
        const json = await exportAllScansJson();
        await Share.share({
          title: 'CleanLiving export',
          message: json.length > 45000 ? `${json.slice(0, 45000)}\n…(truncated)` : json,
        });
      } catch {
        Alert.alert('Export failed', 'Could not share data.');
      } finally {
        setExporting(false);
      }
    })();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScreenHeader title="Settings" navigation={navigation} colors={colors} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted }]}>App version</Text>
          <Text style={[styles.value, { color: colors.text }]}>{version}</Text>
        </View>

        <Pressable
          style={[styles.rowBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => void Linking.openSettings()}
        >
          <Text style={[styles.rowBtnText, { color: colors.text }]}>System settings</Text>
          <Text style={[styles.rowHint, { color: colors.textMuted }]}>
            Camera & privacy permissions
          </Text>
        </Pressable>

        <Pressable
          style={[styles.rowBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={onReplayOnboarding}
        >
          <Text style={[styles.rowBtnText, { color: colors.text }]}>Replay intro</Text>
          <Text style={[styles.rowHint, { color: colors.textMuted }]}>
            Show the welcome slides again
          </Text>
        </Pressable>

        <Pressable
          style={[styles.rowBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={onExport}
          disabled={exporting}
        >
          <Text style={[styles.rowBtnText, { color: colors.text }]}>
            Export scan data (JSON)
          </Text>
          <Text style={[styles.rowHint, { color: colors.textMuted }]}>
            Share a copy of all saved scans
          </Text>
        </Pressable>

        <Pressable
          style={[styles.dangerBtn, { borderColor: colors.danger }]}
          onPress={onClear}
        >
          <Text style={[styles.dangerText, { color: colors.danger }]}>Clear all scans</Text>
        </Pressable>

        <PrivacyPolicyFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, gap: 14, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 6 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  value: { fontSize: 18, fontWeight: '800' },
  rowBtn: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 4 },
  rowBtnText: { fontSize: 16, fontWeight: '800' },
  rowHint: { fontSize: 13, lineHeight: 18 },
  dangerBtn: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  dangerText: { fontSize: 16, fontWeight: '800' },
});
