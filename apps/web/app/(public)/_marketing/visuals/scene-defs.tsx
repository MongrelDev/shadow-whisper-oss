import { SceneSvgDefs } from "../../../_home/components/scenes/shared/svg-defs";

/** Render once per page so scene pills and cursors resolve their SVG symbols. */
export function SceneDefs(): React.ReactElement {
  return <SceneSvgDefs />;
}
