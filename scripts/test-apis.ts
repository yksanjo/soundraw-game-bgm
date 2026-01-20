#!/usr/bin/env npx tsx
/**
 * Test script for Soundraw Game BGM MCP Server
 *
 * Usage:
 *   npx tsx scripts/test-apis.ts
 *
 * Or with environment variables:
 *   DEEPSEEK_API_KEY=sk-xxx SOUNDRAW_API_KEY=xxx npx tsx scripts/test-apis.ts
 */

import 'dotenv/config';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const SOUNDRAW_API_KEY = process.env.SOUNDRAW_API_KEY;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(50));
  log(title, 'cyan');
  console.log('='.repeat(50));
}

// Test 1: DeepSeek API Connection
async function testDeepSeek(): Promise<boolean> {
  logSection('Testing DeepSeek API');

  if (!DEEPSEEK_API_KEY) {
    log('❌ DEEPSEEK_API_KEY not set', 'red');
    return false;
  }

  log('API Key: ' + DEEPSEEK_API_KEY.substring(0, 10) + '...', 'blue');

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: 'Reply with only: "DeepSeek OK"',
          },
        ],
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      log(`❌ DeepSeek API error: ${response.status} - ${error}`, 'red');
      return false;
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const reply = data.choices[0]?.message?.content;
    log(`✅ DeepSeek Response: "${reply}"`, 'green');
    return true;
  } catch (error) {
    log(`❌ DeepSeek connection failed: ${error}`, 'red');
    return false;
  }
}

// Test 2: Soundraw API Connection
async function testSoundrawConnection(): Promise<boolean> {
  logSection('Testing Soundraw API Connection');

  if (!SOUNDRAW_API_KEY) {
    log('❌ SOUNDRAW_API_KEY not set', 'red');
    return false;
  }

  log('API Key: ' + SOUNDRAW_API_KEY.substring(0, 10) + '...', 'blue');

  try {
    // Test with /accounts endpoint (lightweight check)
    const response = await fetch('https://soundraw.io/api/v3/accounts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SOUNDRAW_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      log(`❌ Soundraw API error: ${response.status} - ${error}`, 'red');
      if (response.status === 401) {
        log('   → Check your SOUNDRAW_API_KEY (Bearer token)', 'yellow');
      }
      return false;
    }

    const data = await response.json() as { message: string };
    log(`✅ Soundraw Account: ${data.message}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Soundraw connection failed: ${error}`, 'red');
    return false;
  }
}

