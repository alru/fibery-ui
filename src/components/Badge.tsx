// Badges and marks: theme-colored labels and pills (Badge), Fibery options on theme hues (OptionBadge), labels painted
// with an option's own color (EnumBadge), 8px dots (Dot), the progress ring of a workflow state (StageGlyph) and emoji
// that are left out where the browser can't draw them (Emoji).
import {forwardRef, type HTMLAttributes, type ReactNode} from "react";
import {X} from "lucide-react";
import {cx} from "../cx";
import {emojiRenders, fiberyEmoji, fiberyHue, type Hue} from "../colors";
import {sectorPath} from "../glyphs";
import {useKitTexts} from "./KitLang";

export type {Hue};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  /** Highlight hue from the workspace palette; omit for a neutral badge. */
  hue?: Hue;
  /** `"soft"` — filled (default); `"outline"` — transparent with a thin ring. */
  variant?: "soft" | "outline";
  /** Small uppercase letter-spaced label, like Fibery's database type badge. */
  caps?: boolean;
  /**
   * `"rect"` (default) — Fibery's own 4px corners. `"pill"` — round ends, 8px sides, medium weight: a record's state
   * in lists and tables; with `variant="outline"` and no hue, a neutral chip for an attribute (a channel, a source).
   */
  shape?: "rect" | "pill";
  /**
   * The text wraps inside the badge instead of staying on one line, once the badge is wider than its container
   * (a narrow property column). Nothing is ever cut with "…".
   */
  wrap?: boolean;
  /** Adds a × button, e.g. for an active filter chip. */
  onRemove?: () => void;
  /** Accessible label of the × button; «Убрать» / "Remove" by default. */
  removeLabel?: string;
};

/** Small label colored with the workspace highlight palette (follows light/dark theme). */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({hue, variant = "soft", caps, shape = "rect", wrap, onRemove, removeLabel, className, children, ...props}, ref) => {
    const t = useKitTexts();
    return (
      <span
        ref={ref}
        data-hue={hue}
        data-variant={variant}
        data-caps={caps ? "" : undefined}
        data-shape={shape === "pill" ? "pill" : undefined}
        data-wrap={wrap ? "" : undefined}
        className={cx("fui-badge", className)}
        {...props}
      >
        {children}
        {onRemove && (
          <button type="button" className="fui-badge__remove" aria-label={removeLabel ?? t.remove} onClick={onRemove}>
            <X />
          </button>
        )}
      </span>
    );
  },
);
Badge.displayName = "Badge";

export type EnumBadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "color" | "children"> & {
  /** Option name, e.g. `enum/name` of a single-select or workflow state. */
  name: string;
  /** Option color as stored in Fibery (`enum/color`); `null` falls back to the muted theme color. */
  color?: string | null;
  /** `"dot"` — colored dot + name; `"circle"` — name inside a colored ring (for one-letter values like levels). */
  variant?: "dot" | "circle";
  /** A long name wraps onto more lines (the dot stays at the first) instead of ending with "…". */
  wrap?: boolean;
};

/**
 * Renders a Fibery select/workflow option in its own color. The color is data, not theme,
 * so it is applied as-is and never used as a text background.
 */
export const EnumBadge = forwardRef<HTMLSpanElement, EnumBadgeProps>(
  ({name, color, variant = "dot", wrap, className, style, ...props}, ref) => (
    <span
      ref={ref}
      data-variant={variant}
      data-wrap={wrap ? "" : undefined}
      className={cx("fui-enum-badge", className)}
      style={color ? {...style, ["--fui-enum-color" as string]: color} : style}
      {...props}
    >
      {variant === "dot" && <span className="fui-enum-badge__dot" aria-hidden />}
      {variant === "circle" ? <span className="fui-enum-badge__letter">{name}</span> : <span className="fui-enum-badge__name">{name}</span>}
    </span>
  ),
);
EnumBadge.displayName = "EnumBadge";

export type DotProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** Theme hue; omit for grey (filled) or the text color (ring). */
  hue?: Hue;
  /** `"filled"` (default) — a solid dot, e.g. an attribute's color; `"ring"` — hollow, e.g. something planned. */
  variant?: "filled" | "ring";
  /** 8px (default) or 10px. */
  size?: "sm" | "md";
};

/**
 * Small round mark in a theme hue: an attribute or a secondary state next to its text ("● Outbound"). Decorative
 * by default (`aria-hidden`); give it `aria-label` when nothing next to it says what it means.
 */
export const Dot = forwardRef<HTMLSpanElement, DotProps>(({hue, variant = "filled", size = "sm", className, ...props}, ref) => (
  <span
    ref={ref}
    aria-hidden={props["aria-label"] ? undefined : true}
    role={props["aria-label"] ? "img" : undefined}
    data-hue={hue}
    data-variant={variant}
    data-size={size}
    className={cx("fui-dot", className)}
    {...props}
  />
));
Dot.displayName = "Dot";

