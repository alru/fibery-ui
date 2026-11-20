import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Overlays on Radix: dropdown menu, popover, tooltip and dialog, styled like Fibery's popups, plus ConfirmDialog —
// the ask-before-acting dialog every app needs.
import { forwardRef, } from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cx } from "../cx";
import { Button, IconButton } from "./Button";
import { useKitTexts } from "./KitLang";
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
export const DialogContent = forwardRef(({ title, description, size = "md", closeButton = true, className, children, ...props }, ref) => {
    const t = useKitTexts();
    return (_jsxs(DialogPrimitive.Portal, { children: [_jsx(DialogPrimitive.Overlay, { className: "fui-dialog-overlay" }), _jsxs(DialogPrimitive.Content, { ref: ref, "data-size": size, ...(!description && { "aria-describedby": undefined }), className: cx("fui-dialog", className), ...props, children: [_jsxs("div", { className: "fui-dialog__header", children: [_jsx(DialogPrimitive.Title, { className: "fui-dialog__title", children: title }), description && _jsx(DialogPrimitive.Description, { className: "fui-dialog__description", children: description })] }), children, closeButton && (_jsx(DialogPrimitive.Close, { asChild: true, children: _jsx(IconButton, { icon: _jsx(X, {}), "aria-label": t.close, size: "sm", className: "fui-dialog__close" }) }))] })] }));
});
DialogContent.displayName = "DialogContent";
/** Right-aligned action row at the bottom of a dialog. */
export function DialogFooter({ className, ...props }) {
    return _jsx("div", { className: cx("fui-dialog__footer", className), ...props });
}
/**
 * Small dialog that asks before an action: title, optional description, Cancel and the confirm button. Cancel comes
 * first, so focus starts on it (unless `children` has a control) and Enter right after opening doesn't confirm.
 */
export function ConfirmDialog({ open, onOpenChange, title, description, children, confirmLabel, cancelLabel, destructive, busy, onConfirm, }) {
    const t = useKitTexts();
    // While the action runs, closing would hide its outcome; Radix asks to close on Escape and outside clicks.
    const change = (next) => !busy && onOpenChange(next);
    return (_jsx(Dialog, { open: open, onOpenChange: change, children: _jsxs(DialogContent, { title: title, description: description, size: "sm", closeButton: !busy, children: [children, _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "ghost", disabled: busy, onClick: () => change(false), children: cancelLabel ?? t.cancel }), _jsx(Button, { variant: destructive ? "destructive" : "primary", loading: busy, onClick: onConfirm, children: confirmLabel })] })] }) }));
}
