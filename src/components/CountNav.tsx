// Navigator over a screen made of several lists: one anchor per section with its icon, short name and count. A click
// tells the app (to open the section) and scrolls to it; the row sticks to the top while the screen scrolls.
import {useEffect, useRef, useState, type ReactNode} from "react";
import {cx} from "../cx";
import type {Hue} from "../colors";
import {useKitTexts} from "./KitLang";

export type CountNavItem = {
  /** Section id: CountNav scrolls to the element with this DOM id (e.g. a SectionHeader's `id`). */
  id: string;
  /** Short name; it hides on narrow containers and stays in the anchor's title and accessible name. */
  label: string;
  /** Lucide icon of the section. */
  icon: ReactNode;
  count: number;
  /** Icon hue while the count is above 0, the section's code (e.g. red for overdue); neutral at 0. */
  hue?: Hue;
};

export type CountNavProps = {
  items: CountNavItem[];
  /** Called on click before scrolling, e.g. to expand the section. */
  onSelect?: (id: string) => void;
  /** Scrolls to the section and flashes its header after `onSelect`; on by default. */
  scroll?: boolean;
  /** «Разделы» / "Sections" by default. */
  "aria-label"?: string;
  className?: string;
};

const FLASH_MS = 900;

/**
 * Sticky row of section anchors "icon · name · count" in one segmented frame. Each anchor keeps one width whatever
 * its count (room for "999", tabular digits); a zero count turns muted and its icon neutral. Below 700px of
 * container width only icons and counts remain.
 */
export function CountNav({items, onSelect, scroll = true, className, ...props}: CountNavProps) {
  const t = useKitTexts();
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  // A hairline under the bar only while it is stuck over scrolled content.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) =>
      setStuck(!entry.isIntersecting && entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const select = (id: string) => {
    onSelect?.(id);
    if (!scroll) return;
    // Two frames: the app first renders the section it was asked to open.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const target = document.getElementById(id);
        if (!target) return;
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({behavior: reduced ? "auto" : "smooth", block: "start"});
        target.setAttribute("data-flash", "");
        window.setTimeout(() => target.removeAttribute("data-flash"), FLASH_MS);
      }),
    );
  };

  return (
    <>
      <div ref={sentinel} className="fui-count-nav__sentinel" aria-hidden />
      <nav aria-label={props["aria-label"] ?? t.sections} data-stuck={stuck ? "" : undefined} className={cx("fui-count-nav", className)}>
        <div className="fui-count-nav__track">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="fui-count-nav__item"
              data-hue={item.count > 0 ? item.hue : undefined}
              data-zero={item.count === 0 ? "" : undefined}
              title={item.label}
              aria-label={`${item.label}: ${item.count}`}
              onClick={() => select(item.id)}
            >
              {item.icon}
              <span className="fui-count-nav__label">{item.label}</span>
              <span className="fui-count-nav__count">{item.count}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
