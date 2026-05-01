import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Application from 'expo-application';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrivacyPolicyFooter } from '../components/PrivacyPolicyFooter';
import type { SettingsScreenProps } from '../navigation/types';
import { resetToOnboarding } from '../navigation/navigationRef';
import { clearAllExploreSaved, clearAllScans, exportAllScansJson } from '../db/scansDb';
import { useAppColors } from '../theme/colors';
import { resetOnboarding } from '../utils/onboardingStorage';

type Props = SettingsScreenProps;

const HOW_WE_ANALYZE_BODY = [
  'CleanLiving reads ingredient lists from your photos (or demo data) and classifies each line as Avoid, Caution, or OK using simple heuristics and, when configured, a secure AI step.',
  'Your purity score summarizes how many risky ingredients showed up. More “Avoid” items pull the score down more than “Caution” items. Open “Why this score?” on any result for the exact counts.',
  'We also suggest a cleaner swap and may include affiliate shopping links so you can act on the suggestion. Editorial picks in Explore are suggestions only — always verify labels and sellers.',
];

export function SettingsScreen({ navigation }: Props) {
  const colors = useAppColors();
  const [exporting, setExporting] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

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

  const onClearExploreSaved = useCallback(() => {
    Alert.alert(
      'Clear saved Explore picks?',
      'Removes every star you saved on Explore. Your scans are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await clearAllExploreSaved();
              Alert.alert('Done', 'Saved Explore picks were cleared.');
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
            resetToOnboarding();
          })();
        },
      },
    ]);
  }, []);

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
          onPress={() => navigation.navigate('Tabs', { screen: 'Explore' })}
        >
          <Text style={[styles.rowBtnText, { color: colors.text }]}>Explore clean picks</Text>
          <Text style={[styles.rowHint, { color: colors.textMuted }]}>
            Curated affiliate shopping ideas
          </Text>
        </Pressable>

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
          onPress={() => setHowOpen(true)}
        >
          <Text style={[styles.rowBtnText, { color: colors.text }]}>How we analyze</Text>
          <Text style={[styles.rowHint, { color: colors.textMuted }]}>
            What the score means and where data goes
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
          onPress={onClearExploreSaved}
        >
          <Text style={[styles.rowBtnText, { color: colors.text }]}>Clear saved Explore picks</Text>
          <Text style={[styles.rowHint, { color: colors.textMuted }]}>
            Remove starred ideas from Explore only
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
            Saved scans plus Explore pick IDs — share or archive a copy
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

      <Modal
        visible={howOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setHowOpen(false)}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>How we analyze</Text>
            <Pressable
              onPress={() => setHowOpen(false)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={[styles.modalClose, { color: colors.accent }]}>Done</Text>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            {HOW_WE_ANALYZE_BODY.map((para, i) => (
              <Text
                key={i}
                style={[styles.modalPara, { color: colors.textSecondary }]}
              >
                {para}
              </Text>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
  modalRoot: { flex: 1, paddingTop: 8 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalClose: { fontSize: 16, fontWeight: '800' },
  modalBody: { padding: 20, paddingBottom: 40, gap: 16 },
  modalPara: { fontSize: 15, lineHeight: 22 },
});
