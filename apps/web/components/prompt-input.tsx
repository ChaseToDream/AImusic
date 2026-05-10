"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Music, Loader2 } from "lucide-react";

interface PromptInputProps {
  onSubmit: (prompt: string, options: { makeInstrumental?: boolean }) => void;
  isGenerating: boolean;
}

const EXAMPLE_PROMPTS = [
  "一首轻快的夏日流行曲，带有电子节拍",
  "舒缓的钢琴独奏，适合冥想和放松",
  "摇滚风格，充满能量的吉他即兴",
  "中国风古筝与现代电子音乐融合",
];

export function PromptInput({ onSubmit, isGenerating }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [makeInstrumental, setMakeInstrumental] = useState(false);

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onSubmit(prompt, { makeInstrumental });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="描述你想生成的音乐风格、情绪、乐器..."
          className="min-h-[120px] resize-none pr-4 text-base"
          disabled={isGenerating}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((example) => (
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
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isGenerating}
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
              生成音乐
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
