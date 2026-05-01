import { StyleSheet, Text, View } from 'react-native';

const FRAME_MARGIN = 36;
const CORNER_LEN = 28;
const CORNER_WIDTH = 3;

export function LabelScanOverlay({ mode = 'label' }: { mode?: 'label' | 'barcode' }) {
  if (mode === 'barcode') {
    return (
      <View style={styles.barcodeWrap} pointerEvents="none">
        <Text style={styles.barcodeHint}>Point at a product barcode</Text>
        <Text style={styles.barcodeSub}>We’ll open a search for the code (no label AI in this mode)</Text>
      </View>
    );
  }
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.dimTop} />
      <View style={styles.row}>
        <View style={styles.dimSide} />
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <View style={styles.dimSide} />
      </View>
      <View style={styles.dimBottom}>
        <Text style={styles.hint}>Align the ingredient label inside the frame</Text>
        <Text style={styles.sub}>Hold steady — we capture a sharp frame for the AI</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barcodeWrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  barcodeHint: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  barcodeSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  wrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    height: 220,
  },
  frame: {
    flex: 1,
    marginHorizontal: FRAME_MARGIN,
    borderRadius: 12,
    position: 'relative',
  },
  dimTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dimBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingTop: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  dimSide: {
    width: FRAME_MARGIN,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  hint: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  sub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  corner: {
    position: 'absolute',
    width: CORNER_LEN,
    height: CORNER_LEN,
    borderColor: '#7CFFB2',
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: 10,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: 10,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: 10,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: 10,
  },
});
