import { NextRequest, NextResponse } from "next/server";

const SUNO_API_BASE = process.env.SUNO_API_BASE || "https://api.suno.ai";
const SUNO_API_KEY = process.env.SUNO_API_KEY || "";
const SUNO_COOKIE = process.env.SUNO_COOKIE || "";

const MINIMAX_API_BASE = process.env.MINIMAX_API_BASE || "https://api.minimaxi.com";
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || "";

function getSunoHeaders(): Record<string, string> {
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

function getMinimaxHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${MINIMAX_API_KEY}`,
  };
}

async function handleSunoGenerate(body: {
  prompt: string;
  makeInstrumental?: boolean;
  model?: string;
}) {
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
    headers: getSunoHeaders(),
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
}

async function handleMinimaxGenerate(body: {
  prompt: string;
  lyrics?: string;
  model?: string;
  isInstrumental?: boolean;
  lyricsOptimizer?: boolean;
}) {
  const { prompt, lyrics, model, isInstrumental, lyricsOptimizer } = body;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json(
      { message: "请输入有效的音乐描述" },
      { status: 400 }
    );
  }

  if (!MINIMAX_API_KEY) {
    return NextResponse.json(
      { message: "未配置 MINIMAX_API_KEY" },
      { status: 500 }
    );
  }

  const payload: Record<string, unknown> = {
    model: model || "music-2.6",
    prompt: prompt.trim(),
    output_format: "url",
    audio_setting: {
      sample_rate: 44100,
      bitrate: 256000,
      format: "mp3",
    },
  };

  if (isInstrumental) {
    payload.is_instrumental = true;
    payload.lyrics = "";
  } else if (lyricsOptimizer && !lyrics?.trim()) {
    payload.lyrics_optimizer = true;
    payload.lyrics = "";
  } else if (lyrics?.trim()) {
    payload.lyrics = lyrics.trim();
  } else {
    return NextResponse.json(
      { message: "请输入歌词或开启AI自动写歌词" },
      { status: 400 }
    );
  }

  const response = await fetch(`${MINIMAX_API_BASE}/v1/music_generation`, {
    method: "POST",
    headers: getMinimaxHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Minimax API error:", response.status, errorText);
    return NextResponse.json(
      { message: `Minimax API 错误: ${response.status}` },
      { status: response.status }
    );
  }

  const data = await response.json();

  if (data.base_resp?.status_code !== 0) {
    return NextResponse.json(
      { message: data.base_resp?.status_msg || "Minimax API 返回错误" },
      { status: 500 }
    );
  }

  const audioUrl = data.data?.audio || "";
  const duration = data.extra_info?.music_duration
    ? Math.round(data.extra_info.music_duration / 1000)
    : undefined;
  const traceId = data.trace_id || `minimax-${Date.now()}`;

  return NextResponse.json({
    id: traceId,
    status: "complete" as const,
    audioUrl,
    duration,
    title: prompt.trim().slice(0, 30),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider } = body;

    if (provider === "minimax") {
      return handleMinimaxGenerate(body);
    }

    return handleSunoGenerate(body);
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "服务器内部错误" },
      { status: 500 }
    );
  }
}
