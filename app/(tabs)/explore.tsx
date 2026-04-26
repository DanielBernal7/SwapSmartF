import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View, Pressable, Alert } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Background, Glass } from "@/constants/theme";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "Not configured";
const APP_VERSION = "1.0.0 (1)";
const SDK_VERSION = "54";

function SettingsRow({ icon, iconAccent, label, value, onPress, rightElement, destructive, isLast }: { icon: string; iconAccent: string; label: string; value?: string; onPress?: () => void; rightElement?: React.ReactNode; destructive?: boolean; isLast?: boolean }) {
	return (
		<Pressable style={({ pressed }) => [styles.row, !isLast && styles.rowBorder, pressed && onPress && styles.rowPressed]} onPress={onPress}>
			<View style={[styles.rowIconBg, { backgroundColor: iconAccent + "1A" }]}>
				<SymbolView name={icon as any} tintColor={iconAccent} resizeMode="scaleAspectFit" style={styles.rowIconSym} />
			</View>
			<Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
			{rightElement ?? (
				<>
					{value !== undefined && (
						<Text style={styles.rowValue} numberOfLines={1}>
							{value}
						</Text>
					)}
					{onPress && !rightElement && <SymbolView name="chevron.right" tintColor="#C7C7CC" resizeMode="scaleAspectFit" style={styles.rowChevron} />}
				</>
			)}
		</Pressable>
	);
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
	return (
		<View style={styles.section}>
			{title && <Text style={styles.sectionTitle}>{title}</Text>}
			<BlurView intensity={75} tint="light" style={styles.card}>
				<View style={styles.cardSheen} />
				{children}
			</BlurView>
		</View>
	);
}

export default function SettingsScreen() {
	const insets = useSafeAreaInsets();
	const [devMode, setDevMode] = useState(false);
	const [mockData, setMockData] = useState(false);

	let connectionStatus = "Not set";
	if (BASE_URL !== "Not configured") {
		connectionStatus = "Configured";
	}

	return (
		<View style={styles.root}>
			<LinearGradient colors={Background.gradient} locations={Background.gradientLocations} style={StyleSheet.absoluteFill} />

			<ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
				<Text style={styles.pageTitle}>Settings</Text>

				<Section title="APP">
					<SettingsRow icon="info.circle.fill" iconAccent="#007AFF" label="About SwapSmart" onPress={() => Alert.alert("SwapSmart", "Find healthier alternatives to the foods you love — instantly.\n\nBuilt for demo purposes.")} />
					<SettingsRow icon="star.fill" iconAccent="#FF9500" label="Version" value={APP_VERSION} isLast />
				</Section>

				<Section title="DEVELOPER">
					<SettingsRow icon="hammer.fill" iconAccent="#FF3B30" label="Developer Options" isLast={!devMode} rightElement={<Switch value={devMode} onValueChange={setDevMode} trackColor={{ false: "#E5E5EA", true: "#34C759" }} thumbColor="#fff" />} />
					{devMode && (
						<>
							<SettingsRow icon="network" iconAccent="#5856D6" label="API Endpoint" value={BASE_URL} />
							<SettingsRow icon="antenna.radiowaves.left.and.right" iconAccent="#34C759" label="Connection" value={connectionStatus} />
							<SettingsRow icon="doc.fill" iconAccent="#FF9500" label="Expo SDK" value={SDK_VERSION} />
							<SettingsRow icon="theatermasks.fill" iconAccent="#AF52DE" label="Mock Data" rightElement={<Switch value={mockData} onValueChange={setMockData} trackColor={{ false: "#E5E5EA", true: "#34C759" }} thumbColor="#fff" />} />
							<SettingsRow icon="trash.fill" iconAccent="#FF3B30" label="Clear Cache" destructive isLast onPress={() => Alert.alert("Cache Cleared", "App cache has been cleared.")} />
						</>
					)}
				</Section>

				<Section>
					<SettingsRow icon="doc.text.fill" iconAccent="#8E8E93" label="Privacy Policy" onPress={() => Alert.alert("Privacy Policy", "Your data stays on your device. No personal info is collected.")} />
					<SettingsRow icon="envelope.fill" iconAccent="#007AFF" label="Send Feedback" isLast onPress={() => Alert.alert("Feedback", "Thanks for using SwapSmart! Feedback form coming soon.")} />
				</Section>

				<Text style={styles.footer}>SwapSmart {APP_VERSION}</Text>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	scroll: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 16,
	},

	pageTitle: {
		fontSize: 34,
		fontWeight: "800",
		color: "#1C1C1E",
		letterSpacing: -1,
		marginBottom: 28,
	},

	section: {
		marginBottom: 28,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: "600",
		color: "#8E8E93",
		letterSpacing: 0.6,
		textTransform: "uppercase",
		marginBottom: 8,
		marginLeft: 4,
	},
	card: {
		borderRadius: 16,
		overflow: "hidden",
		borderWidth: Glass.borderWidth,
		borderColor: Glass.borderColor,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.06,
		shadowRadius: 12,
		elevation: 4,
	},
	cardSheen: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: Glass.overlayColor,
	},

	row: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 14,
		paddingVertical: 12,
		gap: 12,
	},
	rowBorder: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "rgba(60,60,67,0.12)",
	},
	rowPressed: {
		backgroundColor: "rgba(0,0,0,0.04)",
	},
	rowIconBg: {
		width: 32,
		height: 32,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
	},
	rowIconSym: {
		width: 16,
		height: 16,
	},
	rowLabel: {
		flex: 1,
		fontSize: 15,
		fontWeight: "500",
		color: "#1C1C1E",
		letterSpacing: -0.2,
	},
	rowLabelDestructive: {
		color: "#FF3B30",
	},
	rowValue: {
		fontSize: 14,
		color: "#8E8E93",
		maxWidth: 160,
		textAlign: "right",
	},
	rowChevron: {
		width: 12,
		height: 12,
	},

	footer: {
		textAlign: "center",
		fontSize: 12,
		color: "#C7C7CC",
		marginTop: 8,
	},
});
