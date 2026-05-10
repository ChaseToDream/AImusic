"use client";

import { useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Download, Volume2, VolumeX } from "lucide-react";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { downloadAudio } from "@/lib/suno-api";
import type { MusicGenerationResult } from "@shared/types";

interface AudioPlayerProps {
  generation: MusicGenerationResult | null;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ generation }: AudioPlayerProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    toggle,
    seek,
    setVolume,
    loadAudio,
  } = useAudioPlayer();

  useEffect(() => {
    if (generation?.audioUrl) {
      loadAudio(generation.audioUrl);
    }
  }, [generation?.audioUrl, loadAudio]);

  const handleDownload = useCallback(() => {
    if (!generation?.audioUrl || !generation?.title) return;
    const filename = `${generation.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_")}.mp3`;
    downloadAudio(generation.audioUrl, filename).catch(console.error);
  }, [generation]);

  const handleSeek = useCallback(
    (value: number | readonly number[]) => {
      const v = Array.isArray(value) ? value[0] : value;
      if (typeof v === "number") seek(v);
    },
    [seek]
  );

  const handleVolumeChange = useCallback(
    (value: number | readonly number[]) => {
      const v = Array.isArray(value) ? value[0] : value;
      if (typeof v === "number") setVolume(v / 100);
    },
    [setVolume]
  );

  if (!generation?.audioUrl) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
        生成音乐后在此播放
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={toggle}
          className="h-10 w-10 shrink-0 rounded-full"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </Button>

        <div className="flex-1 space-y-1">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          className="h-8 w-8 shrink-0"
          title="下载"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {volume === 0 ? (
          <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <Slider
          value={[volume * 100]}
          min={0}
          max={100}
          step={1}
          onValueChange={handleVolumeChange}
          className="w-24"
        />
      </div>
    </div>
  );
}
