export function AppWindow({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="win">
      <div className="titlebar">
        <div className="lights">
          <span className="c1" />
          <span className="c2" />
          <span className="c3" />
        </div>
        <div className="title">
          {title}
          <span className="dot" />
          {subtitle}
        </div>
      </div>
      {children}
    </div>
  );
}

export function NotesBody({
  date,
  heading,
  children,
  bodyStyle,
}: {
  date?: string;
  heading?: string;
  children: React.ReactNode;
  bodyStyle?: React.CSSProperties;
}): React.ReactElement {
  return (
    <div className="notes-body" style={bodyStyle}>
      {date ? <div className="date">{date}</div> : null}
      {heading ? <div className="heading">{heading}</div> : null}
      <div className="body">{children}</div>
    </div>
  );
}

export function Caret(): React.ReactElement {
  return <span className="caret" />;
}
