"use client";

import { useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MusicCard } from "@/components/music-card";
import { useMusicStore } from "@/stores/music-store";
import { Music, Search, Trash2, Filter } from "lucide-react";
import type { MusicGenerationResult } from "@shared/types";

type FilterType = "all" | "complete" | "error" | "generating";

interface MusicHistoryProps {
  selectedId: string | null;
  onSelect: (generation: MusicGenerationResult) => void;
  onRetry?: (generation: MusicGenerationResult) => void;
}

const FILTER_OPTIONS: Array<{ value: FilterType; label: string }> = [
  { value: "all", label: "全部" },
  { value: "complete", label: "已完成" },
  { value: "error", label: "失败" },
  { value: "generating", label: "生成中" },
];

export function MusicHistory({ selectedId, onSelect, onRetry }: MusicHistoryProps) {
  const { generations, clearHistory } = useMusicStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredGenerations = useMemo(() => {
    let result = generations;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.prompt.toLowerCase().includes(query) ||
          g.title?.toLowerCase().includes(query) ||
          g.tags?.toLowerCase().includes(query)
      );
    }

    if (activeFilter !== "all") {
      result = result.filter((g) => {
        switch (activeFilter) {
          case "complete":
            return g.status === "complete";
          case "error":
            return g.status === "error";
          case "generating":
            return g.status === "pending" || g.status === "generating" || g.status === "streaming";
          default:
            return true;
        }
      });
    }

    return result;
  }, [generations, searchQuery, activeFilter]);

  const completedCount = generations.filter((g) => g.status === "complete").length;

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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索提示词、标题或标签..."
            className="h-8 pl-8 text-sm"
          />
        </div>
        {completedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="h-8 gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            清空
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveFilter(opt.value)}
            className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
              activeFilter === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filteredGenerations.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {searchQuery ? "没有匹配的记录" : "该分类下暂无记录"}
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-480px)] min-h-[200px]">
          <div className="space-y-2 pr-4">
            {filteredGenerations.map((gen) => (
              <MusicCard
                key={gen.id}
                generation={gen}
                onSelect={onSelect}
                isSelected={gen.id === selectedId}
                onRetry={onRetry}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
