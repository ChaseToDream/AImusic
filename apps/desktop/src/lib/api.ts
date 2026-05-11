import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { openUrl } from "@tauri-apps/plugin-opener";
import type {
  GenerateApiRequest,
  GenerateApiResponse,
  StatusApiResponse,
  SunoClip,
  MusicGenerationStatus,
} from "@shared/types";

function mapClipStatus(status: string): MusicGenerationStatus {
  const s = status.toLowerCase();
  if (s === "complete" || s === "completed") return "complete";
  if (s === "error" || s === "failed") return "error";
  if (s === "streaming") return "streaming";
  if (s === "generating" || s === "processing") return "generating";
  return "pending";
}

export async function generateMusic(
  request: GenerateApiRequest
): Promise<GenerateApiResponse> {
  return invoke<GenerateApiResponse>("generate_music", { request });
}

export async function getGenerationStatus(id: string): Promise<StatusApiResponse> {
  return invoke<StatusApiResponse>("get_generation_status", { id });
}

export function mapClipToStatusResponse(clip: SunoClip): StatusApiResponse {
  return {
    id: clip.id,
    status: mapClipStatus(clip.status),
    title: clip.title,
    imageUrl: clip.image_url,
    audioUrl: clip.audio_url,
    videoUrl: clip.video_url,
    duration: clip.duration,
    tags: clip.metadata?.tags,
    model: clip.model_name,
  };
}

export async function downloadAudio(url: string, filename: string): Promise<void> {
  const filePath = await save({
    defaultPath: filename,
    filters: [
      { name: "Audio", extensions: ["mp3", "wav"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!filePath) return;

  const response = await fetch(url);
  if (!response.ok) throw new Error("下载失败");

  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  await writeFile(filePath, data);
}

export async function openExternalUrl(url: string): Promise<void> {
  try {
    await openUrl(url);
  } catch {
    await invoke("open_external_url", { url });
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
    await writeText(text);
  }
}
