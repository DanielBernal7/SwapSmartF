import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet, Image, Platform } from "react-native";
import { GlassView, GlassContainer } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

type Product = {
	name: string;
	brand: string | null;
	category: string | null;
	image_url: string | null;
	serving_size: string | null;
	calories: number | null;
	total_sugars: number | null;
	sodium: number | null;
	total_fat: number | null;
	protein: number | null;
	added_sugars: number | null;
};

type RecommendationResponse = {
	scanned: Product;
	recommendations: Product[];
	criteria: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GlassButton({ onPress, children, style }: { onPress: () => void; children: React.ReactNode; style?: object }) {
	const scale = useSharedValue(1);
	const pressed = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const handlePressIn = () => {
		scale.value = withSpring(0.96, { damping: 20, stiffness: 300, mass: 0.8 });
		if (Platform.OS === "ios") {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		}
	};

	const handlePressOut = () => {
		scale.value = withSpring(1, { damping: 14, stiffness: 200, mass: 0.6 });
	};

	return (
		<AnimatedPressable style={[pressed, style]} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
			{children}
		</AnimatedPressable>
	);
}

function formatNutrient(value: number | null, unit: string = ""): string {
	if (value != null) {
		return `${value}${unit}`;
	}
	return "—";
}

function StatPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
	return (
		<View style={[s.statPill, accent && s.statPillAccent]}>
			<Text style={[s.statPillValue, accent && s.statPillValueAccent]}>{value}</Text>
			<Text style={[s.statPillLabel, accent && s.statPillLabelAccent]}>{label}</Text>
		</View>
	);
}

function ScannedCard({ product }: { product: Product }) {
	return (
		<Animated.View entering={FadeInDown.duration(500).springify().damping(22).stiffness(140)}>
			<GlassView glassEffectStyle="regular" tintColor="rgba(255,255,255,0.35)" style={s.scannedCard}>
				<View style={s.scannedHeader}>
					<View style={s.scannedLabelRow}>
						<View style={s.scannedDot} />
						<Text style={s.scannedLabel}>SCANNED PRODUCT</Text>
					</View>
				</View>

				<View style={s.scannedBody}>
					{product.image_url && <Image source={{ uri: product.image_url }} style={s.scannedImage} />}
					{!product.image_url && (
						<View style={[s.scannedImage, s.imagePlaceholder]}>
							<Image source={require("../../../img/image_placeholder.png")} style={s.altImage} />
						</View>
					)}
					<View style={s.scannedInfo}>
						<Text style={s.scannedName} numberOfLines={2}>
							{product.name}
						</Text>
						{product.brand && (
							<Text style={s.scannedBrand} numberOfLines={1}>
								{product.brand}
							</Text>
						)}
					</View>
				</View>

				<View style={s.statsGrid}>
					<StatPill label="Sugar" value={formatNutrient(product.total_sugars, "g")} accent />
					<StatPill label="Cal" value={formatNutrient(product.calories)} />
					<StatPill label="Fat" value={formatNutrient(product.total_fat, "g")} />
					<StatPill label="Protein" value={formatNutrient(product.protein, "g")} />
				</View>
			</GlassView>
		</Animated.View>
	);
}

