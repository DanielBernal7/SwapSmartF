import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { Easing, Extrapolation, interpolate, SharedValue, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Background, Glass, Skeleton } from "@/constants/theme";
import { loadSwaps, type RecentSwap } from "@/utils/swapStorage";
import MaskedView from "@react-native-masked-view/masked-view";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const BUTTON_SIZE = 46;
const BUTTON_GAP = 10;
const horizontalPadding = 20;
const springConfig = { damping: 32, stiffness: 140, mass: 0.8 };
const extrapolationType = Extrapolation.CLAMP;

const heroColor = "#bf994e";
const accentColor = "#1e6394";

type SearchResult = {
	id: string;
	name: string;
	brand: string | null;
	description: string;
};

type DisplaySwap = {
	id: string;
	original: string;
	originalBrand?: string | null;
	originalSugar: number;
	swap: string;
	swapBrand?: string | null;
	swapSugar: number;
	savings: number;
	time?: string;
	scanTimes?: number[];
	onPress?: () => void;
};

const SEED: DisplaySwap[] = [
	{
		id: "s1",
		original: "Kellogg's Frosted Flakes",
		originalSugar: 37,
		swap: "Special K Original",
		swapSugar: 15,
		savings: 22,
	},
	{
		id: "s2",
		original: "Coca-Cola Classic",
		originalSugar: 11,
		swap: "Coca-Cola Zero Sugar",
		swapSugar: 0,
		savings: 11,
	},
	{
		id: "s3",
		original: "Quaker Honey & Oats",
		originalSugar: 22,
		swap: "Quaker Plain Rolled Oats",
		swapSugar: 5,
		savings: 17,
	},
	{
		id: "s4",
		original: "Nutella",
		originalSugar: 57,
		swap: "Pic's Peanut Butter",
		swapSugar: 6,
		savings: 51,
	},
];

const SEED_TOTAL = SEED.reduce((total, seedItem) => total + seedItem.savings, 0);

function greeting(): string {
	const hour = new Date().getHours();
	if (hour < 12) {
		return "Good morning.";
	}
	if (hour < 18) {
		return "Good afternoon.";
	}
	return "Good evening.";
}

function formatDate(): string {
	return new Date().toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
	});
}

function timeAgo(timestamp: number): string {
	const diff = Date.now() - timestamp;
	const minutes = Math.floor(diff / 60000);

	if (minutes < 1) {
		return "just now";
	}
	if (minutes < 60) {
		return `${minutes}m ago`;
	}

	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		return `${hours}h ago`;
	}

	const days = Math.floor(hours / 24);
	if (days === 1) {
		return "yesterday";
	}
	return `${days}d ago`;
}

function SkeletonRow({ pulse }: { pulse: SharedValue<number> }) {
	const animStyle = useAnimatedStyle(() => {
		return {
			opacity: pulse.value,
		};
	});

	return (
		<Animated.View style={[styles.resultRow, animStyle]}>
			<View style={[styles.resultIcon, styles.skelBox]} />
			<View style={styles.skelContent}>
				<View style={[styles.skelLine, styles.skelLineWide]} />
				<View style={[styles.skelLine, styles.skelLineNarrow]} />
			</View>
		</Animated.View>
	);
}

