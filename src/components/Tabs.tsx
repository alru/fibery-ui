// Tabs on Radix in two looks: Fibery's segmented switch ("Workspace / Personal") and underlined page tabs,
// plus SegmentedControl — the same segmented look for picking a value (filters) rather than switching panels.
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
  /** Ordered scale: every option up to and including the selected one is filled, like a level meter. */
  scale?: boolean;
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
            data-filled={scale && index <= selectedIndex ? "" : undefined}
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
