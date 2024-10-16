import { useCatApi } from "@/app/hooks/useCatApi";
import { Text } from "@/components/Themed";
import { AntDesign } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function UploadScreen() {
  const { uploadImage, isLoading, error } = useCatApi();
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera roll permissions to make this work!");
      }
    })();
  }, []);

  const pickImage = async () => {
    if (Platform.OS === "web") {
      // Web-specific image picker
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setImage(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Existing code for native platforms
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    }
  };

  const handleUpload = async () => {
    if (!image) {
      console.error("No image selected");
      Alert.alert("Error", "No image selected. Please choose an image first.");
      return;
    }

    try {
      await uploadImage({ imageUri: image });
      if (Platform.OS === "web") {
        window.alert("Success -Image uploaded successfully!");
        setImage(null);
        router.replace("/");
      } else {
        Alert.alert("Success", "Image uploaded successfully!", [
          {
            text: "OK",
            onPress: () => {
              setImage(null);
              router.replace("/");
            },
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to upload image:", err);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
        <Text style={styles.buttonText}>Select an image</Text>
      </TouchableOpacity>

      {image ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUpload}
            disabled={isLoading}
          >
            <AntDesign name="upload" size={24} color="white" />
            <Text style={styles.buttonText}>
              {isLoading ? "Uploading..." : "Upload"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#011425",
  },
  pickButton: {
    backgroundColor: "#1f4959",
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  imageContainer: {
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 5,
  },
  errorText: {
    color: "red",
    marginTop: 10,
  },
});
