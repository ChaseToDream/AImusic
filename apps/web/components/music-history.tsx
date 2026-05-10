"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { MusicCard } from "@/components/music-card";
import { useMusicStore } from "@/stores/music-store";
import { Music } from "lucide-react";
import type { MusicGenerationResult } from "@shared/types";

interface MusicHistoryProps {
  selectedId: string | null;
  onSelect: (generation: MusicGenerationResult) => void;
}

export function MusicHistory({ selectedId, onSelect }: MusicHistoryProps) {
  const { generations } = useMusicStore();

  if (generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Music className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-sm font-medium">还没有生成记录</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          输入提示词开始创作你的第一首AI音乐
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-400px)] min-h-[200px]">
      <div className="space-y-2 pr-4">
        {generations.map((gen) => (
          <MusicCard
            key={gen.id}
            generation={gen}
            onSelect={onSelect}
            isSelected={gen.id === selectedId}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
