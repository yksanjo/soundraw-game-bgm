import { analyzeSceneForMusic } from '../services/deepseek.js';
import { composeMusic, extractResult } from '../services/soundraw.js';
import { getIntegrationCode } from '../prompts/scene-analysis.js';
import { GenerateBgmInputSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';
import type { GenerateBgmOutput, SoundrawComposeRequest } from '../types/index.js';

export const generateBgmToolDefinition = {
  name: 'generate_bgm',
  description:
    'Generate background music for a game scene. Uses DeepSeek to analyze the scene and map to Soundraw parameters, then generates music via Soundraw API. Returns audio URL, share link, and optional game engine integration code.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      scene: {
        type: 'string',
        description:
          'Scene type (e.g., "boss_fight", "exploration", "cutscene", "menu", "combat", "stealth", "horror")',
      },
      game_genre: {
        type: 'string',
        description:
          'Game genre (e.g., "dark_souls_like", "jrpg", "fps", "puzzle", "horror", "platformer", "metroidvania")',
      },
      intensity: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Music intensity level',
      },
      mood: {
        type: 'string',
        description:
          'Optional mood hint (e.g., "epic", "melancholic", "mysterious", "peaceful", "tense")',
      },
      duration_seconds: {
        type: 'number',
        description: 'Track duration in seconds (10-300, default: 60)',
      },
      engine: {
        type: 'string',
        enum: ['unreal', 'unity', 'godot'],
        description: 'Game engine for integration code snippets',
      },
      file_format: {
        type: 'string',
        enum: ['m4a', 'mp3', 'wav'],
        description: 'Audio file format (default: m4a, recommended for quality/size)',
      },
    },
    required: ['scene', 'game_genre', 'intensity'],
  },
};

// Map energy profile to Soundraw energy_levels
function getEnergyLevels(
  profile: string,
  durationSeconds: number
): Array<{ start: number; end: number; energy: string }> {
  const midpoint = durationSeconds / 2;
  const quarter = durationSeconds / 4;

  switch (profile) {
    case 'building':
      return [
        { start: 0, end: quarter, energy: 'Low' },
        { start: quarter, end: midpoint, energy: 'Medium' },
        { start: midpoint, end: quarter * 3, energy: 'High' },
        { start: quarter * 3, end: durationSeconds, energy: 'Very High' },
      ];
    case 'climax':
      return [
        { start: 0, end: quarter, energy: 'High' },
        { start: quarter, end: durationSeconds, energy: 'Very High' },
      ];
    case 'ambient':
      return [
        { start: 0, end: durationSeconds, energy: 'Low' },
      ];
    case 'steady':
    default:
      return [
        { start: 0, end: durationSeconds, energy: 'Medium' },
      ];
  }
}

export async function handleGenerateBgm(
  args: Record<string, unknown>
): Promise<GenerateBgmOutput> {
  logger.info('Handling generate_bgm request', { args });

  const input = GenerateBgmInputSchema.parse(args);
  const duration = input.duration_seconds ?? 60;
  const fileFormat = input.file_format ?? 'm4a';

  // Step 1: Use DeepSeek to analyze scene and generate Soundraw parameters
  logger.info('Step 1: Analyzing scene with DeepSeek');
  const musicParams = await analyzeSceneForMusic(
    input.scene,
    input.game_genre,
    input.intensity,
    input.mood
  );

  // Step 2: Build Soundraw request
  const soundrawParams: SoundrawComposeRequest = {
    length: duration,
    moods: musicParams.moods,
    genres: musicParams.genres,
    themes: musicParams.themes,
    tempo: [musicParams.tempo],
    file_format: [fileFormat],
    energy_levels: getEnergyLevels(musicParams.energy_profile, duration),
  };

  // Step 3: Generate music with Soundraw (async with polling)
  logger.info('Step 2: Generating music with Soundraw', { soundrawParams });
  const { result: soundrawResponse, format } = await composeMusic(soundrawParams);
  const extracted = extractResult(soundrawResponse, format);

  // Step 4: Generate integration code if engine specified
  const integrationCode = getIntegrationCode(
    input.engine,
    extracted.audio_url,
    extracted.bpm
  );

  const output: GenerateBgmOutput = {
    share_link: extracted.share_link,
    audio_url: extracted.audio_url,
    request_id: extracted.request_id,
    duration_seconds: extracted.duration_seconds,
    bpm: extracted.bpm,
    timestamps: extracted.timestamps,
    file_format: format,
    integration_code: integrationCode,
    deepseek_reasoning: musicParams.reasoning,
    soundraw_params: soundrawParams,
  };

  logger.info('BGM generation complete', {
    share_link: output.share_link,
    bpm: output.bpm,
    duration: output.duration_seconds,
  });

  return output;
}
