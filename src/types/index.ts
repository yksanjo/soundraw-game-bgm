import { z } from 'zod';

// ========== Input Schemas ==========

export const GenerateBgmInputSchema = z.object({
  scene: z.string().describe('Scene type: boss_fight, exploration, cutscene, menu, combat, etc.'),
  game_genre: z.string().describe('Game genre: dark_souls_like, jrpg, fps, puzzle, horror, platformer, etc.'),
  intensity: z.enum(['low', 'medium', 'high']).describe('Music intensity level'),
  mood: z.string().optional().describe('Optional mood: epic, melancholic, mysterious, peaceful, tense, etc.'),
  duration_seconds: z.number().min(10).max(300).optional().describe('Target duration in seconds (10-300)'),
  engine: z.enum(['unreal', 'unity', 'godot']).optional().describe('Game engine for integration code'),
});

export const GetVariationsInputSchema = z.object({
  base_audio_id: z.string().describe('Reference ID of the original BGM'),
  variation_type: z.enum(['intensity', 'instrument', 'tempo']).describe('Type of variation to generate'),
  count: z.number().min(1).max(5).describe('Number of variations to generate (1-5)'),
});

export const AdaptiveLayerInputSchema = z.object({
  audio_id: z.string().describe('Audio ID for stem separation'),
  layers: z.array(z.string()).describe('Layers to extract: drums, bass, melody, ambient, etc.'),
  crossfade_ms: z.number().min(0).max(5000).default(500).describe('Crossfade duration in milliseconds'),
});

export const SceneTransitionInputSchema = z.object({
  from_scene: z.string().describe('Starting scene description'),
  to_scene: z.string().describe('Target scene description'),
  transition_type: z.enum(['fade', 'stinger', 'crossfade']).describe('Type of musical transition'),
  duration_seconds: z.number().min(1).max(30).describe('Transition duration in seconds'),
});

// ========== Output Types ==========

export interface GenerateBgmOutput {
  audio_url: string;
  audio_id: string;
  duration_seconds: number;
  bpm: number;
  key: string;
  instruments: string[];
  mood_tags: string[];
  integration_code?: string;
  deepseek_reasoning: string;
}

export interface VariationOutput {
  variations: Array<{
    audio_url: string;
    audio_id: string;
    variation_type: string;
    description: string;
  }>;
  base_audio_id: string;
}

export interface AdaptiveLayerOutput {
  audio_id: string;
  layers: Array<{
    name: string;
    audio_url: string;
    volume_default: number;
  }>;
  crossfade_ms: number;
  integration_code?: string;
}

export interface SceneTransitionOutput {
  transition_audio_url: string;
  audio_id: string;
  from_scene: string;
  to_scene: string;
  transition_type: string;
  duration_seconds: number;
  deepseek_reasoning: string;
}

// ========== DeepSeek Response Types ==========

export interface DeepSeekMusicParams {
  tempo: number;
  mood: string;
  instruments: string[];
  energy: 'low' | 'medium' | 'high';
  key_suggestion: string;
  genre_tags: string[];
  reasoning: string;
}

export interface DeepSeekTransitionParams {
  from_mood: string;
  to_mood: string;
  transition_style: string;
  tempo_change: 'increase' | 'decrease' | 'stable';
  key_relationship: string;
  reasoning: string;
}

// ========== Soundraw Types ==========

export interface SoundrawGenerateRequest {
  tempo: number;
  mood: string;
  instruments: string[];
  energy: string;
  duration: number;
  genre?: string;
}

export interface SoundrawGenerateResponse {
  id: string;
  audio_url: string;
  duration: number;
  bpm: number;
  key: string;
  tags: string[];
}

// ========== Type exports ==========

export type GenerateBgmInput = z.infer<typeof GenerateBgmInputSchema>;
export type GetVariationsInput = z.infer<typeof GetVariationsInputSchema>;
export type AdaptiveLayerInput = z.infer<typeof AdaptiveLayerInputSchema>;
export type SceneTransitionInput = z.infer<typeof SceneTransitionInputSchema>;
