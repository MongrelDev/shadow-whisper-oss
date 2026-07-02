import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

export function StepsSection({ locale }: { locale: Locale }): React.ReactElement {
  const steps = [
    {
      title: m.home_steps_1_title({}, { locale }),
      description: m.home_steps_1_description({}, { locale }),
    },
    {
      title: m.home_steps_2_title({}, { locale }),
      description: m.home_steps_2_description({}, { locale }),
    },
    {
      title: m.home_steps_3_title({}, { locale }),
      description: m.home_steps_3_description({}, { locale }),
    },
  ];

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-8 sm:px-8 md:grid-cols-3 md:gap-14 md:py-14 lg:px-12 lg:pb-32 lg:pt-14">
      {steps.map((step, index) => (
        <div key={step.title}>
          <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground">
            <span className="font-medium text-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="ml-2 text-muted-foreground/60">
              / {String(steps.length).padStart(2, "0")}
            </span>
          </p>
          <h3 className="mt-3.5 text-lg font-medium tracking-tight">{step.title}</h3>
          <p className="mt-3 max-w-[38ch] text-sm leading-7 text-muted-foreground">
            {step.description}
          </p>
        </div>
      ))}
    </section>
  );
}
