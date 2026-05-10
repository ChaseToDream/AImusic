"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Download, Trash2, Music } from "lucide-react";
import { useMusicStore } from "@/stores/music-store";
import { downloadAudio } from "@/lib/suno-api";
import type { MusicGenerationResult } from "@shared/types";

interface MusicCardProps {
  generation: MusicGenerationResult;
  onSelect: (generation: MusicGenerationResult) => void;
  isSelected: boolean;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MusicCard({ generation, onSelect, isSelected }: MusicCardProps) {
  const { removeGeneration } = useMusicStore();
  const { title, status, duration, prompt, createdAt, audioUrl, tags } = generation;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioUrl || !title) return;
    const filename = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_")}.mp3`;
    downloadAudio(audioUrl, filename).catch(console.error);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeGeneration(generation.id);
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "border-primary ring-1 ring-primary/20" : ""
      }`}
      onClick={() => onSelect(generation)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            {status === "complete" && audioUrl ? (
              <Play className="h-5 w-5 text-primary" />
            ) : (
              <Music className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium truncate">
                {title || "生成中..."}
              </h3>
              {status === "complete" && (
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {formatTime(duration ?? 0)}
                </Badge>
              )}
              {status === "error" && (
                <Badge variant="destructive" className="shrink-0 text-[10px]">
                  失败
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground line-clamp-1">
              {prompt}
            </p>

            {tags && (
              <div className="flex flex-wrap gap-1">
                {tags.split(",").slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground/60">
              {formatDate(createdAt)}
            </p>
          </div>

          <div className="flex shrink-0 gap-1">
            {status === "complete" && audioUrl && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="h-7 w-7"
                title="下载"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="删除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
