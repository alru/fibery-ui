// Select built on Radix: input-styled trigger and a Fibery-style popup menu (radius 8px, 32px rows).
// MultiSelect is its several-values sibling for filters, on a dropdown menu with checkable rows.
import {forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode} from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as SelectPrimitive from "@radix-ui/react-select";
import {Check, ChevronDown} from "lucide-react";
import {cx} from "../cx";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export type SelectTriggerProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "md";
  invalid?: boolean;
};

/** Input-styled button that opens the select; put a `<SelectValue placeholder="…" />` inside. */
export const SelectTrigger = forwardRef<ElementRef<typeof SelectPrimitive.Trigger>, SelectTriggerProps>(
  ({size = "md", invalid, className, children, ...props}, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      data-size={size}
      aria-invalid={invalid || undefined}
      className={cx("fui-input fui-select-trigger", className)}
      {...props}
    >
      <span className="fui-select-trigger__value">{children}</span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  ),
);
SelectTrigger.displayName = "SelectTrigger";

/** Popup list, at least as wide as the trigger. */
export const SelectContent = forwardRef<ElementRef<typeof SelectPrimitive.Content>, ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(
  ({className, children, position = "popper", sideOffset = 4, ...props}, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        sideOffset={sideOffset}
        className={cx("fui-popup fui-select-content", className)}
        {...props}
      >
        <SelectPrimitive.Viewport className="fui-select-viewport">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  ),
);
SelectContent.displayName = "SelectContent";

/** Option row with a check mark when selected. Children may start with an icon or EnumBadge. */
export const SelectItem = forwardRef<ElementRef<typeof SelectPrimitive.Item>, ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(
  ({className, children, ...props}, ref) => (
    <SelectPrimitive.Item ref={ref} className={cx("fui-menu-item", className)} {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="fui-menu-item__check">
        <Check />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  ),
);
SelectItem.displayName = "SelectItem";

/** Muted group caption inside SelectContent. */
export const SelectLabel = forwardRef<ElementRef<typeof SelectPrimitive.Label>, ComponentPropsWithoutRef<typeof SelectPrimitive.Label>>(
  ({className, ...props}, ref) => <SelectPrimitive.Label ref={ref} className={cx("fui-menu-label", className)} {...props} />,
);
SelectLabel.displayName = "SelectLabel";

export const SelectSeparator = forwardRef<ElementRef<typeof SelectPrimitive.Separator>, ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>>(
  ({className, ...props}, ref) => <SelectPrimitive.Separator ref={ref} className={cx("fui-menu-separator", className)} {...props} />,
);
SelectSeparator.displayName = "SelectSeparator";

export type MultiSelectOption = {
  value: string;
  /** Row content and trigger summary, e.g. an EnumBadge. */
  label: ReactNode;
};

export type MultiSelectProps = {
  /** Muted caption before the selection in the trigger, e.g. "Status". */
  label: ReactNode;
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  /** Trigger text while nothing is selected, i.e. the filter is off. */
  placeholder?: ReactNode;
  /** Text of the menu row that clears the selection; shown only when something is selected. */
  clearLabel?: string;
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
};

/**
 * Filter picker for several values: an input-styled trigger "Label: first value +N" and a menu of checkable rows
 * that stays open while toggling. An empty selection means "no filter".
 */
export function MultiSelect({
  label,
  options,
  value,
  onValueChange,
  placeholder = "Все",
  clearLabel = "Сбросить",
  size = "md",
  className,
  "aria-label": ariaLabel,
}: MultiSelectProps) {
  const selected = options.filter((o) => value.includes(o.value));
  const toggle = (option: string, checked: boolean) =>
    onValueChange(checked ? [...value, option] : value.filter((v) => v !== option));
  return (
    <DropdownPrimitive.Root>
      <DropdownPrimitive.Trigger
        data-size={size}
        data-placeholder={selected.length === 0 ? "" : undefined}
        aria-label={ariaLabel}
        className={cx("fui-input fui-select-trigger fui-multiselect", className)}
      >
        <span className="fui-select-trigger__value">
          <span className="fui-multiselect__label">{label}</span>
          {selected.length === 0 ? (
            placeholder
          ) : (
            <>
              {selected[0].label}
              {selected.length > 1 && <span className="fui-multiselect__more">+{selected.length - 1}</span>}
            </>
          )}
        </span>
        <ChevronDown />
      </DropdownPrimitive.Trigger>
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content sideOffset={4} align="start" className="fui-popup fui-menu">
          {options.map((o) => (
            <DropdownPrimitive.CheckboxItem
              key={o.value}
              className="fui-menu-item"
              checked={value.includes(o.value)}
              onCheckedChange={(checked) => toggle(o.value, checked === true)}
              // Keep the menu open: a filter is usually several clicks.
              onSelect={(e) => e.preventDefault()}
            >
              <span className="fui-menu-item__text">{o.label}</span>
              <DropdownPrimitive.ItemIndicator className="fui-menu-item__check">
                <Check />
              </DropdownPrimitive.ItemIndicator>
            </DropdownPrimitive.CheckboxItem>
          ))}
          {selected.length > 0 && (
            <>
              <DropdownPrimitive.Separator className="fui-menu-separator" />
              <DropdownPrimitive.Item className="fui-menu-item" onSelect={() => onValueChange([])}>
                <span className="fui-menu-item__text">{clearLabel}</span>
              </DropdownPrimitive.Item>
            </>
          )}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}
