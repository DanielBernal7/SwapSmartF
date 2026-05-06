import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

type DevModeContextType = {
	devMode: boolean;
	setDevMode: (value: boolean) => void;
};

const DevModeContext = createContext<DevModeContextType>({
	devMode: false,
	setDevMode: () => {},
});

export function DevModeProvider({ children }: { children: React.ReactNode }) {
	const [devMode, setDevModeState] = useState(false);

	useEffect(() => {
		AsyncStorage.getItem("dev_mode").then((val) => {
			if (val === "true") setDevModeState(true);
		});
	}, []);

	const setDevMode = (value: boolean) => {
		setDevModeState(value);
		if (value) {
			AsyncStorage.setItem("dev_mode", "true");
		} else {
			AsyncStorage.setItem("dev_mode", "false");
		}
	};

	return <DevModeContext.Provider value={{ devMode, setDevMode }}>{children}</DevModeContext.Provider>;
}

export function useDevMode() {
	return useContext(DevModeContext);
}
