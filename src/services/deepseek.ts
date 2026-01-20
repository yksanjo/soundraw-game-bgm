import OpenAI from 'openai';
import { logger } from '../utils/logger.js';
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

const SCENE_ANALYSIS_SYSTEM_PROMPT = `You are a game music composer assistant specialized in translating game scene descriptions into music generation parameters.

Your task is to analyze game scene contexts and output structured JSON parameters for music generation.

Always output valid JSON with these exact fields:
- tempo: number (60-180 BPM, appropriate for the scene)
- mood: string (one primary mood: epic, dark, peaceful, mysterious, energetic, melancholic, tense, triumphant, ethereal, aggressive)
- instruments: string[] (2-6 instruments appropriate for the genre and mood)
- energy: "low" | "medium" | "high"
- key_suggestion: string (e.g., "D minor", "C major", "E phrygian")
- genre_tags: string[] (2-4 genre tags)
- reasoning: string (brief explanation of your choices, 1-2 sentences)

Consider these guidelines:
- Combat/boss scenes: Higher tempo (120-160), aggressive instruments, minor keys, high energy
- Exploration: Medium tempo (80-110), atmospheric textures, varied keys, low-medium energy
- Menu/title: Memorable melodies, medium tempo, often major keys, medium energy
- Horror: Slow-medium tempo, dissonant elements, minor/diminished keys, varied energy
- Puzzle: Light, playful, medium tempo, often major keys, low-medium energy
- Cutscenes: Match the emotional content, cinematic orchestration`;

const TRANSITION_ANALYSIS_SYSTEM_PROMPT = `You are a game music composer assistant specialized in creating musical transitions between game scenes.

Analyze the transition from one scene to another and output structured JSON parameters for transition music.

Always output valid JSON with these exact fields:
- from_mood: string (mood of the starting scene)
- to_mood: string (mood of the target scene)
- transition_style: string (how to musically bridge: "gradual_fade", "dramatic_shift", "tempo_morph", "key_modulation", "stinger_break")
- tempo_change: "increase" | "decrease" | "stable"
- key_relationship: string (e.g., "parallel minor", "relative major", "chromatic mediant", "same key")
- reasoning: string (brief explanation of transition approach)`;

export async function analyzeSceneForMusic(
  scene: string,
  gameGenre: string,
  intensity: string,
  mood?: string
): Promise<DeepSeekMusicParams> {
  logger.info('Analyzing scene for music parameters', { scene, gameGenre, intensity, mood });

  const userPrompt = `Analyze this game scene and generate music parameters:

Scene Type: ${scene}
Game Genre: ${gameGenre}
Intensity Level: ${intensity}
${mood ? `Desired Mood: ${mood}` : ''}

Output only valid JSON, no markdown code blocks.`;

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

  // Parse JSON from response, handling potential markdown code blocks
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
  }

  try {
    const params = JSON.parse(jsonStr) as DeepSeekMusicParams;
    logger.info('Scene analysis complete', { tempo: params.tempo, mood: params.mood });
    return params;
  } catch (error) {
    logger.error('Failed to parse DeepSeek response as JSON', { content, error });
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

  const userPrompt = `Analyze this scene transition and generate transition music parameters:

From Scene: ${fromScene}
To Scene: ${toScene}
Transition Type: ${transitionType}
Duration: ${durationSeconds} seconds

Output only valid JSON, no markdown code blocks.`;

  const client = getClient();

  const response = await client.chat.completions.create({
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: TRANSITION_ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 400,
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
    logger.info('Transition analysis complete', { style: params.transition_style });
    return params;
  } catch (error) {
    logger.error('Failed to parse DeepSeek transition response', { content, error });
    throw new Error(`Failed to parse transition parameters: ${content}`);
  }
}
