import recordStartUrl from "../assets/sounds/record-start.mp3";
import recordStopUrl from "../assets/sounds/record-stop.mp3";
import recordCancelUrl from "../assets/sounds/record-cancel.mp3";
import recordErrorUrl from "../assets/sounds/record-error.mp3";

export type UiSound = "start" | "stop" | "cancel" | "error";

const SOUND_URLS: Record<UiSound, string> = {
  start: recordStartUrl,
  stop: recordStopUrl,
  cancel: recordCancelUrl,
  error: recordErrorUrl,
};

const SOUND_VOLUMES: Record<UiSound, number> = {
  start: 0.35,
  stop: 0.35,
  cancel: 0.32,
  error: 0.3,
};

const audioCache = new Map<UiSound, HTMLAudioElement>();

function getAudio(sound: UiSound): HTMLAudioElement | null {
  if (typeof Audio === "undefined") return null;

  const cached = audioCache.get(sound);
  if (cached) return cached;

  const audio = new Audio(SOUND_URLS[sound]);
  audio.preload = "auto";
  audio.volume = SOUND_VOLUMES[sound];
  audioCache.set(sound, audio);
  return audio;
}

export function preloadUiSounds(): void {
  (Object.keys(SOUND_URLS) as UiSound[]).forEach((sound) => {
    const audio = getAudio(sound);
    audio?.load();
  });
}

export function playUiSound(sound: UiSound): void {
  const audio = getAudio(sound);
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  audio.volume = SOUND_VOLUMES[sound];
  void audio.play().catch(() => undefined);
}
