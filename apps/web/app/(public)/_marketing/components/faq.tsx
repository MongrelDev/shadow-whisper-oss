import type { Faq } from "../lib/types";

export function MarketingFaq({ faqs }: { faqs: readonly Faq[] }): React.ReactElement {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background">
      {faqs.map((faq) => (
        <details key={faq.question} className="group px-5 py-4 sm:px-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
            {faq.question}
            <span
              aria-hidden="true"
              className="text-muted-foreground transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3 max-w-[68ch] text-sm leading-[1.7] text-muted-foreground">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
