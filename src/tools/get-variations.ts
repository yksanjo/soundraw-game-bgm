import { generateVariation } from '../services/soundraw.js';
import { GetVariationsInputSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';
import type { VariationOutput } from '../types/index.js';

export const getVariationsToolDefinition = {
  name: 'get_bgm_variations',
  description:
    'Generate variations of an existing BGM for different intensities, instruments, or tempos. Useful for adaptive game audio where music needs to change based on gameplay state.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      base_audio_id: {
        type: 'string',
        description: 'The audio ID of the original BGM to create variations from',
      },
      variation_type: {
        type: 'string',
        enum: ['intensity', 'instrument', 'tempo'],
        description:
          'Type of variation: "intensity" (louder/quieter), "instrument" (different instruments), "tempo" (faster/slower)',
      },
      count: {
        type: 'number',
        description: 'Number of variations to generate (1-5)',
      },
    },
    required: ['base_audio_id', 'variation_type', 'count'],
  },
};

const VARIATION_DESCRIPTIONS: Record<string, string[]> = {
  intensity: [
    'Subtle ambient version - reduced intensity',
    'Medium build - moderate intensity',
    'Full intensity version',
    'Peak intensity - maximum energy',
    'Climactic version - intense with dramatic peaks',
  ],
  instrument: [
    'Stripped down - minimal instrumentation',
    'Acoustic focus - organic instruments emphasized',
    'Electronic focus - synths and digital sounds',
    'Full orchestral - rich instrumental arrangement',
    'Hybrid version - acoustic and electronic blend',
  ],
  tempo: [
    'Slow version - relaxed pace',
    'Slightly slower - gentle tempo reduction',
    'Original tempo maintained',
    'Slightly faster - increased energy',
    'Fast version - high energy pace',
  ],
};

export async function handleGetVariations(
  args: Record<string, unknown>
): Promise<VariationOutput> {
  logger.info('Handling get_bgm_variations request', { args });

  const input = GetVariationsInputSchema.parse(args);

  const variations: VariationOutput['variations'] = [];
  const descriptions = VARIATION_DESCRIPTIONS[input.variation_type] || [];

  for (let i = 0; i < input.count; i++) {
    logger.info(`Generating variation ${i + 1}/${input.count}`);

    const result = await generateVariation(
      input.base_audio_id,
      input.variation_type,
      i
    );

    variations.push({
      audio_url: result.audio_url,
      audio_id: result.id,
      variation_type: input.variation_type,
      description: descriptions[i] || `${input.variation_type} variation ${i + 1}`,
    });
  }

  const output: VariationOutput = {
    variations,
    base_audio_id: input.base_audio_id,
  };

  logger.info('Variations generation complete', { count: variations.length });
  return output;
}
