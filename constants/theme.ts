import { Platform } from "react-native";

export const Fonts = Platform.select({
	ios: {
		sans: "system-ui",
		serif: "ui-serif",
		rounded: "ui-rounded",
		mono: "ui-monospace",
	},
	default: {
		sans: "normal",
		serif: "serif",
		rounded: "normal",
		mono: "monospace",
	},
	web: {
		sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
		serif: "Georgia, 'Times New Roman', serif",
		rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
		mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
	},
});

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
	light: {
		text: "#11181C",
		background: "#fff",
		tint: tintColorLight,
		icon: "#687076",
		tabIconDefault: "#687076",
		tabIconSelected: tintColorLight,
	},
	dark: {
		text: "#ECEDEE",
		background: "#151718",
		tint: tintColorDark,
		icon: "#9BA1A6",
		tabIconDefault: "#9BA1A6",
		tabIconSelected: tintColorDark,
	},
};

export const Palette = {
	blue: "#007AFF",
	red: "#FF3B30",
	indigo: "#5856D6",

	label: "#1C1C1E",
	secondaryLabel: "#8E8E93",
	darkGray: "#3C3C43",
	mediumGray: "#6C6C70",
};

export const Glass = {
	borderWidth: 0.6,
	borderColor: "rgba(255,255,255,0.75)",
	overlayColor: "rgba(255,255,255,0.28)",
	sheenColor: "rgba(255,255,255,0.28)",
};

export const Background = {
	gradient: ["#EEF3FA", "#F0F4F8", "#F2F2F7"] as const,
	gradientLocations: [0, 0.45, 1] as const,
};

export const Skeleton = {
	color: "rgba(120,120,128,0.12)",
};