export type OptionBadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "color" | "children"> & {
  /** Option name (`enum/name`). */
  name: string;
  /** Option color as stored in Fibery (`enum/color`), mapped to a theme hue by `fiberyHue`. */
  color?: string | null;
  /** Option emoji shortcode (`enum/icon`, ":rocket:"), shown before the name; unknown codes are left out. */
  icon?: string | null;
  /** Hue while the option has no color in Fibery: an app's own code. A color set in Fibery always wins. */
  fallbackHue?: Hue;
  /**
   * `"soft"` (default) — filled badge, the state of the record itself; `"outline"` — ring and text in the hue, a
   * record that dropped out (lost, cancelled); `"dot"` — dot + plain text, an attribute or a secondary record's state.
   */
  variant?: "soft" | "outline" | "dot";
  /** Mark before the name in place of the emoji, e.g. a StageGlyph. */
  glyph?: ReactNode;
  /** Badge shape for `"soft"` and `"outline"`, see Badge: `"pill"` for states in lists and tables. */
  shape?: "rect" | "pill";
  /** A long name wraps instead of ending with "…". Default: on for pills, off otherwise. */
  wrap?: boolean;
};

/**
 * A Fibery select or workflow option in the owner's colors and emoji, drawn with the theme's highlight hues (so light
 * and dark themes work): `fiberyHue(color)` picks the hue, `fiberyEmoji(icon)` the emoji (left out where the browser
 * can't draw it). No color → neutral badge (or a grey dot).
 */
export const OptionBadge = forwardRef<HTMLSpanElement, OptionBadgeProps>(
  ({name, color, icon, fallbackHue, variant = "soft", glyph, shape = "rect", wrap, className, ...props}, ref) => {
    const hue = fiberyHue(color) ?? fallbackHue;
    const mark = glyph ?? <Emoji char={fiberyEmoji(icon)} />;
    if (variant === "dot") {
      return (
        <span ref={ref} data-wrap={wrap ? "" : undefined} className={cx("fui-option-dot", className)} {...props}>
          <Dot hue={hue ?? "grey"} />
          {mark}
          <span className="fui-option-dot__name">{name}</span>
        </span>
      );
    }
    return (
      <Badge
        ref={ref}
        hue={hue}
        variant={variant}
        shape={shape}
        wrap={wrap ?? shape === "pill"}
        className={cx("fui-option-badge", className)}
        {...props}
      >
        {mark}
        <span className="fui-option-badge__name">{name}</span>
      </Badge>
    );
  },
);
OptionBadge.displayName = "OptionBadge";

export type StageGlyphProps = {
  /**
   * Kind of state, as Fibery's workflow types: `notStarted` — empty ring; `started` — ring filled `step / steps`;
   * `finished` — check; `paused` — pause bars; `failed` — cross.
   */
  type: "notStarted" | "started" | "finished" | "paused" | "failed";
  /** For `started`: how far along, e.g. 2 of 6 open stages. */
  step?: number;
  steps?: number;
  /** Accessible name; without it the glyph is decorative (the badge text names the state). */
  "aria-label"?: string;
  className?: string;
};

/**
 * 12px progress ring of a workflow state, like Fibery's state icons: how far a record has come, readable without
 * the state's name. Drawn in `currentColor`; inside a neutral Badge it takes the muted text color.
 */
export function StageGlyph({type, step = 0, steps = 1, className, ...props}: StageGlyphProps) {
  const label = props["aria-label"];
  const sector = type === "started" ? sectorPath(step, steps) : "";
  return (
    <svg
      viewBox="0 0 12 12"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-type={type}
      className={cx("fui-stage-glyph", className)}
    >
      <circle cx="6" cy="6" r="5" strokeWidth="1.25" />
      {sector && <path d={sector} fill="currentColor" stroke="none" />}
      {type === "finished" && <path d="M3.8 6.1 5.3 7.6 8.2 4.6" strokeWidth="1.4" />}
      {type === "paused" && <path d="M4.9 4.2v3.6M7.1 4.2v3.6" strokeWidth="1.4" />}
      {type === "failed" && <path d="m4.4 4.4 3.2 3.2m0-3.2-3.2 3.2" strokeWidth="1.4" />}
    </svg>
  );
}

export type EmojiProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** The emoji, e.g. `fiberyEmoji(option.icon)`; empty renders nothing. */
  char: string | null | undefined;
  /** Accessible name; without it the emoji is decorative (the text next to it says what it means). */
  label?: string;
};

/**
 * An emoji at 12px in a 14px box, e.g. a channel's before its name. Renders nothing where the browser can't draw it
 * (`emojiRenders`): an empty box is worse than no mark, and the name next to it carries the meaning.
 */
export function Emoji({char, label, className, ...props}: EmojiProps) {
  if (!char || !emojiRenders(char)) return null;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cx("fui-emoji-mark", className)}
      {...props}
    >
      {char}
    </span>
  );
}
