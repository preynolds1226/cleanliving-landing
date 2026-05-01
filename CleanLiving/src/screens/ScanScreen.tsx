import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LabelScanOverlay } from '../components/LabelScanOverlay';
import { analyzeLabelFromBase64, getMockScanResult } from '../services/analyzeLabel';
import { withEffectiveAffiliate } from '../services/affiliateLinks';
import { insertScan } from '../db/scansDb';
import type { ScanScreenProps } from '../navigation/types';

type Props = ScanScreenProps;

function friendlyScanError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch'))
    return 'We couldn’t reach the analysis service. Check your connection and try again.';
  if (m.includes('timeout') || m.includes('timed out'))
    return 'The analysis took too long. Try again in a moment.';
  if (m.includes('401') || m.includes('403') || m.includes('unauthorized'))
    return 'Analysis isn’t authorized. Ask the person who set up the app to check API keys or the proxy.';
  if (m.includes('500') || m.includes('502') || m.includes('503'))
    return 'The analysis service had a temporary problem. Try again shortly.';
  if (m.includes('could not read image') || m.includes('capture failed'))
    return 'The camera didn’t return a usable photo. Try again with steadier lighting.';
  return message.length > 160 ? `${message.slice(0, 157)}…` : message;
}

const ANALYZE_API_URL = process.env.EXPO_PUBLIC_ANALYZE_API_URL;
const ANALYZE_SECRET = process.env.EXPO_PUBLIC_ANALYZE_SECRET;
const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

type Phase = 'scan' | 'analyzing';
type ScanMode = 'label' | 'barcode';

const BARCODE_TYPES = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'qr',
  'code39',
] as const;

