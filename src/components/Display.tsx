// Content building blocks modeled on Fibery entity pages: avatar, card, relation-style list rows, property list.
import {forwardRef, type HTMLAttributes, type KeyboardEvent, type LiHTMLAttributes, type ReactNode} from "react";
import {cx} from "../cx";

export type AvatarProps = {
  /** Used for initials and as the image alt text. */
  name: string;
  /** Image URL, e.g. `makeFileUrl(secret)` of a Fibery avatar. */
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

/** Round avatar, 20 / 24 / 32px; falls back to initials. */
export function Avatar({name, src, size = "md", className}: AvatarProps) {
  return (
    <span data-size={size} className={cx("fui-avatar", className)} title={name}>
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

/** Vertical stack of ListItem rows. */
export const List = forwardRef<HTMLUListElement, HTMLAttributes<HTMLUListElement>>(({className, ...props}, ref) => (
  <ul ref={ref} className={cx("fui-list", className)} {...props} />
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
};

/** Row in the style of Fibery relation lists: ringed, radius 6px, single-line text with ellipsis. */
export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  ({leading, trailing, onClick, multiline, selected, className, children, ...props}, ref) => {
    const onKeyDown = (e: KeyboardEvent<HTMLLIElement>) => {
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
        className={cx("fui-list-item", className)}
        {...(onClick && {role: "button", tabIndex: 0, onClick, onKeyDown, "aria-pressed": selected, "data-interactive": ""})}
        {...props}
      >
        {leading}
        <span className="fui-list-item__main">{children}</span>
        {trailing && <span className="fui-list-item__trailing">{trailing}</span>}
      </li>
    );
  },
);
ListItem.displayName = "ListItem";

/** Two-column label/value grid, like the field list on a Fibery entity page. */
export const PropertyList = forwardRef<HTMLDListElement, HTMLAttributes<HTMLDListElement>>(({className, ...props}, ref) => (
  <dl ref={ref} className={cx("fui-properties", className)} {...props} />
));
PropertyList.displayName = "PropertyList";

export type PropertyProps = {
  label: ReactNode;
  /** Lucide icon shown before the label, e.g. `<Mail />` for an email field. */
  icon?: ReactNode;
  children: ReactNode;
};

/** One row of a PropertyList. */
export function Property({label, icon, children}: PropertyProps) {
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

export type PropertyGroupProps = {
  title: ReactNode;
  /** Lucide icon before the title: the anchor the eye finds when scanning a long card. */
  icon?: ReactNode;
  actions?: ReactNode;
  /** A PropertyList (rows get denser inside a group), form fields or any other content. */
  children: ReactNode;
  className?: string;
};

/**
 * Titled block of a details card ("Работа", "Контакты"): a bold title with an icon, a hairline above every group but
 * the first, and denser property rows with smaller muted labels, so groups read apart at a glance.
 */
export function PropertyGroup({title, icon, actions, children, className}: PropertyGroupProps) {
  return (
    <section className={cx("fui-property-group", className)}>
      <div className="fui-property-group__header">
        <h3 className="fui-property-group__title">
          {icon}
          {title}
        </h3>
        {actions && <div className="fui-property-group__actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
