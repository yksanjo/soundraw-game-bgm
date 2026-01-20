# Twitter/X Demo Script for Soundraw Game BGM MCP

## Recording Tips
- Use a clean terminal (dark theme looks best)
- Increase font size (16-18pt)
- Record at 1920x1080 or 1080x1080 (square for Twitter)
- Keep it under 60 seconds (Twitter sweet spot)
- Add captions (many watch without sound)

---

## Demo Scenario 1: "Boss Fight Music in 30 Seconds"
**Best for:** Showing the core value prop

### What to show:
1. Open Claude Code in terminal
2. Type a natural language request
3. Watch it call the MCP tool
4. Show the generated music playing

### Script:
```
You: "Generate epic boss fight music for my Dark Souls-like game,
     30 seconds, high intensity"

[Claude Code calls generate_bgm tool]
[Show the response with share_link and audio_url]
[Open the share_link in browser - music plays]
```

### Tweet copy:
```
🎮 Just built an MCP server that generates game music with AI

Ask for "boss fight music" → get a custom track in 30 seconds

Stack:
- Claude Code (agent)
- DeepSeek (scene analysis, 90% cheaper than GPT)
- Soundraw (music generation)

Open source: github.com/yksanjo/soundraw-game-bgm
```

---

## Demo Scenario 2: "From Peaceful to Boss Fight"
**Best for:** Showing transition music feature

### Script:
```
You: "Generate transition music from peaceful village exploration
     to intense boss battle, 15 seconds, stinger style"

[Shows DeepSeek analyzing the emotional journey]
[Soundraw generates the transition]
[Play the dramatic stinger]
```

### Tweet copy:
```
Your game needs music that TRANSITIONS between scenes

Built an MCP that understands:
"peaceful village → boss fight"

And generates the perfect 15-second stinger 🎵

AI agent → DeepSeek → Soundraw → 🔊

[video]
```

---

## Demo Scenario 3: "Adaptive Audio Layers"
**Best for:** Showing advanced game audio features

### Script:
```
You: "Take this track and separate it into layers for adaptive audio -
     drums, bass, melody, backing"

[Shows 4 separate audio files generated]
[Explain: "Now the game can mix these in real-time based on combat intensity"]
```

### Tweet copy:
```
Game devs: You know how AAA games fade in drums when combat starts?

Built an MCP that generates LAYERED game music:
- Drums only
- Bass only
- Melody only
- Full mix

Your game engine mixes them in real-time 🎮

[video]
```

---

## Demo Scenario 4: "Speed Run - 3 Tracks in 2 Minutes"
**Best for:** Showing versatility

### Script:
```
Track 1: "Horror game exploration, low intensity, mysterious"
Track 2: "JRPG battle theme, high energy, epic"
Track 3: "Puzzle game background, calm, lofi"

[Show all 3 generating quickly]
[Play snippets of each]
```

### Tweet copy:
```
Generated 3 completely different game soundtracks in 2 minutes:

1. 👻 Horror exploration
2. ⚔️ JRPG battle
3. 🧩 Chill puzzle

All from natural language prompts to Claude Code

MCP + DeepSeek + Soundraw = unlimited game music

[video]
```

---

## Recording Checklist

Before recording:
- [ ] Set up .env with API keys
- [ ] Test that APIs are working: `npm run test:apis`
- [ ] Configure Claude Code with MCP (see below)
- [ ] Clear terminal history
- [ ] Close unnecessary apps
- [ ] Set terminal to dark theme, large font

Claude Code MCP config (`~/.mcp.json`):
```json
{
  "mcpServers": {
    "soundraw-game-bgm": {
      "command": "node",
      "args": ["/Users/yoshikondo/soundraw-game-bgm/dist/index.js"],
      "env": {
        "DEEPSEEK_API_KEY": "your-key",
        "SOUNDRAW_API_KEY": "your-token"
      }
    }
  }
}
```

After configuring, restart Claude Code.

---

## Hashtags for Twitter
```
#gamedev #indiedev #gameaudio #ai #mcp #claudecode #soundraw #opensource
```

## Best posting times (US audience)
- Tue-Thu, 9-11am EST
- Tue-Thu, 1-3pm EST
