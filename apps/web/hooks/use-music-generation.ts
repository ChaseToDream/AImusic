"use client";

import { useCallback, useRef } from "react";
import { useMusicStore } from "@/stores/music-store";
import { generateMusic, getGenerationStatus } from "@/lib/suno-api";
import type { MusicGenerationResult } from "@shared/types";

const POLL_INTERVAL = 3000;
const MAX_POLL_ATTEMPTS = 120;

export function useMusicGeneration() {
  const {
    isGenerating,
    currentGeneration,
    addGeneration,
    updateGeneration,
    setIsGenerating,
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
    async (prompt: string, options?: { makeInstrumental?: boolean; model?: string }) => {
      if (isGenerating) return;
      if (!prompt.trim()) return;

      setIsGenerating(true);
      stopPolling();
      pollCountRef.current = 0;

      const tempId = `temp-${Date.now()}`;
      const newGeneration: MusicGenerationResult = {
        id: tempId,
        status: "pending",
        prompt: prompt.trim(),
        createdAt: Date.now(),
      };
      addGeneration(newGeneration);

      try {
        const response = await generateMusic({
          prompt: prompt.trim(),
          makeInstrumental: options?.makeInstrumental,
          model: options?.model,
        });

        updateGeneration(tempId, {
          id: response.id,
          status: response.status,
        });

        startPolling(response.id);
      } catch (error) {
        updateGeneration(tempId, {
          status: "error",
          error: error instanceof Error ? error.message : "生成请求失败",
        });
        setIsGenerating(false);
      }
    },
    [isGenerating, addGeneration, updateGeneration, setIsGenerating, startPolling, stopPolling]
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
