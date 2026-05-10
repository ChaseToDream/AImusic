import type {
  GenerateApiRequest,
  GenerateApiResponse,
  StatusApiResponse,
  SunoClip,
  MusicGenerationStatus,
} from "@shared/types";

const API_BASE = "/api";

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
  const response = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "生成请求失败" }));
    throw new Error(error.message || `请求失败: ${response.status}`);
  }

  return response.json();
}

export async function getGenerationStatus(id: string): Promise<StatusApiResponse> {
  const response = await fetch(`${API_BASE}/generate/${id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "获取状态失败" }));
    throw new Error(error.message || `请求失败: ${response.status}`);
  }

  return response.json();
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
  const response = await fetch(url);
  if (!response.ok) throw new Error("下载失败");

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}
