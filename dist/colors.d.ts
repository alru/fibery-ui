/** One of the 12 highlight hues the Fibery theme passes into apps (`--highlight-<hue>-bg` / `-fg` / `-fg-on-bg`). */
export type Hue = "grey" | "red" | "pink" | "purple" | "violet" | "blue" | "turquoise" | "aqua" | "aquamarine" | "green" | "yellow" | "orange";
/**
 * Theme hue for a Fibery option color (`enum/color`). Fibery's 17 standard colors map by a fixed table
 * (case-insensitive); any other hex takes the hue of the nearest standard color (RGB distance) — a choice of token,
 * never a new color. `null`, `undefined` or a value that is not a hex → `null`: render the option neutral.
 */
export declare function fiberyHue(hex: string | null | undefined): Hue | null;
/**
 * Unicode emoji for a Fibery icon shortcode (`enum/icon`, ":rocket:" or "rocket"). Unknown codes → `null`: better no
 * emoji than its code as text.
 */
export declare function fiberyEmoji(shortcode: string | null | undefined): string | null;
/** Stable hue for a person or record id, e.g. an avatar's fill: the same id always gets the same one of 5 hues. */
export declare function hueFor(id: string): Hue;
