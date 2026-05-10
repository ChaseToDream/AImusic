import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MusicGenerationResult, MusicGenerationStatus, MusicProvider, MinimaxModel } from "@shared/types";

interface MusicStore {
  generations: MusicGenerationResult[];
  currentGeneration: MusicGenerationResult | null;
  isGenerating: boolean;
  provider: MusicProvider;
  minimaxModel: MinimaxModel;
  theme: "light" | "dark" | "system";

  addGeneration: (generation: MusicGenerationResult) => void;
  updateGeneration: (id: string, updates: Partial<MusicGenerationResult>) => void;
  removeGeneration: (id: string) => void;
  clearHistory: () => void;
  setCurrentGeneration: (generation: MusicGenerationResult | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationStatus: (id: string, status: MusicGenerationStatus) => void;
  setProvider: (provider: MusicProvider) => void;
  setMinimaxModel: (model: MinimaxModel) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useMusicStore = create<MusicStore>()(
  persist(
    (set) => ({
      generations: [],
      currentGeneration: null,
      isGenerating: false,
      provider: "suno",
      minimaxModel: "music-2.6",
      theme: "system",

      addGeneration: (generation) =>
        set((state) => ({
          generations: [generation, ...state.generations],
          currentGeneration: generation,
        })),

      updateGeneration: (id, updates) =>
        set((state) => ({
          generations: state.generations.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
          currentGeneration:
            state.currentGeneration?.id === id
              ? { ...state.currentGeneration, ...updates }
              : state.currentGeneration,
        })),

      removeGeneration: (id) =>
        set((state) => ({
          generations: state.generations.filter((g) => g.id !== id),
          currentGeneration:
            state.currentGeneration?.id === id
              ? null
              : state.currentGeneration,
        })),

      clearHistory: () =>
        set((state) => ({
          generations: state.generations.filter(
            (g) => g.status === "pending" || g.status === "generating" || g.status === "streaming"
          ),
          currentGeneration: null,
        })),

      setCurrentGeneration: (generation) =>
        set({ currentGeneration: generation }),

      setIsGenerating: (isGenerating) =>
        set({ isGenerating }),

      setGenerationStatus: (id, status) =>
        set((state) => {
          const updates = { status };
          return {
            generations: state.generations.map((g) =>
              g.id === id ? { ...g, ...updates } : g
            ),
            currentGeneration:
              state.currentGeneration?.id === id
                ? { ...state.currentGeneration, ...updates }
                : state.currentGeneration,
          };
        }),

      setProvider: (provider) =>
        set({ provider }),

      setMinimaxModel: (minimaxModel) =>
        set({ minimaxModel }),

      setTheme: (theme) =>
        set({ theme }),
    }),
    {
      name: "ai-music-generator",
      partialize: (state) => ({
        generations: state.generations,
        provider: state.provider,
        minimaxModel: state.minimaxModel,
        theme: state.theme,
      }),
    }
  )
);
