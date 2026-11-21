// How a metric's change against the previous period is written on a MetricCard. Pure, without imports: Node tests
// use it as is.

/**
 * Signed change for a metric card: "+7", "−6" (a true minus, as wide as the plus in tabular digits), "0". No color
 * goes with it: whether growth is good depends on the metric.
 */
export function formatDelta(delta: number): string {
  if (!Number.isFinite(delta) || delta === 0) return "0";
  return `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`;
}
