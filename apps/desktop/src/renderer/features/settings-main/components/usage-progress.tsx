import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const barVariants = cva("h-full rounded-full transition-all duration-300", {
  variants: {
    status: {
      normal: "bg-violet",
      warning: "bg-amber-500",
      critical: "bg-destructive",
    },
  },
  defaultVariants: {
    status: "normal",
  },
});

function getStatus(percentage: number) {
  if (percentage >= 100) return "critical" as const;
  if (percentage >= 80) return "warning" as const;
  return "normal" as const;
}

function formatWords(n: number): string {
  return n.toLocaleString("pt-BR");
}

interface UsageProgressProps {
  totalWords: number;
  limit: number;
  spokenWords: number;
  transformedWords: number;
  daysUntilReset: number | null;
}

export function UsageProgress({
  totalWords,
  limit,
  spokenWords,
  transformedWords,
  daysUntilReset,
}: UsageProgressProps): React.ReactElement {
  const percentage = Math.min((totalWords / limit) * 100, 100);
  const status = getStatus(percentage);
  const tooltip =
    transformedWords > 0
      ? `${formatWords(spokenWords)} faladas + ${formatWords(transformedWords)} transformadas`
      : undefined;

  return (
    <div className="mb-3" title={tooltip}>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={cn(barVariants({ status }))} style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 leading-tight">
        {formatWords(totalWords)}/{formatWords(limit)} palavras esta semana
      </p>
      {daysUntilReset != null && (
        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
          Reseta em {daysUntilReset} {daysUntilReset === 1 ? "dia" : "dias"}
        </p>
      )}
    </div>
  );
}
