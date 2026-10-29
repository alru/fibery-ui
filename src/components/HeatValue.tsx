// Heatmap number: the value on a rounded background whose strength grows with the value within [min, max].
// For count tables like skill maps; zero and empty values render as a muted dash without background.
import type {CSSProperties} from "react";
import {cx} from "../cx";
import type {Hue} from "./Badge";

export type HeatValueProps = {
  value: number | null | undefined;
  /** Smallest and largest values of the whole table, so all cells share one scale. */
  min: number;
  max: number;
  /** Highlight hue of the background; blue by default. */
  hue?: Hue;
  className?: string;
};

/** Number with a background from almost transparent (at `min`) to the strongest tint (at `max`). */
export function HeatValue({value, min, max, hue = "blue", className}: HeatValueProps) {
  if (!value) return <span className={cx("fui-heat", className)} data-empty="">—</span>;
  // Equal min and max (a single distinct value) shows at full strength rather than invisible.
  const heat = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 1;
  return (
    <span className={cx("fui-heat", className)} data-hue={hue} style={{"--fui-heat": heat} as CSSProperties}>
      {value}
    </span>
  );
}
