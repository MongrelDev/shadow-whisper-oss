import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cva } from "class-variance-authority";
import { Mic, Accessibility, Check, type LucideIcon } from "lucide-react";
import { MicSelector } from "@/components/ui/mic-selector";
import { requestMicrophoneAccess } from "@/lib/request-microphone-access";
import { m } from "~/paraglide/messages";

interface StepPermissionsProps {
  microphoneGranted: boolean;
  accessibilityGranted: boolean;
  onUpdate: (patch: { microphoneGranted?: boolean; accessibilityGranted?: boolean }) => void;
  onDeviceSelected?: (deviceId: string) => void;
  selectedDeviceId?: string;
}

const cardVariants = cva("flex items-center gap-3.5 p-3.5 rounded-xl border transition-colors", {
  variants: {
    granted: {
      true: "border-green-500/30 bg-green-500/5",
      false: "border-border bg-card",
    },
  },
});

const iconVariants = cva("flex h-8 w-8 items-center justify-center rounded-lg", {
  variants: {
    granted: {
      true: "bg-green-500/10 text-green-500",
      false: "bg-primary/10 text-primary",
    },
  },
});

interface PermissionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  granted: boolean;
  checking: boolean;
  animationDelay: number;
  onRequest: () => void;
}

function PermissionCard({
  icon: Icon,
  title,
  description,
  granted,
  checking,
  animationDelay,
  onRequest,
}: PermissionCardProps): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.22 }}
      className={cardVariants({ granted })}
    >
      <div className={iconVariants({ granted })}>
        {granted ? (
          <Check className="h-4 w-4" strokeWidth={2.5} />
        ) : (
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-snug">{description}</p>
      </div>
      {granted ? (
        <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-green-500">
          {m.onboarding_permissions_status_granted()}
        </span>
      ) : (
        <button
          type="button"
          onClick={onRequest}
          disabled={checking}
          className="px-3.5 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {checking
            ? m.onboarding_permissions_action_checking()
            : m.onboarding_permissions_action_allow()}
        </button>
      )}
    </motion.div>
  );
}

const isMacOS = navigator.userAgent.includes("Mac OS X");

export function StepPermissions({
  microphoneGranted,
  accessibilityGranted,
  onUpdate,
  onDeviceSelected,
  selectedDeviceId,
}: StepPermissionsProps): React.ReactElement {
  const [micChecking, setMicChecking] = useState(false);
  const [accChecking, setAccChecking] = useState(false);
  const mountedRef = useRef(true);
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  useEffect(() => {
    void window.api.settings.checkAccessibility(false).then((granted) => {
      onUpdateRef.current({ accessibilityGranted: granted });
    });
    void window.api.settings.checkMicrophoneStatus().then((granted) => {
      onUpdateRef.current({ microphoneGranted: granted });
    });

    // Re-check both permissions on focus — covers the case where the user
    // granted access in System Settings and switches back to the app.
    const handleFocus = () => {
      void window.api.settings.checkAccessibility(false).then((granted) => {
        onUpdateRef.current({ accessibilityGranted: granted });
      });
      void window.api.settings.checkMicrophoneStatus().then((granted) => {
        onUpdateRef.current({ microphoneGranted: granted });
      });
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const requestMicrophone = async () => {
    setMicChecking(true);
    const granted = await requestMicrophoneAccess();
    if (mountedRef.current) {
      onUpdateRef.current({ microphoneGranted: granted });
      setMicChecking(false);
    }
  };

  const requestAccessibility = async () => {
    setAccChecking(true);
    // `isTrustedAccessibilityClient(true)` opens System Settings on macOS and
    // returns immediately — the focus handler re-checks when the user switches back.
    await window.api.settings.checkAccessibility(true);
    if (mountedRef.current) setAccChecking(false);
  };

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
        {m.onboarding_permissions_eyebrow()}
      </p>
      <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground">
        {m.onboarding_permissions_title()}
      </h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
        {m.onboarding_permissions_subtitle()}
      </p>

      <div className="mt-5 space-y-2">
        <PermissionCard
          icon={Mic}
          title={m.onboarding_permissions_mic_title()}
          description={m.onboarding_permissions_mic_description()}
          granted={microphoneGranted}
          checking={micChecking}
          animationDelay={0}
          onRequest={requestMicrophone}
        />
        {isMacOS && (
          <PermissionCard
            icon={Accessibility}
            title={m.onboarding_permissions_accessibility_title()}
            description={m.onboarding_permissions_accessibility_description()}
            granted={accessibilityGranted}
            checking={accChecking}
            animationDelay={0.06}
            onRequest={requestAccessibility}
          />
        )}
      </div>

      <AnimatePresence>
        {microphoneGranted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 rounded-xl border border-border bg-card">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {m.onboarding_permissions_mic_selector_label()}
              </p>
              <div className="mt-3">
                <MicSelector
                  value={selectedDeviceId}
                  onValueChange={(id) => onDeviceSelected?.(id)}
                  className="w-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
