import { create } from "zustand";
import type { MusicGenerationResult, MusicGenerationStatus } from "@shared/types";

interface MusicStore {
  generations: MusicGenerationResult[];
  currentGeneration: MusicGenerationResult | null;
  isGenerating: boolean;

  addGeneration: (generation: MusicGenerationResult) => void;
  updateGeneration: (id: string, updates: Partial<MusicGenerationResult>) => void;
  removeGeneration: (id: string) => void;
  setCurrentGeneration: (generation: MusicGenerationResult | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationStatus: (id: string, status: MusicGenerationStatus) => void;
}

export const useMusicStore = create<MusicStore>((set) => ({
  generations: [],
  currentGeneration: null,
  isGenerating: false,

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
}));
