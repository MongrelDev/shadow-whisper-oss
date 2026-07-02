import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
  pixelBasedPreset,
} from "@react-email/components";
import type { ReactNode } from "react";

const emailTheme = {
  extend: {
    colors: {
      "sw-bg": "#faf9fd",
      "sw-fg": "#1a1a2e",
      "sw-muted": "#4b5563",
      "sw-border": "#e0e3e8",
      "sw-primary": "#443f8f",
      "sw-on-primary": "#f8f7fc",
    },
    fontFamily: {
      sans: [
        "Geist",
        "-apple-system",
        "BlinkMacSystemFont",
        "'Segoe UI'",
        "Roboto",
        "Helvetica",
        "Arial",
        "sans-serif",
      ],
      mono: ["'Geist Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
    },
    boxShadow: {
      card: "0 12px 36px rgba(26, 26, 46, 0.08)",
    },
    borderRadius: {
      card: "24px",
    },
    maxWidth: {
      email: "560px",
    },
    letterSpacing: {
      eyebrow: "0.22em",
      display: "-0.03em",
      brand: "-0.01em",
    },
  },
} as const;

const EMAIL_STYLES = `
html, body { height: 100% !important; }
body > table { height: 100% !important; }
@media only screen and (max-width: 480px) {
  .sw-heading { font-size: 28px !important; }
  .sw-outer { padding-top: 0 !important; padding-bottom: 0 !important; padding-left: 0 !important; padding-right: 0 !important; }
  .sw-card { padding-left: 20px !important; padding-right: 20px !important; border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; box-shadow: none !important; max-width: 100% !important; }
}
`;

interface BaseEmailRootProps {
  readonly lang: string;
  readonly preview: string;
  readonly children: ReactNode;
}

function BaseEmailRoot({ lang, preview, children }: BaseEmailRootProps) {
  return (
    <Html lang={lang} style={{ height: "100%" }}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style dangerouslySetInnerHTML={{ __html: EMAIL_STYLES }} />
      </Head>
      <Preview>{preview}</Preview>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: emailTheme,
        }}
      >
        <Body className="m-0 bg-sw-bg px-0 py-0 font-sans text-sw-fg">
          <Section className="sw-outer bg-sw-bg px-4 py-14">{children}</Section>
        </Body>
      </Tailwind>
    </Html>
  );
}

interface BaseEmailChildrenProps {
  readonly children: ReactNode;
}

function BaseEmailCard({ children }: BaseEmailChildrenProps) {
  return (
    <Container className="sw-card mx-auto w-full max-w-email rounded-card border border-solid border-sw-border bg-sw-bg px-8 py-10 shadow-card">
      {children}
    </Container>
  );
}

interface BaseEmailBrandProps {
  readonly href: string;
}

function BaseEmailBrand({ href }: BaseEmailBrandProps) {
  return (
    <Link href={href} className="text-[15px] font-semibold tracking-brand text-sw-fg no-underline">
      Shadow<span className="text-sw-primary">Whisper</span>
    </Link>
  );
}

function BaseEmailEyebrow({ children }: BaseEmailChildrenProps) {
  return (
    <Text className="m-0 mt-5 font-mono text-[11px] font-medium uppercase tracking-eyebrow text-sw-muted">
      {children}
    </Text>
  );
}

function BaseEmailHeading({ children }: BaseEmailChildrenProps) {
  return (
    <Heading className="sw-heading m-0 mt-5 text-[34px] font-semibold leading-[1.05] tracking-display text-sw-fg">
      {children}
    </Heading>
  );
}

interface BaseEmailSplitHeadingProps {
  readonly intro: ReactNode;
  readonly muted: ReactNode;
  readonly accent: ReactNode;
}

function BaseEmailSplitHeading({ intro, muted, accent }: BaseEmailSplitHeadingProps) {
  return (
    <BaseEmailHeading>
      {intro}
      <br />
      <span className="text-sw-muted">{muted}</span>
      <br />
      {accent}
      <span className="text-sw-primary">.</span>
    </BaseEmailHeading>
  );
}

function BaseEmailLead({ children }: BaseEmailChildrenProps) {
  return <Text className="m-0 mt-6 text-[15px] leading-[1.65] text-sw-muted">{children}</Text>;
}

