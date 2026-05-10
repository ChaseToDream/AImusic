"use client";

import { useCallback, useRef } from "react";
import { useMusicStore } from "@/stores/music-store";
import { generateMusic, getGenerationStatus } from "@/lib/suno-api";
import type { MusicGenerationResult, MusicProvider, MinimaxModel } from "@shared/types";

const INITIAL_POLL_INTERVAL = 2000;
const MAX_POLL_INTERVAL = 10000;
const MAX_POLL_ATTEMPTS = 120;
const POLL_BACKOFF_FACTOR = 1.2;

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
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  const cancelPendingRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
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

        const interval = Math.min(
          INITIAL_POLL_INTERVAL * Math.pow(POLL_BACKOFF_FACTOR, pollCountRef.current - 1),
          MAX_POLL_INTERVAL
        );

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

            pollTimerRef.current = setTimeout(poll, interval);
          })
          .catch((error) => {
            if (error instanceof DOMException && error.name === "AbortError") return;
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
      cancelPendingRequests();
      pollCountRef.current = 0;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

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

        if (abortController.signal.aborted) return;

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
        if (error instanceof DOMException && error.name === "AbortError") return;
        updateGeneration(tempId, {
          status: "error",
          error: error instanceof Error ? error.message : "生成请求失败",
        });
        setIsGenerating(false);
      }
    },
    [isGenerating, addGeneration, updateGeneration, setIsGenerating, startPolling, stopPolling, cancelPendingRequests, provider, minimaxModel]
  );

  const cancelGeneration = useCallback(() => {
    stopPolling();
    cancelPendingRequests();
    setIsGenerating(false);
    if (currentGeneration && currentGeneration.status !== "complete") {
      updateGeneration(currentGeneration.id, {
        status: "error",
        error: "已取消",
      });
    }
  }, [stopPolling, cancelPendingRequests, setIsGenerating, currentGeneration, updateGeneration]);

  return {
    isGenerating,
    currentGeneration,
    startGeneration,
    cancelGeneration,
  };
}
