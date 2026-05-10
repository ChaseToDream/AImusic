import { NextRequest, NextResponse } from "next/server";

const SUNO_API_BASE = process.env.SUNO_API_BASE || "https://api.suno.ai";
const SUNO_API_KEY = process.env.SUNO_API_KEY || "";
const SUNO_COOKIE = process.env.SUNO_COOKIE || "";

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (SUNO_API_KEY) {
    headers["Authorization"] = `Bearer ${SUNO_API_KEY}`;
  }
  if (SUNO_COOKIE) {
    headers["Cookie"] = SUNO_COOKIE;
  }
  return headers;
}

function mapClipStatus(status: string): string {
  const s = status.toLowerCase();
  if (s === "complete" || s === "completed") return "complete";
  if (s === "error" || s === "failed") return "error";
  if (s === "streaming") return "streaming";
  if (s === "generating" || s === "processing") return "generating";
  return "pending";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "缺少生成任务ID" },
        { status: 400 }
      );
    }

    const response = await fetch(`${SUNO_API_BASE}/api/get?ids=${id}`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Suno status API error:", response.status, errorText);
      return NextResponse.json(
        { message: `获取状态失败: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const clip = Array.isArray(data) ? data[0] : data;

    if (!clip) {
      return NextResponse.json(
        { message: "未找到对应的生成任务" },
        { status: 404 }
      );
    }

    const status = mapClipStatus(clip.status || "");

    return NextResponse.json({
      id: clip.id,
      status,
      title: clip.title || "",
      imageUrl: clip.image_url || "",
      audioUrl: clip.audio_url || "",
      videoUrl: clip.video_url || "",
      duration: clip.duration || 0,
      error: clip.error || undefined,
      tags: clip.metadata?.tags || "",
      model: clip.model_name || "",
    });
  } catch (error) {
    console.error("Status API error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "服务器内部错误" },
      { status: 500 }
    );
  }
}