function SwapRow({ item }: { item: DisplaySwap }) {
	const [expanded, setExpanded] = useState(false);
	const multiScan = (item.scanTimes?.length ?? 1) > 1;

	let chevronName: SFSymbol = "chevron.down";
	if (expanded) {
		chevronName = "chevron.up";
	}

	let brandInline = null;
	if (item.originalBrand) {
		brandInline = <Text style={styles.swapBrandInline}> {item.originalBrand}</Text>;
	}

	const getSwapCardStyle = ({ pressed }: { pressed: boolean }) => {
		const cardStyles: object[] = [styles.swapCard];
		if (pressed && item.onPress) {
			cardStyles.push(styles.swapRowPressed);
		}
		return cardStyles;
	};

	return (
		<View style={styles.swapRow}>
			{item.time && (
				<View style={styles.swapTimeLine}>
					{multiScan && (
						<Pressable
							style={styles.scanToggle}
							onPress={() => {
								setExpanded((current) => !current);
							}}
						>
							<Text style={styles.swapScanCount}>{item.scanTimes!.length} scans</Text>
							<SymbolView
								name={chevronName}
								tintColor={accentColor}
								resizeMode="scaleAspectFit"
								style={styles.scanChevron}
							/>
						</Pressable>
					)}
					<Text style={styles.swapTimeText}>{item.time}</Text>
				</View>
			)}
			<Pressable style={getSwapCardStyle} onPress={item.onPress} disabled={!item.onPress}>
				<View style={styles.swapAccent} />
				<View style={styles.swapBody}>
					<Text style={styles.swapOriginalText} numberOfLines={1}>
						{item.original}
						{brandInline}
					</Text>
					<View style={styles.swapBottomRow}>
						<View style={styles.swapNameCol}>
							<View style={styles.swapNameRow}>
								<Text style={styles.swapArrow}>↳</Text>
								<Text style={styles.swapSwapText} numberOfLines={1}>
									{item.swap}
								</Text>
							</View>
							{item.swapBrand && (
								<Text style={styles.swapBrandText} numberOfLines={1}>
									{item.swapBrand}
								</Text>
							)}
						</View>
						<Text style={styles.swapSavingsText}>−{item.savings}g</Text>
					</View>
				</View>
			</Pressable>
			{expanded && multiScan && (
				<View style={styles.scanHistory}>
					{item.scanTimes!.map((timestamp, index) => {
						let latestLabel = "";
						if (index === 0) {
							latestLabel = "Latest — ";
						}

						return (
							<View key={timestamp} style={styles.scanHistoryRow}>
								<View style={styles.scanHistoryDot} />
								<Text style={styles.scanHistoryTime}>
									{latestLabel}
									{timeAgo(timestamp)}
								</Text>
							</View>
						);
					})}
				</View>
			)}
		</View>
	);
}

