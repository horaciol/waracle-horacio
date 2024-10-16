import { CatImage, useCatApi } from "@/app/hooks/useCatApi";
import { Text, View } from "@/components/Themed";
import { AntDesign } from "@expo/vector-icons";
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
  TouchableOpacity,
} from "react-native";

const { width } = Dimensions.get("window");
const itemWidth = width / 2 - 15;
const imageAspectRatio = 1;

export default function ImagesScreen() {
  const {
    getImages,
    getVotes,
    createVote,
    deleteImage,
    createFavourite,
    deleteFavourite,
    getFavorites,
    isLoading,
    error,
  } = useCatApi();
  const [images, setImages] = useState<CatImage[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<
    Record<string, { isFavorite: boolean; favoriteId: number }>
  >({});
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const loadImagesVotesAndFavorites = async (refresh = false) => {
    try {
      const [fetchedImages, fetchedVotes, fetchedFavorites] = await Promise.all(
        [getImages(), getVotes(), getFavorites()]
      );

      setImages((prevImages) => {
        if (refresh) {
          return fetchedImages;
        } else {
          return [...prevImages, ...fetchedImages];
        }
      });

      const newVotes: Record<string, number> = {};
      fetchedVotes.forEach((vote) => {
        newVotes[vote.image_id] = vote.value;
      });

      setVotes(newVotes);

      const newFavorites: Record<
        string,
        { isFavorite: boolean; favoriteId: number }
      > = {};
      fetchedFavorites.forEach((favorite) => {
        newFavorites[favorite.image_id] = {
          isFavorite: true,
          favoriteId: favorite.id,
        };
      });
      setFavorites(newFavorites);
    } catch (err) {
      console.error("Failed to load images, votes, and favorites:", err);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadImagesVotesAndFavorites(true);
  }, []);

  const refreshOnFocus = useCallback(() => {
    loadImagesVotesAndFavorites(true);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", refreshOnFocus);
    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadImagesVotesAndFavorites(true);
  }, []);

  const handleVote = async (imageId: string, voteType: "up" | "down") => {
    const currentVote = votes[imageId] || 0;
    const newVote =
      voteType === "up" ? currentVote + 1 : Math.max(currentVote - 1, 0);

    setVotes((prev) => ({
      ...prev,
      [imageId]: newVote,
    }));

    try {
      // Send the new vote value to the API
      await createVote({
        imageId,
        value: newVote,
      });
    } catch (err) {
      console.error(`Failed to vote ${voteType}:`, err);
      Alert.alert("Error", `Failed to ${voteType} vote. Please try again.`);
      // Revert the local state if the API call fails
      setVotes((prev) => ({
        ...prev,
        [imageId]: currentVote,
      }));
    }
  };

  const handleDelete = async (imageId: string) => {
    Alert.alert("Delete Image", "Are you sure you want to delete this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteImage({ imageId });
            // Remove the deleted image from the state
            setImages((prevImages) =>
              prevImages.filter((img) => img.id !== imageId)
            );
            // Remove the vote for the deleted image
            setVotes((prevVotes) => {
              const newVotes = { ...prevVotes };
              delete newVotes[imageId];
              return newVotes;
            });
          } catch (err) {
            console.error("Failed to delete image:", err);
            Alert.alert("Error", "Failed to delete image. Please try again.");
          }
        },
      },
    ]);
  };

  const handleFavorite = async (imageId: string) => {
    try {
      if (favorites[imageId]?.isFavorite) {
        // If it's already a favorite, remove it
        await deleteFavourite({ favouriteId: favorites[imageId].favoriteId });
        setFavorites((prev) => ({
          ...prev,
          [imageId]: { isFavorite: false, favoriteId: 0 },
        }));
      } else {
        // If it's not a favorite, add it
        const response = await createFavourite({ imageId });
        setFavorites((prev) => ({
          ...prev,
          [imageId]: { isFavorite: true, favoriteId: response.id },
        }));
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      Alert.alert("Error", "Failed to update favorite. Please try again.");
    }
  };

  const renderItem = ({ item }: { item: CatImage }) => (
    <RNView style={styles.imageContainer}>
      <Image
        source={{ uri: item.url }}
        style={styles.image}
        resizeMode="cover"
      />
      <Text style={styles.scoreText}>Score: {votes[item.id] || 0}</Text>
      <RNView style={styles.voteContainer}>
        <TouchableOpacity onPress={() => handleVote(item.id, "up")}>
          <AntDesign
            name="caretup"
            size={20}
            color={(votes[item.id] || 0) > 0 ? "green" : "#BEBEBE"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleVote(item.id, "down")}>
          <AntDesign
            name="caretdown"
            size={20}
            color={(votes[item.id] || 0) < 0 ? "red" : "#BEBEBE"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleFavorite(item.id)}>
          <AntDesign
            name="heart"
            size={20}
            color={favorites[item.id]?.isFavorite ? "red" : "#BEBEBE"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <AntDesign name="delete" size={20} color="#BEBEBE" />
        </TouchableOpacity>
      </RNView>
    </RNView>
  );

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
      {images.length === 0 ? (
        <Text style={styles.noImagesText}>
          You haven't uploaded any images yet
        </Text>
      ) : (
        <FlatList
          data={images}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
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
    backgroundColor: "#F0f0f0",
    borderRadius: 10,
    padding: 5,
  },
  image: {
    width: itemWidth - 10,
    height: (itemWidth - 10) / imageAspectRatio,
    borderRadius: 5,
  },
  scoreText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "bold",
    color: "#666666",
  },
  voteContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 5,
    width: "100%",
  },
  noImagesText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
});
