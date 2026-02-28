import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  StyleSheet,
} from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

type SearchResult = {
  id: string;
  name: string;
  brand: string | null;
  description: string;
};

type FoodDetail = {
  id: string;
  name: string;
  brand: string | null;
  calories: string;
  sugar: string;
  fat: string;
  carbs: string;
  protein: string;
};

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedFood, setSelectedFood] = useState<SearchResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [details, setDetails] = useState<FoodDetail | null>(null);

  const handleSearch = async () => {
    if (!query) return;

    const res = await fetch(`${BASE_URL}/api/search?query=${query}`);
    const data = await res.json();
    setResults(data);
  };

  const handleSelect = async (item: SearchResult) => {
    setSelectedFood(item);
    setModalVisible(true);

    const res = await fetch(`${BASE_URL}/api/food/${item.id}`);
    const data = await res.json();
    setDetails(data);
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        style={styles.input}
      />

      <Pressable style={styles.searchButton} onPress={handleSearch}>
        <Text style={{ color: '#fff' }}>Search</Text>
      </Pressable>

      {/* DROPDOWN */}
      <FlatList<SearchResult>
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
            <Pressable
            style={styles.resultItem}
            onPress={() => handleSelect(item)}
            >
            <Text style={styles.resultName}>{item.name}</Text>
            <Text style={styles.resultMeta}>
                {item.brand || 'No Brand'} | ID: {item.id}
            </Text>
            </Pressable>
        )}
        />

      {/*MODAL */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 100 }}>

            {selectedFood && (
            <>
                <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 5 }}>
                {details?.name}
                </Text>

                {details?.brand && (
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
                    {details.brand}
                </Text>
                )}

                <Text style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>
                ID: {details?.id}
                </Text>

                <Text>Calories: {details?.calories || 'N/A'}</Text>
                <Text>Sugar: {details?.sugar || 'N/A'}</Text>
                <Text>Fat: {details?.fat || 'N/A'}</Text>
                <Text>Carbs: {details?.carbs || 'N/A'}</Text>
                <Text>Protein: {details?.protein || 'N/A'}</Text>
            </>
            )}

            <Pressable
            style={{
                marginTop: 30,
                backgroundColor: '#000',
                padding: 12,
                alignItems: 'center'
            }}
            onPress={() => {
                setModalVisible(false);
                setDetails(null);
            }}
            >
            <Text style={{ color: '#fff' }}>Close</Text>
            </Pressable>

        </View>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 100,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  searchButton: {
    backgroundColor: '#000',
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  resultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultMeta: {
    fontSize: 12,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});