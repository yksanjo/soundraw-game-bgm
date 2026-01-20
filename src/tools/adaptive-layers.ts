import { getStemSeparation } from '../services/soundraw.js';
import { AdaptiveLayerInputSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';
import type { AdaptiveLayerOutput } from '../types/index.js';

export const adaptiveLayerToolDefinition = {
  name: 'adaptive_layer_control',
  description:
    'Get stem separation and layer control data for adaptive game audio. Separates music into individual layers (drums, bass, melody, ambient) that can be mixed in real-time based on gameplay.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      audio_id: {
        type: 'string',
        description: 'The audio ID to separate into stems/layers',
      },
      layers: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Layers to extract (e.g., ["drums", "bass", "melody", "ambient", "vocals"])',
      },
      crossfade_ms: {
        type: 'number',
        description: 'Crossfade duration in milliseconds for layer transitions (default: 500)',
      },
    },
    required: ['audio_id', 'layers'],
  },
};

// Default volume levels for different layers
const DEFAULT_VOLUMES: Record<string, number> = {
  drums: 0.8,
  bass: 0.7,
  melody: 0.9,
  ambient: 0.5,
  vocals: 1.0,
  percussion: 0.6,
  strings: 0.7,
  brass: 0.8,
  synth: 0.7,
  piano: 0.8,
};

function generateAdaptiveAudioCode(layers: string[], crossfadeMs: number): string {
  return `// Adaptive Audio Implementation
// Crossfade Duration: ${crossfadeMs}ms

class AdaptiveAudioMixer {
  private layers: Map<string, { audio: HTMLAudioElement; volume: number }> = new Map();
  private crossfadeDuration = ${crossfadeMs};

  constructor(layerUrls: Record<string, string>) {
    for (const [name, url] of Object.entries(layerUrls)) {
      const audio = new Audio(url);
      audio.loop = true;
      this.layers.set(name, { audio, volume: 1.0 });
    }
  }

  // Start all layers synchronized
  playAll(): void {
    const startTime = performance.now() + 100; // Small delay for sync
    for (const { audio } of this.layers.values()) {
      audio.currentTime = 0;
      audio.play();
    }
  }

  // Fade a layer in or out
  setLayerVolume(layerName: string, targetVolume: number): void {
    const layer = this.layers.get(layerName);
    if (!layer) return;

    const startVolume = layer.audio.volume;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / this.crossfadeDuration, 1);

      layer.audio.volume = startVolume + (targetVolume - startVolume) * progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  // Example: Combat intensity control
  setCombatIntensity(intensity: number): void {
    // intensity: 0 (exploration) to 1 (full combat)
    this.setLayerVolume('drums', intensity * 0.8);
    this.setLayerVolume('bass', 0.3 + intensity * 0.5);
    this.setLayerVolume('melody', 0.7 + intensity * 0.3);
    this.setLayerVolume('ambient', 1 - intensity * 0.5);
  }
}

// Layer URLs from Soundraw:
${layers.map((l) => `// - ${l}: [URL from response]`).join('\n')}`;
}

export async function handleAdaptiveLayers(
  args: Record<string, unknown>
): Promise<AdaptiveLayerOutput> {
  logger.info('Handling adaptive_layer_control request', { args });

  const input = AdaptiveLayerInputSchema.parse(args);
  const crossfadeMs = input.crossfade_ms ?? 500;

  // Get stem separation from Soundraw
  logger.info('Requesting stem separation', { audioId: input.audio_id, layers: input.layers });
  const stems = await getStemSeparation(input.audio_id, input.layers);

  // Build output with default volumes
  const outputLayers = stems.map((stem) => ({
    name: stem.name,
    audio_url: stem.audio_url,
    volume_default: DEFAULT_VOLUMES[stem.name.toLowerCase()] ?? 0.7,
  }));

  const integrationCode = generateAdaptiveAudioCode(input.layers, crossfadeMs);

  const output: AdaptiveLayerOutput = {
    audio_id: input.audio_id,
    layers: outputLayers,
    crossfade_ms: crossfadeMs,
    integration_code: integrationCode,
  };

  logger.info('Adaptive layers extraction complete', { layerCount: outputLayers.length });
  return output;
}
