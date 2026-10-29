import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Overlays on Radix: dropdown menu, popover, tooltip and dialog, styled like Fibery's popups.
import { forwardRef, } from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cx } from "../cx";
import { IconButton } from "./Button";
// ─── Dropdown menu ───────────────────────────────────────────────────────────
export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;
/** Menu popup, aligned to the trigger's start edge by default. */
export const DropdownMenuContent = forwardRef(({ className, sideOffset = 4, align = "start", ...props }, ref) => (_jsx(DropdownPrimitive.Portal, { children: _jsx(DropdownPrimitive.Content, { ref: ref, sideOffset: sideOffset, align: align, className: cx("fui-popup fui-menu", className), ...props }) })));
DropdownMenuContent.displayName = "DropdownMenuContent";
/** 32px menu row with optional icon and shortcut hint. */
export const DropdownMenuItem = forwardRef(({ icon, shortcut, destructive, className, children, ...props }, ref) => (_jsxs(DropdownPrimitive.Item, { ref: ref, "data-variant": destructive ? "destructive" : undefined, className: cx("fui-menu-item", className), ...props, children: [icon, _jsx("span", { className: "fui-menu-item__text", children: children }), shortcut && _jsx("span", { className: "fui-menu-item__shortcut", children: shortcut })] })));
DropdownMenuItem.displayName = "DropdownMenuItem";
export const DropdownMenuLabel = forwardRef(({ className, ...props }, ref) => _jsx(DropdownPrimitive.Label, { ref: ref, className: cx("fui-menu-label", className), ...props }));
DropdownMenuLabel.displayName = "DropdownMenuLabel";
export const DropdownMenuSeparator = forwardRef(({ className, ...props }, ref) => (_jsx(DropdownPrimitive.Separator, { ref: ref, className: cx("fui-menu-separator", className), ...props })));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";
// ─── Popover ─────────────────────────────────────────────────────────────────
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;
/** Floating panel, 280px wide by default (override with `className`). */
export const PopoverContent = forwardRef(({ className, sideOffset = 4, align = "center", ...props }, ref) => (_jsx(PopoverPrimitive.Portal, { children: _jsx(PopoverPrimitive.Content, { ref: ref, sideOffset: sideOffset, align: align, className: cx("fui-popup fui-popover", className), ...props }) })));
PopoverContent.displayName = "PopoverContent";
/** Hover/focus hint. Self-contained: carries its own provider, no app-level setup needed. */
export function Tooltip({ content, children, side = "top", delayDuration = 300 }) {
    return (_jsx(TooltipPrimitive.Provider, { delayDuration: delayDuration, children: _jsxs(TooltipPrimitive.Root, { children: [_jsx(TooltipPrimitive.Trigger, { asChild: true, children: children }), _jsx(TooltipPrimitive.Portal, { children: _jsx(TooltipPrimitive.Content, { side: side, sideOffset: 4, className: "fui-tooltip", children: content }) })] }) }));
}
// ─── Dialog ──────────────────────────────────────────────────────────────────
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
/** Modal window with overlay, title and optional description. Put actions in a DialogFooter. */
export const DialogContent = forwardRef(({ title, description, size = "md", closeButton = true, className, children, ...props }, ref) => (_jsxs(DialogPrimitive.Portal, { children: [_jsx(DialogPrimitive.Overlay, { className: "fui-dialog-overlay" }), _jsxs(DialogPrimitive.Content, { ref: ref, "data-size": size, ...(!description && { "aria-describedby": undefined }), className: cx("fui-dialog", className), ...props, children: [_jsxs("div", { className: "fui-dialog__header", children: [_jsx(DialogPrimitive.Title, { className: "fui-dialog__title", children: title }), description && _jsx(DialogPrimitive.Description, { className: "fui-dialog__description", children: description })] }), children, closeButton && (_jsx(DialogPrimitive.Close, { asChild: true, children: _jsx(IconButton, { icon: _jsx(X, {}), "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", size: "sm", className: "fui-dialog__close" }) }))] })] })));
DialogContent.displayName = "DialogContent";
/** Right-aligned action row at the bottom of a dialog. */
export function DialogFooter({ className, ...props }) {
    return _jsx("div", { className: cx("fui-dialog__footer", className), ...props });
}
