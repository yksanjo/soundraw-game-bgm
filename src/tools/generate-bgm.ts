import { analyzeSceneForMusic } from '../services/deepseek.js';
import { generateMusic } from '../services/soundraw.js';
import { getIntegrationCode } from '../prompts/scene-analysis.js';
import { GenerateBgmInputSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';
import type { GenerateBgmOutput } from '../types/index.js';

export const generateBgmToolDefinition = {
  name: 'generate_bgm',
  description:
    'Generate background music for a game scene. Uses DeepSeek to analyze the scene context and generate appropriate music parameters, then calls Soundraw to generate the actual music. Returns audio URL, metadata, and optional game engine integration code.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      scene: {
        type: 'string',
        description:
          'Scene type (e.g., "boss_fight", "exploration", "cutscene", "menu", "combat", "stealth")',
      },
      game_genre: {
        type: 'string',
        description:
          'Game genre (e.g., "dark_souls_like", "jrpg", "fps", "puzzle", "horror", "platformer")',
      },
      intensity: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Music intensity level',
      },
      mood: {
        type: 'string',
        description:
          'Optional desired mood (e.g., "epic", "melancholic", "mysterious", "peaceful", "tense")',
      },
      duration_seconds: {
        type: 'number',
        description: 'Target duration in seconds (10-300, default: 60)',
      },
      engine: {
        type: 'string',
        enum: ['unreal', 'unity', 'godot'],
        description: 'Game engine for integration code snippets',
      },
    },
    required: ['scene', 'game_genre', 'intensity'],
  },
};

export async function handleGenerateBgm(
  args: Record<string, unknown>
): Promise<GenerateBgmOutput> {
  logger.info('Handling generate_bgm request', { args });

  // Validate input
  const input = GenerateBgmInputSchema.parse(args);
  const duration = input.duration_seconds ?? 60;

  // Step 1: Use DeepSeek to analyze scene and generate music parameters
  logger.info('Step 1: Analyzing scene with DeepSeek');
  const musicParams = await analyzeSceneForMusic(
    input.scene,
    input.game_genre,
    input.intensity,
    input.mood
  );

  // Step 2: Generate music with Soundraw
  logger.info('Step 2: Generating music with Soundraw');
  const soundrawResult = await generateMusic(musicParams, duration);

  // Step 3: Generate integration code if engine specified
  const integrationCode = getIntegrationCode(
    input.engine,
    soundrawResult.audio_url,
    soundrawResult.bpm
  );

  // Construct output
  const output: GenerateBgmOutput = {
    audio_url: soundrawResult.audio_url,
    audio_id: soundrawResult.id,
    duration_seconds: soundrawResult.duration,
    bpm: soundrawResult.bpm,
    key: soundrawResult.key,
    instruments: musicParams.instruments,
    mood_tags: [musicParams.mood, ...musicParams.genre_tags],
    integration_code: integrationCode,
    deepseek_reasoning: musicParams.reasoning,
  };

  logger.info('BGM generation complete', { audioId: output.audio_id, bpm: output.bpm });
  return output;
}
