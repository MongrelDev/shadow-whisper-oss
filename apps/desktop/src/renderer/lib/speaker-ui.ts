const SPEAKER_TONES = ["speaker-tone-1", "speaker-tone-2", "speaker-tone-3"] as const;

export function getSpeakerToneClass(index: number): (typeof SPEAKER_TONES)[number] {
  return SPEAKER_TONES[index % SPEAKER_TONES.length]!;
}
