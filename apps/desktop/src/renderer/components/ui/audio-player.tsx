import {
  type ComponentProps,
  createContext,
  type HTMLProps,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { PauseIcon, PlayIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { m } from "~/paraglide/messages";

enum ReadyState {
  HAVE_NOTHING = 0,
  HAVE_METADATA = 1,
  HAVE_CURRENT_DATA = 2,
  HAVE_FUTURE_DATA = 3,
  HAVE_ENOUGH_DATA = 4,
}

enum NetworkState {
  NETWORK_EMPTY = 0,
  NETWORK_IDLE = 1,
  NETWORK_LOADING = 2,
  NETWORK_NO_SOURCE = 3,
}

function formatTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const formattedMins = mins < 10 ? `0${mins}` : mins;
  const formattedSecs = secs < 10 ? `0${secs}` : secs;

  return hrs > 0 ? `${hrs}:${formattedMins}:${formattedSecs}` : `${mins}:${formattedSecs}`;
}

interface AudioPlayerItem<TData = unknown> {
  id: string | number;
  src: string;
  data?: TData;
}

interface AudioPlayerApi<TData = unknown> {
  ref: RefObject<HTMLAudioElement | null>;
  activeItem: AudioPlayerItem<TData> | null;
  duration: number | undefined;
  error: MediaError | null;
  isPlaying: boolean;
  isBuffering: boolean;
  playbackRate: number;
  isItemActive: (id: string | number | null) => boolean;
  setActiveItem: (item: AudioPlayerItem<TData> | null) => Promise<void>;
  play: (item?: AudioPlayerItem<TData> | null) => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerApi<unknown> | null>(null);

export function useAudioPlayer<TData = unknown>(): AudioPlayerApi<TData> {
  const api = useContext(AudioPlayerContext) as AudioPlayerApi<TData> | null;
  if (!api) {
    throw new Error("useAudioPlayer cannot be called outside of AudioPlayerProvider");
  }
  return api;
}

const AudioPlayerTimeContext = createContext<number | null>(null);

export const useAudioPlayerTime = () => {
  const time = useContext(AudioPlayerTimeContext);
  if (time === null) {
    throw new Error("useAudioPlayerTime cannot be called outside of AudioPlayerProvider");
  }
  return time;
};

type AnimationFrameCallback = (delta: number) => void;

function useAnimationFrame(callback: AnimationFrameCallback) {
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const callbackRef = useRef<AnimationFrameCallback>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== null) {
        const delta = time - previousTimeRef.current;
        callbackRef.current(delta);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      previousTimeRef.current = null;
    };
  }, []);
}

function resetAudioElement<TData>(
  audio: HTMLAudioElement,
  item: AudioPlayerItem<TData> | null,
  currentRate: number
) {
  if (!audio.paused) {
    audio.pause();
  }

  audio.currentTime = 0;

  if (item === null) {
    audio.removeAttribute("src");
  } else {
    audio.src = item.src;
  }

  audio.load();
  audio.playbackRate = currentRate;
}

async function awaitPlayPromise(playPromise: Promise<void> | null) {
  if (!playPromise) {
    return;
  }

  try {
    await playPromise;
  } catch (e) {
    void e;
  }
}

function startAudioPlayback(
  audio: HTMLAudioElement,
  playPromiseRef: RefObject<Promise<void> | null>
) {
  const playPromise = audio.play();
  playPromiseRef.current = playPromise;
  return playPromise;
}

function shouldPlayCurrentItem<TData>(
  item: AudioPlayerItem<TData> | null | undefined,
  activeItem: AudioPlayerItem<TData> | null
) {
  return item === undefined || item?.id === activeItem?.id;
}

function switchAudioItemAndPlay<TData>(
  audio: HTMLAudioElement,
  item: AudioPlayerItem<TData> | null,
  playPromiseRef: RefObject<Promise<void> | null>,
  itemRef: RefObject<AudioPlayerItem<TData> | null>
) {
  itemRef.current = item;
  const currentRate = audio.playbackRate;

  resetAudioElement(audio, item, currentRate);

  return startAudioPlayback(audio, playPromiseRef);
}

