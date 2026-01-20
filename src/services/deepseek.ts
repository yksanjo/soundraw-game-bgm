import OpenAI from 'openai';
import { logger } from '../utils/logger.js';
import {
  SOUNDRAW_MOODS,
  SOUNDRAW_GENRES,
  SOUNDRAW_THEMES,
} from '../types/index.js';
import type { DeepSeekMusicParams, DeepSeekTransitionParams } from '../types/index.js';

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is required');
    }
    client = new OpenAI({
      apiKey,
      baseURL: DEEPSEEK_BASE_URL,
    });
  }
  return client;
}

const SCENE_ANALYSIS_SYSTEM_PROMPT = `You are a game music composer assistant. Your job is to translate game scene descriptions into Soundraw API parameters.

Available Soundraw parameters:

MOODS (pick 1-3):
${SOUNDRAW_MOODS.join(', ')}

GENRES (pick 1-3):
${SOUNDRAW_GENRES.join(', ')}

THEMES (pick 1-2):
${SOUNDRAW_THEMES.join(', ')}

TEMPO: low (<100 bpm), normal (100-125 bpm), high (>125 bpm)

ENERGY_PROFILE: building (starts low, builds up), steady (consistent energy), climax (high throughout), ambient (low/muted)

Output ONLY valid JSON with these exact fields:
{
  "moods": ["mood1", "mood2"],
  "genres": ["genre1", "genre2"],
  "themes": ["theme1"],
  "tempo": "low" | "normal" | "high",
  "energy_profile": "building" | "steady" | "climax" | "ambient",
  "reasoning": "Brief explanation of choices"
}

Scene-to-music guidelines:
- Boss fights: Epic, Dark, Suspense moods + Orchestra, Rock genres + Gaming theme + high tempo + climax energy
- Exploration: Mysterious, Peaceful, Dreamy moods + Ambient, Acoustic genres + Nature, Travel themes + low/normal tempo + ambient/steady
- Combat: Angry, Busy & Frantic, Suspense moods + Rock, Electronica genres + Gaming, Sports & Action themes + high tempo + building/climax
- Menu/Title: Elegant, Hopeful, Smooth moods + Orchestra, Ambient genres + Cinematic theme + normal tempo + steady
- Horror: Fear, Scary, Suspense moods + Ambient, Electronica genres + Horror & Thriller theme + low tempo + building
- Puzzle: Laid Back, Dreamy, Peaceful moods + Lofi Hip Hop, Ambient genres + Technology theme + normal tempo + steady
- Cutscene: Match emotional content - Sad, Romantic, Epic depending on scene + Orchestra, Acoustic + Cinematic, Drama themes`;

const TRANSITION_ANALYSIS_SYSTEM_PROMPT = `You are a game music composer creating transition music between scenes.

Available Soundraw parameters:
MOODS: ${SOUNDRAW_MOODS.join(', ')}
GENRES: ${SOUNDRAW_GENRES.join(', ')}
THEMES: ${SOUNDRAW_THEMES.join(', ')}
ENERGY_LEVELS: Muted, Low, Medium, High, Very High

Create a smooth musical transition. Output ONLY valid JSON:
{
  "from_mood": "starting mood",
  "to_mood": "ending mood",
  "moods": ["mood1", "mood2"],
  "genres": ["genre1"],
  "themes": ["theme1"],
  "tempo": "low" | "normal" | "high",
  "energy_levels": [
    {"start": 0, "end": X, "energy": "Level"},
    {"start": X, "end": Y, "energy": "Level"}
  ],
  "reasoning": "Brief explanation"
}

Transition guidelines:
- fade: Gradual energy decrease then increase - use 3-4 energy segments
- stinger: Quick dramatic accent - start Very High, drop to Low, then rise
- crossfade: Smooth blend - keep energy relatively steady with subtle changes`;

export async function analyzeSceneForMusic(
  scene: string,
  gameGenre: string,
  intensity: string,
  mood?: string
): Promise<DeepSeekMusicParams> {
  logger.info('Analyzing scene for music parameters', { scene, gameGenre, intensity, mood });

  const userPrompt = `Generate Soundraw parameters for this game scene:

Scene Type: ${scene}
Game Genre: ${gameGenre}
Intensity: ${intensity}
${mood ? `Desired Mood Hint: ${mood}` : ''}

Output only valid JSON, no markdown.`;

  const client = getClient();

  const response = await client.chat.completions.create({
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: SCENE_ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from DeepSeek');
  }

  logger.debug('DeepSeek raw response', { content });

  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
  }

  try {
    const params = JSON.parse(jsonStr) as DeepSeekMusicParams;

    // Validate moods are from allowed list
    params.moods = params.moods.filter(m =>
      SOUNDRAW_MOODS.includes(m as typeof SOUNDRAW_MOODS[number])
    );
    params.genres = params.genres.filter(g =>
      SOUNDRAW_GENRES.includes(g as typeof SOUNDRAW_GENRES[number])
    );
    params.themes = params.themes.filter(t =>
      SOUNDRAW_THEMES.includes(t as typeof SOUNDRAW_THEMES[number])
    );

    // Ensure at least one of each if filtering removed all
    if (params.moods.length === 0) params.moods = ['Epic'];
    if (params.genres.length === 0) params.genres = ['Orchestra'];
    if (params.themes.length === 0) params.themes = ['Gaming'];

    logger.info('Scene analysis complete', { moods: params.moods, tempo: params.tempo });
    return params;
  } catch (error) {
    logger.error('Failed to parse DeepSeek response', { content, error });
    throw new Error(`Failed to parse music parameters: ${content}`);
  }
}

export async function analyzeTransition(
  fromScene: string,
  toScene: string,
  transitionType: string,
  durationSeconds: number
): Promise<DeepSeekTransitionParams> {
  logger.info('Analyzing scene transition', { fromScene, toScene, transitionType });

  const userPrompt = `Create transition music parameters:

From Scene: ${fromScene}
To Scene: ${toScene}
Transition Type: ${transitionType}
Duration: ${durationSeconds} seconds

Create energy_levels array with timestamps that sum to ${durationSeconds} seconds.
Output only valid JSON, no markdown.`;

  const client = getClient();

  const response = await client.chat.completions.create({
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: TRANSITION_ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 600,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from DeepSeek');
  }

  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
  }

  try {
    const params = JSON.parse(jsonStr) as DeepSeekTransitionParams;

    // Validate parameters
    params.moods = params.moods.filter(m =>
      SOUNDRAW_MOODS.includes(m as typeof SOUNDRAW_MOODS[number])
    );
    params.genres = params.genres.filter(g =>
      SOUNDRAW_GENRES.includes(g as typeof SOUNDRAW_GENRES[number])
    );
    params.themes = params.themes.filter(t =>
      SOUNDRAW_THEMES.includes(t as typeof SOUNDRAW_THEMES[number])
    );

    if (params.moods.length === 0) params.moods = ['Suspense'];
    if (params.genres.length === 0) params.genres = ['Orchestra'];
    if (params.themes.length === 0) params.themes = ['Cinematic'];

    logger.info('Transition analysis complete', { moods: params.moods });
    return params;
  } catch (error) {
    logger.error('Failed to parse DeepSeek transition response', { content, error });
    throw new Error(`Failed to parse transition parameters: ${content}`);
  }
}
