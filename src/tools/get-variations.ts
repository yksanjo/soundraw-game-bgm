import { createSimilarMusic, customizeMusic, extractResult } from '../services/soundraw.js';
import { GetVariationsInputSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';
import type { VariationOutput } from '../types/index.js';

export const getVariationsToolDefinition = {
  name: 'get_bgm_variations',
  description:
    'Generate a variation of an existing BGM using Soundraw. Use "similar" to create a new song with similar style, or "customize" to adjust energy levels or mute stems of the original.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      share_link: {
        type: 'string',
        description: 'The share_link URL from a previous generate_bgm result (e.g., https://soundraw.io/edit_music?m=...)',
      },
      variation_type: {
        type: 'string',
        enum: ['similar', 'customize'],
        description:
          '"similar" creates a new song with similar style. "customize" adjusts energy/stems of existing song.',
      },
      length: {
        type: 'number',
        description: 'Length for similar track in seconds (10-300). Only used with "similar" type.',
      },
      energy_preset: {
        type: 'string',
        enum: ['building', 'steady', 'climax', 'fade_out'],
        description: 'Energy preset for customize. Only used with "customize" type.',
      },
      mute_stems: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['bc', 'bs', 'dr', 'me', 'fe', 'ff'],
        },
        description: 'Stems to mute: bc (backing), bs (bass), dr (drums), me (melody), fe (fill end), ff (fill start)',
      },
    },
    required: ['share_link', 'variation_type'],
  },
};

// Energy presets for customize
function getEnergyPreset(
  preset: string,
  durationSeconds: number = 60
): Array<{ start: number; end: number; energy: string }> {
  const quarter = durationSeconds / 4;

  switch (preset) {
    case 'building':
      return [
        { start: 0, end: quarter, energy: 'Low' },
        { start: quarter, end: quarter * 2, energy: 'Medium' },
        { start: quarter * 2, end: quarter * 3, energy: 'High' },
        { start: quarter * 3, end: durationSeconds, energy: 'Very High' },
      ];
    case 'climax':
      return [
        { start: 0, end: durationSeconds, energy: 'Very High' },
      ];
    case 'fade_out':
      return [
        { start: 0, end: quarter, energy: 'High' },
        { start: quarter, end: quarter * 2, energy: 'Medium' },
        { start: quarter * 2, end: quarter * 3, energy: 'Low' },
        { start: quarter * 3, end: durationSeconds, energy: 'Muted' },
      ];
    case 'steady':
    default:
      return [
        { start: 0, end: durationSeconds, energy: 'Medium' },
      ];
  }
}

export async function handleGetVariations(
  args: Record<string, unknown>
): Promise<VariationOutput> {
  logger.info('Handling get_bgm_variations request', { args });

  const input = GetVariationsInputSchema.parse(args);

  let result;
  let format = 'm4a';

  if (input.variation_type === 'similar') {
    // Create a similar song
    logger.info('Creating similar music');
    const response = await createSimilarMusic({
      share_link: input.share_link,
      length: input.length,
      mute_stems: input.mute_stems,
      file_format: ['m4a'],
    });
    result = response.result;
    format = response.format;
  } else {
    // Customize existing song
    logger.info('Customizing music');

    const customizeParams: {
      share_link: string;
      energy_levels?: Array<{ start: number; end: number; energy: string }>;
      mute_stems?: string[];
      file_format?: string[];
    } = {
      share_link: input.share_link,
      file_format: ['m4a'],
    };

    if (input.energy_preset) {
      customizeParams.energy_levels = getEnergyPreset(input.energy_preset);
    }

    if (input.mute_stems && input.mute_stems.length > 0) {
      customizeParams.mute_stems = input.mute_stems;
    }

    const response = await customizeMusic(customizeParams);
    result = response.result;
    format = response.format;
  }

  const extracted = extractResult(result, format);

  const output: VariationOutput = {
    share_link: extracted.share_link,
    audio_url: extracted.audio_url,
    request_id: extracted.request_id,
    duration_seconds: extracted.duration_seconds,
    bpm: extracted.bpm,
    variation_type: input.variation_type,
    base_share_link: input.share_link,
  };

  logger.info('Variation generation complete', { share_link: output.share_link });
  return output;
}
