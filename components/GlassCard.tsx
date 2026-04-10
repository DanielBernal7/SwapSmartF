import { BlurView } from 'expo-blur';
import { StyleProp, ViewStyle } from 'react-native';

type Props = {
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
};

export function GlassCard({ children, style }: Props) {
    return (
        <BlurView intensity={60} tint="light" style={[{ borderRadius: 20, overflow: 'hidden' }, style]}>
            {children}
        </BlurView>
    );
}
