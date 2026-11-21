// Geometry of StageGlyph, the 12px progress ring of a workflow state: the filled sector for "step of steps". Pure,
// without imports: Node tests use it as is.
const round = (n) => Math.round(n * 1000) / 1000;
/**
 * SVG path of a pie sector inside a 12×12 box: from 12 o'clock clockwise, `step / steps` of a full turn, radius `r`
 * around (6, 6). Empty string for nothing to fill (step ≤ 0); a full circle once step reaches steps.
 */
export function sectorPath(step, steps, r = 2.75) {
    const share = steps > 0 ? Math.min(Math.max(step / steps, 0), 1) : 0;
    if (share === 0)
        return "";
    if (share === 1)
        return `M6 ${round(6 - r)}A${r} ${r} 0 1 1 6 ${round(6 + r)}A${r} ${r} 0 1 1 6 ${round(6 - r)}Z`;
    const angle = share * 2 * Math.PI;
    const x = round(6 + r * Math.sin(angle));
    const y = round(6 - r * Math.cos(angle));
    return `M6 6L6 ${round(6 - r)}A${r} ${r} 0 ${share > 0.5 ? 1 : 0} 1 ${x} ${y}Z`;
}
