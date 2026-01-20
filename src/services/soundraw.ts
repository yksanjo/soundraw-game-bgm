import { logger } from '../utils/logger.js';
import type {
  SoundrawComposeRequest,
  SoundrawSimilarRequest,
  SoundrawCustomizeRequest,
  SoundrawComposeResponse,
  SoundrawResultResponse,
} from '../types/index.js';

const SOUNDRAW_API_BASE_URL = 'https://soundraw.io/api/v3';
const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds
const MAX_POLL_ATTEMPTS = 150; // Max 5 minutes (150 * 2s)

function getApiKey(): string {
  const apiKey = process.env.SOUNDRAW_API_KEY;
  if (!apiKey) {
    throw new Error('SOUNDRAW_API_KEY environment variable is required');
  }
  return apiKey;
}

function getHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
  };
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Poll for result until done or failed
async function pollForResult(requestId: string): Promise<SoundrawResultResponse> {
  logger.info('Polling for result', { requestId });

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const response = await fetch(`${SOUNDRAW_API_BASE_URL}/results/${requestId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Soundraw results API error', { status: response.status, error: errorText });
      throw new Error(`Soundraw API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as SoundrawResultResponse;
    logger.debug('Poll result', { status: result.status, attempt });

    if (result.status === 'done') {
      logger.info('Music generation complete', { requestId });
      return result;
    }

    if (result.status === 'failed') {
      logger.error('Music generation failed', { requestId });
      throw new Error(`Soundraw generation failed for request: ${requestId}`);
    }

    // Still processing, wait and try again
    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Timeout waiting for Soundraw result: ${requestId}`);
}

// Get audio URL from result based on format
function getAudioUrl(result: SoundrawResultResponse['result'], format: string): string {
  if (!result) throw new Error('No result available');

  switch (format) {
    case 'wav':
      if (result.wav_url) return result.wav_url;
      break;
    case 'mp3':
      if (result.mp3_url) return result.mp3_url;
      break;
    case 'm4a':
    default:
      if (result.m4a_url) return result.m4a_url;
      break;
  }

  // Fallback to any available format
  return result.m4a_url || result.mp3_url || result.wav_url || '';
}

// POST /musics/compose - Create new music
export async function composeMusic(
  params: SoundrawComposeRequest
): Promise<{ result: SoundrawResultResponse; format: string }> {
  logger.info('Composing music via Soundraw', { length: params.length, moods: params.moods });

  const response = await fetch(`${SOUNDRAW_API_BASE_URL}/musics/compose`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Soundraw compose API error', { status: response.status, error: errorText });
    throw new Error(`Soundraw API error: ${response.status} - ${errorText}`);
  }

  const { request_id } = await response.json() as SoundrawComposeResponse;
  logger.info('Compose request submitted', { request_id });

  // Poll for result
  const result = await pollForResult(request_id);
  const format = params.file_format?.[0] || 'm4a';

  return { result, format };
}

// POST /musics/similar - Create similar music
export async function createSimilarMusic(
  params: SoundrawSimilarRequest
): Promise<{ result: SoundrawResultResponse; format: string }> {
  logger.info('Creating similar music via Soundraw', { share_link: params.share_link });

  const response = await fetch(`${SOUNDRAW_API_BASE_URL}/musics/similar`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Soundraw similar API error', { status: response.status, error: errorText });
    throw new Error(`Soundraw API error: ${response.status} - ${errorText}`);
  }

  const { request_id } = await response.json() as SoundrawComposeResponse;
  logger.info('Similar request submitted', { request_id });

  const result = await pollForResult(request_id);
  const format = params.file_format?.[0] || 'm4a';

  return { result, format };
}

// POST /musics/customize - Customize existing music
export async function customizeMusic(
  params: SoundrawCustomizeRequest
): Promise<{ result: SoundrawResultResponse; format: string }> {
  logger.info('Customizing music via Soundraw', { share_link: params.share_link });

  const response = await fetch(`${SOUNDRAW_API_BASE_URL}/musics/customize`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Soundraw customize API error', { status: response.status, error: errorText });
    throw new Error(`Soundraw API error: ${response.status} - ${errorText}`);
  }

  const { request_id } = await response.json() as SoundrawComposeResponse;
  logger.info('Customize request submitted', { request_id });

  const result = await pollForResult(request_id);
  const format = params.file_format?.[0] || 'm4a';

  return { result, format };
}

// Helper to extract structured result
export function extractResult(
  soundrawResult: SoundrawResultResponse,
  format: string
): {
  share_link: string;
  audio_url: string;
  request_id: string;
  duration_seconds: number;
  bpm: number;
  timestamps: Array<{ start: number; end: number; energy: string }>;
} {
  if (!soundrawResult.result) {
    throw new Error('No result in Soundraw response');
  }

  const { result } = soundrawResult;

  return {
    share_link: result.share_link,
    audio_url: getAudioUrl(result, format),
    request_id: soundrawResult.request_id,
    duration_seconds: result.length,
    bpm: parseInt(result.bpm, 10),
    timestamps: result.timestamps,
  };
}

// POST /musics/tags - Get available tags
export async function getAvailableTags(
  selected: Array<{ order: number; category: string; value: string }>
): Promise<{
  themes: string[];
  moods: string[];
  genres: string[];
  tempos: string[];
}> {
  logger.info('Getting available tags', { selected });

  const response = await fetch(`${SOUNDRAW_API_BASE_URL}/musics/tags`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ selected }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Soundraw tags API error', { status: response.status, error: errorText });
    throw new Error(`Soundraw API error: ${response.status} - ${errorText}`);
  }

  return await response.json() as {
    themes: string[];
    moods: string[];
    genres: string[];
    tempos: string[];
  };
}

// GET /accounts - Check usage
export async function getAccountUsage(
  month?: number,
  year?: number
): Promise<{ message: string }> {
  const params = new URLSearchParams();
  if (month) params.append('month', month.toString());
  if (year) params.append('year', year.toString());

  const url = `${SOUNDRAW_API_BASE_URL}/accounts${params.toString() ? '?' + params.toString() : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Soundraw API error: ${response.status} - ${errorText}`);
  }

  return await response.json() as { message: string };
}
