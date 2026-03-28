import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useState, useRef, useCallback } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { GlassView, GlassContainer } from "expo-glass-effect";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SpringButton({ onPress, children, style }: {
  onPress: () => void;
  children: React.ReactNode;
  style?: object;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedPressable
      style={[animStyle, style]}
      onPressIn={() => { scale.value = withSpring(0.93, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 300 }); }}
      onPress={onPress}
    >
      {children}
    </AnimatedPressable>
  );
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const router = useRouter();
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const [showScanAgain, setShowScanAgain] = useState(false);

  const isProcessing = useRef(false);

  const resetScanner = useCallback(() => {
    isProcessing.current = false;
    setLastBarcode(null);
    setShowScanAgain(false);
  }, []);

  const handleBarCodeScanned = useCallback(
    ({ data }: { type: string; data: string }) => {
      if (isProcessing.current) {
        return;
      }
      isProcessing.current = true;
      setLastBarcode(data);
      setShowScanAgain(true);
      router.push({ pathname: '/scanner/recommendations' as any, params: { gtin: data } });
    },
    [router],
  );

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>SwapSmart needs camera access to scan barcodes.</Text>
        <SpringButton onPress={requestPermission}>
          <GlassView glassEffectStyle="regular" isInteractive style={styles.pill}>
            <Text style={styles.pillText}>Grant Camera Permission</Text>
          </GlassView>
        </SpringButton>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
          }}
        />
      )}

      <GlassContainer style={styles.overlay}>
        <GlassView glassEffectStyle="regular" style={styles.hintPill}>
          <Text style={styles.hintText}>Point at a product barcode</Text>
        </GlassView>

        <View style={styles.scanArea} />

        {lastBarcode && (
          <GlassView glassEffectStyle="regular" style={styles.lastScanPill}>
            <Text style={styles.lastScanText}>Last scan: {lastBarcode}</Text>
          </GlassView>
        )}
      </GlassContainer>

      {showScanAgain && (
        <View style={styles.scanAgainContainer}>
          <SpringButton onPress={resetScanner}>
            <GlassView glassEffectStyle="regular" isInteractive style={styles.pill}>
              <Text style={styles.pillText}>Tap to Scan Again</Text>
            </GlassView>
          </SpringButton>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  hintPill: {
    borderRadius: 22,
    overflow: "hidden",
  },
  hintText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: -0.2,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  scanArea: {
    width: 260,
    height: 160,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
  },
  lastScanPill: {
    borderRadius: 14,
    overflow: "hidden",
  },
  lastScanText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  message: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  pill: {
    borderRadius: 22,
    overflow: "hidden",
  },
  pillText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  scanAgainContainer: {
    position: "absolute",
    bottom: 250,
    alignSelf: "center",
  },
});
