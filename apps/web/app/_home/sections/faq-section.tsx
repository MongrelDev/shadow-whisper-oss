import { Plus } from "lucide-react";
import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqSection({
  locale,
  launched,
}: {
  locale: Locale;
  launched: boolean;
}): React.ReactElement {
  const faqs = [
    {
      question: m.home_faq_1_question({}, { locale }),
      answer: m.home_faq_1_answer({}, { locale }),
    },
    {
      question: m.home_faq_2_question({}, { locale }),
      answer: m.home_faq_2_answer({}, { locale }),
    },
    {
      question: m.home_faq_3_question({}, { locale }),
      answer: m.home_faq_3_answer({}, { locale }),
    },
    {
      question: m.home_faq_4_question({}, { locale }),
      answer: m.home_faq_4_answer({}, { locale }),
    },
    {
      question: m.home_faq_5_question({}, { locale }),
      answer: m.home_faq_5_answer({}, { locale }),
    },
    {
      question: m.home_faq_6_question({}, { locale }),
      answer: m.home_faq_6_answer({}, { locale }),
    },
    {
      question: m.home_faq_7_question({}, { locale }),
      answer: m.home_faq_7_answer({}, { locale }),
    },
  ];

  if (!launched) {
    faqs.unshift({
      question: m.home_faq_launch_question({}, { locale }),
      answer: m.home_faq_launch_answer({}, { locale }),
    });
  }

  return (
    <section id="faq">
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <h2 className="text-[clamp(2rem,4.2vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-balance">
              {m.home_faq_title_prefix({}, { locale })}{" "}
              <span className="text-muted-foreground/85">
                {m.home_faq_title_suffix({}, { locale })}
              </span>
            </h2>
            <p className="mt-6 max-w-[52ch] text-base leading-[1.75] text-muted-foreground">
              {m.home_faq_description({}, { locale })}
            </p>
          </div>

          <Accordion type="single" collapsible className="border-t border-border">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={faq.question}
                value={`item-${i}`}
                className="border-b border-border"
              >
                <AccordionTrigger className="group grid grid-cols-[auto_1fr_auto] items-start gap-5 py-5 text-left font-medium hover:no-underline [&>svg]:hidden">
                  <span className="mt-1 font-mono text-[11px] tracking-[0.1em] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[17px] font-medium leading-[1.4] tracking-[-0.01em] transition-colors group-hover:text-primary group-data-[state=open]:text-primary">
                    {faq.question}
                  </span>
                  <Plus
                    aria-hidden="true"
                    className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-45"
                    strokeWidth={1.5}
                  />
                </AccordionTrigger>
                <AccordionContent className="pb-6 pl-10 text-[14.5px] leading-[1.75] text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
