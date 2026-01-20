import { customizeMusic, extractResult } from '../services/soundraw.js';
import { AdaptiveLayerInputSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';
import type { AdaptiveLayerOutput } from '../types/index.js';

export const adaptiveLayerToolDefinition = {
  name: 'adaptive_layer_control',
  description:
    'Generate multiple versions of a track with different stems muted for adaptive game audio. Creates separate audio files for each layer configuration that can be mixed in real-time based on gameplay.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      share_link: {
        type: 'string',
        description: 'The share_link URL from a previous generate_bgm result',
      },
      layers_to_keep: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['backing', 'bass', 'drums', 'melody'],
        },
        description: 'Which layers to generate isolated versions for. Each layer creates a version with other layers muted.',
      },
      file_format: {
        type: 'string',
        enum: ['m4a', 'mp3', 'wav'],
        description: 'Audio format (default: m4a)',
      },
    },
    required: ['share_link', 'layers_to_keep'],
  },
};

// Map layer names to stem codes
const LAYER_TO_STEMS: Record<string, string[]> = {
  backing: ['bs', 'dr', 'me', 'fe', 'ff'], // Mute everything except backing (bc)
  bass: ['bc', 'dr', 'me', 'fe', 'ff'],    // Mute everything except bass (bs)
  drums: ['bc', 'bs', 'me', 'fe', 'ff'],   // Mute everything except drums (dr)
  melody: ['bc', 'bs', 'dr', 'fe', 'ff'],  // Mute everything except melody (me)
};

function generateAdaptiveAudioCode(layers: string[], baseShareLink: string): string {
  return `// Adaptive Audio System - Layer Mixing
// Base track: ${baseShareLink}

class AdaptiveGameAudio {
  private layers: Map<string, HTMLAudioElement> = new Map();
  private masterVolume = 1.0;
  private crossfadeDuration = 500; // ms

  constructor() {
    // Initialize layers from generated URLs
    // Each layer is a version of the track with other stems muted
  }

  async loadLayers(layerUrls: Record<string, string>) {
    for (const [name, url] of Object.entries(layerUrls)) {
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0;
      await audio.load();
      this.layers.set(name, audio);
    }
  }

  // Start all layers synchronized
  play() {
    const startTime = performance.now() + 50;
    for (const audio of this.layers.values()) {
      audio.currentTime = 0;
      audio.play();
    }
  }

  // Crossfade layer volume
  setLayerVolume(layer: string, targetVolume: number) {
    const audio = this.layers.get(layer);
    if (!audio) return;

    const startVolume = audio.volume;
    const startTime = performance.now();

    const animate = () => {
      const progress = Math.min((performance.now() - startTime) / this.crossfadeDuration, 1);
      audio.volume = startVolume + (targetVolume - startVolume) * progress * this.masterVolume;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  // Presets for common game states
  setState(state: 'exploration' | 'combat' | 'stealth' | 'boss') {
    switch (state) {
      case 'exploration':
        this.setLayerVolume('backing', 0.8);
        this.setLayerVolume('melody', 0.6);
        this.setLayerVolume('drums', 0.2);
        this.setLayerVolume('bass', 0.4);
        break;
      case 'combat':
        this.setLayerVolume('backing', 1.0);
        this.setLayerVolume('melody', 0.8);
        this.setLayerVolume('drums', 1.0);
        this.setLayerVolume('bass', 0.9);
        break;
      case 'stealth':
        this.setLayerVolume('backing', 0.5);
        this.setLayerVolume('melody', 0.3);
        this.setLayerVolume('drums', 0);
        this.setLayerVolume('bass', 0.4);
        break;
      case 'boss':
        this.setLayerVolume('backing', 1.0);
        this.setLayerVolume('melody', 1.0);
        this.setLayerVolume('drums', 1.0);
        this.setLayerVolume('bass', 1.0);
        break;
    }
  }
}

// Usage:
// const audio = new AdaptiveGameAudio();
// await audio.loadLayers({
${layers.map(l => `//   '${l}': '<${l}_audio_url>',`).join('\n')}
// });
// audio.play();
// audio.setState('exploration');
// // Later: audio.setState('combat');
`;
}

export async function handleAdaptiveLayers(
  args: Record<string, unknown>
): Promise<AdaptiveLayerOutput> {
  logger.info('Handling adaptive_layer_control request', { args });

  const input = AdaptiveLayerInputSchema.parse(args);
  const fileFormat = input.file_format ?? 'm4a';

  const layers: AdaptiveLayerOutput['layers'] = [];

  // Generate a version for each requested layer
  for (const layerName of input.layers_to_keep) {
    logger.info(`Generating ${layerName} layer`);

    const muteStems = LAYER_TO_STEMS[layerName];
    if (!muteStems) {
      logger.warn(`Unknown layer: ${layerName}, skipping`);
      continue;
    }

    const { result, format } = await customizeMusic({
      share_link: input.share_link,
      mute_stems: muteStems,
      file_format: [fileFormat],
    });

    const extracted = extractResult(result, format);

    layers.push({
      name: layerName,
      mute_stems: muteStems,
      share_link: extracted.share_link,
      audio_url: extracted.audio_url,
      request_id: extracted.request_id,
    });
  }

  const integrationCode = generateAdaptiveAudioCode(
    input.layers_to_keep,
    input.share_link
  );

  const output: AdaptiveLayerOutput = {
    layers,
    base_share_link: input.share_link,
    integration_code: integrationCode,
  };

  logger.info('Adaptive layers generation complete', { layerCount: layers.length });
  return output;
}
