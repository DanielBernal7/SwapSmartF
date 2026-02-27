// This is an extremly barebones scanner page.
// This is just to get functionality down, we might want to move from tabs.
// Added here just to test functionallity. 

import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setLastBarcode(data);
    Alert.alert(
      'Barcode Scanned',
      `Type: ${type}\nData: ${data}`,
      [
        { text: 'Scan Again', onPress: () => setScanned(false) },
        { text: 'OK' },
      ]
    );
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>SwapSmart needs camera access to scan barcodes.</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
        }}
      />

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Point at a product barcode</Text>
        <View style={styles.scanArea} />
        {lastBarcode && (
          <Text style={styles.lastScan}>Last scan: {lastBarcode}</Text>
        )}
      </View>

      {scanned && (
        <View style={styles.scanAgainContainer}>
          <Pressable style={styles.button} onPress={() => setScanned(false)}>
            <Text style={styles.buttonText}>Tap to Scan Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanArea: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
  },
  lastScan: {
    color: '#fff',
    fontSize: 14,
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanAgainContainer: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
  },
});