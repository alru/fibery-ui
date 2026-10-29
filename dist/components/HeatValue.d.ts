import type { Hue } from "./Badge";
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
export declare function HeatValue({ value, min, max, hue, className }: HeatValueProps): import("react").JSX.Element;
