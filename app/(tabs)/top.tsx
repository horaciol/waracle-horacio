import { useCatApi, Vote } from "@/app/hooks/useCatApi";
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

const renderItem = ({ item, index }: { item: Vote; index: number }) => (
  <RNView style={styles.imageContainer}>
    <Image
      source={{ uri: item?.image?.url }}
      style={styles.image}
      resizeMode="cover"
    />
    <RNView style={styles.infoContainer}>
      <Text style={styles.rankText}>Rank #{index + 1}</Text>
      <Text style={styles.scoreText}>Score: {item.value}</Text>
    </RNView>
  </RNView>
);

export default function TopScreen() {
  const { getVotes, isLoading, error } = useCatApi();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const loadVotes = useCallback(async () => {
    setRefreshing(true);
    try {
      const fetchedVotes = await getVotes();
      const highestVotes = new Map<string, Vote>();

      fetchedVotes.forEach((vote: Vote) => {
        // Check if the image property is not an empty object
        if (vote.image && Object.keys(vote.image).length > 0) {
          if (
            !highestVotes.has(vote.image_id) ||
            vote.value > highestVotes.get(vote.image_id)!.value
          ) {
            highestVotes.set(vote.image_id, vote);
          }
        }
      });

      const sortedVotes = Array.from(highestVotes.values()).sort(
        (a, b) => b.value - a.value
      );

      console.log("sortedVotes = ", JSON.stringify(sortedVotes, null, 2));

      // Take only the top 10 votes
      setVotes(sortedVotes.slice(0, 10));
    } catch (err) {
      console.error("Failed to load votes:", err);
      Alert.alert(
        "Error",
        "Failed to load top voted images. Please try again."
      );
    } finally {
      setRefreshing(false);
    }
  }, [getVotes]);

  const refreshOnFocus = useCallback(() => {
    setVotes([]);
    loadVotes();
  }, [loadVotes]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", refreshOnFocus);
    return unsubscribe;
  }, [navigation, refreshOnFocus]);

  const onRefresh = () => {
    loadVotes();
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
      <Text style={styles.title}>Top Voted Images</Text>

      {votes.length === 0 ? (
        <Text style={styles.noVotesText}>
          You haven't voted for any pictures yet
        </Text>
      ) : (
        <FlatList
          data={votes}
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
    backgroundColor: "#011425",
  },
  listContainer: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 20,
    color: "#FFFFFF",
  },
  imageContainer: {
    width: itemWidth,
    margin: 5,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 5,
    overflow: "hidden",
  },
  image: {
    width: itemWidth - 10,
    height: (itemWidth - 10) / imageAspectRatio,
    borderRadius: 5,
    marginBottom: 20,
  },
  infoContainer: {
    position: "absolute",
    bottom: 5,
    left: 5,
    right: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  rankText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "bold",
  },
  scoreText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "bold",
  },
  noVotesText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 20,
    color: "#FFFFFF",
  },
});
