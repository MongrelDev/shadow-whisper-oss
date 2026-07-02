import { useEffect, useRef } from "react";
import { AsyncButton } from "@/components/ui/async-button";
import { Textarea } from "@/components/ui/textarea";
import { m } from "~/paraglide/messages";

interface StepDescribeProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  onGenerate: () => void;
  onBuildManually: () => void;
  isGenerating: boolean;
  hasFailed: boolean;
}

export function StepDescribe({
  description,
  onDescriptionChange,
  onGenerate,
  onBuildManually,
  isGenerating,
  hasFailed,
}: StepDescribeProps): React.ReactElement {
  const canGenerate = description.trim().length > 0 && !isGenerating;
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasFailed && errorRef.current) {
      errorRef.current.focus();
    }
  }, [hasFailed]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1.5">
        <h2
          id="builder-describe-title"
          className="text-xl font-semibold tracking-tight text-foreground"
        >
          {m.skill_builder_step_describe_title()}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {m.skill_builder_step_describe_subtitle()}
        </p>
      </header>

      <Textarea
        aria-labelledby="builder-describe-title"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder={m.skill_builder_step_describe_placeholder()}
        rows={5}
        className="min-h-[120px] resize-none"
        autoFocus
        maxLength={2000}
      />

      {hasFailed && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3"
        >
          <p className="text-sm text-destructive">{m.skill_builder_step_describe_build_failed()}</p>
          <button
            type="button"
            onClick={onBuildManually}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap ml-3"
          >
            {m.skill_builder_step_describe_build_manually()}
          </button>
        </div>
      )}

      <AsyncButton
        onClick={onGenerate}
        isPending={isGenerating}
        pendingLabel={m.skill_builder_step_describe_generating()}
        disabled={!canGenerate}
        className="self-end"
      >
        {m.skill_builder_step_describe_generate()}
      </AsyncButton>
    </div>
  );
}
