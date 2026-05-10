export type MusicGenerationStatus =
  | "pending"
  | "generating"
  | "streaming"
  | "complete"
  | "error";

export interface MusicGenerationRequest {
  prompt: string;
  makeInstrumental?: boolean;
  model?: "chirp-v3-0" | "chirp-v3-5" | "chirp-v4";
  waitAudio?: boolean;
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
  createdAt: number;
  error?: string;
  model?: string;
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

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface GenerateApiRequest {
  prompt: string;
  makeInstrumental?: boolean;
  model?: string;
}

export interface GenerateApiResponse {
  id: string;
  status: MusicGenerationStatus;
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
