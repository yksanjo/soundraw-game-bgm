# Soundraw Game BGM MCP Server

An MCP (Model Context Protocol) server that enables AI agents to generate game background music. Uses **DeepSeek** for intelligent scene analysis and parameter generation, and **Soundraw** for actual music generation.

## Architecture

```
Game Dev Agent (Claude/Cursor)
    ↓ calls MCP tool
MCP Server (soundraw-game-bgm)
    ↓ uses DeepSeek API for reasoning
DeepSeek analyzes game context
    ↓ generates music parameters
Soundraw API generates actual music
    ↓ returns audio files + metadata
Game Dev Agent receives music
```

## Features

- **Cost-Optimized**: Uses DeepSeek (~90% cheaper than Claude) for scene analysis
- **4 MCP Tools**: Full suite for game audio needs
- **Engine Integration**: Auto-generated code snippets for Unreal, Unity, and Godot
- **Adaptive Audio**: Stem separation for dynamic game audio

## Installation

```bash
cd soundraw-game-bgm
npm install
npm run build
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
SOUNDRAW_API_KEY=your-soundraw-api-key
SOUNDRAW_API_BASE_URL=https://api.soundraw.io/v1
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
  "duration_seconds": 120,
  "engine": "unreal"
}
```

**Output:**
- Audio URL and ID
- BPM, key, instruments
- Mood tags
- Engine-specific integration code
- DeepSeek's reasoning for parameter choices

### 2. `get_bgm_variations`

Generate variations of existing BGM for adaptive audio.

**Input:**
```json
{
  "base_audio_id": "abc123",
  "variation_type": "intensity",
  "count": 3
}
```

**Variation Types:**
- `intensity`: Louder/quieter versions
- `instrument`: Different instrument arrangements
- `tempo`: Faster/slower versions

### 3. `adaptive_layer_control`

Get stem separation for real-time audio mixing.

**Input:**
```json
{
  "audio_id": "abc123",
  "layers": ["drums", "bass", "melody", "ambient"],
  "crossfade_ms": 500
}
```

**Output:**
- Individual layer audio URLs
- Default volume levels
- JavaScript integration code for adaptive mixing

### 4. `scene_transition_music`

Generate transition music between scenes.

**Input:**
```json
{
  "from_scene": "peaceful village exploration",
  "to_scene": "intense boss battle",
  "transition_type": "stinger",
  "duration_seconds": 5
}
```

**Transition Types:**
- `fade`: Gradual transition
- `stinger`: Dramatic accent
- `crossfade`: Blend both scenes

## Usage with Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "soundraw-game-bgm": {
      "command": "node",
      "args": ["/path/to/soundraw-game-bgm/dist/index.js"],
      "env": {
        "DEEPSEEK_API_KEY": "sk-your-key",
        "SOUNDRAW_API_KEY": "your-soundraw-key"
      }
    }
  }
}
```

## Example Workflow

```
You: "Generate epic boss battle music for my Dark Souls-like game"

Agent calls: generate_bgm({
  scene: "boss_fight",
  game_genre: "dark_souls_like",
  intensity: "high",
  mood: "epic",
  engine: "unreal"
})

Returns:
- Audio URL for the generated track
- BPM: 140, Key: D minor
- Instruments: ["orchestra", "choir", "percussion", "strings"]
- Unreal Engine integration code
- DeepSeek reasoning: "Boss fights in Souls-like games need driving orchestral
  arrangements with building intensity. D minor provides the dark, epic quality..."
```

## Development

```bash
# Run in development mode
npm run dev

# Type check
npm run typecheck

# Build
npm run build

# Run built version
npm start
```

## Cost Optimization

| Component | Purpose | Cost |
|-----------|---------|------|
| DeepSeek | Scene analysis, parameter generation | ~$0.001/request |
| Soundraw | Actual music generation | Per Soundraw pricing |

DeepSeek handles all the reasoning work at a fraction of Claude's cost, while Soundraw generates the actual audio.

## License

MIT