export function ScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [phase, setPhase] = useState<Phase>('scan');
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('label');
  const lastBase64Ref = useRef<string | null>(null);
  const lastBarcodeAt = useRef(0);

  const runAnalyze = useCallback(
    async (base64: string | null) => {
      setPhase('analyzing');
      setError(null);
      if (base64) lastBase64Ref.current = base64;
      try {
        const raw = base64
          ? await analyzeLabelFromBase64(base64, {
              apiUrl: ANALYZE_API_URL,
              apiSecret: ANALYZE_SECRET,
              openAiKey: OPENAI_KEY,
            })
          : getMockScanResult();
        const result = withEffectiveAffiliate(raw);
        const scanId = await insertScan(result);
        lastBase64Ref.current = null;
        navigation.navigate('Result', { scanId });
      } catch (e) {
        const raw = e instanceof Error ? e.message : 'Something went wrong';
        setError(friendlyScanError(raw));
      } finally {
        setPhase('scan');
      }
    },
    [navigation]
  );

  const capture = useCallback(async () => {
    if (scanMode !== 'label') return;
    const cam = cameraRef.current;
    if (!cam) return;
    try {
      const photo = await cam.takePictureAsync({
        base64: true,
        quality: 0.52,
        skipProcessing: false,
      });
      if (photo?.base64) {
        await runAnalyze(photo.base64);
      } else {
        setError(friendlyScanError('Could not read image from camera.'));
      }
    } catch (e) {
      setError(friendlyScanError(e instanceof Error ? e.message : 'Capture failed'));
    }
  }, [runAnalyze, scanMode]);

  const onDemo = useCallback(() => {
    void runAnalyze(null);
  }, [runAnalyze]);

  const onRetry = useCallback(() => {
    const b64 = lastBase64Ref.current;
    if (b64) void runAnalyze(b64);
  }, [runAnalyze]);

  const onBarcodeScanned = useCallback((result: BarcodeScanningResult) => {
    const now = Date.now();
    if (now - lastBarcodeAt.current < 2200) return;
    lastBarcodeAt.current = now;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const q = encodeURIComponent(result.data);
    Alert.alert('Barcode scanned', result.data, [
      {
        text: 'Web search',
        onPress: () => void Linking.openURL(`https://www.google.com/search?q=${q}`),
      },
      { text: 'OK', style: 'cancel' },
    ]);
  }, []);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7CFFB2" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permission}>
        <Pressable
          style={styles.backPermission}
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backPermissionText}>← Back</Text>
        </Pressable>
        <Text style={styles.permissionTitle}>Camera access</Text>
        <Text style={styles.permissionBody}>
          We need the camera to scan labels with the live framing guide.
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => void requestPermission()}>
          <Text style={styles.primaryButtonText}>Allow camera</Text>
        </Pressable>
        <Pressable style={styles.textButton} onPress={() => navigation.navigate('History')}>
          <Text style={styles.textButtonLabel}>View History</Text>
        </Pressable>
        <Pressable style={styles.textButton} onPress={onDemo}>
          <Text style={styles.textButtonLabel}>Skip — show demo result</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.scanRoot}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={scanMode === 'label' && torchOn}
        barcodeScannerSettings={
          scanMode === 'barcode'
            ? { barcodeTypes: [...BARCODE_TYPES] }
            : { barcodeTypes: [] }
        }
        onBarcodeScanned={scanMode === 'barcode' ? onBarcodeScanned : undefined}
      />
      <LabelScanOverlay mode={scanMode} />
      <SafeAreaView style={styles.scanChrome} edges={['top']}>
        <View style={styles.topRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={styles.backCam}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backCamText}>← Back</Text>
          </Pressable>
          {scanMode === 'label' ? (
            <Pressable
              onPress={() => setTorchOn((t) => !t)}
              style={styles.torchBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={torchOn ? 'Turn flash off' : 'Turn flash on'}
            >
              <Text style={styles.torchText}>{torchOn ? 'Light on' : 'Light'}</Text>
            </Pressable>
          ) : (
            <View style={styles.torchPlaceholder} />
          )}
        </View>
        <Text style={styles.brand}>CleanLiving</Text>
        <Text style={styles.liveVision}>{scanMode === 'label' ? 'Live Vision' : 'Barcode'}</Text>
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modePill, scanMode === 'label' && styles.modePillActive]}
            onPress={() => {
              setScanMode('label');
              setTorchOn(false);
              setError(null);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: scanMode === 'label' }}
            accessibilityLabel="Label scan mode"
          >
            <Text style={[styles.modePillText, scanMode === 'label' && styles.modePillTextActive]}>
              Label
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modePill, scanMode === 'barcode' && styles.modePillActive]}
            onPress={() => {
              setScanMode('barcode');
              setTorchOn(false);
              setError(null);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: scanMode === 'barcode' }}
            accessibilityLabel="Barcode scan mode"
          >
            <Text style={[styles.modePillText, scanMode === 'barcode' && styles.modePillTextActive]}>
              Barcode
            </Text>
          </Pressable>
        </View>
        {!ANALYZE_API_URL?.trim() && scanMode === 'label' ? (
          <Text style={styles.demoBanner}>
            Demo mode — set EXPO_PUBLIC_ANALYZE_API_URL to use your secure AI proxy
          </Text>
        ) : null}
      </SafeAreaView>
      {phase === 'analyzing' ? (
        <View style={styles.analyzing}>
          <ActivityIndicator size="large" color="#7CFFB2" />
          <Text style={styles.analyzingText}>Reading label…</Text>
        </View>
      ) : null}
      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        {error ? (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        {error && lastBase64Ref.current ? (
          <Pressable style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        ) : null}
        {scanMode === 'label' ? (
          <Pressable
            style={styles.captureOuter}
            onPress={() => void capture()}
            accessibilityRole="button"
            accessibilityLabel="Capture label photo"
          >
            <View style={styles.captureInner} />
          </Pressable>
        ) : (
          <Text style={styles.barcodeWait}>Aim at barcode — it scans automatically</Text>
        )}
        <View style={styles.bottomLinks}>
          <Pressable onPress={onDemo}>
            <Text style={styles.demoLink}>Demo scan</Text>
          </Pressable>
          <Text style={styles.dot}>·</Text>
          <Pressable onPress={() => navigation.navigate('History')}>
            <Text style={styles.demoLink}>History</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  scanRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  scanChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backCam: { paddingVertical: 4 },
  backCamText: { color: 'rgba(255,255,255,0.95)', fontSize: 16, fontWeight: '700' },
  torchBtn: { paddingVertical: 4 },
  torchText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '700' },
  torchPlaceholder: { width: 64 },
  brand: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  liveVision: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  modePill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  modePillActive: {
    backgroundColor: 'rgba(124,255,178,0.35)',
  },
  modePillText: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
    fontSize: 14,
  },
  modePillTextActive: {
    color: '#fff',
  },
  demoBanner: {
    marginTop: 10,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 12,
    gap: 10,
  },
  bottomLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  captureOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  barcodeWait: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  demoLink: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontWeight: '600',
  },
  analyzing: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  analyzingText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  retryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  permission: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  backPermission: { position: 'absolute', top: 56, left: 20 },
  backPermissionText: { fontSize: 16, fontWeight: '700', color: '#3B82F6' },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  permissionBody: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  textButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
