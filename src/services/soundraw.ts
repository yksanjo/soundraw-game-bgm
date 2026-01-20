import { logger } from '../utils/logger.js';
import type {
  SoundrawGenerateRequest,
  SoundrawGenerateResponse,
  DeepSeekMusicParams,
} from '../types/index.js';

const SOUNDRAW_API_BASE_URL = process.env.SOUNDRAW_API_BASE_URL || 'https://api.soundraw.io/v1';

function getApiKey(): string {
  const apiKey = process.env.SOUNDRAW_API_KEY;
  if (!apiKey) {
    throw new Error('SOUNDRAW_API_KEY environment variable is required');
  }
  return apiKey;
}

// Map DeepSeek parameters to Soundraw API format
function mapParamsToSoundraw(
  params: DeepSeekMusicParams,
  durationSeconds: number
): SoundrawGenerateRequest {
  return {
    tempo: params.tempo,
    mood: params.mood,
    instruments: params.instruments,
    energy: params.energy,
    duration: durationSeconds,
    genre: params.genre_tags[0], // Use primary genre tag
  };
}

export async function generateMusic(
  params: DeepSeekMusicParams,
  durationSeconds: number = 60
): Promise<SoundrawGenerateResponse> {
  logger.info('Generating music via Soundraw', { tempo: params.tempo, mood: params.mood, duration: durationSeconds });

  const apiKey = getApiKey();
  const requestBody = mapParamsToSoundraw(params, durationSeconds);

  const response = await fetch(`${SOUNDRAW_API_BASE_URL}/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Soundraw API error', { status: response.status, error: errorText });
    throw new Error(`Soundraw API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json() as SoundrawGenerateResponse;
  logger.info('Music generated successfully', { audioId: result.id, duration: result.duration });
  return result;
}

export async function generateVariation(
  baseAudioId: string,
  variationType: 'intensity' | 'instrument' | 'tempo',
  index: number
): Promise<SoundrawGenerateResponse> {
  logger.info('Generating variation', { baseAudioId, variationType, index });

  const apiKey = getApiKey();

  const response = await fetch(`${SOUNDRAW_API_BASE_URL}/variations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base_audio_id: baseAudioId,
      variation_type: variationType,
      variation_index: index,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Soundraw variation API error', { status: response.status, error: errorText });
    throw new Error(`Soundraw API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json() as SoundrawGenerateResponse;
  logger.info('Variation generated', { audioId: result.id });
  return result;
}

export async function getStemSeparation(
  audioId: string,
  layers: string[]
): Promise<Array<{ name: string; audio_url: string }>> {
  logger.info('Requesting stem separation', { audioId, layers });

  const apiKey = getApiKey();

  const response = await fetch(`${SOUNDRAW_API_BASE_URL}/stems`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_id: audioId,
      layers: layers,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Soundraw stems API error', { status: response.status, error: errorText });
    throw new Error(`Soundraw API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json() as { stems: Array<{ name: string; audio_url: string }> };
  logger.info('Stems separated', { count: result.stems.length });
  return result.stems;
}

export async function generateTransitionMusic(
  fromMood: string,
  toMood: string,
  transitionStyle: string,
  durationSeconds: number
): Promise<SoundrawGenerateResponse> {
  logger.info('Generating transition music', { fromMood, toMood, transitionStyle, duration: durationSeconds });

  const apiKey = getApiKey();

  const response = await fetch(`${SOUNDRAW_API_BASE_URL}/transition`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from_mood: fromMood,
      to_mood: toMood,
      transition_style: transitionStyle,
      duration: durationSeconds,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Soundraw transition API error', { status: response.status, error: errorText });
    throw new Error(`Soundraw API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json() as SoundrawGenerateResponse;
  logger.info('Transition music generated', { audioId: result.id });
  return result;
}
