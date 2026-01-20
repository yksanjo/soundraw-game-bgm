import { analyzeTransition } from '../services/deepseek.js';
import { composeMusic, extractResult } from '../services/soundraw.js';
import { SceneTransitionInputSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';
import type { SceneTransitionOutput, SoundrawComposeRequest } from '../types/index.js';

export const sceneTransitionToolDefinition = {
  name: 'scene_transition_music',
  description:
    'Generate transition music between two game scenes. Uses DeepSeek to analyze the emotional journey between scenes and creates appropriate transition audio with dynamic energy levels.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      from_scene: {
        type: 'string',
        description: 'Description of the starting scene (e.g., "peaceful village exploration", "tense stealth section")',
      },
      to_scene: {
        type: 'string',
        description: 'Description of the target scene (e.g., "intense boss battle", "emotional cutscene")',
      },
      transition_type: {
        type: 'string',
        enum: ['fade', 'stinger', 'crossfade'],
        description:
          '"fade" = gradual energy shift, "stinger" = dramatic accent, "crossfade" = smooth blend',
      },
      duration_seconds: {
        type: 'number',
        description: 'Transition duration in seconds (10-60)',
      },
    },
    required: ['from_scene', 'to_scene', 'transition_type', 'duration_seconds'],
  },
};

export async function handleSceneTransition(
  args: Record<string, unknown>
): Promise<SceneTransitionOutput> {
  logger.info('Handling scene_transition_music request', { args });

  const input = SceneTransitionInputSchema.parse(args);

  // Step 1: Use DeepSeek to analyze the transition
  logger.info('Step 1: Analyzing transition with DeepSeek');
  const transitionParams = await analyzeTransition(
    input.from_scene,
    input.to_scene,
    input.transition_type,
    input.duration_seconds
  );

  // Step 2: Build Soundraw request with energy levels
  const soundrawParams: SoundrawComposeRequest = {
    length: input.duration_seconds,
    moods: transitionParams.moods,
    genres: transitionParams.genres,
    themes: transitionParams.themes,
    tempo: [transitionParams.tempo],
    file_format: ['m4a'],
    energy_levels: transitionParams.energy_levels,
  };

  // Step 3: Generate transition music
  logger.info('Step 2: Generating transition music with Soundraw', { soundrawParams });
  const { result: soundrawResponse, format } = await composeMusic(soundrawParams);
  const extracted = extractResult(soundrawResponse, format);

  const output: SceneTransitionOutput = {
    share_link: extracted.share_link,
    audio_url: extracted.audio_url,
    request_id: extracted.request_id,
    from_scene: input.from_scene,
    to_scene: input.to_scene,
    transition_type: input.transition_type,
    duration_seconds: extracted.duration_seconds,
    bpm: extracted.bpm,
    deepseek_reasoning: transitionParams.reasoning,
  };

  logger.info('Transition music generation complete', { share_link: output.share_link });
  return output;
}
