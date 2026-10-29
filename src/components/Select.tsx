// Select built on Radix: input-styled trigger and a Fibery-style popup menu (radius 8px, 32px rows).
import {forwardRef, type ComponentPropsWithoutRef, type ElementRef} from "react";
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
