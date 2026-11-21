/**
 * SVG path of a pie sector inside a 12×12 box: from 12 o'clock clockwise, `step / steps` of a full turn, radius `r`
 * around (6, 6). Empty string for nothing to fill (step ≤ 0); a full circle once step reaches steps.
 */
export declare function sectorPath(step: number, steps: number, r?: number): string;
