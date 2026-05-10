"use client";

import { useEffect } from "react";

interface KeyboardShortcutsConfig {
  onTogglePlay?: () => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          config.onTogglePlay?.();
          break;
        case "ArrowLeft":
          if (e.shiftKey) {
            e.preventDefault();
            config.onSkipBack?.();
          }
          break;
        case "ArrowRight":
          if (e.shiftKey) {
            e.preventDefault();
            config.onSkipForward?.();
          }
          break;
        case "ArrowUp":
          if (e.shiftKey) {
            e.preventDefault();
            config.onVolumeUp?.();
          }
          break;
        case "ArrowDown":
          if (e.shiftKey) {
            e.preventDefault();
            config.onVolumeDown?.();
          }
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [config]);
}
