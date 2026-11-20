// Overlays on Radix: dropdown menu, popover, tooltip and dialog, styled like Fibery's popups, plus ConfirmDialog —
// the ask-before-acting dialog every app needs.
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {X} from "lucide-react";
import {cx} from "../cx";
import {Button, IconButton} from "./Button";
import {useKitTexts} from "./KitLang";

// ─── Dropdown menu ───────────────────────────────────────────────────────────

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;

/** Menu popup, aligned to the trigger's start edge by default. */
export const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({className, sideOffset = 4, align = "start", ...props}, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      align={align}
      className={cx("fui-popup fui-menu", className)}
      {...props}
    />
  </DropdownPrimitive.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

export type DropdownMenuItemProps = ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & {
  icon?: ReactNode;
  /** Keyboard hint at the right edge, e.g. `"⌘D"`. Display only. */
  shortcut?: string;
  destructive?: boolean;
};

/** 32px menu row with optional icon and shortcut hint. */
export const DropdownMenuItem = forwardRef<ElementRef<typeof DropdownPrimitive.Item>, DropdownMenuItemProps>(
  ({icon, shortcut, destructive, className, children, ...props}, ref) => (
    <DropdownPrimitive.Item
      ref={ref}
      data-variant={destructive ? "destructive" : undefined}
      className={cx("fui-menu-item", className)}
      {...props}
    >
      {icon}
      <span className="fui-menu-item__text">{children}</span>
      {shortcut && <span className="fui-menu-item__shortcut">{shortcut}</span>}
    </DropdownPrimitive.Item>
  ),
);
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuLabel = forwardRef<
  ElementRef<typeof DropdownPrimitive.Label>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>
>(({className, ...props}, ref) => <DropdownPrimitive.Label ref={ref} className={cx("fui-menu-label", className)} {...props} />);
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof DropdownPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>
>(({className, ...props}, ref) => (
  <DropdownPrimitive.Separator ref={ref} className={cx("fui-menu-separator", className)} {...props} />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

// ─── Popover ─────────────────────────────────────────────────────────────────

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

/** Floating panel, 280px wide by default (override with `className`). */
export const PopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({className, sideOffset = 4, align = "center", ...props}, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      align={align}
      className={cx("fui-popup fui-popover", className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = "PopoverContent";

// ─── Tooltip ─────────────────────────────────────────────────────────────────

export type TooltipProps = {
  content: ReactNode;
  /** Trigger element; must accept a ref (any kit control or DOM element does). */
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
};

/** Hover/focus hint. Self-contained: carries its own provider, no app-level setup needed. */
export function Tooltip({content, children, side = "top", delayDuration = 300}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content side={side} sideOffset={4} className="fui-tooltip">
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

// ─── Dialog ──────────────────────────────────────────────────────────────────

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

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
export const DialogContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(
  ({title, description, size = "md", closeButton = true, className, children, ...props}, ref) => {
    const t = useKitTexts();
    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fui-dialog-overlay" />
        <DialogPrimitive.Content
          ref={ref}
          data-size={size}
          // Radix links the description itself; without one, an explicit undefined silences its a11y warning.
          {...(!description && {"aria-describedby": undefined})}
          className={cx("fui-dialog", className)}
          {...props}
        >
          <div className="fui-dialog__header">
            <DialogPrimitive.Title className="fui-dialog__title">{title}</DialogPrimitive.Title>
            {description && <DialogPrimitive.Description className="fui-dialog__description">{description}</DialogPrimitive.Description>}
          </div>
          {children}
          {closeButton && (
            <DialogPrimitive.Close asChild>
              <IconButton icon={<X />} aria-label={t.close} size="sm" className="fui-dialog__close" />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    );
  },
);
DialogContent.displayName = "DialogContent";

/** Right-aligned action row at the bottom of a dialog. */
export function DialogFooter({className, ...props}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("fui-dialog__footer", className)} {...props} />;
}

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The question, naming the action: "Delete Jane Doe?". */
  title: ReactNode;
  /** What happens, e.g. what else goes with it. */
  description?: ReactNode;
  /** Anything more between the description and the buttons, e.g. a list of affected records. */
  children?: ReactNode;
  /** The action's verb, e.g. "Delete"; never "OK". */
  confirmLabel: ReactNode;
  /** «Отмена» / "Cancel" by default. */
  cancelLabel?: ReactNode;
  /** Red confirm button for actions that destroy data. */
  destructive?: boolean;
  /** The action is running: spinner on the confirm button, and the dialog can't be closed. */
  busy?: boolean;
  /** Called on confirm; the dialog stays open, so the caller closes it (at once, or after `busy`). */
  onConfirm: () => void;
};

/**
 * Small dialog that asks before an action: title, optional description, Cancel and the confirm button. Cancel comes
 * first, so focus starts on it (unless `children` has a control) and Enter right after opening doesn't confirm.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  destructive,
  busy,
  onConfirm,
}: ConfirmDialogProps) {
  const t = useKitTexts();
  // While the action runs, closing would hide its outcome; Radix asks to close on Escape and outside clicks.
  const change = (next: boolean) => !busy && onOpenChange(next);
  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent title={title} description={description} size="sm" closeButton={!busy}>
        {children}
        <DialogFooter>
          <Button variant="ghost" disabled={busy} onClick={() => change(false)}>
            {cancelLabel ?? t.cancel}
          </Button>
          <Button variant={destructive ? "destructive" : "primary"} loading={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
