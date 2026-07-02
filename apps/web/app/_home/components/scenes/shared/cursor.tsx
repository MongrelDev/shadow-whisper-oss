import { SwCursorSvg } from "./svg-defs";

export function Cursor({ left, top }: { left: string; top: string }): React.ReactElement {
  return (
    <div className="cursor" style={{ left, top }}>
      <SwCursorSvg />
    </div>
  );
}
