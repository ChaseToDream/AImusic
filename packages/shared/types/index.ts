export type MusicGenerationStatus =
  | "pending"
  | "generating"
  | "streaming"
  | "complete"
  | "error";

export type MusicProvider = "suno" | "minimax";

export type SunoModel = "chirp-v3-0" | "chirp-v3-5" | "chirp-v4";

export type MinimaxModel = "music-2.6" | "music-2.6-free";

export interface MusicGenerationRequest {
  prompt: string;
  makeInstrumental?: boolean;
  model?: SunoModel;
  waitAudio?: boolean;
}

export interface MinimaxGenerationRequest {
  prompt: string;
  lyrics: string;
  model?: MinimaxModel;
  isInstrumental?: boolean;
  lyricsOptimizer?: boolean;
}

export interface MusicGenerationResult {
  id: string;
  status: MusicGenerationStatus;
  title?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  duration?: number;
  prompt: string;
  lyrics?: string;
  createdAt: number;
  error?: string;
  model?: string;
  provider?: MusicProvider;
  tags?: string;
}

export interface SunoClip {
  id: string;
  status: string;
  title: string;
  image_url: string;
  audio_url: string;
  video_url: string;
  duration: number;
  metadata: {
    prompt: string;
    tags: string;
    type: string;
  };
  model_name: string;
  created_at: string;
  is_liked: boolean;
}

export interface SunoGenerateResponse {
  clips: SunoClip[];
}

export interface MinimaxGenerateResponse {
  data: {
    audio: string;
    status: number;
  };
  extra_info?: {
    music_duration: number;
    music_sample_rate: number;
    music_channel: number;
    bitrate: number;
    music_size: number;
  };
  base_resp: {
    status_code: number;
    status_msg: string;
  };
  trace_id?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface GenerateApiRequest {
  prompt: string;
  makeInstrumental?: boolean;
  model?: string;
  provider?: MusicProvider;
  lyrics?: string;
  isInstrumental?: boolean;
  lyricsOptimizer?: boolean;
}

export interface GenerateApiResponse {
  id: string;
  status: MusicGenerationStatus;
  audioUrl?: string;
  duration?: number;
  title?: string;
}

export interface StatusApiResponse {
  id: string;
  status: MusicGenerationStatus;
  title?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  duration?: number;
  error?: string;
  tags?: string;
  model?: string;
}
