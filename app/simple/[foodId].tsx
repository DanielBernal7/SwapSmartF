import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withDelay, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { Stack } from "expo-router";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const SUGAR_ALIASES = [
	"high fructose corn syrup",
	"corn syrup",
	"corn syrup solids",
	"dextrose",
	"fructose",
	"glucose",
	"maltose",
	"sucrose",
	"lactose",
	"galactose",
	"ribose",
	"trehalose",
	"cane sugar",
	"cane juice",
	"evaporated cane juice",
	"cane juice crystals",
	"raw cane sugar",
	"turbinado sugar",
	"demerara sugar",
	"muscovado",
	"coconut sugar",
	"palm sugar",
	"date sugar",
	"beet sugar",
	"brown sugar",
	"powdered sugar",
	"confectioners sugar",
	"invert sugar",
	"invert syrup",
	"golden syrup",
	"maple syrup",
	"agave syrup",
	"agave nectar",
	"honey",
	"molasses",
	"blackstrap molasses",
	"sorghum syrup",
	"rice syrup",
	"brown rice syrup",
	"barley malt syrup",
	"malt syrup",
	"malt extract",
	"barley malt extract",
	"caramel",
	"caramel syrup",
	"fruit juice concentrate",
	"apple juice concentrate",
	"grape juice concentrate",
	"pear juice concentrate",
	"dextrin",
	"maltodextrin",
	"polydextrose",
	"sorbitol",
	"xylitol",
	"mannitol",
	"erythritol",
	"isomalt",
	"lactitol",
	"treacle",
	"syrup",
];

type Serving = {
	serving_description: string;
	calories: number | null;
	total_fat: number | null;
	total_carbs: number | null;
	protein: number | null;
	total_sugars: number | null;
	sodium: number | null;
	saturated_fat: number | null;
	trans_fat: number | null;
	polyunsaturated_fat: number | null;
	monounsaturated_fat: number | null;
	cholesterol: number | null;
	dietary_fiber: number | null;
	added_sugars: number | null;
};

type FoodDetail = {
	id: string;
	name: string;
	brand: string | null;
	image_url: string | null;
	serving_size: string | null;
	calories: number | null;
	total_fat: number | null;
	total_carbs: number | null;
	protein: number | null;
	total_sugars: number | null;
	sodium: number | null;
	saturated_fat: number | null;
	trans_fat: number | null;
	polyunsaturated_fat: number | null;
	monounsaturated_fat: number | null;
	cholesterol: number | null;
	dietary_fiber: number | null;
	added_sugars: number | null;
	ingredients: string | null;
	all_servings: Serving[];
	categories: string[];
};

const NAV_BAR_HEIGHT = 44;

function ServingPicker({ servings, selectedIndex, onSelect }: { servings: Serving[]; selectedIndex: number; onSelect: (i: number) => void }) {
	if (servings.length <= 1) return null;

	return (
		<View>
			<Text style={sectionStyles.sectionTitle}>Serving Size</Text>
			<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sectionStyles.pills}>
				{servings.map((serving, i) => (
					<Pressable key={i} onPress={() => onSelect(i)} style={[sectionStyles.pill, i === selectedIndex && sectionStyles.pillActive]}>
						<Text style={[sectionStyles.pillText, i === selectedIndex && sectionStyles.pillTextActive]}>{serving.serving_description}</Text>
					</Pressable>
				))}
			</ScrollView>
		</View>
	);
}

function HighlightedIngredients({ text }: { text: string }) {
	const lower = text.toLowerCase();
	const segments: { text: string; highlight: boolean }[] = [];
	let pos = 0;

	type Match = { start: number; end: number };
	const matches: Match[] = [];

	for (const alias of SUGAR_ALIASES) {
		let idx = lower.indexOf(alias, 0);
		while (idx !== -1) {
			matches.push({ start: idx, end: idx + alias.length });
			idx = lower.indexOf(alias, idx + 1);
		}
	}

	matches.sort((a, b) => a.start - b.start);
	const merged: Match[] = [];
	for (const m of matches) {
		if (merged.length > 0 && m.start < merged[merged.length - 1].end) {
			merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, m.end);
		} else {
			merged.push({ ...m });
		}
	}

	for (const m of merged) {
		if (pos < m.start) {
			segments.push({ text: text.slice(pos, m.start), highlight: false });
		}
		segments.push({ text: text.slice(m.start, m.end), highlight: true });
		pos = m.end;
	}
	if (pos < text.length) {
		segments.push({ text: text.slice(pos), highlight: false });
	}

	return (
		<Text style={ingredientStyles.body}>
			{segments.map((seg, i) => {
				if (seg.highlight) {
					return (
						<Text key={i} style={ingredientStyles.highlighted}>
							{seg.text}
						</Text>
					);
				}
				return <Text key={i}>{seg.text}</Text>;
			})}
		</Text>
	);
}

