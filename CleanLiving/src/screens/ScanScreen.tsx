import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LabelScanOverlay } from '../components/LabelScanOverlay';
import { analyzeLabelFromBase64, getMockScanResult } from '../services/analyzeLabel';
import { withEffectiveAffiliate } from '../services/affiliateLinks';
import { insertScan } from '../db/scansDb';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Scan'>;

const ANALYZE_API_URL = process.env.EXPO_PUBLIC_ANALYZE_API_URL;
const ANALYZE_SECRET = process.env.EXPO_PUBLIC_ANALYZE_SECRET;
const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

type Phase = 'scan' | 'analyzing';

export function ScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [phase, setPhase] = useState<Phase>('scan');
  const [error, setError] = useState<string | null>(null);

  const runAnalyze = useCallback(
    async (base64: string | null) => {
      setPhase('analyzing');
      setError(null);
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
        navigation.navigate('Result', { scanId });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      } finally {
        setPhase('scan');
      }
    },
    [navigation]
  );

  const capture = useCallback(async () => {
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
        setError('Could not read image from camera.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Capture failed');
    }
  }, [runAnalyze]);

  const onDemo = useCallback(() => {
    void runAnalyze(null);
  }, [runAnalyze]);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permission}>
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
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      <LabelScanOverlay />
      <SafeAreaView style={styles.scanChrome} edges={['top']}>
        <Text style={styles.brand}>CleanLiving</Text>
        <Text style={styles.liveVision}>Live Vision</Text>
        {!ANALYZE_API_URL?.trim() ? (
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
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable style={styles.captureOuter} onPress={() => void capture()}>
          <View style={styles.captureInner} />
        </Pressable>
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
    paddingTop: 8,
  },
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
    gap: 12,
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
  permission: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
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

