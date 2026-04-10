import React from "react";

import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<Label>Home</Label>
				<Icon sf="house.fill" />
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="search">
				<Label>Search</Label>
				<Icon sf="magnifyingglass" />
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="explore">
				<Label>Explore</Label>
				<Icon sf="paperplane.fill" />
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="scanner">
				<Label>Scan</Label>
				<Icon sf="barcode.viewfinder" />
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
