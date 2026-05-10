"use client";

import { useCallback, useRef } from "react";
import { useMusicStore } from "@/stores/music-store";
import { generateMusic, getGenerationStatus } from "@/lib/suno-api";
import type { MusicGenerationResult, MusicProvider, MinimaxModel } from "@shared/types";

const POLL_INTERVAL = 3000;
const MAX_POLL_ATTEMPTS = 120;

export interface GenerationOptions {
  makeInstrumental?: boolean;
  model?: string;
  provider?: MusicProvider;
  lyrics?: string;
  isInstrumental?: boolean;
  lyricsOptimizer?: boolean;
  minimaxModel?: MinimaxModel;
}

export function useMusicGeneration() {
  const {
    isGenerating,
    currentGeneration,
    addGeneration,
    updateGeneration,
    setIsGenerating,
    provider,
    minimaxModel,
  } = useMusicStore();

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  const startPolling = useCallback(
    (id: string) => {
      const poll = () => {
        pollCountRef.current += 1;

        if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
          stopPolling();
          updateGeneration(id, {
            status: "error",
            error: "生成超时，请重试",
          });
          setIsGenerating(false);
          return;
        }

        getGenerationStatus(id)
          .then((data) => {
            updateGeneration(id, {
              status: data.status,
              title: data.title,
              imageUrl: data.imageUrl,
              audioUrl: data.audioUrl,
              videoUrl: data.videoUrl,
              duration: data.duration,
              error: data.error,
              tags: data.tags,
              model: data.model,
            });

            if (data.status === "complete" || data.status === "error") {
              stopPolling();
              setIsGenerating(false);
              return;
            }

            pollTimerRef.current = setTimeout(poll, POLL_INTERVAL);
          })
          .catch((error) => {
            console.error("Poll error:", error);
            updateGeneration(id, {
              status: "error",
              error: error instanceof Error ? error.message : "获取状态失败",
            });
            stopPolling();
            setIsGenerating(false);
          });
      };

      poll();
    },
    [updateGeneration, setIsGenerating, stopPolling]
  );

  const startGeneration = useCallback(
    async (prompt: string, options?: GenerationOptions) => {
      if (isGenerating) return;
      if (!prompt.trim()) return;

      const activeProvider = options?.provider || provider;
      const activeModel = activeProvider === "minimax"
        ? (options?.minimaxModel || minimaxModel)
        : options?.model;

      setIsGenerating(true);
      stopPolling();
      pollCountRef.current = 0;

      const tempId = `temp-${Date.now()}`;
      const newGeneration: MusicGenerationResult = {
        id: tempId,
        status: "pending",
        prompt: prompt.trim(),
        lyrics: options?.lyrics,
        createdAt: Date.now(),
        provider: activeProvider,
      };
      addGeneration(newGeneration);

      try {
        const response = await generateMusic({
          prompt: prompt.trim(),
          makeInstrumental: options?.makeInstrumental,
          model: activeModel,
          provider: activeProvider,
          lyrics: options?.lyrics,
          isInstrumental: options?.isInstrumental,
          lyricsOptimizer: options?.lyricsOptimizer,
        });

        if (activeProvider === "minimax" && response.status === "complete") {
          updateGeneration(tempId, {
            id: response.id,
            status: "complete",
            audioUrl: response.audioUrl,
            duration: response.duration,
            title: response.title,
            model: activeModel,
          });
          setIsGenerating(false);
        } else {
          updateGeneration(tempId, {
            id: response.id,
            status: response.status,
          });
          startPolling(response.id);
        }
      } catch (error) {
        updateGeneration(tempId, {
          status: "error",
          error: error instanceof Error ? error.message : "生成请求失败",
        });
        setIsGenerating(false);
      }
    },
    [isGenerating, addGeneration, updateGeneration, setIsGenerating, startPolling, stopPolling, provider, minimaxModel]
  );

  const cancelGeneration = useCallback(() => {
    stopPolling();
    setIsGenerating(false);
    if (currentGeneration && currentGeneration.status !== "complete") {
      updateGeneration(currentGeneration.id, {
        status: "error",
        error: "已取消",
      });
    }
  }, [stopPolling, setIsGenerating, currentGeneration, updateGeneration]);

  return {
    isGenerating,
    currentGeneration,
    startGeneration,
    cancelGeneration,
  };
}
