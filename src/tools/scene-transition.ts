import { analyzeTransition } from '../services/deepseek.js';
import { generateTransitionMusic } from '../services/soundraw.js';
import { SceneTransitionInputSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';
import type { SceneTransitionOutput } from '../types/index.js';

export const sceneTransitionToolDefinition = {
  name: 'scene_transition_music',
  description:
    'Generate transition music between two game scenes. Uses DeepSeek to analyze the emotional and musical journey between scenes, then generates appropriate transition audio.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      from_scene: {
        type: 'string',
        description: 'Description of the starting scene (e.g., "peaceful village exploration")',
      },
      to_scene: {
        type: 'string',
        description: 'Description of the target scene (e.g., "intense boss battle")',
      },
      transition_type: {
        type: 'string',
        enum: ['fade', 'stinger', 'crossfade'],
        description:
          'Type of transition: "fade" (gradual), "stinger" (dramatic accent), "crossfade" (blend both)',
      },
      duration_seconds: {
        type: 'number',
        description: 'Transition duration in seconds (1-30)',
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

  // Step 2: Generate transition music with Soundraw
  logger.info('Step 2: Generating transition music with Soundraw');
  const soundrawResult = await generateTransitionMusic(
    transitionParams.from_mood,
    transitionParams.to_mood,
    transitionParams.transition_style,
    input.duration_seconds
  );

  const output: SceneTransitionOutput = {
    transition_audio_url: soundrawResult.audio_url,
    audio_id: soundrawResult.id,
    from_scene: input.from_scene,
    to_scene: input.to_scene,
    transition_type: input.transition_type,
    duration_seconds: soundrawResult.duration,
    deepseek_reasoning: transitionParams.reasoning,
  };

  logger.info('Transition music generation complete', { audioId: output.audio_id });
  return output;
}
