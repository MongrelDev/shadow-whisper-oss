import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { m } from "~/paraglide/messages";
import type { SkillDraft } from "../types/builder-message";

interface StepReviewProps {
  draft: SkillDraft;
  onChange: (patch: Partial<SkillDraft>) => void;
}

export function StepReview({ draft, onChange }: StepReviewProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {m.skill_builder_step_review_title()}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {m.skill_builder_step_review_subtitle()}
        </p>
      </header>

      <div className="space-y-1.5">
        <Label htmlFor="builder-display-name">{m.skill_builder_meta_display_name()}</Label>
        <Input
          id="builder-display-name"
          value={draft.displayName}
          onChange={(e) => onChange({ displayName: e.target.value })}
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="builder-description">{m.skill_builder_meta_description()}</Label>
        <Textarea
          id="builder-description"
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
          className="min-h-[64px] resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="builder-slug">{m.skill_builder_meta_slug()}</Label>
        <Input
          id="builder-slug"
          value={draft.slug}
          onChange={(e) => onChange({ slug: e.target.value })}
        />
      </div>

      <TriggersField triggers={draft.triggers} onChange={(triggers) => onChange({ triggers })} />

      <div className="space-y-1.5">
        <Label htmlFor="builder-markdown">{m.skill_builder_meta_markdown_label()}</Label>
        <Textarea
          id="builder-markdown"
          value={draft.markdown}
          onChange={(e) => onChange({ markdown: e.target.value })}
          rows={8}
          className="min-h-[160px] resize-y text-xs"
        />
      </div>
    </div>
  );
}

interface TriggersFieldProps {
  triggers: readonly string[];
  onChange: (triggers: string[]) => void;
}

function TriggersField({ triggers, onChange }: TriggersFieldProps): React.ReactElement {
  const [input, setInput] = useState("");

  function addTrigger() {
    const value = input.trim();
    if (value.length === 0 || triggers.includes(value)) return;
    onChange([...triggers, value]);
    setInput("");
  }

  function removeTrigger(index: number) {
    onChange(triggers.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-1.5">
      <Label>{m.skill_builder_meta_triggers()}</Label>
      <div className="flex flex-wrap gap-1.5">
        {triggers.map((trigger, i) => (
          <Badge key={trigger} variant="secondary" className="gap-1 pr-1">
            {trigger}
            <button
              type="button"
              onClick={() => removeTrigger(i)}
              aria-label={`Remove trigger ${trigger}`}
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTrigger();
          }
        }}
        placeholder={m.skill_builder_meta_triggers_placeholder()}
      />
    </div>
  );
}
