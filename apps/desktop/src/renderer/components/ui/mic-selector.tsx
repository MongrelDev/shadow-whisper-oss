import { useEffect, useState } from "react";
import { cva } from "class-variance-authority";
import { Check, Mic } from "lucide-react";

import { cn } from "@/lib/utils";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { m } from "~/paraglide/messages";

const micSelectorMessageText = cva("text-xs", {
  variants: {
    tone: {
      default: "text-muted-foreground",
      destructive: "text-destructive",
    },
  },
});

const micSelectorOption = cva(
  "w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
  {
    variants: {
      active: {
        true: "border-primary bg-primary/5 text-foreground",
        false: "border-border text-muted-foreground hover:bg-accent",
      },
    },
    defaultVariants: { active: false },
  }
);

const micSelectorOptionIcon = cva("h-3.5 w-3.5 shrink-0", {
  variants: {
    active: {
      true: "text-primary",
      false: "text-muted-foreground",
    },
  },
  defaultVariants: { active: false },
});

export interface AudioDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

export interface MicSelectorProps {
  value?: string;
  onValueChange?: (deviceId: string) => void;
  disabled?: boolean;
  className?: string;
}

function MicSelectorMessage({
  className,
  tone,
  message,
}: {
  className?: string;
  tone: "default" | "destructive";
  message: string;
}): React.ReactElement {
  return (
    <div className={cn("space-y-2", className)}>
      <p className={micSelectorMessageText({ tone })}>{message}</p>
    </div>
  );
}

function useAutoDefaultDevice(
  value: string | undefined,
  devices: AudioDevice[],
  onValueChange?: (deviceId: string) => void
): void {
  useEffect(() => {
    if (value === undefined && devices[0]) {
      onValueChange?.(devices[0].deviceId);
    }
  }, [value, devices, onValueChange]);
}

export function MicSelector({ value, onValueChange, disabled, className }: MicSelectorProps) {
  const { devices, loading, error } = useAudioDevices();
  const selectedDevice = value ?? devices[0]?.deviceId ?? "";
  useAutoDefaultDevice(value, devices, onValueChange);

  if (loading) {
    return (
      <MicSelectorMessage
        className={className}
        tone="default"
        message={m.mic_selector_detecting()}
      />
    );
  }
  if (error) {
    return <MicSelectorMessage className={className} tone="destructive" message={error} />;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {devices.map((device) => (
        <DeviceOption
          key={device.deviceId}
          device={device}
          active={device.deviceId === selectedDevice}
          disabled={disabled}
          onSelect={onValueChange}
        />
      ))}
      <WaveformPreview deviceId={selectedDevice} />
    </div>
  );
}

function DeviceOption({
  device,
  active,
  disabled,
  onSelect,
}: {
  device: AudioDevice;
  active: boolean;
  disabled?: boolean;
  onSelect?: (deviceId: string) => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(device.deviceId)}
      disabled={disabled}
      className={cn(
        "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
        "disabled:opacity-50 disabled:pointer-events-none",
        micSelectorOption({ active })
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Mic className={micSelectorOptionIcon({ active })} />
          <span className="truncate">{device.label}</span>
        </div>
        {active && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
      </div>
    </button>
  );
}

function WaveformPreview({ deviceId }: { deviceId: string }): React.ReactElement | null {
  if (!deviceId) return null;
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden mt-3">
      <LiveWaveform
        active
        deviceId={deviceId}
        mode="static"
        height={48}
        barWidth={2}
        barGap={1}
        barRadius={1}
        sensitivity={0.8}
        historySize={200}
        fadeEdges
        fadeWidth={24}
        className="w-full text-foreground"
      />
    </div>
  );
}

function resolveDeviceLabel(device: MediaDeviceInfo): string {
  const fallbackSuffix = device.deviceId.slice(0, 8);
  const rawLabel = device.label || `${m.mic_selector_device_fallback()} ${fallbackSuffix}`;
  return rawLabel.replace(/\s*\([^)]*\)/g, "").trim();
}

function toAudioInputs(deviceList: MediaDeviceInfo[]): AudioDevice[] {
  return deviceList
    .filter((device) => device.kind === "audioinput")
    .map((device) => ({
      deviceId: device.deviceId,
      label: resolveDeviceLabel(device),
      groupId: device.groupId,
    }));
}

async function fetchAudioDevices(): Promise<AudioDevice[]> {
  if (!navigator.mediaDevices?.getUserMedia) return [];
  const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  tempStream.getTracks().forEach((track) => track.stop());
  const deviceList = await navigator.mediaDevices.enumerateDevices();
  return toAudioInputs(deviceList);
}

export function useAudioDevices() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await fetchAudioDevices();
        if (!cancelled) setDevices(next);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : m.mic_selector_load_error());
        console.error("Error getting audio devices:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    navigator.mediaDevices?.addEventListener?.("devicechange", load);
    return () => {
      cancelled = true;
      navigator.mediaDevices?.removeEventListener?.("devicechange", load);
    };
  }, []);

  return { devices, loading, error };
}
