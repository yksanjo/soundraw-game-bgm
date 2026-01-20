import { z } from 'zod';

// ========== Soundraw API Constants ==========

export const SOUNDRAW_MOODS = [
  'Angry', 'Busy & Frantic', 'Dark', 'Dreamy', 'Elegant', 'Epic', 'Euphoric',
  'Fear', 'Funny & Weird', 'Glamorous', 'Happy', 'Heavy & Ponderous', 'Hopeful',
  'Laid Back', 'Mysterious', 'Peaceful', 'Restless', 'Romantic', 'Running',
  'Sad', 'Scary', 'Sentimental', 'Sexy', 'Smooth', 'Suspense'
] as const;

export const SOUNDRAW_GENRES = [
  'Acoustic', 'Hip Hop', 'Beats', 'Funk', 'Pop', 'Drum n Bass', 'Trap',
  'Tokyo night pop', 'Rock', 'Latin', 'House', 'Tropical House', 'Ambient',
  'Orchestra', 'Electro & Dance', 'Electronica', 'Techno & Trance',
  'Jersey Club', 'Drill', 'R&B', 'Lofi Hip Hop', 'World', 'Afrobeats', 'Christmas'
] as const;

export const SOUNDRAW_THEMES = [
  'Ads & Trailers', 'Broadcasting', 'Cinematic', 'Corporate', 'Comedy',
  'Cooking', 'Documentary', 'Drama', 'Fashion & Beauty', 'Gaming',
  'Holiday Season', 'Horror & Thriller', 'Motivational & Inspiring', 'Nature',
  'Photography', 'Sports & Action', 'Technology', 'Travel', 'Tutorials',
  'Vlogs', 'Wedding & Romance', 'Workout & Wellness'
] as const;

export const SOUNDRAW_TEMPOS = ['low', 'normal', 'high'] as const;
export const SOUNDRAW_ENERGY_LEVELS = ['Muted', 'Low', 'Medium', 'High', 'Very High'] as const;
export const SOUNDRAW_STEMS = ['bc', 'bs', 'dr', 'me', 'fe', 'ff'] as const;
export const SOUNDRAW_FILE_FORMATS = ['m4a', 'mp3', 'wav'] as const;

// ========== Input Schemas ==========

export const GenerateBgmInputSchema = z.object({
  scene: z.string().describe('Scene type: boss_fight, exploration, cutscene, menu, combat, etc.'),
  game_genre: z.string().describe('Game genre: dark_souls_like, jrpg, fps, puzzle, horror, platformer, etc.'),
  intensity: z.enum(['low', 'medium', 'high']).describe('Music intensity level'),
  mood: z.string().optional().describe('Optional mood: epic, melancholic, mysterious, peaceful, tense, etc.'),
  duration_seconds: z.number().min(10).max(300).optional().describe('Target duration in seconds (10-300)'),
  engine: z.enum(['unreal', 'unity', 'godot']).optional().describe('Game engine for integration code'),
  file_format: z.enum(['m4a', 'mp3', 'wav']).optional().describe('Audio file format (default: m4a)'),
});

export const GetVariationsInputSchema = z.object({
  share_link: z.string().url().describe('The share_link URL of the original BGM'),
  variation_type: z.enum(['similar', 'customize']).describe('Type: similar (new song) or customize (adjust energy/stems)'),
  length: z.number().min(10).max(300).optional().describe('Length for similar track'),
  energy_preset: z.enum(['building', 'steady', 'climax', 'fade_out']).optional().describe('Energy preset for customize'),
  mute_stems: z.array(z.enum(['bc', 'bs', 'dr', 'me', 'fe', 'ff'])).optional().describe('Stems to mute'),
});

export const AdaptiveLayerInputSchema = z.object({
  share_link: z.string().url().describe('The share_link URL of the track'),
  layers_to_keep: z.array(z.enum(['backing', 'bass', 'drums', 'melody'])).describe('Layers to keep unmuted'),
  file_format: z.enum(['m4a', 'mp3', 'wav']).optional().describe('Audio format'),
});

export const SceneTransitionInputSchema = z.object({
  from_scene: z.string().describe('Starting scene description'),
  to_scene: z.string().describe('Target scene description'),
  transition_type: z.enum(['fade', 'stinger', 'crossfade']).describe('Type of musical transition'),
  duration_seconds: z.number().min(10).max(60).describe('Transition duration in seconds (10-60)'),
});

// ========== Output Types ==========

export interface GenerateBgmOutput {
  share_link: string;
  audio_url: string;
  request_id: string;
  duration_seconds: number;
  bpm: number;
  timestamps: Array<{ start: number; end: number; energy: string }>;
  file_format: string;
  integration_code?: string;
  deepseek_reasoning: string;
  soundraw_params: SoundrawComposeRequest;
}

export interface VariationOutput {
  share_link: string;
  audio_url: string;
  request_id: string;
  duration_seconds: number;
  bpm: number;
  variation_type: string;
  base_share_link: string;
}

export interface AdaptiveLayerOutput {
  layers: Array<{
    name: string;
    mute_stems: string[];
    share_link: string;
    audio_url: string;
    request_id: string;
  }>;
  base_share_link: string;
  integration_code: string;
}

export interface SceneTransitionOutput {
  share_link: string;
  audio_url: string;
  request_id: string;
  from_scene: string;
  to_scene: string;
  transition_type: string;
  duration_seconds: number;
  bpm: number;
  deepseek_reasoning: string;
}

// ========== DeepSeek Response Types ==========

export interface DeepSeekMusicParams {
  moods: string[];
  genres: string[];
  themes: string[];
  tempo: 'low' | 'normal' | 'high';
  energy_profile: 'building' | 'steady' | 'climax' | 'ambient';
  reasoning: string;
}

export interface DeepSeekTransitionParams {
  from_mood: string;
  to_mood: string;
  moods: string[];
  genres: string[];
  themes: string[];
  tempo: 'low' | 'normal' | 'high';
  energy_levels: Array<{ start: number; end: number; energy: string }>;
  reasoning: string;
}

// ========== Soundraw API Types ==========

export interface SoundrawComposeRequest {
  length: number;
  moods?: string[];
  genres?: string[];
  themes?: string[];
  tempo?: string[];
  file_format?: string[];
  mute_stems?: string[];
  energy_levels?: Array<{ start: number; end: number; energy: string }>;
}

export interface SoundrawSimilarRequest {
  share_link: string;
  length?: number;
  tempo?: string[];
  file_format?: string[];
  mute_stems?: string[];
}

export interface SoundrawCustomizeRequest {
  share_link: string;
  energy_levels?: Array<{ start: number; end: number; energy: string }>;
  mute_stems?: string[];
  file_format?: string[];
}

export interface SoundrawComposeResponse {
  request_id: string;
}

export interface SoundrawResultResponse {
  endpoint: string;
  params: Record<string, unknown>;
  request_id: string;
  status: 'processing' | 'done' | 'failed';
  result?: {
    bpm: string;
    share_link: string;
    length: number;
    timestamps: Array<{ start: number; end: number; energy: string }>;
    m4a_url?: string;
    mp3_url?: string;
    wav_url?: string;
  };
}

// ========== Type exports ==========

export type GenerateBgmInput = z.infer<typeof GenerateBgmInputSchema>;
export type GetVariationsInput = z.infer<typeof GetVariationsInputSchema>;
export type AdaptiveLayerInput = z.infer<typeof AdaptiveLayerInputSchema>;
export type SceneTransitionInput = z.infer<typeof SceneTransitionInputSchema>;
