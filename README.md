# Soundraw Game BGM MCP Server

An MCP (Model Context Protocol) server that enables AI agents to generate game background music. Uses **DeepSeek** for intelligent scene analysis and parameter generation, and **Soundraw B2B API V3** for actual music generation.

## Architecture

```
Game Dev Agent (Claude/Cursor)
    ↓ calls MCP tool
MCP Server (soundraw-game-bgm)
    ↓ uses DeepSeek API for reasoning
DeepSeek analyzes game context
    ↓ generates Soundraw parameters (moods, genres, themes, tempo, energy)
Soundraw API generates actual music
    ↓ async: returns request_id → poll for result
Game Dev Agent receives share_link + audio_url
```

## Features

- **Cost-Optimized**: Uses DeepSeek (~90% cheaper than Claude) for scene analysis
- **4 MCP Tools**: Full suite for game audio needs
- **Real Soundraw API**: Uses B2B API V3 with proper async handling
- **Engine Integration**: Auto-generated code snippets for Unreal, Unity, and Godot
- **Adaptive Audio**: Stem muting for dynamic game audio layers

## Installation

```bash
git clone https://github.com/yksanjo/soundraw-game-bgm.git
cd soundraw-game-bgm
npm install
npm run build
```

## Configuration

Create a `.env` file:

```env
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
SOUNDRAW_API_KEY=your-soundraw-bearer-token
```

## Testing API Connections

Before using the MCP server, verify your API keys work:

```bash
# Quick test (checks API connections only)
npm run test:apis

# Full test (generates a 10-second track - uses API credits)
npm run test:apis:full
```

Expected output:
```
🎮 Soundraw Game BGM MCP Server - API Test

==================================================
Testing DeepSeek API
==================================================
API Key: sk-xxxxxx...
✅ DeepSeek Response: "DeepSeek OK"

==================================================
Testing Soundraw API Connection
==================================================
API Key: xxxxxxxxxx...
✅ Soundraw Account: Number of queries: X from ...

==================================================
Testing Soundraw Tags Endpoint
==================================================
✅ Available genres for "Epic" mood: Orchestra, Electronica...
✅ Available themes: Gaming, Cinematic...

==================================================
Test Summary
==================================================
✅ DeepSeek API
✅ Soundraw Connection
✅ Soundraw Tags
❌ Music Generation (skipped without --full flag)

🎉 Core APIs working! Ready to use the MCP server.
```

## MCP Tools

### 1. `generate_bgm`

Generate background music based on game scene description.

**Input:**
```json
{
  "scene": "boss_fight",
  "game_genre": "dark_souls_like",
  "intensity": "high",
  "mood": "epic",
  "duration_seconds": 60,
  "engine": "unreal",
  "file_format": "m4a"
}
```

**Output:**
```json
{
  "share_link": "https://soundraw.io/edit_music?m=...",
  "audio_url": "https://..../final_xxx.m4a",
  "request_id": "...",
  "duration_seconds": 60,
  "bpm": 140,
  "timestamps": [{"start": 0, "end": 15, "energy": "Low"}, ...],
  "file_format": "m4a",
  "integration_code": "// Unreal Engine 5 integration...",
  "deepseek_reasoning": "Boss fights need epic orchestral...",
  "soundraw_params": {"moods": ["Epic", "Dark"], "genres": ["Orchestra"], ...}
}
```

### 2. `get_bgm_variations`

Generate variations of existing BGM.

**Input:**
```json
{
  "share_link": "https://soundraw.io/edit_music?m=...",
  "variation_type": "similar",
  "length": 60
}
```

Or customize energy/stems:
```json
{
  "share_link": "https://soundraw.io/edit_music?m=...",
  "variation_type": "customize",
  "energy_preset": "building",
  "mute_stems": ["me"]
}
```

**Stem codes:** `bc` (backing), `bs` (bass), `dr` (drums), `me` (melody), `fe` (fill end), `ff` (fill start)

### 3. `adaptive_layer_control`

Generate multiple versions with different stems muted for adaptive audio.

**Input:**
```json
{
  "share_link": "https://soundraw.io/edit_music?m=...",
  "layers_to_keep": ["drums", "bass", "melody", "backing"]
}
```

**Output:** Separate audio URLs for each layer + JavaScript integration code for runtime mixing.

### 4. `scene_transition_music`

Generate transition music between scenes.

**Input:**
```json
{
  "from_scene": "peaceful village exploration",
  "to_scene": "intense boss battle",
  "transition_type": "stinger",
  "duration_seconds": 15
}
```

**Transition Types:**
- `fade`: Gradual energy shift
- `stinger`: Dramatic accent
- `crossfade`: Smooth blend

## Usage with Claude Code

Add to `~/.mcp.json`:

```json
{
  "mcpServers": {
    "soundraw-game-bgm": {
      "command": "node",
      "args": ["/path/to/soundraw-game-bgm/dist/index.js"],
      "env": {
        "DEEPSEEK_API_KEY": "sk-your-key",
        "SOUNDRAW_API_KEY": "your-bearer-token"
      }
    }
  }
}
```

Then restart Claude Code and try:
```
Generate epic boss battle music for my Dark Souls-like game, 60 seconds, with Unreal Engine integration code
```

## Soundraw API Parameters

The server maps game scenes to these Soundraw parameters:

**Moods:** Angry, Busy & Frantic, Dark, Dreamy, Elegant, Epic, Euphoric, Fear, Funny & Weird, Glamorous, Happy, Heavy & Ponderous, Hopeful, Laid Back, Mysterious, Peaceful, Restless, Romantic, Running, Sad, Scary, Sentimental, Sexy, Smooth, Suspense

**Genres:** Acoustic, Hip Hop, Beats, Funk, Pop, Drum n Bass, Trap, Tokyo night pop, Rock, Latin, House, Tropical House, Ambient, Orchestra, Electro & Dance, Electronica, Techno & Trance, Jersey Club, Drill, R&B, Lofi Hip Hop, World, Afrobeats, Christmas

**Themes:** Ads & Trailers, Broadcasting, Cinematic, Corporate, Comedy, Cooking, Documentary, Drama, Fashion & Beauty, Gaming, Holiday Season, Horror & Thriller, Motivational & Inspiring, Nature, Photography, Sports & Action, Technology, Travel, Tutorials, Vlogs, Wedding & Romance, Workout & Wellness

**Tempo:** low (<100 bpm), normal (100-125 bpm), high (>125 bpm)

**Energy Levels:** Muted, Low, Medium, High, Very High

## Development

```bash
# Run in development mode (watches for changes)
npm run dev

# Type check
npm run typecheck

# Build
npm run build

# Run built version
npm start

# Test API connections
npm run test:apis
```

## Cost

| Component | Purpose | Cost |
|-----------|---------|------|
| DeepSeek | Scene analysis → Soundraw params | ~$0.001/request |
| Soundraw | Music generation | Per your B2B plan |

DeepSeek handles the reasoning at ~90% less cost than Claude API.

## License

MIT
