import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoriteState {
  favorites: string[]; // Array of Product IDs
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (productId) => {
        const favorites = get().favorites;
        if (favorites.includes(productId)) {
          set({ favorites: favorites.filter((id) => id !== productId) });
        } else {
          set({ favorites: [...favorites, productId] });
        }
      },
      isFavorite: (productId) => get().favorites.includes(productId),
    }),
    { name: "maachh-favorites-storage" },
  ),
);
