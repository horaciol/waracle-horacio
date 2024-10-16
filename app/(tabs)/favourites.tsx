import { Favorite, useCatApi } from "@/app/hooks/useCatApi";
import { Text, View } from "@/components/Themed";
import { useNavigation } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  View as RNView,
  StyleSheet,
} from "react-native";

const { width } = Dimensions.get("window");
const itemWidth = width / 2 - 15;
const imageAspectRatio = 1;

const renderItem = ({ item }: { item: Favorite }) => (
  <RNView style={styles.imageContainer}>
    <Image
      source={{ uri: item.image.url }}
      style={styles.image}
      resizeMode="cover"
    />
  </RNView>
);

export default function FavoritesScreen() {
  const { getFavorites, isLoading, error } = useCatApi();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const loadFavorites = useCallback(async () => {
    setRefreshing(true);
    try {
      const fetchedFavorites = await getFavorites();
      // Filter out favorites with empty image objects
      const validFavorites = fetchedFavorites.filter(
        (favorite) => favorite.image && Object.keys(favorite.image).length > 0
      );
      setFavorites(validFavorites);
    } catch (err) {
      console.error("Failed to load favorites:", err);
      Alert.alert("Error", "Failed to load favorites. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }, [getFavorites]);

  const refreshOnFocus = useCallback(() => {
    setFavorites([]);
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", refreshOnFocus);
    return unsubscribe;
  }, [navigation, refreshOnFocus]);

  const onRefresh = () => {
    loadFavorites();
  };

  if (isLoading)
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  if (error)
    return (
      <View style={styles.container}>
        <Text>Error: {error}</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favorites</Text>
      {favorites.length === 0 ? (
        <Text style={styles.noFavoritesText}>
          You haven't selected any favourites yet
        </Text>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 20,
  },
  imageContainer: {
    width: itemWidth,
    margin: 5,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 5,
  },
  image: {
    width: itemWidth - 10,
    height: (itemWidth - 10) / imageAspectRatio,
    borderRadius: 5,
  },
  noFavoritesText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
});
