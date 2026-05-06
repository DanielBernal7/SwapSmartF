import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

type SearchResult = {
	id: string;
	name: string;
	brand: string | null;
};

type UploadStatus = "idle" | "uploading" | "done" | "error";

function ImageUploadZone({
	foodId,
	currentImage,
	onUploaded,
}: {
	foodId: string;
	currentImage: string | null;
	onUploaded: (foodId: string, uri: string) => void;
}) {
	const [status, setStatus] = useState<UploadStatus>("idle");
	const [previewUri, setPreviewUri] = useState<string | null>(currentImage);
	const [isDragOver, setIsDragOver] = useState(false);
	const zoneRef = useRef<View>(null);

	useEffect(() => {
		setPreviewUri(currentImage);
	}, [currentImage]);

	useEffect(() => {
		if (Platform.OS !== "web" || !zoneRef.current) {
			return;
		}
		const el = zoneRef.current as any;

		const onDragOver = (e: DragEvent) => {
			e.preventDefault();
			setIsDragOver(true);
		};
		const onDragLeave = () => setIsDragOver(false);
		const onDrop = (e: DragEvent) => {
			e.preventDefault();
			setIsDragOver(false);
			const file = e.dataTransfer?.files[0];
			if (file && file.type.startsWith("image/")) {
				readAndUpload(file);
			}
		};

		el.addEventListener("dragover", onDragOver);
		el.addEventListener("dragleave", onDragLeave);
		el.addEventListener("drop", onDrop);
		return () => {
			el.removeEventListener("dragover", onDragOver);
			el.removeEventListener("dragleave", onDragLeave);
			el.removeEventListener("drop", onDrop);
		};
	}, [foodId]);

	const readAndUpload = (file: File) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const dataUri = e.target?.result as string;
			if (dataUri) {
				uploadImage(dataUri);
			}
		};
		reader.readAsDataURL(file);
	};

	const uploadImage = async (imageData: string) => {
		setStatus("uploading");
		try {
			const res = await fetch(`${BASE_URL}/api/product/${foodId}/image`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ image_data: imageData }),
			});
			if (!res.ok) {
				throw new Error("Upload failed");
			}
			setPreviewUri(imageData);
			setStatus("done");
			onUploaded(foodId, imageData);
		} catch {
			setStatus("error");
			Alert.alert("Upload failed", "Could not save the image. Try again.");
		}
	};

	const pickFromLibrary = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			quality: 0.5,
			base64: true,
		});
		if (!result.canceled && result.assets[0].base64) {
			const imageData = `data:image/jpeg;base64,${result.assets[0].base64}`;
			uploadImage(imageData);
		}
	};

	return (
		<Pressable ref={zoneRef as any} onPress={pickFromLibrary} style={[s.zone, isDragOver && s.zoneDragOver]}>
			{status === "uploading" ? (
				<ActivityIndicator size="small" color="#007AFF" />
			) : previewUri ? (
				<Image source={{ uri: previewUri }} style={s.zoneImage} resizeMode="contain" />
			) : (
				<View style={s.zonePlaceholder}>
					<Text style={s.zonePlaceholderIcon}>{Platform.OS === "web" ? "⬆" : "+"}</Text>
					<Text style={s.zonePlaceholderText}>{Platform.OS === "web" ? "Drop or click" : "Tap to add"}</Text>
				</View>
			)}
			{status === "done" && (
				<View style={s.doneBadge}>
					<Text style={s.doneBadgeText}>✓</Text>
				</View>
			)}
		</Pressable>
	);
}

