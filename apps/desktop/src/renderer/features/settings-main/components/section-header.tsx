interface SectionHeaderProps {
  title: string;
  description: string;
}

export function SectionHeader({ title, description }: SectionHeaderProps): React.ReactElement {
  return (
    <header className="mb-7">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="mt-1.5 max-w-[520px] text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </header>
  );
}
