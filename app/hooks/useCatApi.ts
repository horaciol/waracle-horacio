import axios from "axios";
import { useState } from "react";
import { Platform } from "react-native";

const API_BASE_URL = "https://api.thecatapi.com/v1";
const API_KEY =
  "live_tuatQHT1g5uisUmClicqCSkzdl2NhHur7daX1ziQyqfUEwvFQOUx5fG6xoxba8VR";

export type CatImage = {
  id: string;
  url: string;
  width: number;
  height: number;
  sub_id?: string;
  created_at: string;
  original_filename: string;
};

export type Favorite = {
  id: number;
  user_id: string;
  image_id: string;
  sub_id: string;
  created_at: string;
  image: CatImage;
};

export type Vote = {
  id: number;
  image_id: string;
  sub_id: string;
  created_at: string;
  value: number;
  country_code: string;
  image?: {
    id: string;
    url: string;
  };
};

type CatApiHook = {
  uploadImage: ({ imageUri }: { imageUri: string }) => Promise<any>;
  deleteImage: ({ imageId }: { imageId: string }) => Promise<any>;
  createFavourite: ({ imageId }: { imageId: string }) => Promise<any>;
  deleteFavourite: ({ favouriteId }: { favouriteId: number }) => Promise<any>;
  createVote: ({
    imageId,
    value,
  }: {
    imageId: string;
    value: number;
  }) => Promise<number>;

  getFavorites: () => Promise<Favorite[]>;
  getImages: () => Promise<CatImage[]>;
  getVotes: (params?: {
    limit?: number;
    order?: "ASC" | "DESC";
  }) => Promise<Vote[]>;
  isLoading: boolean;
  error: string | null;
};

export const useCatApi = (): CatApiHook => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { "x-api-key": API_KEY },
  });

  const handleError = (err: unknown, defaultMessage: string) => {
    if (axios.isAxiosError(err) && err.response) {
      console.error("Error response:", err.response.data);
      setError(`${defaultMessage}: ${err.response.data.message}`);
    } else {
      console.error("Unexpected error:", err);
      setError(`${defaultMessage}: Unexpected error`);
    }
  };

  const apiCall = async (method: string, endpoint: string, data?: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios({
        method,
        url: `${API_BASE_URL}${endpoint}`,
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json",
        },
        data,
      });
      return response.data;
    } catch (err) {
      handleError(err, `Failed to ${method.toLowerCase()} ${endpoint}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImage = async ({ imageUri }: { imageUri: string }) => {
    if (!imageUri) {
      throw new Error("No image URI provided");
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      if (Platform.OS === "web") {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append("file", blob, "upload.jpg");
      } else {
        const uri =
          Platform.OS === "android"
            ? imageUri
            : imageUri.replace("file://", "");
        const fileExtension = uri.split(".").pop()?.toLowerCase();
        const mimeType = fileExtension === "png" ? "image/png" : "image/jpeg";

        formData.append("file", {
          uri: uri,
          type: mimeType,
          name: `upload.${fileExtension}`,
        } as any);
      }

      const response = await axios.post(
        `${API_BASE_URL}/images/upload`,
        formData,
        {
          headers: {
            "x-api-key": API_KEY,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(
        "uploadImage response = ",
        JSON.stringify(response.data, null, 2)
      );
      return response.data;
    } catch (err) {
      handleError(err, "Failed to upload image");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async ({ imageId }: { imageId: string }) => {
    return apiCall("DELETE", `/images/${imageId}`);
  };

  const createFavourite = async ({ imageId }: { imageId: string }) => {
    return apiCall("POST", "/favourites", { image_id: imageId });
  };

  const deleteFavourite = async ({ favouriteId }: { favouriteId: number }) => {
    return apiCall("DELETE", `/favourites/${favouriteId}`);
  };

  const createVote = async ({
    imageId,
    value,
  }: {
    imageId: string;
    value: number;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/votes", {
        image_id: imageId,
        value: value,
      });
      return response.data.value;
    } catch (err) {
      handleError(err, `Failed to create vote`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getFavorites = async (): Promise<Favorite[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Favorite[]>("/favourites");
      console.log("getFavorites = ", JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (err) {
      handleError(err, "Failed to fetch favorites");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getImages = async (): Promise<CatImage[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<CatImage[]>(
        `/images?limit=100&order=DESC`
      );
      console.log("getImages = ", JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (err) {
      handleError(err, "Failed to fetch uploaded images");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getVotes = async ({
    limit,
    order,
  }: {
    limit?: number;
    order?: "ASC" | "DESC";
  } = {}): Promise<Vote[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (limit) params.limit = limit;
      if (order) params.order = order;
      const response = await api.get<Vote[]>(`/votes`, { params });
      console.log("getVotes = ", JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (err) {
      handleError(err, "Failed to get votes");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadImage,
    deleteImage,
    createFavourite,
    deleteFavourite,
    createVote,
    getFavorites,
    getImages,
    getVotes,
    isLoading,
    error,
  };
};
