// Engine-specific integration code templates

export function getUnrealIntegrationCode(audioUrl: string, bpm: number): string {
  return `// Unreal Engine 5 - BGM Integration
// Add to your GameMode or AudioManager Blueprint

// 1. Create a Sound Cue and import the audio file from:
// ${audioUrl}

// 2. C++ Integration:
#include "Sound/SoundCue.h"
#include "Components/AudioComponent.h"

// In your header:
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Audio")
USoundCue* BGMCue;

UPROPERTY()
UAudioComponent* BGMAudioComponent;

// In your implementation:
void AMyGameMode::PlayBGM()
{
    if (BGMCue && !BGMAudioComponent)
    {
        BGMAudioComponent = UGameplayStatics::SpawnSound2D(this, BGMCue, 1.0f, 1.0f, 0.0f, nullptr, true, false);
        // BPM: ${bpm} - Use for beat-synced gameplay events
    }
}

void AMyGameMode::StopBGM(float FadeOutDuration)
{
    if (BGMAudioComponent)
    {
        BGMAudioComponent->FadeOut(FadeOutDuration, 0.0f);
    }
}

// Blueprint: Use "Spawn Sound 2D" node with your Sound Cue`;
}

export function getUnityIntegrationCode(audioUrl: string, bpm: number): string {
  return `// Unity - BGM Integration
// Download audio from: ${audioUrl}

using UnityEngine;

public class BGMManager : MonoBehaviour
{
    [SerializeField] private AudioClip bgmClip;
    [SerializeField] private float fadeSpeed = 1f;

    private AudioSource audioSource;
    private const float BPM = ${bpm}f;
    private float beatInterval => 60f / BPM;

    void Awake()
    {
        audioSource = GetComponent<AudioSource>();
        if (audioSource == null)
            audioSource = gameObject.AddComponent<AudioSource>();

        audioSource.loop = true;
        audioSource.playOnAwake = false;
    }

    public void PlayBGM()
    {
        if (bgmClip != null)
        {
            audioSource.clip = bgmClip;
            audioSource.Play();
        }
    }

    public void StopBGM()
    {
        StartCoroutine(FadeOut());
    }

    private System.Collections.IEnumerator FadeOut()
    {
        while (audioSource.volume > 0)
        {
            audioSource.volume -= fadeSpeed * Time.deltaTime;
            yield return null;
        }
        audioSource.Stop();
        audioSource.volume = 1f;
    }

    // Call this for beat-synced events
    public float GetNextBeatTime()
    {
        float currentTime = audioSource.time;
        float currentBeat = currentTime / beatInterval;
        float nextBeat = Mathf.Ceil(currentBeat);
        return nextBeat * beatInterval;
    }
}`;
}

export function getGodotIntegrationCode(audioUrl: string, bpm: number): string {
  return `# Godot 4 - BGM Integration
# Download audio from: ${audioUrl}

extends Node

@export var bgm_stream: AudioStream
@export var fade_duration: float = 1.0

var audio_player: AudioStreamPlayer
const BPM: float = ${bpm}.0
var beat_interval: float = 60.0 / BPM

func _ready():
    audio_player = AudioStreamPlayer.new()
    audio_player.bus = "Music"
    add_child(audio_player)

func play_bgm():
    if bgm_stream:
        audio_player.stream = bgm_stream
        audio_player.play()

func stop_bgm():
    var tween = create_tween()
    tween.tween_property(audio_player, "volume_db", -80, fade_duration)
    tween.tween_callback(audio_player.stop)
    tween.tween_property(audio_player, "volume_db", 0, 0)

# Get time until next beat for synced events
func get_next_beat_time() -> float:
    var current_time = audio_player.get_playback_position()
    var current_beat = current_time / beat_interval
    var next_beat = ceil(current_beat)
    return next_beat * beat_interval - current_time`;
}

export function getIntegrationCode(
  engine: 'unreal' | 'unity' | 'godot' | undefined,
  audioUrl: string,
  bpm: number
): string | undefined {
  if (!engine) return undefined;

  switch (engine) {
    case 'unreal':
      return getUnrealIntegrationCode(audioUrl, bpm);
    case 'unity':
      return getUnityIntegrationCode(audioUrl, bpm);
    case 'godot':
      return getGodotIntegrationCode(audioUrl, bpm);
    default:
      return undefined;
  }
}