type NutritionRowDef = {
	label: string;
	value: number | null | undefined;
	unit: string;
	accent?: boolean;
	sub?: boolean;
};

function NutritionCard({ detail, serving }: { detail: FoodDetail; serving: Serving | null }) {
	const rows: NutritionRowDef[] = [
		{
			label: "Calories",
			value: serving?.calories ?? detail.calories,
			unit: "",
		},
		{
			label: "Total Fat",
			value: serving?.total_fat ?? detail.total_fat,
			unit: "g",
		},
		{
			label: "Saturated Fat",
			value: serving?.saturated_fat ?? detail.saturated_fat,
			unit: "g",
			sub: true,
		},
		{
			label: "Total Carbs",
			value: serving?.total_carbs ?? detail.total_carbs,
			unit: "g",
		},
		{
			label: "Dietary Fiber",
			value: serving?.dietary_fiber ?? detail.dietary_fiber,
			unit: "g",
			sub: true,
		},
		{
			label: "Total Sugars",
			value: serving?.total_sugars ?? detail.total_sugars,
			unit: "g",
			sub: true,
			accent: true,
		},
		{
			label: "Added Sugars",
			value: serving?.added_sugars ?? detail.added_sugars,
			unit: "g",
			sub: true,
		},
		{ label: "Protein", value: serving?.protein ?? detail.protein, unit: "g" },
		{ label: "Sodium", value: serving?.sodium ?? detail.sodium, unit: "mg" },
	];

	let servingLabel = "Nutrition";
	if (detail.serving_size) {
		servingLabel = `Nutrition  ·  per ${detail.serving_size}`;
	}

	return (
		<GlassCard style={styles.card}>
			<View style={styles.cardInner}>
				<Text style={sectionStyles.sectionTitle}>{servingLabel}</Text>
				{rows.map((row, i) => {
					let rowValue = "—";
					if (row.value != null) {
						rowValue = `${row.value}${row.unit}`;
					}
					return (
						<View key={row.label} style={[statStyles.row, i < rows.length - 1 && statStyles.rowDivider]}>
							<Text style={[statStyles.rowLabel, row.sub && statStyles.rowLabelSub, row.accent && statStyles.rowLabelAccent]}>{row.label}</Text>
							<Text style={[statStyles.rowValue, row.accent && statStyles.rowValueAccent]}>{rowValue}</Text>
						</View>
					);
				})}
			</View>
		</GlassCard>
	);
}

function AvailabilityRow({ name }: { name: string }) {
	const encoded = encodeURIComponent(name);
	const stores = [
		{
			label: "Instacart",
			url: `https://www.instacart.com/store/search_v3/term?term=${encoded}`,
		},
		{
			label: "Amazon Fresh",
			url: `https://www.amazon.com/s?k=${encoded}&i=amazonfresh`,
		},
		{
			label: "Walmart",
			url: `https://www.walmart.com/search?q=${encoded}`,
		},
	];

	return (
		<View>
			<Text style={sectionStyles.sectionTitle}>Check availability on</Text>
			<View style={availabilityStyles.row}>
				{stores.map((store) => (
					<Pressable key={store.label} style={availabilityStyles.chip} onPress={() => Linking.openURL(store.url)}>
						<Text style={availabilityStyles.chipText}>{store.label}</Text>
					</Pressable>
				))}
			</View>
		</View>
	);
}

