"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, X, Music } from "lucide-react";
import type { MusicGenerationResult } from "@shared/types";

interface GenerationProgressProps {
  generation: MusicGenerationResult;
  onCancel: () => void;
}

const STATUS_MESSAGES: Record<string, string> = {
  pending: "准备中...",
  generating: "AI 正在创作音乐...",
  streaming: "音乐流式传输中...",
  complete: "生成完成！",
  error: "生成失败",
};

function getProgressValue(status: string): number {
  switch (status) {
    case "pending":
      return 10;
    case "generating":
      return 50;
    case "streaming":
      return 80;
    case "complete":
      return 100;
    default:
      return 0;
  }
}

export function GenerationProgress({ generation, onCancel }: GenerationProgressProps) {
  const { status, prompt, error } = generation;
  const progress = getProgressValue(status);
  const message = STATUS_MESSAGES[status] || "处理中...";
  const isActive = status === "pending" || status === "generating" || status === "streaming";

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              {isActive ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : status === "complete" ? (
                <Music className="h-4 w-4 text-primary" />
              ) : null}
              <span className="text-sm font-medium">{message}</span>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-1">
              {prompt}
            </p>

            {isActive && (
              <Progress value={progress} className="h-2" />
            )}

            {status === "error" && error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          {isActive && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-8 w-8 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