function AlternativeCard({ product, index, scannedSugar, onPress }: { product: Product; index: number; scannedSugar: number | null; onPress: () => void }) {
	let sugarDiff: number | null = null;
	if (scannedSugar != null && product.total_sugars != null) {
		sugarDiff = scannedSugar - product.total_sugars;
	}

	let savingsPercent: number | null = null;
	if (sugarDiff != null && scannedSugar != null && scannedSugar > 0) {
		savingsPercent = Math.round((sugarDiff / scannedSugar) * 100);
	}

	return (
		<Animated.View
			entering={FadeInDown.delay(100 + index * 70)
				.duration(450)
				.springify()
				.damping(22)
				.stiffness(140)}
		>
			<GlassButton onPress={onPress}>
				<GlassView glassEffectStyle="regular" tintColor="rgba(255,255,255,0.3)" isInteractive style={s.altCard}>
					<View style={s.altBody}>
						<View style={s.rankBadge}>
							<Text style={s.rankText}>{index + 1}</Text>
						</View>

						{product.image_url && <Image source={{ uri: product.image_url }} style={s.altImage} />}
						{!product.image_url && (
							<View style={[s.altImage, s.imagePlaceholder]}>
								<Image source={require("../../../img/image_placeholder.png")} style={s.altImage} resizeMode="contain" />
							</View>
						)}

						<View style={s.altInfo}>
							<Text style={s.altName} numberOfLines={2}>
								{product.name}
							</Text>
							{product.brand && (
								<Text style={s.altBrand} numberOfLines={1}>
									{product.brand}
								</Text>
							)}

							<View style={s.altMetrics}>
								<Text style={s.altSugar}>{formatNutrient(product.total_sugars, "g")} sugar</Text>
								{sugarDiff != null && sugarDiff > 0 && (
									<View style={s.savingsBadge}>
										<Text style={s.savingsText}>↓ {savingsPercent}%</Text>
									</View>
								)}
							</View>
						</View>

						<Text style={s.chevron}>›</Text>
					</View>
				</GlassView>
			</GlassButton>
		</Animated.View>
	);
}