// Test 3: Soundraw Tags Endpoint
async function testSoundrawTags(): Promise<boolean> {
  logSection('Testing Soundraw Tags Endpoint');

  if (!SOUNDRAW_API_KEY) return false;

  try {
    const response = await fetch('https://soundraw.io/api/v3/musics/tags', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SOUNDRAW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selected: [
          { order: 1, category: 'mood', value: 'Epic' },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      log(`❌ Soundraw tags error: ${response.status} - ${error}`, 'red');
      return false;
    }

    const data = await response.json() as { genres: string[]; themes: string[] };
    log(`✅ Available genres for "Epic" mood: ${data.genres.slice(0, 5).join(', ')}...`, 'green');
    log(`✅ Available themes: ${data.themes.slice(0, 5).join(', ')}...`, 'green');
    return true;
  } catch (error) {
    log(`❌ Soundraw tags failed: ${error}`, 'red');
    return false;
  }
}

// Test 4: Full Music Generation (optional, costs API credits)
async function testMusicGeneration(): Promise<boolean> {
  logSection('Testing Music Generation (10s test track)');

  if (!SOUNDRAW_API_KEY || !DEEPSEEK_API_KEY) {
    log('⏭️  Skipping - requires both API keys', 'yellow');
    return false;
  }

  log('This will generate a short 10-second track...', 'blue');
  log('Press Ctrl+C within 5 seconds to skip...', 'yellow');

  // Give user a chance to cancel
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // Step 1: DeepSeek analysis
    log('\n1. Asking DeepSeek for music parameters...', 'blue');

    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a game music assistant. Output ONLY valid JSON with these fields:
{
  "moods": ["Epic"],
  "genres": ["Orchestra"],
  "themes": ["Gaming"],
  "tempo": "high",
  "reasoning": "brief explanation"
}`,
          },
          {
            role: 'user',
            content: 'Generate parameters for a boss fight in a dark souls style game. Output only JSON.',
          },
        ],
        max_tokens: 200,
      }),
    });

    const deepseekData = await deepseekResponse.json() as { choices: Array<{ message: { content: string } }> };
    let paramsJson = deepseekData.choices[0]?.message?.content || '';

    // Clean markdown if present
    if (paramsJson.includes('```')) {
      paramsJson = paramsJson.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const params = JSON.parse(paramsJson);
    log(`   DeepSeek params: moods=${params.moods}, genres=${params.genres}`, 'green');

    // Step 2: Soundraw compose
    log('\n2. Sending to Soundraw API...', 'blue');

    const composeResponse = await fetch('https://soundraw.io/api/v3/musics/compose', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SOUNDRAW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        length: 10,
        moods: params.moods || ['Epic'],
        genres: params.genres || ['Orchestra'],
        themes: params.themes || ['Gaming'],
        tempo: [params.tempo || 'high'],
        file_format: ['m4a'],
      }),
    });

    if (!composeResponse.ok) {
      const error = await composeResponse.text();
      log(`❌ Soundraw compose error: ${error}`, 'red');
      return false;
    }

    const { request_id } = await composeResponse.json() as { request_id: string };
    log(`   Request ID: ${request_id}`, 'green');

    // Step 3: Poll for result
    log('\n3. Polling for result...', 'blue');

    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const resultResponse = await fetch(`https://soundraw.io/api/v3/results/${request_id}`, {
        headers: {
          'Authorization': `Bearer ${SOUNDRAW_API_KEY}`,
        },
      });

      const result = await resultResponse.json() as {
        status: string;
        result?: {
          share_link: string;
          m4a_url: string;
          bpm: string;
          length: number;
        };
      };

      if (result.status === 'done' && result.result) {
        log(`\n✅ Music generated successfully!`, 'green');
        log(`   Share link: ${result.result.share_link}`, 'cyan');
        log(`   Audio URL: ${result.result.m4a_url}`, 'cyan');
        log(`   BPM: ${result.result.bpm}`, 'cyan');
        log(`   Duration: ${result.result.length}s`, 'cyan');
        return true;
      } else if (result.status === 'failed') {
        log(`❌ Generation failed`, 'red');
        return false;
      }

      process.stdout.write('.');
    }

    log(`❌ Timeout waiting for result`, 'red');
    return false;
  } catch (error) {
    log(`❌ Music generation failed: ${error}`, 'red');
    return false;
  }
}

// Main
async function main() {
  console.log('\n🎮 Soundraw Game BGM MCP Server - API Test\n');

  const results = {
    deepseek: false,
    soundrawConnection: false,
    soundrawTags: false,
    musicGeneration: false,
  };

  // Run tests
  results.deepseek = await testDeepSeek();
  results.soundrawConnection = await testSoundrawConnection();

  if (results.soundrawConnection) {
    results.soundrawTags = await testSoundrawTags();
  }

  // Ask user if they want to test full generation
  if (results.deepseek && results.soundrawConnection) {
    const args = process.argv.slice(2);
    if (args.includes('--full') || args.includes('-f')) {
      results.musicGeneration = await testMusicGeneration();
    } else {
      logSection('Full Generation Test');
      log('⏭️  Skipped. Run with --full flag to test music generation', 'yellow');
      log('   npx tsx scripts/test-apis.ts --full', 'blue');
    }
  }

  // Summary
  logSection('Test Summary');

  const tests = [
    { name: 'DeepSeek API', passed: results.deepseek },
    { name: 'Soundraw Connection', passed: results.soundrawConnection },
    { name: 'Soundraw Tags', passed: results.soundrawTags },
    { name: 'Music Generation', passed: results.musicGeneration },
  ];

  for (const test of tests) {
    const icon = test.passed ? '✅' : '❌';
    const color = test.passed ? 'green' : 'red';
    log(`${icon} ${test.name}`, color);
  }

  const allPassed = results.deepseek && results.soundrawConnection;

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    log('🎉 Core APIs working! Ready to use the MCP server.', 'green');
  } else {
    log('⚠️  Some tests failed. Check your API keys.', 'yellow');
  }
  console.log('='.repeat(50) + '\n');

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
