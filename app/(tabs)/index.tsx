import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { Easing, Extrapolation, interpolate, SharedValue, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Background, Glass, Skeleton } from "@/constants/theme";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const BUTTON_SIZE = 46;
const BUTTON_GAP = 10;
const HORIZONTAL_PADDING = 16;
const SPRING_CONFIG = { damping: 32, stiffness: 140, mass: 0.8 };
const clamp = Extrapolation.CLAMP;

type SearchResult = {
	id: string;
	name: string;
	brand: string | null;
	description: string;
};

function SkeletonRow({ pulse }: { pulse: SharedValue<number> }) {
	const animStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
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

export default function HomeScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const [active, setActive] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const inputRef = useRef<TextInput>(null);
	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const progress = useSharedValue(0);
	const pulse = useSharedValue(0.35);

	useEffect(() => {
		if (loading) {
			pulse.value = withRepeat(withSequence(withTiming(0.9, { duration: 600 }), withTiming(0.35, { duration: 600 })), -1, false);
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
		progress.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) });
	}, [progress]);

	useEffect(() => {
		if (!active) return;
		const sub = BackHandler.addEventListener("hardwareBackPress", () => {
			close();
			return true;
		});
		return () => sub.remove();
	}, [active, close]);

	const open = () => {
		progress.value = withSpring(1, SPRING_CONFIG);
		requestAnimationFrame(() => {
			setQuery("");
			setResults([]);
			setError(null);
			setActive(true);
			setTimeout(() => inputRef.current?.focus(), 60);
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
				const res = await fetch(`${BASE_URL}/api/search?query=${encodeURIComponent(text)}`);
				if (!res.ok) throw new Error(`Server error ${res.status}`);
				const data = await res.json();
				if (Array.isArray(data)) {
					setResults(data);
				} else {
					setResults([]);
				}
			} catch (e: any) {
				setError(e?.message ?? "Network error");
				setResults([]);
			} finally {
				setLoading(false);
			}
		}, 300);
	};

	const scannerAnim = useAnimatedStyle(() => ({
		opacity: interpolate(progress.value, [0, 1], [1, 0], clamp),
		transform: [
			{ scale: interpolate(progress.value, [0, .5], [1, 0.3], clamp) },
		],
	}));

	const pillAnim = useAnimatedStyle(() => ({
		left: interpolate(progress.value, [0, .95], [BUTTON_SIZE + BUTTON_GAP, 0], clamp),
	}));

	const filterAnim = useAnimatedStyle(() => ({
		opacity: interpolate(progress.value, [0, 0.35], [1, 0], clamp),
		transform: [
			{ scale: interpolate(progress.value, [0, 0.35], [1, 0.5], clamp) },
		],
	}));

	const closeIconAnim = useAnimatedStyle(() => ({
		opacity: interpolate(progress.value, [0.45, 1], [0, 1], clamp),
		transform: [
			{ scale: interpolate(progress.value, [0.45, 1], [0.3, 1], clamp) },
			{ rotate: `${interpolate(progress.value, [0.45, 1], [-45, 0], clamp)}deg` },
		],
	}));

	const dropdownAnim = useAnimatedStyle(() => ({
		opacity: interpolate(progress.value, [0.55, 1], [0, 1], clamp),
		transform: [
			{ translateY: interpolate(progress.value, [0.55, 1], [-8, 0], clamp) },
		],
	}));

	let scannerPointerEvents: "auto" | "none" = "auto";
	if (active) {
		scannerPointerEvents = "none";
	}

	let overlayPointerEvents: "auto" | "none" = "none";
	if (active) {
		overlayPointerEvents = "auto";
	}

	let placeholder = "";
	if (active) {
		placeholder = "Search foods…";
	}

	return (
		<View style={styles.root}>
			<LinearGradient colors={Background.gradient} locations={Background.gradientLocations} style={StyleSheet.absoluteFill} />

			<Pressable style={StyleSheet.absoluteFill} onPress={close} pointerEvents={overlayPointerEvents} />

			<View style={[styles.row, { marginTop: insets.top + 14 }]}>
				<Animated.View style={[styles.absScanner, scannerAnim]} pointerEvents={scannerPointerEvents}>
					<BlurView intensity={75} tint="light" style={styles.circle}>
						<View style={styles.sheen} />
						<Pressable style={styles.fill} onPress={() => router.push("/(tabs)/scanner")}>
							<SymbolView name="barcode.viewfinder" tintColor="rgba(0,0,0,0.58)" resizeMode="scaleAspectFit" style={styles.icon22} />
						</Pressable>
					</BlurView>
				</Animated.View>

				<Animated.View style={[styles.absPill, pillAnim]}>
					<BlurView intensity={75} tint="light" style={styles.pillBlur}>
						<View style={styles.sheen} />
						<SymbolView name="magnifyingglass" tintColor="rgba(0,0,0,0.32)" resizeMode="scaleAspectFit" style={styles.magnifyIcon} />
						<View style={styles.inputWrapper}>
							<TextInput
								ref={inputRef}
								style={[styles.input, !active && styles.inputHidden]}
								placeholder={placeholder}
								placeholderTextColor="rgba(0,0,0,0.28)"
								value={query}
								onChangeText={search}
								autoCapitalize="none"
								autoCorrect={false}
								returnKeyType="search"
								editable={active}
								onFocus={() => {
									progress.value = withSpring(1, SPRING_CONFIG);
								}}
							/>
							<Pressable style={[StyleSheet.absoluteFill, styles.hintButton]} onPress={open} pointerEvents={scannerPointerEvents}>
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
								<SymbolView name="slider.horizontal.3" tintColor="rgba(0,0,0,0.58)" resizeMode="scaleAspectFit" style={styles.icon20} />
							</Animated.View>
							<Animated.View style={[StyleSheet.absoluteFill, styles.centered, closeIconAnim]}>
								<SymbolView name="xmark" tintColor="rgba(0,0,0,0.58)" resizeMode="scaleAspectFit" style={styles.icon18} />
							</Animated.View>
						</Pressable>
					</BlurView>
				</View>
			</View>

			<Animated.View style={[styles.dropdown, dropdownAnim]} pointerEvents={overlayPointerEvents}>
				<BlurView intensity={85} tint="light" style={styles.dropdownBlur}>
					<View style={styles.dropdownSheen} />

					{!loading && !error && query.length === 0 && (
						<View style={styles.empty}>
							<SymbolView name="magnifyingglass" tintColor="rgba(0,0,0,0.16)" resizeMode="scaleAspectFit" style={styles.emptyIcon} />
							<Text style={styles.emptyText}>Start typing to search</Text>
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
							<Text style={styles.emptyText}>{`No results for "${query}"`}</Text>
						</View>
					)}

					{!loading && results.length > 0 && (
						<FlatList<SearchResult>
							data={results}
							keyExtractor={(item) => item.id}
							keyboardShouldPersistTaps="handled"
							showsVerticalScrollIndicator={false}
							style={styles.resultList}
							renderItem={({ item, index }) => (
								<Pressable style={({ pressed }) => [styles.resultRow, index < results.length - 1 && styles.divider, pressed && styles.pressed]} onPress={() => router.push(`/product/${item.id}`)}>
									<View style={styles.resultIcon}>
										<SymbolView name="fork.knife" tintColor="rgba(0,0,0,0.28)" resizeMode="scaleAspectFit" style={styles.icon14} />
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
									<SymbolView name="chevron.right" tintColor="#C7C7CC" resizeMode="scaleAspectFit" style={styles.icon12} />
								</Pressable>
							)}
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

	row: {
		height: BUTTON_SIZE,
		marginHorizontal: HORIZONTAL_PADDING,
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
		marginTop: 10,
		marginHorizontal: HORIZONTAL_PADDING,
		borderRadius: 20,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 6 },
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
	emptyText: {
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
	divider: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "rgba(60,60,67,0.08)",
	},
	pressed: {
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
