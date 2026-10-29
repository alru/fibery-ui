import { type ComponentPropsWithoutRef, type HTMLAttributes, type ReactNode } from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as DialogPrimitive from "@radix-ui/react-dialog";
export declare const DropdownMenu: import("react").FC<DropdownPrimitive.DropdownMenuProps>;
export declare const DropdownMenuTrigger: import("react").ForwardRefExoticComponent<DropdownPrimitive.DropdownMenuTriggerProps & import("react").RefAttributes<HTMLButtonElement>>;
export declare const DropdownMenuGroup: import("react").ForwardRefExoticComponent<DropdownPrimitive.DropdownMenuGroupProps & import("react").RefAttributes<HTMLDivElement>>;
/** Menu popup, aligned to the trigger's start edge by default. */
export declare const DropdownMenuContent: import("react").ForwardRefExoticComponent<Omit<DropdownPrimitive.DropdownMenuContentProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & import("react").RefAttributes<HTMLDivElement>>;
export type DropdownMenuItemProps = ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & {
    icon?: ReactNode;
    /** Keyboard hint at the right edge, e.g. `"⌘D"`. Display only. */
    shortcut?: string;
    destructive?: boolean;
};
/** 32px menu row with optional icon and shortcut hint. */
export declare const DropdownMenuItem: import("react").ForwardRefExoticComponent<Omit<DropdownPrimitive.DropdownMenuItemProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & {
    icon?: ReactNode;
    /** Keyboard hint at the right edge, e.g. `"⌘D"`. Display only. */
    shortcut?: string;
    destructive?: boolean;
} & import("react").RefAttributes<HTMLDivElement>>;
export declare const DropdownMenuLabel: import("react").ForwardRefExoticComponent<Omit<DropdownPrimitive.DropdownMenuLabelProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & import("react").RefAttributes<HTMLDivElement>>;
export declare const DropdownMenuSeparator: import("react").ForwardRefExoticComponent<Omit<DropdownPrimitive.DropdownMenuSeparatorProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & import("react").RefAttributes<HTMLDivElement>>;
export declare const Popover: import("react").FC<PopoverPrimitive.PopoverProps>;
export declare const PopoverTrigger: import("react").ForwardRefExoticComponent<PopoverPrimitive.PopoverTriggerProps & import("react").RefAttributes<HTMLButtonElement>>;
export declare const PopoverAnchor: import("react").ForwardRefExoticComponent<PopoverPrimitive.PopoverAnchorProps & import("react").RefAttributes<HTMLDivElement>>;
export declare const PopoverClose: import("react").ForwardRefExoticComponent<PopoverPrimitive.PopoverCloseProps & import("react").RefAttributes<HTMLButtonElement>>;
/** Floating panel, 280px wide by default (override with `className`). */
export declare const PopoverContent: import("react").ForwardRefExoticComponent<Omit<PopoverPrimitive.PopoverContentProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & import("react").RefAttributes<HTMLDivElement>>;
export type TooltipProps = {
    content: ReactNode;
    /** Trigger element; must accept a ref (any kit control or DOM element does). */
    children: ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    delayDuration?: number;
};
/** Hover/focus hint. Self-contained: carries its own provider, no app-level setup needed. */
export declare function Tooltip({ content, children, side, delayDuration }: TooltipProps): import("react").JSX.Element;
export declare const Dialog: import("react").FC<DialogPrimitive.DialogProps>;
export declare const DialogTrigger: import("react").ForwardRefExoticComponent<DialogPrimitive.DialogTriggerProps & import("react").RefAttributes<HTMLButtonElement>>;
export declare const DialogClose: import("react").ForwardRefExoticComponent<DialogPrimitive.DialogCloseProps & import("react").RefAttributes<HTMLButtonElement>>;
export type DialogContentProps = Omit<ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, "title"> & {
    /** Required by Radix for screen readers. */
    title: ReactNode;
    description?: ReactNode;
    /** 400 / 520 / 720px. */
    size?: "sm" | "md" | "lg";
    /** Close (×) button in the corner; on by default. */
    closeButton?: boolean;
};
/** Modal window with overlay, title and optional description. Put actions in a DialogFooter. */
export declare const DialogContent: import("react").ForwardRefExoticComponent<Omit<Omit<DialogPrimitive.DialogContentProps & import("react").RefAttributes<HTMLDivElement>, "ref">, "title"> & {
    /** Required by Radix for screen readers. */
    title: ReactNode;
    description?: ReactNode;
    /** 400 / 520 / 720px. */
    size?: "sm" | "md" | "lg";
    /** Close (×) button in the corner; on by default. */
    closeButton?: boolean;
} & import("react").RefAttributes<HTMLDivElement>>;
/** Right-aligned action row at the bottom of a dialog. */
export declare function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
