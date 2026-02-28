import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.button}
        onPress={() => router.push('/(tabs)/search')}
      >
        <Text style={styles.buttonText}>Search for Food...</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 120,
    backgroundColor: '#fff',
  },
  button: {
    width: '85%',
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
  },
});