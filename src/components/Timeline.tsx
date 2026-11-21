// History of a record as a vertical timeline: a spine through the markers, a time column, the event and its context,
// the red "now" line between what is planned and what is past, and «Ещё N» under a long history.
import {Fragment, useState, type KeyboardEvent, type ReactNode} from "react";
import {cx} from "../cx";
import {Button} from "./Button";
import {Separator} from "./Layout";
import {useKitTexts} from "./KitLang";

export type TimelineItem = {
  id: string;
  /**
   * 12px mark on the spine, in a 16px circle that covers the line: a Dot (e.g. a hollow ring for something planned),
   * a Lucide icon (an arrow for who wrote, an X for cancelled). Its shape should carry the meaning; color repeats it.
   */
  marker: ReactNode;
  /** Time column (80px, tabular digits, muted by default): «20 ноя», «пн 1 дек». */
  time: ReactNode;
  /** The event, one line with an ellipsis. */
  title: ReactNode;
  /** Muted context at the right edge, e.g. channel and person. */
  meta?: ReactNode;
  /** Muted second line under the title. */
  description?: ReactNode;
  /** Struck-through muted title: the event was cancelled. */
  struck?: boolean;
  /** Makes the row clickable (Enter / Space too), e.g. to edit the event. */
  onClick?: () => void;
};

export type TimelineProps = {
  /** Events in display order, usually latest first with the planned ones on top. */
  items: TimelineItem[];
  /** Rows above the "now" line (see `nowLineIndex`); `null` or omitted — no line. Not drawn while hidden by «Ещё». */
  nowIndex?: number | null;
  /** Caption of the "now" line, e.g. «сейчас 11:42»; «сейчас» / "now" by default. */
  nowLabel?: ReactNode;
  /** Rows shown before «Ещё N» / "N more"; 10 by default. */
  limit?: number;
  /** Shown instead of an empty timeline, e.g. "No activities yet" with a button. */
  empty?: ReactNode;
  "aria-label"?: string;
  className?: string;
};

/**
 * Vertical timeline: spine 12px from the left edge, markers in circles of the card color (set
 * `--fui-timeline-bg` on another surface), time column, title with optional second line, muted meta on the right.
 */
export function Timeline({items, nowIndex, nowLabel, limit = 10, empty, className, ...props}: TimelineProps) {
  const t = useKitTexts();
  const [all, setAll] = useState(false);
  if (items.length === 0) return empty ? <div className={cx("fui-timeline__empty", className)}>{empty}</div> : null;

  const shown = all ? items.length : Math.min(limit, items.length);
  const nowAt = nowIndex != null && nowIndex >= 0 && nowIndex <= shown ? nowIndex : null;
  const nowLine = <Separator as="li" tone="alert" label={nowLabel ?? t.now} className="fui-timeline__now" />;
  const onKeyDown = (item: TimelineItem) => (e: KeyboardEvent<HTMLLIElement>) => {
    if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    item.onClick?.();
  };

  return (
    <div className={cx("fui-timeline", className)}>
      <ol className="fui-timeline__list" aria-label={props["aria-label"]}>
        {items.slice(0, shown).map((item, i) => (
          <Fragment key={item.id}>
            {nowAt === i && nowLine}
            <li
              className="fui-timeline__item"
              data-struck={item.struck ? "" : undefined}
              {...(item.onClick && {
                role: "button",
                tabIndex: 0,
                onClick: item.onClick,
                onKeyDown: onKeyDown(item),
                "data-interactive": "",
              })}
            >
              <span className="fui-timeline__marker">{item.marker}</span>
              <span className="fui-timeline__time">{item.time}</span>
              <span className="fui-timeline__main">
                <span className="fui-timeline__title">{item.title}</span>
                {item.description != null && <span className="fui-timeline__description">{item.description}</span>}
              </span>
              {item.meta != null && <span className="fui-timeline__meta">{item.meta}</span>}
            </li>
          </Fragment>
        ))}
        {nowAt === shown && nowLine}
      </ol>
      {shown < items.length && (
        <Button variant="ghost" size="sm" className="fui-timeline__more" onClick={() => setAll(true)}>
          {t.moreCount(items.length - shown)}
        </Button>
      )}
    </div>
  );
}