function BaseEmailActions({ children }: BaseEmailChildrenProps) {
  return <Section className="mt-8">{children}</Section>;
}

interface BaseEmailButtonProps {
  readonly href: string;
  readonly children: ReactNode;
}

function BaseEmailButton({ href, children }: BaseEmailButtonProps) {
  return (
    <Button
      href={href}
      className="rounded-[6px] bg-sw-primary px-6 py-3 text-[14px] font-medium text-sw-on-primary no-underline"
    >
      {children}
    </Button>
  );
}

function BaseEmailDivider() {
  return <Hr className="my-8 border-sw-border" />;
}

function BaseEmailSectionLabel({ children }: BaseEmailChildrenProps) {
  return (
    <Text className="m-0 mb-[10px] font-mono text-[11px] font-medium uppercase tracking-eyebrow text-sw-muted">
      {children}
    </Text>
  );
}

function BaseEmailText({ children }: BaseEmailChildrenProps) {
  return <Text className="m-0 text-[14px] leading-[1.65] text-sw-muted">{children}</Text>;
}

function BaseEmailTextBlock({ children }: BaseEmailChildrenProps) {
  return <Text className="m-0 mb-[10px] text-[14px] leading-[1.65] text-sw-muted">{children}</Text>;
}

function BaseEmailMonoText({ children }: BaseEmailChildrenProps) {
  return (
    <Text className="m-0 break-all font-mono text-[12px] leading-[1.5] text-sw-fg">{children}</Text>
  );
}

function BaseEmailDetailGroup({ children }: BaseEmailChildrenProps) {
  return (
    <Section className="mt-6 rounded-[12px] border border-solid border-sw-border px-5 py-4">
      {children}
    </Section>
  );
}

interface BaseEmailDetailItemProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly mono?: boolean;
}

function BaseEmailDetailItem({ label, value, mono = false }: BaseEmailDetailItemProps) {
  return (
    <Text className="m-0 py-[6px] text-[14px] leading-[1.4] text-sw-muted">
      <span className="font-mono text-[11px] font-medium uppercase tracking-eyebrow text-sw-muted">
        {label}
      </span>
      <br />
      <span className={mono ? "font-mono text-[13px] text-sw-fg" : "font-semibold text-sw-fg"}>
        {value}
      </span>
    </Text>
  );
}

interface BaseEmailSecondaryButtonProps {
  readonly href: string;
  readonly children: ReactNode;
}

function BaseEmailSecondaryButton({ href, children }: BaseEmailSecondaryButtonProps) {
  return (
    <Button
      href={href}
      className="rounded-[6px] border border-solid border-sw-border bg-sw-bg px-6 py-3 text-[14px] font-medium text-sw-fg no-underline"
    >
      {children}
    </Button>
  );
}

interface BaseEmailFooterProps {
  readonly appBaseUrl: string;
  readonly children: ReactNode;
}

function BaseEmailFooter({ appBaseUrl, children }: BaseEmailFooterProps) {
  const year = new Date().getFullYear();

  return (
    <Section className="pt-12">
      <Text className="m-0 mb-[6px] text-[12px] leading-[1.6] text-sw-muted">{children}</Text>
      <Text className="m-0 text-[12px] leading-[1.6] text-sw-muted">
        © {year}{" "}
        <Link href={appBaseUrl} className="text-sw-primary no-underline">
          ShadowWhisper
        </Link>
      </Text>
    </Section>
  );
}

export const BaseEmail = {
  Root: BaseEmailRoot,
  Card: BaseEmailCard,
  Brand: BaseEmailBrand,
  Eyebrow: BaseEmailEyebrow,
  Heading: BaseEmailHeading,
  SplitHeading: BaseEmailSplitHeading,
  Lead: BaseEmailLead,
  Actions: BaseEmailActions,
  Button: BaseEmailButton,
  Divider: BaseEmailDivider,
  SectionLabel: BaseEmailSectionLabel,
  Text: BaseEmailText,
  TextBlock: BaseEmailTextBlock,
  MonoText: BaseEmailMonoText,
  DetailGroup: BaseEmailDetailGroup,
  DetailItem: BaseEmailDetailItem,
  SecondaryButton: BaseEmailSecondaryButton,
  Footer: BaseEmailFooter,
};
