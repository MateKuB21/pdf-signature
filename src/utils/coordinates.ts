/** Convert UI pixels to PDF points */
export function pxToPts(px: number, scale: number): number {
  return px / scale;
}

/** Convert PDF points to UI pixels */
export function ptsToPx(pts: number, scale: number): number {
  return pts * scale;
}

/**
 * Compute the scale factor: how many CSS pixels per PDF point.
 * baseWidth is the available container width in CSS pixels.
 */
export function getScale(
  baseWidth: number,
  pageWidthPts: number,
  zoom: number,
): number {
  return (baseWidth / pageWidthPts) * zoom;
}

/** Convert top-left Y origin to pdf-lib bottom-left Y origin */
export function toBottomLeftY(
  yTopLeft: number,
  objHeight: number,
  pageHeightPts: number,
): number {
  return pageHeightPts - yTopLeft - objHeight;
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
