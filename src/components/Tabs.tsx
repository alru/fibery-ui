// Tabs on Radix in two looks: Fibery's segmented switch ("Workspace / Personal") and underlined page tabs,
// plus SegmentedControl — the same segmented look for picking a value (filters) rather than switching panels — and
// SegmentedToggles, the same look with options toggled on and off independently.
import {
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import {cx} from "../cx";

export const Tabs = TabsPrimitive.Root;

type TabsVariant = "segmented" | "line";
const VariantContext = createContext<TabsVariant>("segmented");

export type TabsListProps = ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {variant?: TabsVariant};

/** Row of tab triggers; `variant` styles the whole row. */
export const TabsList = forwardRef<ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({variant = "segmented", className, ...props}, ref) => (
    <VariantContext.Provider value={variant}>
      <TabsPrimitive.List ref={ref} data-variant={variant} className={cx("fui-tabs-list", className)} {...props} />
    </VariantContext.Provider>
  ),
);
TabsList.displayName = "TabsList";

export const TabsTrigger = forwardRef<ElementRef<typeof TabsPrimitive.Trigger>, ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(
  ({className, ...props}, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      data-variant={useContext(VariantContext)}
      className={cx("fui-tabs-trigger", className)}
      {...props}
    />
  ),
);
TabsTrigger.displayName = "TabsTrigger";

export type TabsContentProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
  /** Keep the panel mounted while hidden, so its state (filters, selection, scroll) survives tab switches. */
  keepMounted?: boolean;
};

export const TabsContent = forwardRef<ElementRef<typeof TabsPrimitive.Content>, TabsContentProps>(
  ({keepMounted, className, ...props}, ref) => (
    <TabsPrimitive.Content
      ref={ref}
      forceMount={keepMounted || undefined}
      className={cx("fui-tabs-content", className)}
      {...props}
    />
  ),
);
TabsContent.displayName = "TabsContent";

export type SegmentedOption<T extends string> = {value: T; label: ReactNode};

export type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** Describes the choice for screen readers, e.g. "Minimum level". */
  "aria-label"?: string;
  /**
   * Ordered scale. `true`: every option up to and including the selected one is filled, like a level meter.
   * `"from"`: the selected option and every one after it are filled, like a threshold filter ("D and up" with options
   * D, C, B, A fills all four; "A" fills one).
   */
  scale?: boolean | "from";
  /** Muted caption inside an input-styled frame, like MultiSelect's: lines the control up with filter pickers. */
  label?: ReactNode;
  className?: string;
};

/**
 * Single-choice segmented switch (radio group), 28px high to line up with small inputs.
 * Arrow keys move the selection, like native radio buttons.
 */
export function SegmentedControl<T extends string>({options, value, onValueChange, scale, label, className, ...props}: SegmentedControlProps<T>) {
  const selectedIndex = options.findIndex((o) => o.value === value);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = options[(selectedIndex + step + options.length) % options.length];
    onValueChange(next.value);
    e.currentTarget.querySelector<HTMLElement>(`[data-value="${CSS.escape(next.value)}"]`)?.focus();
  };
  const group = (
    <div
      role="radiogroup"
      aria-label={props["aria-label"]}
      data-variant="segmented"
      data-scale={scale ? "" : undefined}
      className={cx("fui-tabs-list", !label && className)}
      onKeyDown={onKeyDown}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            data-value={option.value}
            data-variant="segmented"
            data-state={active ? "active" : "inactive"}
            data-filled={
              (scale === "from" ? index >= selectedIndex : scale && index <= selectedIndex) ? "" : undefined
            }
            className="fui-tabs-trigger"
            onClick={() => onValueChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
  return label ? (
    <div className={cx("fui-segmented-field", className)}>
      <span className="fui-segmented-field__label">{label}</span>
      {group}
    </div>
  ) : (
    group
  );
}

export type SegmentedTogglesProps<T extends string> = {
  options: SegmentedOption<T>[];
  /** Options that are on, in any order. */
  value: T[];
  /** Gets the options that are on, in the order of `options`. */
  onValueChange: (value: T[]) => void;
  /** Describes the group for screen readers, e.g. "Levels". */
  "aria-label"?: string;
  /** Muted caption inside an input-styled frame, as on SegmentedControl. */
  label?: ReactNode;
  className?: string;
};

/**
 * SegmentedControl's look with independent toggles: each option turns on and off by itself and is filled while on,
 * e.g. a filter that shows any combination of levels. Every option may be off; what that means is up to the caller.
 */
export function SegmentedToggles<T extends string>({options, value, onValueChange, label, className, ...props}: SegmentedTogglesProps<T>) {
  const toggle = (option: T) =>
    onValueChange(options.map((o) => o.value).filter((v) => (v === option ? !value.includes(v) : value.includes(v))));
  const group = (
    <div
      role="group"
      aria-label={props["aria-label"]}
      data-variant="segmented"
      data-scale=""
      className={cx("fui-tabs-list", !label && className)}
    >
      {options.map((option) => {
        const on = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            data-variant="segmented"
            data-filled={on ? "" : undefined}
            className="fui-tabs-trigger"
            onClick={() => toggle(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
  return label ? (
    <div className={cx("fui-segmented-field", className)}>
      <span className="fui-segmented-field__label">{label}</span>
      {group}
    </div>
  ) : (
    group
  );
}
