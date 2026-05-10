"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Music, Loader2, Mic, MicOff, Wand2, ChevronDown } from "lucide-react";
import { useMusicStore } from "@/stores/music-store";
import type { MusicProvider, MinimaxModel } from "@shared/types";
import type { GenerationOptions } from "@/hooks/use-music-generation";

interface PromptInputProps {
  onSubmit: (prompt: string, options: GenerationOptions) => void;
  isGenerating: boolean;
}

const SUNO_EXAMPLE_PROMPTS = [
  "一首轻快的夏日流行曲，带有电子节拍",
  "舒缓的钢琴独奏，适合冥想和放松",
  "摇滚风格，充满能量的吉他即兴",
  "中国风古筝与现代电子音乐融合",
];

const MINIMAX_EXAMPLE_PROMPTS = [
  "独立民谣,忧郁,内省,渴望,独自漫步,咖啡馆",
  "电子流行,欢快,节奏感强,霓虹灯,夜店",
  "古风仙侠,抒情,影视配乐,古筝与二胡",
  "爵士乐,慵懒,咖啡厅,萨克斯,雨天",
];

const MINIMAX_MODELS: { value: MinimaxModel; label: string; desc: string }[] = [
  { value: "music-2.6", label: "Music 2.6", desc: "高质量（需付费）" },
  { value: "music-2.6-free", label: "Music 2.6 Free", desc: "免费版" },
];

const LYRICS_EXAMPLE = `[Verse]
街灯微亮晚风轻抚
影子拉长独自漫步

[Chorus]
推开木门香气弥漫
熟悉的角落陌生人看`;

export function PromptInput({ onSubmit, isGenerating }: PromptInputProps) {
  const { provider, setProvider, minimaxModel, setMinimaxModel } = useMusicStore();
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [makeInstrumental, setMakeInstrumental] = useState(false);
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [lyricsOptimizer, setLyricsOptimizer] = useState(false);
  const [showModelSelect, setShowModelSelect] = useState(false);

  const isMinimax = provider === "minimax";
  const examplePrompts = isMinimax ? MINIMAX_EXAMPLE_PROMPTS : SUNO_EXAMPLE_PROMPTS;

  const canSubmit = () => {
    if (!prompt.trim() || isGenerating) return false;
    if (isMinimax && !isInstrumental && !lyricsOptimizer && !lyrics.trim()) return false;
    return true;
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;

    if (isMinimax) {
      onSubmit(prompt, {
        provider: "minimax",
        isInstrumental,
        lyricsOptimizer,
        lyrics: isInstrumental ? "" : lyrics,
        minimaxModel,
      });
    } else {
      onSubmit(prompt, {
        provider: "suno",
        makeInstrumental,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const handleProviderChange = (newProvider: MusicProvider) => {
    setProvider(newProvider);
    setPrompt("");
    setLyrics("");
    setMakeInstrumental(false);
    setIsInstrumental(false);
    setLyricsOptimizer(newProvider === "minimax");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
        <button
          onClick={() => handleProviderChange("suno")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
            !isMinimax
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Music className="h-3.5 w-3.5" />
            Suno AI
          </div>
        </button>
        <button
          onClick={() => handleProviderChange("minimax")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
            isMinimax
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Minimax
          </div>
        </button>
      </div>

      {isMinimax && (
        <div className="relative">
          <button
            onClick={() => setShowModelSelect(!showModelSelect)}
            className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
          >
            <span className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {MINIMAX_MODELS.find((m) => m.value === minimaxModel)?.label}
              </Badge>
              <span className="text-muted-foreground">
                {MINIMAX_MODELS.find((m) => m.value === minimaxModel)?.desc}
              </span>
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showModelSelect ? "rotate-180" : ""}`} />
          </button>
          {showModelSelect && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
              {MINIMAX_MODELS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => {
                    setMinimaxModel(m.value);
                    setShowModelSelect(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors ${
                    minimaxModel === m.value
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <Badge variant="secondary" className="text-[10px]">{m.label}</Badge>
                  <span className="text-muted-foreground text-xs">{m.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isMinimax
              ? "描述音乐风格、情绪和场景，如：流行音乐, 难过, 适合在下雨的晚上"
              : "描述你想生成的音乐风格、情绪、乐器..."
          }
          className="min-h-[100px] resize-none pr-4 text-base"
          disabled={isGenerating}
        />
      </div>

      {isMinimax && !isInstrumental && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">
              歌词
            </label>
            <button
              onClick={() => setLyricsOptimizer(!lyricsOptimizer)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors ${
                lyricsOptimizer
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              disabled={isGenerating}
            >
              <Wand2 className="h-3 w-3" />
              AI自动写歌词
            </button>
          </div>
          {lyricsOptimizer ? (
            <div className="rounded-md border bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground">
                AI 将根据你的风格描述自动生成歌词，无需手动输入
              </p>
            </div>
          ) : (
            <Textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`输入歌词，支持结构标签：\n${LYRICS_EXAMPLE}`}
              className="min-h-[140px] resize-none text-sm font-mono"
              disabled={isGenerating}
            />
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {examplePrompts.map((example) => (
          <button
            key={example}
            onClick={() => setPrompt(example)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            disabled={isGenerating}
          >
            <Sparkles className="h-3 w-3" />
            {example.slice(0, 20)}...
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isMinimax ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isInstrumental}
                onChange={(e) => {
                  setIsInstrumental(e.target.checked);
                  if (e.target.checked) {
                    setLyricsOptimizer(false);
                  } else {
                    setLyricsOptimizer(true);
                  }
                }}
                className="rounded border-border"
                disabled={isGenerating}
              />
              {isInstrumental ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              纯音乐（无人声）
            </label>
          ) : (
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={makeInstrumental}
                onChange={(e) => setMakeInstrumental(e.target.checked)}
                className="rounded border-border"
                disabled={isGenerating}
              />
              纯音乐（无人声）
            </label>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit()}
          size="lg"
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Music className="h-4 w-4" />
              {isMinimax ? "Minimax 生成" : "生成音乐"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
