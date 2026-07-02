import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShortcutKeys } from "@/components/ui/shortcut-keys";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { m } from "~/paraglide/messages";

interface ShortcutRow {
  label: string;
  accelerator?: string;
  keys?: string[];
}

interface ShortcutSection {
  title: string;
  rows: ShortcutRow[];
}

function Section({ title, rows }: ShortcutSection): React.ReactElement {
  return (
    <section className="space-y-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
        {title}
      </p>
      <ul className="divide-y divide-border/40 rounded-lg border border-border/50 bg-card">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="text-sm text-foreground">{row.label}</span>
            <ShortcutKeys accelerator={row.accelerator} keys={row.keys} size="sm" />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ShortcutsModal(): React.ReactElement {
  const search = useSearch({ from: "/app-shell/protected/app/" });
  const navigate = useNavigate();
  const { shortcuts } = useShortcuts();
  const isOpen = search.modal === "shortcuts";

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      navigate({ to: "/app", search: {} });
    }
  };

  const recordingRows: ShortcutRow[] = [
    { label: m.shortcuts_modal_record(), accelerator: shortcuts?.transcription },
    { label: m.shortcuts_modal_cancel(), accelerator: shortcuts?.cancelRecording },
  ];

  const otherRows: ShortcutRow[] = [
    { label: m.shortcuts_modal_paste(), accelerator: shortcuts?.pasteLastTranscript },
    { label: m.shortcuts_modal_open_dictionary(), keys: ["⌘", "⇧", "D"] },
    { label: m.shortcuts_modal_open_settings(), keys: ["⌘", ","] },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{m.shortcuts_modal_title()}</DialogTitle>
          <DialogDescription>{m.shortcuts_modal_subtitle()}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-5">
          <Section title={m.shortcuts_modal_section_recording()} rows={recordingRows} />
          <Section title={m.shortcuts_modal_section_other()} rows={otherRows} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
