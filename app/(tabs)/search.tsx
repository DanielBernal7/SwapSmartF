import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "@/components/GlassCard";
import { useRouter } from "expo-router";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

type SearchResult = {
  id: string;
  name: string;
  brand: string | null;
};

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const [results, setResults] = useState<SearchResult[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async () => {
    let searchQuery = query;

    if (!searchQuery && selectedCategory) {
      const keywordMap: Record<string, string[]> = {
        dairy: ["milk", "cheese", "yogurt"],
        fruit: ["apple", "banana", "orange"],
        meat: ["chicken", "beef", "pork"],
        snacks: ["chips", "crackers"],
        beverages: ["juice", "soda", "coffee"],
        vegetables: ["carrot", "broccoli"],
        grains: ["rice", "pasta", "bread"],
        sweets: ["cake", "cookie", "chocolate"],
        seafood: ["fish", "shrimp"],

        dairy_free: ["dairy free"],
        gluten_free: ["gluten free"],
        grain_free: ["grain free"],
        sugar_free: ["sugar free"],
      };

      searchQuery = keywordMap[selectedCategory]?.join(" ") || "";
    }

    if (!searchQuery) return;

    const res = await fetch(`${BASE_URL}/api/search?query=${searchQuery}`);
      const data = await res.json();
      setResults(data);
    };

    const handleSelect = (item: SearchResult) => {
      router.push({
      pathname: "/simple/[foodId]",
      params: { foodId: item.id },
    });
  };

  const categories = ["dairy","fruit","meat","snacks","beverages","vegetables","grains","sweets","seafood"];
  const dietaryFilters = ["gluten_free","dairy_free","grain_free","sugar_free"];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EEF3FA", "#F0F4F8", "#F2F2F7"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Advanced Filtering</Text>

        {/* SEARCH CARD */}
        <GlassCard style={styles.card}>
          <View style={styles.cardInner}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              style={styles.input}
              placeholder="Search for Food"
              placeholderTextColor="#8E8E93"
            />

            <Pressable style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchText}>Search</Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* FILTER CARD */}
        <GlassCard style={styles.card}>
          <View style={styles.cardInner}>
            <Pressable onPress={() => setShowFilters(prev => !prev)}>
              <Text style={styles.sectionTitle}>
                Filters {showFilters ? "▲" : "▼"}
              </Text>
            </Pressable>

            {showFilters && (
            <>
              <Text style={styles.subHeader}>Categories</Text>
              <View style={styles.filterContainer}>
                {categories.map(cat => (
                  <Pressable
                    key={cat}
                    onPress={() => {
                      setSelectedCategory(prev => (prev === cat ? null : cat));
                      handleSearch();
                    }}
                    style={[
                      styles.filterButton,
                      selectedCategory === cat && styles.filterActive
                    ]}
                  >
                    <Text
                      style={
                        selectedCategory === cat
                          ? styles.filterTextActive
                          : styles.filterText
                      }
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.subHeader}>Dietary Preferences</Text>
              <View style={styles.filterContainer}>
                {dietaryFilters.map(cat => (
                  <Pressable
                    key={cat}
                    onPress={() => {
                      setSelectedCategory(prev => (prev === cat ? null : cat));
                      handleSearch();
                    }}
                    style={[
                      styles.filterButton,
                      selectedCategory === cat && styles.filterActive
                    ]}
                  >
                    <Text
                      style={
                        selectedCategory === cat
                          ? styles.filterTextActive
                          : styles.filterText
                      }
                    >
                      {cat.replace("_", " ")}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* CLEAR FILTER BUTTON */}
              <Pressable
                onPress={() => setSelectedCategory(null)}
                style={styles.clearButton}
              >
                <Text style={styles.clearText}>Clear Filter</Text>
              </Pressable>
            </>
          )}
          </View>
        </GlassCard>

        {/* RESULTS */}
        <GlassCard style={styles.card}>
          <View style={styles.cardInner}>
            
            <View style={styles.resultsBox}>
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <Pressable style={styles.resultItem} onPress={() => handleSelect(item)}>
                    <View style={styles.imageContainer}>
                      <Image
                        source={require('../../img/image_placeholder.png')}
                        style={styles.image}
                      />
                    </View>

                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>{item.name}</Text>
                      <Text style={styles.resultMeta}>
                        {item.brand || "No Brand"} | ID: {item.id}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            </View>

          </View>
        </GlassCard>

      </ScrollView>
      

      {/* MODAL */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3FA",
  },

  scrollContent: {
    paddingTop: 120,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  card: {
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },

  cardInner: {
    padding: 16,
  },

  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(60,60,67,0.15)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
    fontSize: 15,
  },

  searchButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  searchText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    letterSpacing: -0.3,
  },

  subHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    marginTop: 10,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(60,60,67,0.2)",
    borderRadius: 20,
    backgroundColor: "rgba(120,120,128,0.08)",
  },

  filterActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },

  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },

  imageContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(120,120,128,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: 32,
    height: 32,
  },

  resultInfo: {
    flex: 1,
  },

  resultName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    letterSpacing: -0.2,
  },

  resultMeta: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },

  filterText: {
  color: "#3C3C43",
  fontSize: 13,
  },

  filterTextActive: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  clearButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(120,120,128,0.1)",
  },

  clearText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
  },


  resultsBox: {
  marginTop: 6,
  borderRadius: 16,
  backgroundColor: "rgba(60,60,67,0.08)", // subtle darker box
  paddingHorizontal: 10,
  paddingVertical: 6,
  },

  pageTitle: {
  fontSize: 22,
  fontWeight: "700",
  color: "#000",
  marginBottom: 12,
  letterSpacing: -0.4,
  },
});