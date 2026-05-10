"use client";

import { useCallback, useState } from "react";
import { PromptInput } from "@/components/prompt-input";
import { GenerationProgress } from "@/components/generation-progress";
import { AudioPlayer } from "@/components/audio-player";
import { MusicHistory } from "@/components/music-history";
import { useMusicGeneration } from "@/hooks/use-music-generation";
import { useMusicStore } from "@/stores/music-store";
import { Separator } from "@/components/ui/separator";
import { Music, ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { MusicGenerationResult } from "@shared/types";
import type { GenerationOptions } from "@/hooks/use-music-generation";

export default function HomePage() {
  const { isGenerating, currentGeneration, startGeneration, cancelGeneration } =
    useMusicGeneration();
  const { setCurrentGeneration } = useMusicStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelectGeneration = useCallback(
    (generation: MusicGenerationResult) => {
      setSelectedId(generation.id);
      setCurrentGeneration(generation);
    },
    [setCurrentGeneration]
  );

  const handleGenerate = useCallback(
    (prompt: string, options: GenerationOptions) => {
      startGeneration(prompt, options);
    },
    [startGeneration]
  );

  const handleRetry = useCallback(
    (generation: MusicGenerationResult) => {
      const options: GenerationOptions = {
        provider: generation.provider,
        makeInstrumental: generation.provider === "suno",
        isInstrumental: generation.provider === "minimax",
        lyrics: generation.lyrics,
      };
      startGeneration(generation.prompt, options);
    },
    [startGeneration]
  );

  const activeGeneration =
    isGenerating && currentGeneration ? currentGeneration : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Music className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold hidden sm:block">AI Music Generator</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 sm:px-6 py-6">
        <section className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            创作你的AI音乐
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            选择 Suno AI 或 Minimax，描述你想要的音乐风格、情绪和乐器，AI将为你生成独特的音乐作品
          </p>
        </section>

        <PromptInput onSubmit={handleGenerate} isGenerating={isGenerating} />

        {activeGeneration && (
          <GenerationProgress
            generation={activeGeneration}
            onCancel={cancelGeneration}
          />
        )}

        {currentGeneration?.status === "complete" && (
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              正在播放
            </h3>
            <AudioPlayer generation={currentGeneration} />
          </section>
        )}

        <Separator />

        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            生成历史
          </h3>
          <MusicHistory
            selectedId={selectedId}
            onSelect={handleSelectGeneration}
            onRetry={handleRetry}
          />
        </section>
      </main>

      <footer className="border-t py-4">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-muted-foreground">
          Powered by Suno AI & Minimax · Built with Next.js + Tauri
        </div>
      </footer>
    </div>
  );
}