function isValidDurationValue(value?: number): value is number {
  return value !== undefined && Number.isFinite(value) && !Number.isNaN(value) && value > 0;
}

export function AudioPlayerProvider<TData = unknown>({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const itemRef = useRef<AudioPlayerItem<TData> | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const [readyState, setReadyState] = useState<number>(0);
  const [networkState, setNetworkState] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [error, setError] = useState<MediaError | null>(null);
  const [activeItem, _setActiveItem] = useState<AudioPlayerItem<TData> | null>(null);
  const [paused, setPaused] = useState(true);
  const [playbackRate, setPlaybackRateState] = useState<number>(1);

  const setActiveItem = useCallback(async (item: AudioPlayerItem<TData> | null) => {
    if (!audioRef.current) return;

    if (item?.id === itemRef.current?.id) {
      return;
    }

    itemRef.current = item;
    const currentRate = audioRef.current.playbackRate;

    resetAudioElement(audioRef.current, item, currentRate);
  }, []);

  const play = useCallback(
    async (item?: AudioPlayerItem<TData> | null) => {
      if (!audioRef.current) return;

      await awaitPlayPromise(playPromiseRef.current);

      if (shouldPlayCurrentItem(item, activeItem)) {
        return startAudioPlayback(audioRef.current, playPromiseRef);
      }

      return switchAudioItemAndPlay(audioRef.current, item ?? null, playPromiseRef, itemRef);
    },
    [activeItem]
  );

  const pause = useCallback(async () => {
    if (!audioRef.current) return;

    await awaitPlayPromise(playPromiseRef.current);

    audioRef.current.pause();
    playPromiseRef.current = null;
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRateState(rate);
  }, []);

  const isItemActive = useCallback(
    (id: string | number | null) => {
      return activeItem?.id === id;
    },
    [activeItem]
  );

  useAnimationFrame(() => {
    if (audioRef.current) {
      _setActiveItem(itemRef.current);
      setReadyState(audioRef.current.readyState);
      setNetworkState(audioRef.current.networkState);
      setTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
      setPaused(audioRef.current.paused);
      setError(audioRef.current.error);
      setPlaybackRateState(audioRef.current.playbackRate);
    }
  });

  const isPlaying = !paused;
  const isBuffering =
    readyState < ReadyState.HAVE_FUTURE_DATA && networkState === NetworkState.NETWORK_LOADING;

  const api = useMemo<AudioPlayerApi<TData>>(
    () => ({
      ref: audioRef,
      duration,
      error,
      isPlaying,
      isBuffering,
      activeItem,
      playbackRate,
      isItemActive,
      setActiveItem,
      play,
      pause,
      seek,
      setPlaybackRate,
    }),
    [
      audioRef,
      duration,
      error,
      isPlaying,
      isBuffering,
      activeItem,
      playbackRate,
      isItemActive,
      setActiveItem,
      play,
      pause,
      seek,
      setPlaybackRate,
    ]
  );

  return (
    <AudioPlayerContext.Provider value={api as AudioPlayerApi<unknown>}>
      <AudioPlayerTimeContext.Provider value={time}>
        <audio ref={audioRef} className="hidden" />
        {children}
      </AudioPlayerTimeContext.Provider>
    </AudioPlayerContext.Provider>
  );
}

export const AudioPlayerProgress = ({
  fallbackDuration,
  ...otherProps
}: Omit<ComponentProps<typeof SliderPrimitive.Root>, "min" | "max" | "value"> & {
  fallbackDuration?: number;
}) => {
  const player = useAudioPlayer();
  const time = useAudioPlayerTime();
  const wasPlayingRef = useRef(false);
  const duration = resolveDuration(player.duration, fallbackDuration);

  return (
    <SliderPrimitive.Root
      {...otherProps}
      value={[time]}
      onValueChange={(vals) => {
        if (vals[0] !== undefined) player.seek(vals[0]);
        otherProps.onValueChange?.(vals);
      }}
      min={0}
      max={duration ?? 0}
      step={otherProps.step || 0.25}
      onPointerDown={(e) => {
        wasPlayingRef.current = player.isPlaying;
        player.pause();
        otherProps.onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        if (wasPlayingRef.current) {
          player.play();
        }
        otherProps.onPointerUp?.(e);
      }}
      className={cn(
        "group/player relative flex h-4 touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        otherProps.className
      )}
      onKeyDown={(e) => {
        if (e.key === " ") {
          e.preventDefault();
          if (!player.isPlaying) {
            player.play();
          } else {
            player.pause();
          }
        }
        otherProps.onKeyDown?.(e);
      }}
      disabled={duration === undefined || !Number.isFinite(duration) || Number.isNaN(duration)}
    >
      <SliderPrimitive.Track className="bg-muted relative h-[4px] w-full grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="relative flex h-0 w-0 items-center justify-center opacity-0 group-hover/player:opacity-100 focus-visible:opacity-100 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        data-slot="slider-thumb"
      >
        <div className="bg-foreground absolute size-3 rounded-full" />
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  );
};

export const AudioPlayerTime = ({ className, ...otherProps }: HTMLProps<HTMLSpanElement>) => {
  const time = useAudioPlayerTime();
  return (
    <span
      {...otherProps}
      className={cn("font-mono text-xs text-muted-foreground tabular-nums", className)}
    >
      {formatTime(time)}
    </span>
  );
};

export const AudioPlayerDuration = ({
  className,
  fallbackDuration,
  ...otherProps
}: HTMLProps<HTMLSpanElement> & { fallbackDuration?: number }) => {
  const player = useAudioPlayer();
  const duration = resolveDuration(player.duration, fallbackDuration) ?? null;

  return (
    <span
      {...otherProps}
      className={cn("font-mono text-xs text-muted-foreground tabular-nums", className)}
    >
      {duration !== null ? formatTime(duration) : "--:--"}
    </span>
  );
};

function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-muted border-t-foreground size-3.5 animate-spin rounded-full border-2",
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">{m.media_loading()}</span>
    </div>
  );
}

