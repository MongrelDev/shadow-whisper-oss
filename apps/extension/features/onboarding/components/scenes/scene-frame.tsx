import { cn } from "~/lib/utils";

import "./scenes.css";

export function SceneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <article className={cn("sw-scene", className)}>
      <div className="frame">
        <div className="app">{children}</div>
      </div>
    </article>
  );
}

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
  heading,
  children,
}: {
  heading?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="notes-body">
      {heading ? <div className="heading">{heading}</div> : null}
      <div className="body">{children}</div>
    </div>
  );
}

export function Caret(): React.ReactElement {
  return <span className="caret" />;
}