export default function ProductDetailScreen() {
  const { foodId } = useLocalSearchParams<{ foodId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [detail, setDetail] = useState<FoodDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServingIndex, setSelectedServingIndex] = useState(0);

  const headerBarHeight = insets.top + NAV_BAR_HEIGHT;

  let headerTitle = "Product Detail";
  if (loading) {
    headerTitle = "Loading...";
  } else if (detail?.name) {
    headerTitle = detail.name;
  }

  useEffect(() => {
    if (!foodId) return;
    fetch(`${BASE_URL}/api/food-by-id/${foodId}`)
      .then((res) => {
        if (!res.ok) return res.json().then((e) => Promise.reject(e.error || "Not found"));
        return res.json();
      })
      .then((json: FoodDetail) => setDetail(json))
      .catch((err) => {
        if (typeof err === "string") {
          setError(err);
        } else {
          setError("Failed to load product");
        }
      })
      .finally(() => setLoading(false));
  }, [foodId]);

  let currentServing: Serving | null = null;
  if (detail && detail.all_servings) {
    currentServing = detail.all_servings[selectedServingIndex];
  }

  return (
    <>
      {/* 🔥 THIS HIDES THE DEFAULT HEADER */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        <LinearGradient
          colors={["#EEF3FA", "#F0F4F8", "#F2F2F7"]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.headerWrapper, { height: headerBarHeight }]} pointerEvents="box-none">
          <GlassCard style={[styles.headerGlass, { height: headerBarHeight }]} />
          <View
            style={[styles.headerContent, { height: headerBarHeight, paddingTop: insets.top }]}
            pointerEvents="box-none"
          >
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <SymbolView
                name="chevron.left"
                style={styles.backIcon}
                tintColor="#007AFF"
                resizeMode="scaleAspectFit"
                weight="semibold"
              />
            </Pressable>

            <Text style={styles.headerTitle} numberOfLines={1}>
              {headerTitle}
            </Text>

            <View style={styles.headerSpacer} />
          </View>
        </View>

        {loading && (
          <View style={styles.centerState}>
            <Animated.View entering={FadeIn.duration(300)}>
              <ActivityIndicator size="large" color="#007AFF" />
            </Animated.View>
            <Animated.Text entering={FadeIn.delay(200).duration(400)} style={styles.loadingText}>
              Loading product…
            </Animated.Text>
          </View>
        )}

        {error && (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => router.back()} style={styles.errorBtn}>
              <Text style={styles.errorBtnText}>Go Back</Text>
            </Pressable>
          </View>
        )}

        {!loading && !error && detail && (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingTop: headerBarHeight + 20 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.productHeader}>
              <Text style={styles.productName}>{detail.name}</Text>
              {detail.brand && <Text style={styles.productBrand}>{detail.brand}</Text>}
            </View>

            {detail.all_servings?.length > 1 && (
              <GlassCard style={styles.card}>
                <View style={styles.cardInner}>
                  <ServingPicker
                    servings={detail.all_servings}
                    selectedIndex={selectedServingIndex}
                    onSelect={setSelectedServingIndex}
                  />
                </View>
              </GlassCard>
            )}

            <NutritionCard detail={detail} serving={currentServing} />

            {detail.ingredients && (
              <GlassCard style={styles.card}>
                <View style={styles.cardInner}>
                  <Text style={sectionStyles.sectionTitle}>Ingredients</Text>
                  <HighlightedIngredients text={detail.ingredients} />
                  <View style={ingredientStyles.legend}>
                    <View style={ingredientStyles.legendDot} />
                    <Text style={ingredientStyles.legendText}>
                      Sugar aliases highlighted in red
                    </Text>
                  </View>
                </View>
              </GlassCard>
            )}

            <GlassCard style={styles.card}>
              <View style={styles.cardInner}>
                <AvailabilityRow name={detail.name} />
              </View>
            </GlassCard>

            <View style={{ height: insets.bottom + 32 }} />
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#EEF3FA" },
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
		flex: 1,
		fontSize: 17,
		fontWeight: "600",
		color: "#000",
		letterSpacing: -0.4,
		textAlign: "center",
		marginHorizontal: 8,
	},
	backBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	backIcon: { width: 16, height: 16 },
	headerSpacer: { width: 40 },
	scrollContent: {
		paddingHorizontal: 16,
	},
	productHeader: {
		marginBottom: 16,
		paddingHorizontal: 2,
	},
	productName: {
		fontSize: 22,
		fontWeight: "700",
		color: "#000",
		letterSpacing: -0.5,
		marginBottom: 4,
	},
	productBrand: {
		fontSize: 15,
		color: "#8E8E93",
		letterSpacing: -0.1,
	},
	card: {
		borderRadius: 18,
		marginBottom: 14,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.55)",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.07,
		shadowRadius: 8,
	},
	cardInner: {
		padding: 16,
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
		backgroundColor: "rgba(0,122,255,0.1)",
		borderRadius: 14,
		paddingHorizontal: 24,
		paddingVertical: 12,
	},
	errorBtnText: {
		fontSize: 15,
		color: "#007AFF",
		fontWeight: "600",
	},
});

