// Small count charts for stats pages: BarList (labelled bars), StackedBar (parts of one whole) and FlowChart
// (per-period ins above an axis, outs below, optional level line). Every number is printed, so nothing needs a hover;
// a clickable value has the same dotted underline everywhere, and the accent appears only on hover.
import type {CSSProperties, ReactNode} from "react";
import {cx} from "../cx";
import type {Hue} from "./Badge";

const share = (value: number, total: number) => (total > 0 ? `${Math.round((value / total) * 100)}%` : "");

export type BarListItem = {
  key: string;
  label: ReactNode;
  value: number;
  /** Makes the row a button, e.g. to open a list filtered by this value. Zero rows are never clickable. */
  onClick?: () => void;
  /** Muted label, for "not set" rows. */
  muted?: boolean;
  /** Hatched bar and a note after the label: the value is there, but it is a stand-in (a placeholder), not real data. */
  placeholder?: ReactNode;
};

export type BarListProps = {
  items: BarListItem[];
  /** Value of a full bar; default the largest value. Pass the total to read bars as shares of it. */
  max?: number;
  /** Shows a share column, value / total. */
  total?: number;
  /** Bar color; neutral by default. */
  hue?: Hue;
  className?: string;
  style?: CSSProperties;
};

/**
 * Rows of "label, bar, value, share". The label column has a fixed width (`--fui-bar-label`, default 13rem), so bars
 * don't move when rows come and go with filters; long labels end with "…".
 */
