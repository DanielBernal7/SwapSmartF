import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import { useState, useRef, useCallback } from "react";
import { StyleSheet, Text, View, Pressable, Alert } from "react-native";

export default function ScannerScreen() {
	const [permission, requestPermission] = useCameraPermissions();
	const isFocused = useIsFocused();
	const [lastBarcode, setLastBarcode] = useState<string | null>(null);
	const [showScanAgain, setShowScanAgain] = useState(false);

	// This should prevent having to rerended or ther weird lag that was happenign.
	const isProcessing = useRef(false);

	const resetScanner = useCallback(() => {
		isProcessing.current = false;
		setShowScanAgain(false);
	}, []);

	const handleBarCodeScanned = useCallback(
		({ type, data }: { type: string; data: string }) => {
			if (isProcessing.current) {
				return;
			}
			isProcessing.current = true;

			setLastBarcode(data);
			setShowScanAgain(true);

			Alert.alert(
				"Barcode Scanned",
				`Type: ${type}\nData: ${data}`,
				[
					{ text: "Scan Again", onPress: resetScanner },
					{
						text: "OK",
					},
				],
				{ cancelable: false },
			);
		},
		[resetScanner],
	);

	if (!permission) {
		return <View style={styles.container} />;
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

			<View style={styles.overlay}>
				<Text style={styles.overlayText}>Point at a product barcode</Text>
				<View style={styles.scanArea} />
				{lastBarcode && <Text style={styles.lastScan}>Last scan: {lastBarcode}</Text>}
			</View>

			{showScanAgain && (
				<View style={styles.scanAgainContainer}>
					<Pressable style={styles.button} onPress={resetScanner}>
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
	},
	overlayText: {
		color: "#fff",
		fontSize: 16,
		marginBottom: 16,
		backgroundColor: "rgba(0,0,0,0.5)",
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 8,
	},
	scanArea: {
		width: 250,
		height: 150,
		borderWidth: 2,
		borderColor: "rgba(255,255,255,0.7)",
		borderRadius: 12,
	},
	lastScan: {
		color: "#fff",
		fontSize: 14,
		marginTop: 16,
		backgroundColor: "rgba(0,0,0,0.5)",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
	},
	message: {
		color: "#fff",
		fontSize: 16,
		textAlign: "center",
		marginBottom: 20,
		paddingHorizontal: 24,
	},
	button: {
		backgroundColor: "#4CAF50",
		paddingHorizontal: 24,
		paddingVertical: 14,
		borderRadius: 10,
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	scanAgainContainer: {
		position: "absolute",
		bottom: 250,
		alignSelf: "center",
	},
});