export default function RecommendationsScreen() {
	const { gtin } = useLocalSearchParams<{ gtin: string }>();
	const router = useRouter();
	const [data, setData] = useState<RecommendationResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [glassKey, setGlassKey] = useState(0);
	useFocusEffect(
		useCallback(() => {
			setGlassKey((k) => k + 1);
		}, []),
	);

	useEffect(() => {
		if (!gtin) {
			return;
		}
		setLoading(true);
		setError(null);
		fetch(`${BASE_URL}/api/recommend/${gtin}?criteria=sugar`)
			.then((res) => {
				if (!res.ok) {
					return res.json().then((e) => Promise.reject(e.error || "Not found"));
				}
				return res.json();
			})
			.then((json: RecommendationResponse) => {
				json.recommendations.sort((a, b) => (a.total_sugars ?? 0) - (b.total_sugars ?? 0));
				setData(json);
			})
			.catch((err) => {
				if (typeof err === "string") {
					setError(err);
				} else {
					setError("Failed to load recommendations");
				}
			})
			.finally(() => setLoading(false));
	}, [gtin]);

	const handleAlternativePress = (_product: Product) => {
		if (Platform.OS === "ios") {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		}
	};

	return (
		<View style={s.container}>
			<LinearGradient colors={["#F2F2F7", "#E8ECF0", "#F2F2F7"]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />

			<View key={glassKey} style={StyleSheet.absoluteFill}>
				{loading && (
					<View style={s.centerState}>
						<Animated.View entering={FadeIn.duration(300)}>
							<ActivityIndicator size="large" color="#007AFF" />
						</Animated.View>
						<Animated.Text entering={FadeIn.delay(200).duration(400)} style={s.loadingText}>
							Finding healthier swaps…
						</Animated.Text>
					</View>
				)}

				{error && (
					<View style={s.centerState}>
						<Animated.Text entering={FadeIn.duration(300)} style={s.errorText}>
							{error}
						</Animated.Text>
						<GlassButton onPress={() => router.back()}>
							<GlassView glassEffectStyle="regular" tintColor="rgba(255,255,255,0.4)" isInteractive style={s.errorBtn}>
								<Text style={s.errorBtnText}>Go Back</Text>
							</GlassView>
						</GlassButton>
					</View>
				)}

				{!loading && !error && data && (
					<GlassContainer spacing={12} style={StyleSheet.absoluteFill}>
						<ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
							<ScannedCard product={data.scanned} />

							{data.recommendations.length > 0 && (
								<Animated.View entering={FadeInDown.delay(80).duration(400).springify().damping(22)}>
									<Text style={s.sectionTitle}>Better Alternatives</Text>
									<Text style={s.sectionSubtitle}>
										{data.recommendations.length} option{data.recommendations.length !== 1 && "s"} with less sugar
									</Text>
								</Animated.View>
							)}

							{data.recommendations.map((rec, index) => (
								<AlternativeCard key={index} product={rec} index={index} scannedSugar={data.scanned.total_sugars} onPress={() => handleAlternativePress(rec)} />
							))}

							{data.recommendations.length === 0 && (
								<Animated.View entering={FadeInDown.delay(120).springify()}>
									<GlassView glassEffectStyle="regular" tintColor="rgba(255,255,255,0.3)" style={s.emptyCard}>
										<Text style={s.emptyIcon}>🔍</Text>
										<Text style={s.emptyTitle}>No alternatives found</Text>
										<Text style={s.emptySubtitle}>{"We couldn't find products with less sugar in this category."}</Text>
									</GlassView>
								</Animated.View>
							)}

							<View style={s.scrollBottomSpacer} />
						</ScrollView>
					</GlassContainer>
				)}

				<View style={s.headerWrapper} pointerEvents="box-none">
					<GlassView glassEffectStyle="clear" tintColor="rgba(255,255,255,0.5)" style={s.headerGlass} />
					<LinearGradient colors={["rgba(242,242,247,0.2)", "rgba(242,242,247,0)"]} locations={[0.6, 1]} style={s.headerFade} pointerEvents="none" />
					<View style={s.headerContent} pointerEvents="box-none">
						<GlassButton onPress={() => router.back()}>
							<GlassView glassEffectStyle="clear" tintColor="rgba(255,255,255,0.45)" isInteractive style={s.backBtn}>
								<Text style={s.backIcon}>‹</Text>
							</GlassView>
						</GlassButton>
						<Text style={s.headerTitle}>Recommendations</Text>
						<View style={s.headerSpacer} />
					</View>
				</View>
			</View>
		</View>
	);
}

const s = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F2F2F7",
	},

	headerWrapper: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 150,
		zIndex: 10,
	},
	headerGlass: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 106,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "rgba(60,60,67,0.08)",
		overflow: "hidden",
	},
	headerFade: {
		position: "absolute",
		top: 104,
		left: 0,
		right: 0,
		height: 46,
	},
	headerContent: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 106,
		flexDirection: "row",
		alignItems: "flex-end",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingBottom: 10,
	},
	headerTitle: {
		fontSize: 17,
		fontWeight: "600",
		color: "#000",
		letterSpacing: -0.4,
		fontFamily: Platform.select({ ios: "system-ui", default: undefined }),
	},
	backBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	backIcon: {
		fontSize: 26,
		color: "#007AFF",
		lineHeight: 32,
		fontWeight: "300",
		marginTop: -1,
	},

	scrollContent: {
		padding: 16,
		paddingTop: 120,
	},

	scannedCard: {
		borderRadius: 22,
		marginBottom: 20,
		overflow: "hidden",
	},
	scannedHeader: {
		paddingHorizontal: 18,
		paddingTop: 16,
		paddingBottom: 4,
	},
	scannedLabelRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	scannedDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: "#FF3B30",
	},
	scannedLabel: {
		fontSize: 11,
		fontWeight: "600",
		color: "#8E8E93",
		letterSpacing: 0.6,
	},
	scannedBody: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 18,
		paddingTop: 12,
		paddingBottom: 16,
	},
	scannedImage: {
		width: 68,
		height: 68,
		borderRadius: 16,
		backgroundColor: "#E5E5EA",
	},
	scannedInfo: {
		flex: 1,
		marginLeft: 14,
	},
	scannedName: {
		fontSize: 17,
		fontWeight: "600",
		color: "#000",
		letterSpacing: -0.3,
		lineHeight: 22,
	},
	scannedBrand: {
		fontSize: 14,
		color: "#8E8E93",
		marginTop: 2,
		letterSpacing: -0.1,
	},

	statsGrid: {
		flexDirection: "row",
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: "rgba(60,60,67,0.08)",
		paddingHorizontal: 12,
		paddingVertical: 12,
		gap: 8,
	},
	statPill: {
		flex: 1,
		alignItems: "center",
		paddingVertical: 8,
		borderRadius: 12,
		backgroundColor: "rgba(120,120,128,0.06)",
	},
	statPillAccent: {
		backgroundColor: "rgba(255,59,48,0.08)",
	},
	statPillValue: {
		fontSize: 15,
		fontWeight: "700",
		color: "#1C1C1E",
		letterSpacing: -0.3,
		fontFamily: Platform.select({ ios: "ui-rounded", default: undefined }),
	},
	statPillValueAccent: {
		color: "#FF3B30",
	},
	statPillLabel: {
		fontSize: 10,
		fontWeight: "500",
		color: "#8E8E93",
		marginTop: 2,
		letterSpacing: 0.2,
	},
	statPillLabelAccent: {
		color: "#FF3B30",
	},

	sectionTitle: {
		fontSize: 22,
		fontWeight: "700",
		color: "#000",
		letterSpacing: -0.5,
		marginTop: 4,
		marginBottom: 2,
		paddingHorizontal: 2,
	},
	sectionSubtitle: {
		fontSize: 14,
		color: "#8E8E93",
		letterSpacing: -0.1,
		marginBottom: 14,
		paddingHorizontal: 2,
	},

	altCard: {
		borderRadius: 18,
		marginBottom: 10,
		overflow: "hidden",
	},
	altBody: {
		flexDirection: "row",
		alignItems: "center",
		padding: 14,
		paddingRight: 12,
		gap: 12,
	},
	rankBadge: {
		width: 26,
		height: 26,
		borderRadius: 13,
		backgroundColor: "rgba(0,122,255,0.08)",
		alignItems: "center",
		justifyContent: "center",
	},
	rankText: {
		fontSize: 13,
		fontWeight: "700",
		color: "#007AFF",
		fontFamily: Platform.select({ ios: "ui-rounded", default: undefined }),
	},
	altImage: {
		width: 52,
		height: 52,
		borderRadius: 14,
		backgroundColor: "#E5E5EA",
	},
	altInfo: {
		flex: 1,
	},
	altName: {
		fontSize: 15,
		fontWeight: "600",
		color: "#000",
		letterSpacing: -0.2,
		lineHeight: 20,
	},
	altBrand: {
		fontSize: 13,
		color: "#8E8E93",
		marginTop: 1,
	},
	altMetrics: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 5,
	},
	altSugar: {
		fontSize: 13,
		fontWeight: "600",
		color: "#34C759",
		letterSpacing: -0.1,
	},
	savingsBadge: {
		backgroundColor: "rgba(52,199,89,0.1)",
		borderRadius: 8,
		paddingHorizontal: 7,
		paddingVertical: 3,
	},
	savingsText: {
		fontSize: 11,
		fontWeight: "700",
		color: "#30B855",
		letterSpacing: -0.1,
	},
	chevron: {
		fontSize: 22,
		color: "#C7C7CC",
		fontWeight: "300",
		marginLeft: 4,
	},

	imagePlaceholder: {
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(120,120,128,0.08)",
	},
	placeholderIcon: {
		fontSize: 28,
	},
	placeholderIconSmall: {
		fontSize: 22,
	},

	emptyCard: {
		borderRadius: 22,
		alignItems: "center",
		paddingVertical: 36,
		paddingHorizontal: 24,
		overflow: "hidden",
	},
	emptyIcon: {
		fontSize: 36,
		marginBottom: 12,
	},
	emptyTitle: {
		fontSize: 17,
		fontWeight: "600",
		color: "#1C1C1E",
		letterSpacing: -0.3,
		marginBottom: 6,
	},
	emptySubtitle: {
		fontSize: 14,
		color: "#8E8E93",
		textAlign: "center",
		lineHeight: 20,
	},

	centerState: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 32,
		gap: 14,
	},
	loadingText: {
		fontSize: 15,
		color: "#8E8E93",
		letterSpacing: -0.2,
	},
	errorText: {
		fontSize: 16,
		color: "#FF3B30",
		textAlign: "center",
		letterSpacing: -0.2,
	},
	errorBtn: {
		borderRadius: 16,
		overflow: "hidden",
		paddingHorizontal: 28,
		paddingVertical: 14,
	},
	errorBtnText: {
		fontSize: 16,
		color: "#007AFF",
		fontWeight: "600",
		letterSpacing: -0.2,
	},
	scrollBottomSpacer: {
		height: 40,
	},
	headerSpacer: {
		width: 40,
	},
});
