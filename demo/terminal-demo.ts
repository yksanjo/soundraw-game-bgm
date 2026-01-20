#!/usr/bin/env npx tsx
/**
 * Terminal Demo - Simulates the MCP workflow for recording
 *
 * This creates a nice visual demo of what happens when you use
 * the soundraw-game-bgm MCP with Claude Code.
 *
 * Usage: npx tsx demo/terminal-demo.ts
 *
 * For recording: increase terminal font size, use dark theme
 */

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ANSI colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
};

async function typeText(text: string, delay = 30) {
  for (const char of text) {
    process.stdout.write(char);
    await sleep(delay);
  }
}

async function printLine(text: string, color = c.reset) {
  console.log(`${color}${text}${c.reset}`);
}

async function demo() {
  console.clear();

  // Header
  console.log('\n');
  await printLine('  ╔═══════════════════════════════════════════════════════╗', c.cyan);
  await printLine('  ║     🎮 Soundraw Game BGM - MCP Demo                   ║', c.cyan);
  await printLine('  ║     Generate game music with natural language         ║', c.cyan);
  await printLine('  ╚═══════════════════════════════════════════════════════╝', c.cyan);
  console.log('\n');

  await sleep(1000);

  // User prompt
  await printLine('  You:', c.green + c.bold);
  await typeText('  ');
  await typeText('"Generate epic boss fight music for my Dark Souls-like game,', 25);
  console.log();
  await typeText('   30 seconds, high intensity"', 25);
  console.log('\n');

  await sleep(800);

  // Claude thinking
  await printLine('  Claude Code:', c.blue + c.bold);
  await printLine('  I\'ll generate boss fight music using the soundraw-game-bgm MCP.', c.dim);
  console.log();

  await sleep(500);

  // Tool call
  await printLine('  ┌─ Calling: generate_bgm', c.yellow);
  await printLine('  │', c.yellow);
  await printLine('  │  scene: "boss_fight"', c.dim);
  await printLine('  │  game_genre: "dark_souls_like"', c.dim);
  await printLine('  │  intensity: "high"', c.dim);
  await printLine('  │  duration_seconds: 30', c.dim);
  await printLine('  │', c.yellow);

  await sleep(500);

  // DeepSeek analysis
  await printLine('  │  🧠 DeepSeek analyzing scene...', c.magenta);
  await sleep(1200);
  await printLine('  │     → Moods: Epic, Dark, Suspense', c.dim);
  await printLine('  │     → Genres: Orchestra, Rock', c.dim);
  await printLine('  │     → Theme: Gaming', c.dim);
  await printLine('  │     → Tempo: high (>125 BPM)', c.dim);
  await printLine('  │', c.yellow);

  await sleep(500);

  // Soundraw generation
  await printLine('  │  🎵 Soundraw generating music...', c.magenta);

  // Progress dots
  process.stdout.write(`  ${c.yellow}│${c.reset}     `);
  for (let i = 0; i < 15; i++) {
    process.stdout.write('▓');
    await sleep(200);
  }
  console.log(' Done!');

  await printLine('  │', c.yellow);
  await printLine('  └─ Complete ✓', c.green);
  console.log();

  await sleep(500);

  // Result
  await printLine('  ┌─────────────────────────────────────────────────────────┐', c.cyan);
  await printLine('  │  📦 Result                                              │', c.cyan);
  await printLine('  ├─────────────────────────────────────────────────────────┤', c.cyan);
  await printLine('  │                                                         │', c.cyan);
  await printLine('  │  🔗 Share Link:                                         │', c.cyan);
  await printLine('  │     https://soundraw.io/edit_music?m=abc123...          │', c.white);
  await printLine('  │                                                         │', c.cyan);
  await printLine('  │  🎵 Audio URL:                                          │', c.cyan);
  await printLine('  │     https://cdn.soundraw.io/final_xxx.m4a               │', c.white);
  await printLine('  │                                                         │', c.cyan);
  await printLine('  │  ⏱️  Duration: 30 seconds                                │', c.cyan);
  await printLine('  │  🥁 BPM: 142                                            │', c.cyan);
  await printLine('  │                                                         │', c.cyan);
  await printLine('  │  💭 DeepSeek reasoning:                                 │', c.cyan);
  await printLine('  │     "Boss fights in Souls-like games need driving       │', c.dim);
  await printLine('  │      orchestral arrangements with building intensity.   │', c.dim);
  await printLine('  │      High tempo and dark mood create tension..."        │', c.dim);
  await printLine('  │                                                         │', c.cyan);
  await printLine('  └─────────────────────────────────────────────────────────┘', c.cyan);

  console.log('\n');

  await sleep(1000);

  // Footer
  await printLine('  ✨ Music generated in ~30 seconds', c.green + c.bold);
  await printLine('  📂 Open share_link in browser to listen', c.dim);
  console.log();
  await printLine('  Stack: Claude Code → DeepSeek (analysis) → Soundraw (generation)', c.dim);
  await printLine('  Cost: ~$0.001 for DeepSeek + Soundraw API usage', c.dim);
  console.log('\n');

  await printLine('  github.com/yksanjo/soundraw-game-bgm', c.cyan);
  console.log('\n');
}

demo().catch(console.error);