export default function HomeScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const [active, setActive] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [recentSwaps, setRecentSwaps] = useState<RecentSwap[]>([]);

	const inputRef = useRef<TextInput>(null);
	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const progress = useSharedValue(0);
	const pulse = useSharedValue(0.35);

	useFocusEffect(
		useCallback(() => {
			loadSwaps().then(setRecentSwaps);
		}, []),
	);

	useEffect(() => {
		if (loading) {
			pulse.value = withRepeat(
				withSequence(
					withTiming(0.9, { duration: 600 }),
					withTiming(0.35, { duration: 600 })
				),
				-1,
				false
			);
		} else {
			pulse.value = 0.35;
		}
	}, [loading, pulse]);

	const close = useCallback(() => {
		Keyboard.dismiss();

		if (debounceTimer.current) {
			clearTimeout(debounceTimer.current);
		}

		setActive(false);
		setQuery("");
		setResults([]);
		setError(null);
		setLoading(false);

		progress.value = withTiming(0, {
			duration: 240,
			easing: Easing.out(Easing.cubic),
		});
	}, [progress]);

	useEffect(() => {
		if (!active) {
			return;
		}

		const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
			close();
			return true;
		});

		return () => {
			subscription.remove();
		};
	}, [active, close]);

	const open = () => {
		progress.value = withSpring(1, springConfig);
		requestAnimationFrame(() => {
			setQuery("");
			setResults([]);
			setError(null);
			setActive(true);
			setTimeout(() => {
				inputRef.current?.focus();
			}, 60);
		});
	};

	const search = (text: string) => {
		setQuery(text);
		setError(null);

		if (debounceTimer.current) {
			clearTimeout(debounceTimer.current);
		}

		if (!text.trim()) {
			setResults([]);
			setLoading(false);
			return;
		}

		if (!BASE_URL) {
			setError("EXPO_PUBLIC_API_URL is not set");
			return;
		}

		setLoading(true);

		debounceTimer.current = setTimeout(async () => {
			try {
				const response = await fetch(`${BASE_URL}/api/search?query=${encodeURIComponent(text)}`);

				if (!response.ok) {
					throw new Error(`Server error ${response.status}`);
				}

				const data = await response.json();

				if (Array.isArray(data)) {
					setResults(data);
				} else {
					setResults([]);
				}
			} catch (err: any) {
				setError(err?.message ?? "Network error");
				setResults([]);
			} finally {
				setLoading(false);
			}
		}, 300);
	};

	const scannerAnim = useAnimatedStyle(() => {
		return {
			opacity: interpolate(progress.value, [0, 1], [1, 0], extrapolationType),
			transform: [
				{
					scale: interpolate(progress.value, [0, 0.5], [1, 0.3], extrapolationType),
				},
			],
		};
	});

	const pillAnim = useAnimatedStyle(() => {
		return {
			left: interpolate(
				progress.value,
				[0, 0.95],
				[BUTTON_SIZE + BUTTON_GAP, 0],
				extrapolationType
			),
		};
	});

	const filterAnim = useAnimatedStyle(() => {
		return {
			opacity: interpolate(progress.value, [0, 0.35], [1, 0], extrapolationType),
			transform: [
				{
					scale: interpolate(progress.value, [0, 0.35], [1, 0.5], extrapolationType),
				},
			],
		};
	});

	const closeIconAnim = useAnimatedStyle(() => {
		return {
			opacity: interpolate(progress.value, [0.45, 1], [0, 1], extrapolationType),
			transform: [
				{
					scale: interpolate(progress.value, [0.45, 1], [0.3, 1], extrapolationType),
				},
				{
					rotate: `${interpolate(progress.value, [0.45, 1], [-45, 0], extrapolationType)}deg`,
				},
			],
		};
	});

	const dropdownAnim = useAnimatedStyle(() => {
		return {
			opacity: interpolate(progress.value, [0.55, 1], [0, 1], extrapolationType),
			transform: [
				{
					translateY: interpolate(progress.value, [0.55, 1], [-8, 0], extrapolationType),
				},
			],
		};
	});

	const contentAnim = useAnimatedStyle(() => {
		return {
			opacity: interpolate(progress.value, [0, 0.35], [1, 0], extrapolationType),
		};
	});

	const hasSwaps = recentSwaps.length > 0;

	let displaySwaps: DisplaySwap[];
	if (hasSwaps) {
		displaySwaps = recentSwaps.map((recentSwap) => {
			let onPress: (() => void) | undefined = undefined;
			if (recentSwap.swap.foodId) {
				onPress = () => router.push(`/product/${recentSwap.swap.foodId}`);
			}

			return {
				id: recentSwap.id,
				original: recentSwap.original.name,
				originalBrand: recentSwap.original.brand,
				originalSugar: recentSwap.original.sugar ?? 0,
				swap: recentSwap.swap.name,
				swapBrand: recentSwap.swap.brand,
				swapSugar: recentSwap.swap.sugar ?? 0,
				savings: Math.max(
					0,
					Math.round((recentSwap.original.sugar ?? 0) - (recentSwap.swap.sugar ?? 0))
				),
				time: timeAgo(recentSwap.savedAt),
				scanTimes: recentSwap.scanTimes,
				onPress,
			};
		});
	} else {
		displaySwaps = SEED;
	}

	let totalSaved: number;
	if (hasSwaps) {
		totalSaved = displaySwaps.reduce((total, swapItem) => total + swapItem.savings, 0);
	} else {
		totalSaved = SEED_TOTAL;
	}

	let sectionTitle = "POPULAR SWAPS";
	if (hasSwaps) {
		sectionTitle = "RECENT";
	}

	let pluralSuffix = "";
	if (displaySwaps.length !== 1) {
		pluralSuffix = "s";
	}

	let scannerPointerEvents: "auto" | "none" = "auto";
	if (active) {
		scannerPointerEvents = "none";
	}

	let overlayPointerEvents: "auto" | "none" = "none";
	if (active) {
		overlayPointerEvents = "auto";
	}

	let scrollPointerEvents: "auto" | "none" = "auto";
	if (active) {
		scrollPointerEvents = "none";
	}

	const searchBarTop = insets.top + 14;
	const dropdownTop = searchBarTop + BUTTON_SIZE + 10;

	return (
		<View style={styles.root}>
			<LinearGradient
				colors={Background.gradient}
				locations={Background.gradientLocations}
				style={StyleSheet.absoluteFill}
			/>

			<Animated.ScrollView
				style={[styles.scroll, contentAnim]}
				contentContainerStyle={[
					styles.scrollContent,
					{
						paddingTop: searchBarTop + BUTTON_SIZE + 28,
						paddingBottom: insets.bottom + 90,
					},
				]}
				showsVerticalScrollIndicator={false}
				pointerEvents={scrollPointerEvents}
			>
				<Text style={styles.greet}>{greeting()}</Text>
				<Text style={styles.date}>{formatDate()}</Text>

				<View style={styles.metric}>
					<MaskedView maskElement={<Text style={styles.metricNum}>{totalSaved}g</Text>}>
						<LinearGradient
							colors={["#bf994e", "#997b3f", "#b58c3c", "#8f6f31"]}
							locations={[0, 0.35, 0.65, 0.9]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
						>
							<Text style={[styles.metricNum, { opacity: 0 }]}>{totalSaved}g</Text>
						</LinearGradient>
					</MaskedView>
					<Text style={styles.metricLabel}>sugar avoided</Text>
					<Text style={styles.metricSub}>
						across {displaySwaps.length} swap{pluralSuffix}
					</Text>
				</View>

				<Text style={styles.sectionLabel}>{sectionTitle}</Text>
				<View style={styles.sectionLine} />

				{displaySwaps.map((item, i) => (
					<View key={item.id}>
						<SwapRow item={item} />
						{i < displaySwaps.length - 1 && <View style={styles.rowDivider} />}
					</View>
				))}
			</Animated.ScrollView>

			<Pressable
				style={StyleSheet.absoluteFill}
				onPress={close}
				pointerEvents={overlayPointerEvents}
			/>

			<View style={[styles.searchRow, { top: searchBarTop }]} pointerEvents="box-none">
				<Animated.View
					style={[styles.absScanner, scannerAnim]}
					pointerEvents={scannerPointerEvents}
				>
					<BlurView intensity={75} tint="light" style={styles.circle}>
						<View style={styles.sheen} />
						<Pressable style={styles.fill} onPress={() => router.push("/(tabs)/scanner")}>
							<SymbolView
								name="barcode.viewfinder"
								tintColor="rgba(0,0,0,0.58)"
								resizeMode="scaleAspectFit"
								style={styles.icon22}
							/>
						</Pressable>
					</BlurView>
				</Animated.View>

				<Animated.View style={[styles.absPill, pillAnim]}>
					<BlurView intensity={75} tint="light" style={styles.pillBlur}>
						<View style={styles.sheen} />
						<SymbolView
							name="magnifyingglass"
							tintColor="rgba(0,0,0,0.32)"
							resizeMode="scaleAspectFit"
							style={styles.magnifyIcon}
						/>
						<View style={styles.inputWrapper}>
							<TextInput
								ref={inputRef}
								style={active ? styles.input : [styles.input, styles.inputHidden]}
								placeholder="Search foods…"
								placeholderTextColor="rgba(0,0,0,0.28)"
								value={query}
								onChangeText={search}
								autoCapitalize="none"
								autoCorrect={false}
								returnKeyType="search"
								editable={active}
								onFocus={() => {
									progress.value = withSpring(1, springConfig);
								}}
							/>
							<Pressable
								style={[StyleSheet.absoluteFill, styles.hintButton]}
								onPress={open}
								pointerEvents={scannerPointerEvents}
							>
								{!active && <Text style={styles.hint}>Search foods…</Text>}
							</Pressable>
						</View>
					</BlurView>
				</Animated.View>

				<View style={styles.absRight}>
					<BlurView intensity={75} tint="light" style={styles.circle}>
						<View style={styles.sheen} />
						<Pressable
							style={styles.fill}
							onPress={() => {
								if (active) {
									close();
								} else {
									router.push("/(tabs)/search");
								}
							}}
						>
							<Animated.View style={[StyleSheet.absoluteFill, styles.centered, filterAnim]}>
								<SymbolView
									name="slider.horizontal.3"
									tintColor="rgba(0,0,0,0.58)"
									resizeMode="scaleAspectFit"
									style={styles.icon20}
								/>
							</Animated.View>
							<Animated.View style={[StyleSheet.absoluteFill, styles.centered, closeIconAnim]}>
								<SymbolView
									name="xmark"
									tintColor="rgba(0,0,0,0.58)"
									resizeMode="scaleAspectFit"
									style={styles.icon18}
								/>
							</Animated.View>
						</Pressable>
					</BlurView>
				</View>
			</View>

			<Animated.View
				style={[styles.dropdown, dropdownAnim, { top: dropdownTop }]}
				pointerEvents={overlayPointerEvents}
			>
				<BlurView intensity={85} tint="light" style={styles.dropdownBlur}>
					<View style={styles.dropdownSheen} />

					{!loading && !error && query.length === 0 && (
						<View style={styles.empty}>
							<SymbolView
								name="magnifyingglass"
								tintColor="rgba(0,0,0,0.16)"
								resizeMode="scaleAspectFit"
								style={styles.emptyIcon}
							/>
							<Text style={styles.emptyLabel}>Start typing to search</Text>
						</View>
					)}

					{loading && (
						<View style={styles.skeletonList}>
							{[0, 1, 2, 3].map((i) => (
								<SkeletonRow key={i} pulse={pulse} />
							))}
						</View>
					)}

					{!loading && error && (
						<View style={styles.empty}>
							<Text style={styles.errorText}>{error}</Text>
						</View>
					)}

					{!loading && !error && query.length > 0 && results.length === 0 && (
						<View style={styles.empty}>
							<Text style={styles.emptyLabel}>{`No results for "${query}"`}</Text>
						</View>
					)}

					{!loading && results.length > 0 && (
						<FlatList<SearchResult>
							data={results}
							keyExtractor={(item) => item.id}
							keyboardShouldPersistTaps="handled"
							showsVerticalScrollIndicator={false}
							style={styles.resultList}
							renderItem={({ item, index }) => {
								const getRowStyle = ({ pressed }: { pressed: boolean }) => {
									const rowStyles: object[] = [styles.resultRow];

									if (index < results.length - 1) {
										rowStyles.push(styles.resultDivider);
									}

									if (pressed) {
										rowStyles.push(styles.resultPressed);
									}

									return rowStyles;
								};

								return (
									<Pressable
										style={getRowStyle}
										onPress={() => {
											router.push(`/product/${item.id}`);
										}}
									>
										<View style={styles.resultIcon}>
											<SymbolView
												name="fork.knife"
												tintColor="rgba(0,0,0,0.28)"
												resizeMode="scaleAspectFit"
												style={styles.icon14}
											/>
										</View>
										<View style={styles.resultContent}>
											<Text style={styles.resultName} numberOfLines={1}>
												{item.name}
											</Text>
											{item.brand && (
												<Text style={styles.resultBrand} numberOfLines={1}>
													{item.brand}
												</Text>
											)}
										</View>
										<SymbolView
											name="chevron.right"
											tintColor="#C7C7CC"
											resizeMode="scaleAspectFit"
											style={styles.icon12}
										/>
									</Pressable>
								);
							}}
						/>
					)}
				</BlurView>
			</Animated.View>
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
	scrollContent: {
		paddingHorizontal: horizontalPadding,
	},

	greet: {
		fontSize: 28,
		fontWeight: "700",
		color: "#1C1C1E",
		letterSpacing: -0.7,
		marginBottom: 4,
	},
	date: {
		fontSize: 14,
		color: "#8E8E93",
		letterSpacing: -0.1,
		marginBottom: 32,
	},

	metric: {
		alignItems: "center",
		marginBottom: 36,
	},
	metricNum: {
		fontSize: 72,
		fontWeight: "800",
		color: heroColor,
		letterSpacing: -4,
		lineHeight: 76,
		includeFontPadding: false,
	},
	metricLabel: {
		fontSize: 16,
		fontWeight: "500",
		color: "#1C1C1E",
		letterSpacing: -0.3,
		marginTop: 6,
	},
	metricSub: {
		fontSize: 13,
		color: "#8E8E93",
		marginTop: 4,
		letterSpacing: -0.1,
	},

	sectionLabel: {
		fontSize: 11,
		fontWeight: "600",
		color: "#8E8E93",
		letterSpacing: 1.1,
		marginBottom: 10,
	},
	sectionLine: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: "rgba(60,60,67,0.15)",
		marginBottom: 0,
	},

	swapRow: {
		paddingVertical: 14,
	},
	swapRowPressed: {
		opacity: 0.55,
	},
	swapCard: {
		flexDirection: "row",
		alignItems: "stretch",
		gap: 13,
	},
	swapAccent: {
		width: 3,
		borderRadius: 2,
		backgroundColor: accentColor,
	},
	swapBody: {
		flex: 1,
		gap: 5,
	},
	swapOriginalText: {
		fontSize: 13,
		color: "#8E8E93",
		letterSpacing: -0.1,
	},
	swapTimeLine: {
		flexDirection: "row",
		justifyContent: "flex-end",
		alignItems: "baseline",
		marginBottom: 6,
	},
	swapTimeText: {
		fontSize: 11,
		color: "#C7C7CC",
		letterSpacing: -0.1,
	},
	scanToggle: {
		flexDirection: "row",
		alignItems: "center",
		gap: 3,
		marginRight: 6,
	},
	swapScanCount: {
		fontSize: 11,
		fontWeight: "600",
		color: accentColor,
	},
	scanChevron: {
		width: 9,
		height: 9,
	},
	scanHistory: {
		marginTop: 10,
		marginLeft: 16,
		gap: 6,
	},
	scanHistoryRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	scanHistoryDot: {
		width: 5,
		height: 5,
		borderRadius: 3,
		backgroundColor: "rgba(232,112,74,0.4)",
	},
	scanHistoryTime: {
		fontSize: 12,
		color: "#8E8E93",
		letterSpacing: -0.1,
	},
	swapBottomRow: {
		flexDirection: "row",
		alignItems: "baseline",
		justifyContent: "space-between",
		gap: 8,
	},
	swapBrandInline: {
		fontSize: 12,
		color: "#C7C7CC",
		letterSpacing: -0.1,
	},
	swapNameCol: {
		flex: 1,
		gap: 2,
	},
	swapNameRow: {
		flexDirection: "row",
		alignItems: "baseline",
		gap: 5,
	},
	swapBrandText: {
		fontSize: 12,
		color: "#8E8E93",
		marginLeft: 18,
		letterSpacing: -0.1,
	},
	swapArrow: {
		fontSize: 13,
		color: accentColor,
		flexShrink: 0,
	},
	swapSwapText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#1C1C1E",
		letterSpacing: -0.3,
		flex: 1,
	},
	swapSavingsText: {
		fontSize: 13,
		fontWeight: "600",
		color: accentColor,
		letterSpacing: -0.2,
		flexShrink: 0,
	},
	rowDivider: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: "rgba(60,60,67,0.1)",
	},

	searchRow: {
		position: "absolute",
		left: horizontalPadding,
		right: horizontalPadding,
		height: BUTTON_SIZE,
	},
	absScanner: {
		position: "absolute",
		left: 0,
		top: 0,
		width: BUTTON_SIZE,
		height: BUTTON_SIZE,
	},
	absPill: {
		position: "absolute",
		top: 0,
		bottom: 0,
		right: BUTTON_SIZE + BUTTON_GAP,
	},
	absRight: {
		position: "absolute",
		right: 0,
		top: 0,
		width: BUTTON_SIZE,
		height: BUTTON_SIZE,
	},
	circle: {
		width: BUTTON_SIZE,
		height: BUTTON_SIZE,
		borderRadius: BUTTON_SIZE / 2,
		overflow: "hidden",
		borderWidth: Glass.borderWidth,
		borderColor: Glass.borderColor,
	},
	fill: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	centered: {
		alignItems: "center",
		justifyContent: "center",
	},
	pillBlur: {
		flex: 1,
		height: BUTTON_SIZE,
		borderRadius: BUTTON_SIZE / 2,
		overflow: "hidden",
		flexDirection: "row",
		alignItems: "center",
		borderWidth: Glass.borderWidth,
		borderColor: Glass.borderColor,
	},
	sheen: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: Glass.sheenColor,
	},
	inputWrapper: {
		flex: 1,
	},
	input: {
		flex: 1,
		fontSize: 16,
		color: "#1C1C1E",
		paddingVertical: 0,
		paddingRight: 14,
		letterSpacing: -0.2,
	},
	inputHidden: {
		color: "transparent",
	},
	hintButton: {
		justifyContent: "center",
	},
	hint: {
		fontSize: 16,
		color: "rgba(0,0,0,0.28)",
		paddingRight: 14,
		letterSpacing: -0.2,
	},
	magnifyIcon: {
		width: 16,
		height: 16,
		marginLeft: 13,
		marginRight: 7,
	},
	icon22: {
		width: 22,
		height: 22,
	},
	icon20: {
		width: 20,
		height: 20,
	},
	icon18: {
		width: 18,
		height: 18,
	},
	icon14: {
		width: 14,
		height: 14,
	},
	icon12: {
		width: 12,
		height: 12,
	},

	dropdown: {
		position: "absolute",
		left: horizontalPadding,
		right: horizontalPadding,
		borderRadius: 20,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 6,
		},
		shadowOpacity: 0.1,
		shadowRadius: 24,
		elevation: 10,
	},
	dropdownBlur: {
		borderRadius: 20,
		overflow: "hidden",
		borderWidth: Glass.borderWidth,
		borderColor: Glass.borderColor,
	},
	dropdownSheen: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: Glass.sheenColor,
	},
	empty: {
		paddingVertical: 22,
		alignItems: "center",
	},
	emptyIcon: {
		width: 24,
		height: 24,
		marginBottom: 6,
	},
	emptyLabel: {
		fontSize: 14,
		color: "#8E8E93",
		letterSpacing: -0.1,
	},
	errorText: {
		fontSize: 14,
		color: "#FF3B30",
		letterSpacing: -0.1,
	},
	skeletonList: {
		paddingVertical: 4,
	},
	resultList: {
		maxHeight: 320,
	},
	resultRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 14,
		paddingVertical: 11,
		gap: 10,
	},
	resultContent: {
		flex: 1,
	},
	resultDivider: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "rgba(60,60,67,0.08)",
	},
	resultPressed: {
		backgroundColor: "rgba(0,0,0,0.04)",
	},
	resultIcon: {
		width: 32,
		height: 32,
		borderRadius: 9,
		backgroundColor: "rgba(120,120,128,0.08)",
		alignItems: "center",
		justifyContent: "center",
	},
	resultName: {
		fontSize: 15,
		fontWeight: "500",
		color: "#1C1C1E",
		letterSpacing: -0.2,
	},
	resultBrand: {
		fontSize: 12,
		color: "#8E8E93",
		marginTop: 1,
		letterSpacing: -0.1,
	},
	skelContent: {
		flex: 1,
		gap: 6,
	},
	skelBox: {
		backgroundColor: Skeleton.color,
	},
	skelLine: {
		height: 10,
		borderRadius: 5,
		backgroundColor: Skeleton.color,
	},
	skelLineWide: {
		width: "70%",
	},
	skelLineNarrow: {
		width: "45%",
	},
});
