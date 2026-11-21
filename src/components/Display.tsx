// Content building blocks modeled on Fibery entity pages: avatar, card, list rows (Fibery relation rows or divided
// worklist rows with an actions column), property list.
import {
  createContext,
  forwardRef,
  useContext,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type LiHTMLAttributes,
  type ReactNode,
} from "react";
import {ChevronDown, Plus} from "lucide-react";
import {cx} from "../cx";
import type {Hue} from "../colors";
import {Button, IconButton, type IconButtonProps} from "./Button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Tooltip} from "./Overlay";
import {Spinner} from "./States";
import {useKitTexts} from "./KitLang";

export type AvatarProps = {
  /** Used for initials and as the image alt text. */
  name: string;
  /** Image URL, e.g. `makeFileUrl(secret)` of a Fibery avatar. */
  src?: string;
  size?: "sm" | "md" | "lg";
  /** Initials on a highlight hue, e.g. `hueFor(user.id)`, so people are told apart at a glance; neutral by default. */
  hue?: Hue;
  className?: string;
};

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

/** Round avatar, 20 / 24 / 32px; falls back to initials. */
export function Avatar({name, src, size = "md", hue, className}: AvatarProps) {
  return (
    <span data-size={size} data-hue={hue} className={cx("fui-avatar", className)} title={name}>
      {src ? <img src={src} alt={name} /> : initials(name)}
    </span>
  );
}

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Adds hover elevation and pointer cursor; pair with `onClick`. */
  interactive?: boolean;
};

/** Surface with Fibery's card ring and soft shadow, radius 8px. */
export const Card = forwardRef<HTMLDivElement, CardProps>(({interactive, className, ...props}, ref) => (
  <div ref={ref} data-interactive={interactive ? "" : undefined} className={cx("fui-card", className)} {...props} />
));
Card.displayName = "Card";

export type CardHeaderProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned controls, e.g. an IconButton with a menu. */
  actions?: ReactNode;
};

/** Card title row with optional description and actions. */
export function CardHeader({title, description, actions, className, ...props}: CardHeaderProps) {
  return (
    <div className={cx("fui-card__header", className)} {...props}>
      <div className="fui-card__heading">
        <h3 className="fui-card__title">{title}</h3>
        {description && <p className="fui-card__description">{description}</p>}
      </div>
      {actions && <div className="fui-card__actions">{actions}</div>}
    </div>
  );
}

/** Padded card body. */
export function CardContent({className, ...props}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("fui-card__content", className)} {...props} />;
}

export type ListProps = HTMLAttributes<HTMLUListElement> & {
  /**
   * `"default"` — Fibery relation rows: ringed boxes with a 4px gap. `"divided"` — a worklist: rows edge to edge
   * with a hairline between them, no rings, 13px text; for long lists that are scanned and worked through.
   */
  variant?: "default" | "divided";
};

/** Vertical stack of ListItem rows. */
export const List = forwardRef<HTMLUListElement, ListProps>(({variant = "default", className, ...props}, ref) => (
  <ul ref={ref} data-variant={variant} className={cx("fui-list", className)} {...props} />
));
List.displayName = "List";

export type ListItemProps = Omit<LiHTMLAttributes<HTMLLIElement>, "onClick"> & {
  /** Icon, avatar or badge before the text. */
  leading?: ReactNode;
  /** Muted content at the right edge: counts, dates, badges. */
  trailing?: ReactNode;
  /** Makes the row focusable and clickable (Enter / Space too), e.g. to `openEntity`. */
  onClick?: () => void;
  /** Lets the content wrap onto several lines and top-aligns leading/trailing, for rows with nested lists. */
  multiline?: boolean;
  /** Accent-tinted state for the row whose details are open, e.g. in a SidePanel. */
  selected?: boolean;
  /**
   * Row verbs at the right edge, usually RowActions and a "⋯" menu. The first is the main verb and always shows;
   * the others show on hover, focus inside the row, while selected and on touch screens, and keep their place
   * otherwise. Clicks and keys inside never reach the row's `onClick`.
   */
  actions?: ReactNode[];
  /** Slots (28px each) the actions column reserves, so rows with fewer verbs keep the column at one width. */
  actionSlots?: number;
  /** Shows every action all the time, e.g. in a short list where each row matters. */
  actionsVisible?: boolean;
  /** The row's action is being saved: a spinner in place of the first action, the others disabled. */
  busy?: boolean;
};

const stopEvent = (e: {stopPropagation: () => void}) => e.stopPropagation();

/**
 * Row in the style of Fibery relation lists: ringed, radius 6px, single-line text with ellipsis; inside
 * `<List variant="divided">`, a flat worklist row.
 */
export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  (
    {leading, trailing, onClick, multiline, selected, actions, actionSlots, actionsVisible, busy, className, children, ...props},
    ref,
  ) => {
    const onKeyDown = (e: KeyboardEvent<HTMLLIElement>) => {
      // Enter on a control inside the row belongs to that control.
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.();
      }
    };
    return (
      <li
        ref={ref}
        data-multiline={multiline ? "" : undefined}
        data-selected={selected ? "" : undefined}
        aria-busy={busy || undefined}
        className={cx("fui-list-item", className)}
        {...(onClick && {role: "button", tabIndex: 0, onClick, onKeyDown, "aria-pressed": selected, "data-interactive": ""})}
        {...props}
      >
        {leading}
        <span className="fui-list-item__main">{children}</span>
        {trailing && <span className="fui-list-item__trailing">{trailing}</span>}
        {actions && (
          <span
            className="fui-list-item__actions"
            data-visible={actionsVisible ? "" : undefined}
            style={{"--fui-action-slots": Math.max(actionSlots ?? 0, actions.length)} as CSSProperties}
            onClick={stopEvent}
            onKeyDown={stopEvent}
          >
            {/* A disabled fieldset disables every button inside, whatever the app put there. */}
            <fieldset className="fui-list-item__action-set" disabled={busy}>
              {actions.map((action, i) => (
                <span key={i} className="fui-list-item__action" data-main={i === 0 ? "" : undefined}>
                  {i === 0 && busy ? <Spinner size="sm" /> : action}
                </span>
              ))}
            </fieldset>
          </span>
        )}
      </li>
    );
  },
);
ListItem.displayName = "ListItem";

