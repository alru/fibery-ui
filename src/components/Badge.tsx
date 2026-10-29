// Badges: theme-colored labels (Badge) and labels painted with a user-defined Fibery enum color (EnumBadge).
import {forwardRef, type HTMLAttributes} from "react";
import {X} from "lucide-react";
import {cx} from "../cx";

export type Hue =
  | "grey" | "red" | "pink" | "purple" | "violet" | "blue"
  | "turquoise" | "aqua" | "aquamarine" | "green" | "yellow" | "orange";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  /** Highlight hue from the workspace palette; omit for a neutral badge. */
  hue?: Hue;
  /** `"soft"` — filled (default); `"outline"` — transparent with a thin ring. */
  variant?: "soft" | "outline";
  /** Small uppercase letter-spaced label, like Fibery's database type badge. */
  caps?: boolean;
  /** Adds a × button, e.g. for an active filter chip. */
  onRemove?: () => void;
  /** Accessible label of the × button. */
  removeLabel?: string;
};

/** Small label colored with the workspace highlight palette (follows light/dark theme). */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({hue, variant = "soft", caps, onRemove, removeLabel = "Убрать", className, children, ...props}, ref) => (
    <span
      ref={ref}
      data-hue={hue}
      data-variant={variant}
      data-caps={caps ? "" : undefined}
      className={cx("fui-badge", className)}
      {...props}
    >
      {children}
      {onRemove && (
        <button type="button" className="fui-badge__remove" aria-label={removeLabel} onClick={onRemove}>
          <X />
        </button>
      )}
    </span>
  ),
);
Badge.displayName = "Badge";

export type EnumBadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "color" | "children"> & {
  /** Option name, e.g. `enum/name` of a single-select or workflow state. */
  name: string;
  /** Option color as stored in Fibery (`enum/color`); `null` falls back to the muted theme color. */
  color?: string | null;
  /** `"dot"` — colored dot + name; `"circle"` — name inside a colored ring (for one-letter values like levels). */
  variant?: "dot" | "circle";
};

/**
 * Renders a Fibery select/workflow option in its own color. The color is data, not theme,
 * so it is applied as-is and never used as a text background.
 */
export const EnumBadge = forwardRef<HTMLSpanElement, EnumBadgeProps>(
  ({name, color, variant = "dot", className, style, ...props}, ref) => (
    <span
      ref={ref}
      data-variant={variant}
      className={cx("fui-enum-badge", className)}
      style={color ? {...style, ["--fui-enum-color" as string]: color} : style}
      {...props}
    >
      {variant === "dot" && <span className="fui-enum-badge__dot" aria-hidden />}
      {variant === "circle" ? <span className="fui-enum-badge__letter">{name}</span> : name}
    </span>
  ),
);
EnumBadge.displayName = "EnumBadge";
