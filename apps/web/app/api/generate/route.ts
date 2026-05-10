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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, makeInstrumental, model } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { message: "请输入有效的提示词" },
        { status: 400 }
      );
    }

    const payload = {
      gpt_description_prompt: prompt.trim(),
      make_instrumental: makeInstrumental ?? false,
      model: model ?? "chirp-v4",
    };

    const response = await fetch(`${SUNO_API_BASE}/api/generate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Suno API error:", response.status, errorText);
      return NextResponse.json(
        { message: `Suno API 错误: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.clips && data.clips.length > 0) {
      const clip = data.clips[0];
      return NextResponse.json({
        id: clip.id,
        status: "generating",
      });
    }

    return NextResponse.json(
      { message: "Suno API 返回了意外的响应格式" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "服务器内部错误" },
      { status: 500 }
    );
  }
}