export type RowActionProps = Omit<IconButtonProps, "aria-label" | "size" | "variant"> & {
  /** The verb, e.g. "Done": the tooltip and the accessible name. */
  label: string;
};

/**
 * Icon-only verb for a ListItem's `actions`: a small ghost IconButton with a tooltip. Also works as a menu trigger
 * (`<DropdownMenuTrigger asChild><RowAction … /></DropdownMenuTrigger>`).
 */
export const RowAction = forwardRef<HTMLButtonElement, RowActionProps>(({label, ...props}, ref) => (
  <Tooltip content={label}>
    <IconButton ref={ref} aria-label={label} size="sm" {...props} />
  </Tooltip>
));
RowAction.displayName = "RowAction";

const HideEmptyContext = createContext(false);

export type PropertyListProps = HTMLAttributes<HTMLDListElement> & {
  /** Leaves out the properties without a value (see Property `empty`); pair with PropertyAdd to fill one in. */
  hideEmpty?: boolean;
};

/** Two-column label/value grid, like the field list on a Fibery entity page. */
export const PropertyList = forwardRef<HTMLDListElement, PropertyListProps>(({hideEmpty = false, className, ...props}, ref) => (
  <HideEmptyContext.Provider value={hideEmpty}>
    <dl ref={ref} className={cx("fui-properties", className)} {...props} />
  </HideEmptyContext.Provider>
));
PropertyList.displayName = "PropertyList";

export type PropertyProps = {
  label: ReactNode;
  /** Lucide icon shown before the label, e.g. `<Mail />` for an email field. */
  icon?: ReactNode;
  /**
   * The value is empty, so a `hideEmpty` list leaves the row out. By default: children are null, false or "".
   * Set it when the value is a component, e.g. `empty={deal.closeDate == null}` around an InlineDate.
   */
  empty?: boolean;
  children: ReactNode;
};

const isBlank = (node: ReactNode): boolean =>
  node == null || node === false || node === "" || (Array.isArray(node) && node.every(isBlank));

/** One row of a PropertyList. */
export function Property({label, icon, empty, children}: PropertyProps) {
  const hideEmpty = useContext(HideEmptyContext);
  if (hideEmpty && (empty ?? isBlank(children))) return null;
  return (
    <>
      <dt className="fui-property__label">
        {icon}
        {label}
      </dt>
      <dd className="fui-property__value">{children}</dd>
    </>
  );
}

export type PropertyAddProps = {
  /** The empty fields a `hideEmpty` list left out. Nothing renders while there are none. */
  fields: {id: string; label: ReactNode; icon?: ReactNode}[];
  /** The user picked a field: show its row, usually with its editor open (`startEditing` of an Inline* control). */
  onAdd: (id: string) => void;
  /** Button text after the plus; «Поле» / "Field" by default. */
  label?: ReactNode;
  className?: string;
};

/** «+ Поле» / "+ Field" button with a menu of the empty fields, e.g. in a PropertyGroup's `actions`. */
export function PropertyAdd({fields, onAdd, label, className}: PropertyAddProps) {
  const t = useKitTexts();
  if (fields.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" icon={<Plus />} className={className}>
          {label ?? t.addField}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {fields.map((f) => (
          <DropdownMenuItem key={f.id} icon={f.icon} onSelect={() => onAdd(f.id)}>
            {f.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type PropertyGroupProps = {
  title: ReactNode;
  /** Lucide icon before the title: the anchor the eye finds when scanning a long card. */
  icon?: ReactNode;
  actions?: ReactNode;
  /** A PropertyList (rows get denser inside a group), form fields or any other content. */
  children: ReactNode;
  /** Adds a chevron at the right end of the header; the whole header then toggles the content. */
  collapsible?: boolean;
  /** Controlled open state of a collapsible group, e.g. from `usePersistentState` to keep it across cards. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Initial state when uncontrolled. Default true. */
  defaultOpen?: boolean;
  className?: string;
};

/**
 * Titled block of a details card ("Работа", "Контакты"): a bold title with an icon, a hairline above every group but
 * the first, and denser property rows with smaller muted labels, so groups read apart at a glance. With
 * `collapsible`, the header becomes a toggle with a chevron on the right.
 */
export function PropertyGroup({
  title,
  icon,
  actions,
  children,
  collapsible,
  open: openProp,
  onOpenChange,
  defaultOpen = true,
  className,
}: PropertyGroupProps) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const open = !collapsible || (openProp ?? ownOpen);
  const toggle = () => {
    setOwnOpen(!open);
    onOpenChange?.(!open);
  };
  const heading = (
    <>
      {icon}
      {title}
    </>
  );
  return (
    <section className={cx("fui-property-group", className)} data-collapsed={open ? undefined : ""}>
      <div className="fui-property-group__header">
        <h3 className="fui-property-group__title">
          {collapsible ? (
            <button type="button" className="fui-property-group__toggle" aria-expanded={open} onClick={toggle}>
              <span className="fui-property-group__heading">{heading}</span>
              <ChevronDown className="fui-property-group__chevron" aria-hidden />
            </button>
          ) : (
            heading
          )}
        </h3>
        {actions && <div className="fui-property-group__actions">{actions}</div>}
      </div>
      {open && children}
    </section>
  );
}
