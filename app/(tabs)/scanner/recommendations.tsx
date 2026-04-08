import { GlassContainer, GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
	FadeIn,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const NAV_BAR_HEIGHT = 44;

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


function useSlideIn(delayMs: number = 0) {
	const translateY = useSharedValue(22);
	const style = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));
	useEffect(() => {
		translateY.value = withDelay(delayMs, withSpring(0, { damping: 22, stiffness: 140, mass: 0.8 }));
	}, []);
	return style;
}

function GlassButton({ onPress, children, style }: { onPress: () => void; children: React.ReactNode; style?: object }) {
	const scale = useSharedValue(1);
	const pressed = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const handlePressIn = () => {
		scale.value = withSpring(0.96, { damping: 20, stiffness: 300, mass: 0.8 });
	};

	const handlePressOut = () => {
		scale.value = withSpring(1, { damping: 12, stiffness: 200, mass: 0.6 });
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

function ProductImage({ imageUrl, size }: { imageUrl: string | null; size: "large" | "small" }) {
	let imageStyle = s.altImage;
	if (size === "large") {
		imageStyle = s.scannedImage;
	}
	let placeholderInnerStyle = s.altPlaceholderImg;
	if (size === "large") {
		placeholderInnerStyle = s.scannedPlaceholderImg;
	}

	if (imageUrl) {
		return <Image source={{ uri: imageUrl }} style={imageStyle} />;
	}

	return (
		<View style={[imageStyle, s.imagePlaceholder]}>
			<Image source={require("../../../img/image_placeholder.png")} style={placeholderInnerStyle} resizeMode="contain" />
		</View>
	);
}

function ScannedCard({ product }: { product: Product }) {
	const slideStyle = useSlideIn(0);

	return (
		<Animated.View style={slideStyle}>
			<GlassView
				glassEffectStyle={{ style: "regular", animate: true, animationDuration: 0.45 }}
				tintColor="rgba(255,255,255,0.08)"
				style={s.scannedCard}
			>
				<View style={s.scannedHeader}>
					<View style={s.scannedLabelRow}>
						<View style={s.scannedDot} />
						<Text style={s.scannedLabel}>SCANNED PRODUCT</Text>
					</View>
				</View>

				<View style={s.scannedBody}>
					<ProductImage imageUrl={product.image_url} size="large" />``
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

function AlternativeCard({
	product,
	index,
	scannedSugar,
	onPress,
}: {
	product: Product;
	index: number;
	scannedSugar: number | null;
	onPress: () => void;
}) {
	const slideStyle = useSlideIn(80 + index * 60);

	let sugarDiff: number | null = null;
	if (scannedSugar != null && product.total_sugars != null) {
		sugarDiff = scannedSugar - product.total_sugars;
	}

	let savingsPercent: number | null = null;
	if (sugarDiff != null && scannedSugar != null && scannedSugar > 0) {
		savingsPercent = Math.round((sugarDiff / scannedSugar) * 100);
	}

	return (
		<Animated.View style={slideStyle}>
			<GlassButton onPress={onPress}>
				<GlassView
					glassEffectStyle={{ style: "regular", animate: true, animationDuration: 0.3 }}
					tintColor="rgba(255,255,255,0.06)"
					isInteractive
					style={s.altCard}
				>
					<View style={s.altBody}>
						<View style={s.rankBadge}>
							<Text style={s.rankText}>{index + 1}</Text>
						</View>

						<ProductImage imageUrl={product.image_url} size="small" />

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

						<SymbolView name="chevron.right" style={s.chevron} tintColor="#C7C7CC" resizeMode="scaleAspectFit" weight="light" />
					</View>
				</GlassView>
			</GlassButton>
		</Animated.View>
	);
}

export default function RecommendationsScreen() {
	const { gtin } = useLocalSearchParams<{ gtin: string }>();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [data, setData] = useState<RecommendationResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const headerBarHeight = insets.top + NAV_BAR_HEIGHT;
	const headerTotalHeight = headerBarHeight + 46;

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

	const handleAlternativePress = (_product: Product) => {};

	let recCount = 0;
	if (data) {
		recCount = data.recommendations.length;
	}
	let recCountSuffix = "";
	if (recCount !== 1) {
		recCountSuffix = "s";
	}

	return (
		<View style={s.container} collapsable={false}>
			<LinearGradient colors={["#EEF3FA", "#F0F4F8", "#F2F2F7"]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />

			<View style={StyleSheet.absoluteFill} collapsable={false}>
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
							<GlassView
								glassEffectStyle="regular"
								tintColor="rgba(255,255,255,0.1)"
								isInteractive
								style={s.errorBtn}
							>
								<Text style={s.errorBtnText}>Go Back</Text>
							</GlassView>
						</GlassButton>
					</View>
				)}

				{!loading && !error && data && (
					<GlassContainer spacing={12} style={StyleSheet.absoluteFill}>
						<ScrollView
							contentContainerStyle={[s.scrollContent, { paddingTop: headerBarHeight + 24 }]}
							showsVerticalScrollIndicator={false}
							alwaysBounceVertical
							scrollEventThrottle={16}
							decelerationRate="normal"
						>
							<ScannedCard product={data.scanned} />

							{data.recommendations.length > 0 && (
								<View style={s.sectionHeader}>
									<Text style={s.sectionTitle}>Lower Sugar Alternatives</Text>
									<Text style={s.sectionSubtitle}>
										{recCount} option{recCountSuffix} with less sugar
									</Text>
								</View>
							)}

							{data.recommendations.map((rec, index) => (
								<AlternativeCard
									key={index}
									product={rec}
									index={index}
									scannedSugar={data.scanned.total_sugars}
									onPress={() => handleAlternativePress(rec)}
								/>
							))}

							{data.recommendations.length === 0 && (
								<GlassView
									glassEffectStyle={{ style: "regular", animate: true, animationDuration: 0.4 }}
									tintColor="rgba(255,255,255,0.06)"
									style={s.emptyCard}
								>
									<Text style={s.emptyIcon}>🔍</Text>
									<Text style={s.emptyTitle}>No alternatives found</Text>
									<Text style={s.emptySubtitle}>{"We couldn't find products with less sugar in this category."}</Text>
								</GlassView>
							)}

							<View style={{ height: insets.bottom + 65 }} />
						</ScrollView>
					</GlassContainer>
				)}

				<View style={[s.headerWrapper, { height: headerTotalHeight }]} pointerEvents="box-none" collapsable={false}>
					<GlassView
						glassEffectStyle="regular"
						tintColor="rgba(255,255,255,0.08)"
						style={[s.headerGlass, { height: headerBarHeight }]}
					/>
					<LinearGradient
						colors={["rgba(238,243,250,0.12)", "rgba(238,243,250,0)"]}
						locations={[0.6, 1]}
						style={[s.headerFade, { top: headerBarHeight - 2 }]}
						pointerEvents="none"
					/>
					<View style={[s.headerContent, { height: headerBarHeight, paddingTop: insets.top }]} pointerEvents="box-none">
						<GlassButton onPress={() => router.back()}>
							<GlassView
								glassEffectStyle="clear"
								tintColor="rgba(255,255,255,0.08)"
								isInteractive
								style={s.backBtn}
							>
								<SymbolView name="chevron.left" style={s.backIcon} tintColor="#007AFF" resizeMode="scaleAspectFit" weight="semibold" />
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
		backgroundColor: "#EEF3FA",
	},

	headerWrapper: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		zIndex: 10,
	},
	headerGlass: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "rgba(60,60,67,0.1)",
		overflow: "hidden",
	},
	headerFade: {
		position: "absolute",
		left: 0,
		right: 0,
		height: 48,
	},
	headerContent: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
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
	},
	backBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.4)",
	},
	backIcon: {
		width: 16,
		height: 16,
	},

	scrollContent: {
		paddingHorizontal: 16,
		paddingBottom: 0,
	},

	scannedCard: {
		borderRadius: 22,
		marginBottom: 20,
		overflow: "hidden",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.55)",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.07,
		shadowRadius: 10,
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
	scannedPlaceholderImg: {
		width: 44,
		height: 44,
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

	sectionHeader: {
		marginBottom: 14,
		paddingHorizontal: 2,
	},
	sectionTitle: {
		fontSize: 22,
		fontWeight: "700",
		color: "#000",
		letterSpacing: -0.5,
		marginTop: 4,
		marginBottom: 2,
	},
	sectionSubtitle: {
		fontSize: 14,
		color: "#8E8E93",
		letterSpacing: -0.1,
	},

	altCard: {
		borderRadius: 18,
		marginBottom: 10,
		overflow: "hidden",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.5)",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 6,
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
	},
	altImage: {
		width: 52,
		height: 52,
		borderRadius: 14,
		backgroundColor: "#E5E5EA",
	},
	altPlaceholderImg: {
		width: 36,
		height: 36,
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
		width: 14,
		height: 14,
		marginLeft: 4,
	},

	imagePlaceholder: {
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(120,120,128,0.08)",
	},

	emptyCard: {
		borderRadius: 22,
		alignItems: "center",
		paddingVertical: 36,
		paddingHorizontal: 24,
		overflow: "hidden",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.5)",
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
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.4)",
	},
	errorBtnText: {
		fontSize: 16,
		color: "#007AFF",
		fontWeight: "600",
		letterSpacing: -0.2,
	},
	headerSpacer: {
		width: 40,
	},
});
