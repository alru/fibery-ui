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
/** Pixels of one character, drawn the same way every time; `null` where nothing can draw (no DOM, no canvas). */
export type GlyphProbe = (char: string) => ArrayLike<number> | null;
/**
 * Whether this browser draws the emoji (or any character) with a real glyph: it is drawn on a canvas and compared
 * with the "missing glyph" box of a code point no font has, and with nothing at all. On Windows some emoji (e.g. a
 * text-style ✉️ in certain font stacks) come out as an empty box; show the option's name alone then, never the box.
 * Cached per character for the session. Without a DOM (tests, server) it answers `true` and caches nothing.
 * `probe` replaces the canvas, for tests.
 */
export declare function emojiRenders(char: string, probe?: GlyphProbe): boolean;
