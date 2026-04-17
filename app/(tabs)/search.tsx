import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
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
  serving_size?: string;
  calories?: string;
  sugar?: string;
  fat?: string;
  carbs?: string;
  protein?: string;
};

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedFood, setSelectedFood] = useState<SearchResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [details, setDetails] = useState<FoodDetail | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async () => {
    let searchQuery = query;

    if (!searchQuery && selectedCategory) {
      const keywordMap: Record<string, string[]> = {
        dairy: ["milk", "cheese", "yogurt"],
        fruit: ["apple", "banana", "orange"],
        meat: ["chicken", "beef", "pork"],
        snacks: ["chips", "crackers", "jerky", "slices", "nuts"],
        beverages: ["juice", "soda", "coffee"],
        vegetables: ["carrot", "broccoli"],
        grains: ["rice", "pasta", "bread"],
        sweets: ["cake", "cookie", "chocolate"],
        seafood: ["fish", "shrimp", "salmon", "cod", "trout", "tilapia", "snapper", "crab", "tuna"],

        dairy_free: ["dairy free"],
        gluten_free: ["gluten free"],
        grain_free: ["grain free"],
        sugar_free: ["sugar free"],
      };

      searchQuery = keywordMap[selectedCategory]?.join(" ") || "";
    }

    if (!searchQuery) return;
    let url = `${BASE_URL}/api/search?query=${searchQuery}`;
    //if (selectedCategory) {
      //url += `&category=${selectedCategory}`;
    //}

    const res = await fetch(url);
    const data = await res.json();
    setResults(data);
  };

	const handleSelect = async (item: SearchResult) => {
		setSelectedFood(item);
		setModalVisible(true);

    const res = await fetch(`${BASE_URL}/api/food-by-id/${item.id}`);
    const data = await res.json();
    setDetails(data);
  };
  /// filters brah
  const categories = [
    "dairy",
    "fruit",
    "meat",
    "snacks",
    "beverages",
    "vegetables",
    "grains",
    "sweets",
    "seafood",
  ];
  
  const dietaryFilters = [
  "gluten_free",
  "dairy_free",
  "grain_free",
  "sugar_free"
  ];

	return (
		<View style={styles.container}>
			<TextInput value={query} onChangeText={setQuery} style={styles.input} />

      <Pressable style={styles.searchButton} onPress={handleSearch}>
        <Text style={{ color: '#fff' }}>Search</Text>
      </Pressable>

      <Pressable onPress={() => setShowFilters(prev => !prev)} style={{ marginBottom: 10 }}>
          <Text style={{ fontWeight: 'bold' }}>
            Filters {showFilters ? "▲" : "▼"}
          </Text>
        </Pressable>
        
      {/* Filters */}
      {showFilters && (
        <>
          <Text style={styles.filterHeader}>Categories</Text>
          <View style={styles.filterContainer}>
            {categories.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => {
                  setSelectedCategory(prev => (prev === cat ? null : cat));
                  handleSearch();
                }}
                style={[
                  styles.filterButton,
                  selectedCategory === cat && styles.filterButtonActive
                ]}
              >
                <Text>{cat.replace("_", " ")}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.filterHeader}>Dietary Preferences</Text>

          <View style={styles.filterContainer}>
            {dietaryFilters.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => {
                  setSelectedCategory(prev => (prev === cat ? null : cat));
                  handleSearch();
                }}
                style={[
                  styles.filterButton,
                  selectedCategory === cat && styles.filterButtonActive
                ]}
              >
                <Text>{cat.replace("_", " ")}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => setSelectedCategory(null)}>
            <Text>Clear Filter</Text>
          </Pressable>
        </>
      )}

      {/* DROPDOWN */}
      <View style={{ flex: 1 }}>
        <FlatList<SearchResult>
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
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
      </View>

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
                {details?.serving_size && (
                <Text style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>
                  Serving: {details.serving_size}
                </Text>
                )}
                <Text style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>
                ID: {details?.id}
                </Text>

							<Text>Calories: {details?.calories || "N/A"}</Text>
							<Text>Sugar: {details?.sugar || "N/A"}</Text>
							<Text>Fat: {details?.fat || "N/A"}</Text>
							<Text>Carbs: {details?.carbs || "N/A"}</Text>
							<Text>Protein: {details?.protein || "N/A"}</Text>
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
  
  filterHeader: {
  marginBottom: 10,
  fontWeight: 'bold',
  },

  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },

  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },

  filterButtonActive: {
    borderColor: 'blue',
    backgroundColor: '#e0f0ff',
  },
});