export default function ImageManagerScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [images, setImages] = useState<Record<string, string | null>>({});
	const [searching, setSearching] = useState(false);

	const handleSearch = async () => {
		if (!query.trim()) {
			return;
		}
		setSearching(true);
		try {
			const res = await fetch(`${BASE_URL}/api/search?query=${encodeURIComponent(query)}`);
			const data: SearchResult[] = await res.json();
			const top = data.slice(0, 15);
			setResults(top);
			top.forEach((item) => loadCurrentImage(item.id));
		} catch {
			Alert.alert("Error", "Search failed");
		} finally {
			setSearching(false);
		}
	};

	const loadCurrentImage = async (foodId: string) => {
		try {
			const res = await fetch(`${BASE_URL}/api/food-by-id/${foodId}`);
			const data = await res.json();
			setImages((prev) => ({ ...prev, [foodId]: data.image_url ?? null }));
		} catch {
			setImages((prev) => ({ ...prev, [foodId]: null }));
		}
	};

	const handleUploaded = (foodId: string, uri: string) => {
		setImages((prev) => ({ ...prev, [foodId]: uri }));
	};

	return (
		<View style={[s.root, { paddingTop: insets.top }]}>
			<View style={s.header}>
				<Pressable onPress={() => router.back()} style={s.backBtn}>
					<Text style={s.backText}>‹ Back</Text>
				</Pressable>
				<Text style={s.title}>Image Manager</Text>
			</View>

			<View style={s.searchRow}>
				<TextInput
					style={s.input}
					value={query}
					onChangeText={setQuery}
					placeholder="Search products…"
					onSubmitEditing={handleSearch}
					returnKeyType="search"
					placeholderTextColor="#8E8E93"
				/>
				<Pressable style={s.searchBtn} onPress={handleSearch}>
					{searching ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.searchBtnText}>Search</Text>}
				</Pressable>
			</View>

			{Platform.OS === "web" && results.length === 0 && (
				<Text style={s.hint}>Search for a product, then drag an image onto its thumbnail or click to browse.</Text>
			)}

			<FlatList
				data={results}
				keyExtractor={(item) => item.id}
				contentContainerStyle={s.list}
				renderItem={({ item }) => (
					<View style={s.row}>
						<ImageUploadZone foodId={item.id} currentImage={images[item.id] ?? null} onUploaded={handleUploaded} />
						<View style={s.info}>
							<Text style={s.productName} numberOfLines={2}>
								{item.name}
							</Text>
							{item.brand && <Text style={s.productBrand}>{item.brand}</Text>}
							<Text style={s.productId}>ID: {item.id}</Text>
						</View>
					</View>
				)}
			/>
		</View>
	);
}

const s = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: "#F2F2F7",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		gap: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "rgba(60,60,67,0.12)",
		backgroundColor: "#F2F2F7",
	},
	backBtn: {
		paddingVertical: 4,
		paddingRight: 8,
	},
	backText: {
		fontSize: 17,
		color: "#007AFF",
	},
	title: {
		fontSize: 17,
		fontWeight: "600",
		color: "#000",
	},
	searchRow: {
		flexDirection: "row",
		gap: 8,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	input: {
		flex: 1,
		height: 40,
		borderRadius: 10,
		backgroundColor: "#fff",
		paddingHorizontal: 12,
		fontSize: 15,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(60,60,67,0.2)",
		color: "#000",
	},
	searchBtn: {
		height: 40,
		paddingHorizontal: 16,
		borderRadius: 10,
		backgroundColor: "#007AFF",
		alignItems: "center",
		justifyContent: "center",
	},
	searchBtnText: {
		color: "#fff",
		fontWeight: "600",
		fontSize: 15,
	},
	hint: {
		fontSize: 13,
		color: "#8E8E93",
		paddingHorizontal: 16,
		marginBottom: 8,
		lineHeight: 18,
	},
	list: {
		paddingHorizontal: 16,
		paddingBottom: 40,
		gap: 10,
	},
	row: {
		flexDirection: "row",
		backgroundColor: "#fff",
		borderRadius: 14,
		padding: 12,
		gap: 12,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
	},
	zone: {
		width: 72,
		height: 72,
		borderRadius: 12,
		backgroundColor: "#F2F2F7",
		borderWidth: 1.5,
		borderColor: "#D1D1D6",
		borderStyle: "dashed",
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
		flexShrink: 0,
	},
	zoneDragOver: {
		borderColor: "#007AFF",
		backgroundColor: "#EAF3FF",
	},
	zoneImage: {
		width: 72,
		height: 72,
		borderRadius: 12,
	},
	zonePlaceholder: {
		alignItems: "center",
		gap: 2,
	},
	zonePlaceholderIcon: {
		fontSize: 20,
		color: "#8E8E93",
	},
	zonePlaceholderText: {
		fontSize: 9,
		color: "#8E8E93",
		textAlign: "center",
	},
	doneBadge: {
		position: "absolute",
		bottom: 4,
		right: 4,
		width: 18,
		height: 18,
		borderRadius: 9,
		backgroundColor: "#34C759",
		alignItems: "center",
		justifyContent: "center",
	},
	doneBadgeText: {
		color: "#fff",
		fontSize: 10,
		fontWeight: "700",
	},
	info: {
		flex: 1,
	},
	productName: {
		fontSize: 15,
		fontWeight: "600",
		color: "#000",
		lineHeight: 20,
	},
	productBrand: {
		fontSize: 13,
		color: "#8E8E93",
		marginTop: 2,
	},
	productId: {
		fontSize: 11,
		color: "#C7C7CC",
		marginTop: 4,
	},
});