interface PlayButtonProps extends React.ComponentProps<typeof Button> {
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  loading?: boolean;
}

function PlayButton({
  playing,
  onPlayingChange,
  className,
  onClick,
  loading,
  ...otherProps
}: PlayButtonProps) {
  return (
    <Button
      {...otherProps}
      onClick={(e) => {
        onPlayingChange(!playing);
        onClick?.(e);
      }}
      className={cn("relative", className)}
      aria-label={playing ? m.media_pause() : m.media_play()}
      type="button"
    >
      {playing ? (
        <PauseIcon className={cn("size-4", loading && "opacity-0")} aria-hidden="true" />
      ) : (
        <PlayIcon className={cn("size-4", loading && "opacity-0")} aria-hidden="true" />
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] backdrop-blur-xs">
          <Spinner />
        </div>
      )}
    </Button>
  );
}

export interface AudioPlayerButtonProps<TData = unknown> extends React.ComponentProps<
  typeof Button
> {
  item?: AudioPlayerItem<TData>;
}

export function AudioPlayerButton<TData = unknown>({
  item,
  ...otherProps
}: AudioPlayerButtonProps<TData>) {
  const player = useAudioPlayer<TData>();

  if (!item) {
    return (
      <PlayButton
        {...otherProps}
        playing={player.isPlaying}
        onPlayingChange={(shouldPlay) => {
          if (shouldPlay) {
            player.play();
          } else {
            player.pause();
          }
        }}
        loading={player.isBuffering && player.isPlaying}
      />
    );
  }

  return (
    <PlayButton
      {...otherProps}
      playing={player.isItemActive(item.id) && player.isPlaying}
      onPlayingChange={(shouldPlay) => {
        if (shouldPlay) {
          player.play(item);
        } else {
          player.pause();
        }
      }}
      loading={player.isItemActive(item.id) && player.isBuffering && player.isPlaying}
    />
  );
}

function resolveDuration(value?: number, fallbackDuration?: number): number | undefined {
  if (isValidDurationValue(value)) {
    return value;
  }

  if (isValidDurationValue(fallbackDuration)) {
    return fallbackDuration;
  }

  return undefined;
}