export function BarList({items, max, total, hue, className, style}: BarListProps) {
  const full = max ?? Math.max(0, ...items.map((i) => i.value));
  return (
    <ul className={cx("fui-bar-list", "fui-chart-hue", className)} data-hue={hue} data-share={total != null ? "" : undefined} style={style}>
      {items.map((item) => {
        const content = (
          <>
            <span className="fui-bar-list__label" data-muted={item.muted ? "" : undefined}>
              <span className="fui-bar-list__text" title={typeof item.label === "string" ? item.label : undefined}>
                {item.label}
              </span>
              {item.placeholder && <span className="fui-bar-list__note">{item.placeholder}</span>}
            </span>
            <span className="fui-bar-list__track">
              <span
                className="fui-bar-list__bar"
                data-placeholder={item.placeholder ? "" : undefined}
                style={{width: `${full > 0 ? (item.value / full) * 100 : 0}%`}}
              />
            </span>
            <span className="fui-bar-list__value" data-empty={item.value ? undefined : ""}>
              {item.value || "—"}
            </span>
            {total != null && <span className="fui-bar-list__share">{share(item.value, total)}</span>}
          </>
        );
        return (
          <li key={item.key}>
            {item.onClick && item.value ? (
              <button type="button" className="fui-bar-list__row" data-interactive="" onClick={item.onClick}>
                {content}
              </button>
            ) : (
              <div className="fui-bar-list__row">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export type StackedBarSegment = {
  key: string;
  label: ReactNode;
  value: number;
  hue?: Hue;
  /** Makes the legend entry a button. */
  onClick?: () => void;
};

export type StackedBarProps = {
  /** Parts of one whole, in display order; zero parts are left out of the bar but stay in the legend. */
  segments: StackedBarSegment[];
  className?: string;
};

/** One bar split into parts, with a legend of "swatch, label, value, share" under it. */
export function StackedBar({segments, className}: StackedBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  return (
    <div className={cx("fui-stacked", className)}>
      <div className="fui-stacked__bar" aria-hidden>
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <span key={s.key} className="fui-stacked__segment fui-chart-hue" data-hue={s.hue} style={{flexGrow: s.value}} />
          ))}
      </div>
      <ul className="fui-stacked__legend">
        {segments.map((s) => {
          const content = (
            <>
              <span className="fui-stacked__swatch fui-chart-hue" data-hue={s.hue} />
              <span className="fui-stacked__label">{s.label}</span>
              <span className="fui-stacked__value">{s.value}</span>
              <span className="fui-stacked__share">{share(s.value, total)}</span>
            </>
          );
          return (
            <li key={s.key}>
              {s.onClick && s.value ? (
                <button type="button" className="fui-stacked__item" data-interactive="" onClick={s.onClick}>
                  {content}
                </button>
              ) : (
                <span className="fui-stacked__item">{content}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export type FlowPeriod = {
  key: string;
  /** Axis caption, e.g. "янв" or "янв 26". */
  label: ReactNode;
  /** Spoken name of the period for screen readers, e.g. "январь 2026". */
  name: string;
  up: number;
  down: number;
  /** Value of the level line at this period, e.g. headcount at the month's end. */
  level?: number;
  onUpClick?: () => void;
  onDownClick?: () => void;
};

export type FlowChartProps = {
  periods: FlowPeriod[];
  /** Legend names of the series, e.g. "Пришли", "Ушли", "В работе на конец месяца". */
  upLabel: string;
  downLabel: string;
  levelLabel?: string;
  upHue?: Hue;
  downHue?: Hue;
  className?: string;
};

// Height of the tallest bar in px; both sides share the scale, so the axis sits where the data puts it.
const PLOT = 112;

function FlowBar({value, scale, side, name, label, onClick}: {
  value: number;
  scale: number;
  side: "up" | "down";
  name: string;
  label: string;
  onClick?: () => void;
}) {
  if (!value) return null;
  const parts = (
    <>
      <span className="fui-flow__value">{value}</span>
      <span className="fui-flow__bar" style={{height: Math.max(2, (value / scale) * PLOT)}} />
    </>
  );
  return onClick ? (
    <button type="button" className="fui-flow__stack" data-side={side} data-interactive="" onClick={onClick} aria-label={`${label}, ${name}: ${value}`}>
      {parts}
    </button>
  ) : (
    <span className="fui-flow__stack" data-side={side} aria-label={`${label}, ${name}: ${value}`} role="img">
      {parts}
    </span>
  );
}

/**
 * Per-period flow: `up` bars rise above the axis, `down` bars hang below it, each with its number; an optional level
 * line runs above them with its value at every point. Scrolls sideways when the periods don't fit (36px each at least).
 */
export function FlowChart({periods, upLabel, downLabel, levelLabel, upHue = "green", downHue = "red", className}: FlowChartProps) {
  const upMax = Math.max(0, ...periods.map((p) => p.up));
  const downMax = Math.max(0, ...periods.map((p) => p.down));
  const scale = Math.max(1, upMax, downMax);
  const levels = periods.map((p) => p.level).filter((v): v is number => v != null);
  const hasLevel = levelLabel != null && levels.length === periods.length && periods.length > 0;
  const levelMin = Math.min(...levels);
  const levelMax = Math.max(...levels);
  // Level y in % of its band, 0 at the top; the top 30% stay free for the value above the highest point, and a flat
  // line sits in the middle of the rest.
  const levelY = (v: number) => (levelMax > levelMin ? 88 - ((v - levelMin) / (levelMax - levelMin)) * 58 : 59);
  const sum = (pick: (p: FlowPeriod) => number) => periods.reduce((total, p) => total + pick(p), 0);

  return (
    <div className={cx("fui-flow", className)}>
      <ul className="fui-flow__legend">
        <li>
          <span className="fui-flow__swatch fui-chart-hue" data-hue={upHue} />
          {upLabel} <b>{sum((p) => p.up)}</b>
        </li>
        <li>
          <span className="fui-flow__swatch fui-chart-hue" data-hue={downHue} />
          {downLabel} <b>{sum((p) => p.down)}</b>
        </li>
        {hasLevel && (
          <li>
            <span className="fui-flow__swatch" data-line="" />
            {levelLabel}
          </li>
        )}
      </ul>
      <div className="fui-flow__scroll">
        <div
          className="fui-flow__plot"
          style={{"--fui-flow-n": periods.length, "--fui-flow-up": `${(upMax / scale) * PLOT}px`, "--fui-flow-down": `${(downMax / scale) * PLOT}px`} as CSSProperties}
        >
          {hasLevel && (
            <svg className="fui-flow__line" viewBox={`0 0 ${periods.length} 100`} preserveAspectRatio="none" aria-hidden>
              <polyline
                points={periods.map((p, i) => `${i + 0.5},${levelY(p.level!)}`).join(" ")}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
          {periods.map((p) => (
            <div key={p.key} className="fui-flow__column">
              {hasLevel && (
                <div className="fui-flow__band">
                  <span className="fui-flow__level" style={{top: `${levelY(p.level!)}%`}}>
                    <span className="fui-flow__level-value">{p.level}</span>
                  </span>
                </div>
              )}
              <div className="fui-flow__up fui-chart-hue" data-hue={upHue}>
                <FlowBar value={p.up} scale={scale} side="up" name={p.name} label={upLabel} onClick={p.onUpClick} />
              </div>
              <div className="fui-flow__down fui-chart-hue" data-hue={downHue}>
                <FlowBar value={p.down} scale={scale} side="down" name={p.name} label={downLabel} onClick={p.onDownClick} />
              </div>
              <span className="fui-flow__period">{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