const sectionStyles = StyleSheet.create({
	sectionTitle: {
		fontSize: 13,
		fontWeight: "600",
		color: "#8E8E93",
		letterSpacing: 0.5,
		textTransform: "uppercase",
		marginBottom: 12,
	},
	pills: {
		flexDirection: "row",
		gap: 8,
		paddingBottom: 2,
	},
	pill: {
		borderRadius: 20,
		paddingHorizontal: 14,
		paddingVertical: 7,
		backgroundColor: "rgba(120,120,128,0.1)",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(60,60,67,0.1)",
	},
	pillActive: {
		backgroundColor: "#007AFF",
		borderColor: "#007AFF",
	},
	pillText: {
		fontSize: 13,
		fontWeight: "500",
		color: "#3C3C43",
		letterSpacing: -0.1,
	},
	pillTextActive: {
		color: "#fff",
	},
});


const ingredientStyles = StyleSheet.create({
	body: {
		fontSize: 13,
		color: "#3C3C43",
		lineHeight: 20,
		letterSpacing: -0.1,
	},
	highlighted: {
		color: "#FF3B30",
		fontWeight: "600",
	},
	legend: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 10,
	},
	legendDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#FF3B30",
	},
	legendText: {
		fontSize: 11,
		color: "#8E8E93",
		letterSpacing: -0.1,
	},
});

const availabilityStyles = StyleSheet.create({
	row: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
	},
	chip: {
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 9,
		backgroundColor: "rgba(0,122,255,0.08)",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(0,122,255,0.2)",
	},
	chipText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#007AFF",
		letterSpacing: -0.2,
	},
});

const statStyles = StyleSheet.create({
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "baseline",
		paddingVertical: 9,
	},
	rowDivider: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "rgba(60,60,67,0.1)",
	},
	rowLabel: {
		fontSize: 15,
		color: "#1C1C1E",
		letterSpacing: -0.2,
	},
	rowLabelSub: {
		paddingLeft: 16,
		fontSize: 14,
		color: "#6C6C70",
	},
	rowLabelAccent: {
		color: "#E8704A",
		fontWeight: "600",
	},
	rowValue: {
		fontSize: 15,
		fontWeight: "500",
		color: "#1C1C1E",
		letterSpacing: -0.2,
	},
	rowValueAccent: {
		color: "#E8704A",
		fontWeight: "700",
	},
});

const sugarVizStyles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 13,
	},
	badge: {
		backgroundColor: "rgba(88,86,214,0.10)",
		borderRadius: 20,
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(88,86,214,0.25)",
	},
	badgeText: {
		fontSize: 13,
		fontWeight: "700",
		color: "#5856D6",
		letterSpacing: -0.3,
	},
	rowLabel: {
		fontSize: 13,
		fontWeight: "500",
		color: "#8E8E93",
		letterSpacing: -0.1,
		marginBottom: 5,
		marginLeft: 48,
	},
	swapLabelLine: {
		flexDirection: "row",
		alignItems: "center",
		gap: 3,
		marginBottom: 5,
	},
	checkIcon: {
		width: 14,
		height: 14,
		marginLeft: 45,
	},
	rowLabelIndigo: {
		fontSize: 13,
		fontWeight: "600",
		color: "#5856D6",
		letterSpacing: -0.1,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	gap: {
		height: 16,
	},
	numMuted: {
		width: 40,
		textAlign: "left",
		bottom: 5,
		fontSize: 29,
		fontWeight: "600",
		color: "#8E8E93",
		letterSpacing: -0.1,
	},
	numIndigo: {
		width: 40,
		textAlign: "left",
		bottom: 5,
		fontSize: 29,
		fontWeight: "700",
		color: "#5856D6",
		letterSpacing: -0.1,
	},
	trackNeutral: {
		flex: 1,
		height: 12,
		borderRadius: 7,
		overflow: "hidden",
		backgroundColor: "rgba(142,142,147,0.10)",
	},
	trackIndigo: {
		flex: 1,
		height: 12,
		borderRadius: 7,
		overflow: "hidden",
		backgroundColor: "rgba(88,86,214,0.10)",
		flexDirection: "row",
	},
	fill: {
		borderRadius: 7,
		overflow: "hidden",
	},
	footer: {
		flexDirection: "row",
		alignItems: "baseline",
		justifyContent: "center",
		marginTop: 16,
		paddingTop: 14,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: "rgba(60,60,67,0.08)",
	},
	footerNum: {
		fontSize: 15,
		fontWeight: "700",
		color: "#5856D6",
		letterSpacing: 0.08,
		marginRight: 1.2,
	},
	footerSub: {
		fontSize: 13,
		fontWeight: "400",
		color: "#8E8E93",
		letterSpacing: -0.1,
	},
});