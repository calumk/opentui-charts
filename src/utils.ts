/**
 * @opentui-chart - Core drawing utilities
 * Low-level helpers for rendering onto FrameBuffer
 */

import { RGBA } from "@opentui/core";
import {
  BLOCK,
  BRAILLE,
  LINE_CHARS,
  DEFAULT_MARGINS,
  type ChartMargins,
  type AxisOptions,
  type GridOptions,
} from "./types";

// Re-export constants used by chart modules
export { LINE_CHARS, BLOCK, BRAILLE };

// ─── Color Helpers ──────────────────────────────────────────────────────────

const colorCache = new Map<string, RGBA>();

export function color(hex: string): RGBA {
  let c = colorCache.get(hex);
  if (!c) {
    c = RGBA.fromHex(hex);
    colorCache.set(hex, c);
  }
  return c;
}

export function dimColor(hex: string, factor = 0.4): RGBA {
  const c = color(hex);
  return RGBA.fromValues(c.r * factor, c.g * factor, c.b * factor, c.a);
}

export function lerpColor(a: string, b: string, t: number): RGBA {
  const ca = color(a);
  const cb = color(b);
  return RGBA.fromValues(
    ca.r + (cb.r - ca.r) * t,
    ca.g + (cb.g - ca.g) * t,
    ca.b + (cb.b - ca.b) * t,
    ca.a + (cb.a - ca.a) * t
  );
}

// ─── Math Helpers ───────────────────────────────────────────────────────────

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function niceNum(range: number, round: boolean): number {
  const exp = Math.floor(Math.log10(range));
  const frac = range / Math.pow(10, exp);
  let nice: number;
  if (round) {
    if (frac < 1.5) nice = 1;
    else if (frac < 3) nice = 2;
    else if (frac < 7) nice = 5;
    else nice = 10;
  } else {
    if (frac <= 1) nice = 1;
    else if (frac <= 2) nice = 2;
    else if (frac <= 5) nice = 5;
    else nice = 10;
  }
  return nice * Math.pow(10, exp);
}

export interface NiceScale {
  min: number;
  max: number;
  tickSpacing: number;
  ticks: number[];
  /** When plotHeight is provided, the effective height adjusted for even tick spacing */
  effectivePlotH?: number;
  /** Y offset to center the effective area within the original plotH */
  plotYOffset?: number;
}

export function computeNiceScale(
  dataMin: number,
  dataMax: number,
  maxTicks = 10,
  plotHeight?: number
): NiceScale {
  if (dataMin === dataMax) {
    dataMin = dataMin === 0 ? 0 : dataMin - 1;
    dataMax = dataMax === 0 ? 1 : dataMax + 1;
  }
  const range = niceNum(dataMax - dataMin, false);
  const tickSpacing = niceNum(range / (maxTicks - 1), true);
  const niceMin = Math.floor(dataMin / tickSpacing) * tickSpacing;
  const niceMax = Math.ceil(dataMax / tickSpacing) * tickSpacing;

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + tickSpacing * 0.5; v += tickSpacing) {
    ticks.push(parseFloat(v.toPrecision(12)));
  }

  let effectivePlotH: number | undefined;
  let plotYOffset: number | undefined;

  // If we know the plot height, compute an adjusted height so tick intervals
  // divide evenly into available rows (perfectly even grid line spacing).
  if (plotHeight && plotHeight > 4 && ticks.length > 1) {
    const intervals = ticks.length - 1;
    const availableRows = plotHeight - 1;
    const excess = availableRows % intervals;
    if (excess > 0) {
      effectivePlotH = plotHeight - excess;
      plotYOffset = Math.floor(excess / 2);
    }
  }

  return { min: niceMin, max: niceMax, tickSpacing, ticks, effectivePlotH, plotYOffset };
}

export function resolveMargins(partial?: Partial<ChartMargins>): ChartMargins {
  return { ...DEFAULT_MARGINS, ...partial };
}

// ─── FrameBuffer Drawing Helpers ────────────────────────────────────────────

export interface FB {
  setCell(
    x: number,
    y: number,
    char: string,
    fg: RGBA,
    bg: RGBA,
    attributes?: number
  ): void;
  drawText(
    text: string,
    x: number,
    y: number,
    fg: RGBA,
    bg?: RGBA,
    attributes?: number
  ): void;
  fillRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: RGBA
  ): void;
}

/**
 * Draw a horizontal line
 */
export function drawHLine(
  fb: FB,
  x1: number,
  x2: number,
  y: number,
  fg: RGBA,
  bg: RGBA,
  char = LINE_CHARS.HORIZONTAL
) {
  const start = Math.min(x1, x2);
  const end = Math.max(x1, x2);
  for (let x = start; x <= end; x++) {
    fb.setCell(x, y, char, fg, bg);
  }
}

/**
 * Draw a vertical line
 */
export function drawVLine(
  fb: FB,
  x: number,
  y1: number,
  y2: number,
  fg: RGBA,
  bg: RGBA,
  char = LINE_CHARS.VERTICAL
) {
  const start = Math.min(y1, y2);
  const end = Math.max(y1, y2);
  for (let y = start; y <= end; y++) {
    fb.setCell(x, y, char, fg, bg);
  }
}

/**
 * Draw a line between two points using Bresenham's algorithm
 * with directional box-drawing characters for thin, clean lines.
 */
export function drawLine(
  fb: FB,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  fg: RGBA,
  bg: RGBA,
  char: string = ""
) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let cx = x0;
  let cy = y0;
  let prevDx = 0;
  let prevDy = 0;

  while (true) {
    // Determine the character for this cell based on direction
    let cellChar = char;
    if (!cellChar) {
      const e2 = 2 * err;
      const willMoveX = e2 > -dy;
      const willMoveY = e2 < dx;

      if (willMoveX && willMoveY) {
        // Diagonal movement
        cellChar = sy < 0 ? "╱" : "╲";
      } else if (willMoveX) {
        // Horizontal movement
        cellChar = "─";
      } else if (willMoveY) {
        // Vertical movement
        cellChar = "│";
      } else {
        cellChar = "─";
      }

      // At the endpoint, use the direction we came from
      if (cx === x1 && cy === y1) {
        if (prevDx !== 0 && prevDy !== 0) {
          cellChar = prevDy < 0 ? "╱" : "╲";
        } else if (prevDx !== 0) {
          cellChar = "─";
        } else if (prevDy !== 0) {
          cellChar = "│";
        }
      }
    }

    fb.setCell(cx, cy, cellChar, fg, bg);
    if (cx === x1 && cy === y1) break;

    const e2 = 2 * err;
    prevDx = 0;
    prevDy = 0;
    if (e2 > -dy) {
      err -= dy;
      cx += sx;
      prevDx = sx;
    }
    if (e2 < dx) {
      err += dx;
      cy += sy;
      prevDy = sy;
    }
  }
}

/**
 * Draw axes on the chart area
 */
export function drawAxes(
  fb: FB,
  plotX: number,
  plotY: number,
  plotW: number,
  plotH: number,
  scale: NiceScale,
  labels: string[] | undefined,
  bg: RGBA,
  axisColor: RGBA,
  xAxisOpts?: AxisOptions,
  yAxisOpts?: AxisOptions,
  gridOpts?: GridOptions
) {
  const showXAxis = xAxisOpts?.show !== false;
  const showYAxis = yAxisOpts?.show !== false;
  const showGrid = gridOpts?.show !== false;
  const gridColor = gridOpts?.color
    ? color(gridOpts.color)
    : dimColor("#FFFFFF", 0.15);
  const gridStyle = gridOpts?.style ?? "dotted";
  const gridChar =
    gridStyle === "dotted"
      ? LINE_CHARS.SMALL_DOT
      : gridStyle === "dashed"
        ? LINE_CHARS.HORIZONTAL
        : LINE_CHARS.HORIZONTAL;

  // Use effective plot area for even tick spacing if available
  const ePH = scale.effectivePlotH ?? plotH;
  const ePY = plotY + (scale.plotYOffset ?? 0);

  // Y axis line (full height)
  if (showYAxis) {
    drawVLine(fb, plotX, plotY, plotY + plotH - 1, axisColor, bg);
  }

  // X axis line (at bottom of full area)
  if (showXAxis) {
    drawHLine(fb, plotX, plotX + plotW - 1, plotY + plotH - 1, axisColor, bg);
  }

  // Y axis ticks & labels — use effective area for even spacing
  if (showYAxis) {
    const ticks = scale.ticks;
    for (const tick of ticks) {
      const t = (tick - scale.min) / (scale.max - scale.min);
      const y = Math.round(ePY + ePH - 1 - t * (ePH - 1));
      if (y < plotY || y >= plotY + plotH) continue;

      // Tick mark
      fb.setCell(plotX - 1, y, LINE_CHARS.TEE_LEFT, axisColor, bg);

      // Label
      const fmt = yAxisOpts?.formatTick
        ? yAxisOpts.formatTick(tick)
        : formatNumber(tick);
      const labelStr = fmt.slice(0, plotX - 1);
      fb.drawText(
        labelStr.padStart(plotX - 1),
        0,
        y,
        axisColor,
        bg
      );

      // Grid line
      if (showGrid && y > plotY && y < plotY + plotH - 1) {
        for (let x = plotX + 1; x < plotX + plotW - 1; x++) {
          if (gridStyle === "dotted" && x % 2 === 0) continue;
          fb.setCell(x, y, gridChar, gridColor, bg);
        }
      }
    }
  }

  // X axis labels — start 1 column right of Y axis to align with data
  if (showXAxis && labels) {
    const step = Math.max(1, Math.ceil(labels.length / Math.floor(plotW / 6)));
    for (let i = 0; i < labels.length; i += step) {
      const x = Math.round(
        plotX + 1 + (i / Math.max(1, labels.length - 1)) * (plotW - 2)
      );
      if (x > plotX && x < plotX + plotW) {
        fb.setCell(x, plotY + plotH - 1, LINE_CHARS.TEE_BOTTOM, axisColor, bg);
        const label = labels[i].slice(0, 6);
        const lx = Math.max(0, x - Math.floor(label.length / 2));
        fb.drawText(label, lx, plotY + plotH, axisColor, bg);
      }
    }
  }

  // Corner
  if (showXAxis && showYAxis) {
    fb.setCell(
      plotX,
      plotY + plotH - 1,
      LINE_CHARS.CORNER_BL,
      axisColor,
      bg
    );
  }
}

/**
 * Format a number for axis labels
 */
export function formatNumber(n: number): string {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (Math.abs(n) >= 1e4) return (n / 1e3).toFixed(1) + "K";
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(1);
}

/**
 * Draw legend entries
 */
export function drawLegend(
  fb: FB,
  items: { name: string; color: string }[],
  x: number,
  y: number,
  maxWidth: number,
  bg: RGBA
) {
  let cx = x;
  for (const item of items) {
    const entry = `${BLOCK.FULL} ${item.name}`;
    if (cx + entry.length + 2 > x + maxWidth) {
      // wrap - just skip if too many
      break;
    }
    fb.setCell(cx, y, BLOCK.FULL, color(item.color), bg);
    fb.drawText(` ${item.name}`, cx + 1, y, color("#AAAAAA"), bg);
    cx += item.name.length + 3;
  }
}

/**
 * Draw braille scatter/line using 2x4 braille encoding  
 * Each terminal cell = 2 wide x 4 tall in braille space
 */
export function drawBraillePoint(
  fb: FB,
  bx: number,
  by: number,
  fg: RGBA,
  bg: RGBA,
  cellX: number,
  cellY: number
): void {
  const col = bx % 2;
  const row = by % 4;
  const bit = BRAILLE.DOTS[col][row];
  fb.setCell(
    cellX,
    cellY,
    String.fromCharCode(BRAILLE.BASE + bit),
    fg,
    bg
  );
}

// ─── Braille Canvas ─────────────────────────────────────────────────────────

/**
 * A high-resolution braille canvas that accumulates dots and renders them
 * as braille Unicode characters. Each terminal cell = 2 wide × 4 tall
 * in braille sub-pixel space, giving 8× the effective resolution.
 *
 * Usage:
 *   const bc = new BrailleCanvas(termCols, termRows);
 *   bc.set(subX, subY);            // plot a sub-pixel dot
 *   bc.drawLine(x0, y0, x1, y1);   // Bresenham in sub-pixel space
 *   bc.render(fb, offsetX, offsetY, fg, bg);
 */
export class BrailleCanvas {
  /** Terminal columns */
  readonly cols: number;
  /** Terminal rows */
  readonly rows: number;
  /** Sub-pixel width  (cols × 2) */
  readonly w: number;
  /** Sub-pixel height (rows × 4) */
  readonly h: number;
  /** One braille bit-mask per terminal cell (cols × rows) */
  private grid: Uint8Array;

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.w = cols * 2;
    this.h = rows * 4;
    this.grid = new Uint8Array(cols * rows);
  }

  /** Clear all dots */
  clear() {
    this.grid.fill(0);
  }

  /** Set a single sub-pixel dot */
  set(sx: number, sy: number) {
    if (sx < 0 || sx >= this.w || sy < 0 || sy >= this.h) return;
    const cx = sx >> 1;           // terminal column
    const cy = Math.floor(sy / 4); // terminal row
    const dotCol = sx & 1;        // 0 or 1
    const dotRow = sy & 3;        // 0-3

    // Braille dot bit offsets:
    //   col0: row0=0x01, row1=0x02, row2=0x04, row3=0x40
    //   col1: row0=0x08, row1=0x10, row2=0x20, row3=0x80
    const bit = BRAILLE.DOTS[dotCol][dotRow];
    this.grid[cy * this.cols + cx] |= bit;
  }

  /** Fill a small circle of sub-pixels as a dot marker */
  fillDot(sx: number, sy: number, radius: number = 3) {
    const r2 = radius * radius;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= r2) {
          this.set(sx + dx, sy + dy);
        }
      }
    }
  }

  /** Draw a line in sub-pixel space using Bresenham */
  drawLine(x0: number, y0: number, x1: number, y1: number) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let cx = x0;
    let cy = y0;

    while (true) {
      this.set(cx, cy);
      if (cx === x1 && cy === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; cx += sx; }
      if (e2 < dx)  { err += dx; cy += sy; }
    }
  }

  /** Render accumulated dots onto a FrameBuffer */
  render(fb: FB, offsetX: number, offsetY: number, fg: RGBA, bg: RGBA) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const bits = this.grid[r * this.cols + c];
        if (bits === 0) continue;
        fb.setCell(
          offsetX + c,
          offsetY + r,
          String.fromCharCode(BRAILLE.BASE + bits),
          fg,
          bg
        );
      }
    }
  }
}

/**
 * Quadrant-block canvas for smooth, solid line rendering.
 *
 * Each terminal cell is split into a 2×2 grid of sub-pixels, rendered with
 * Unicode quadrant block characters (▘▝▖▗▀▄▌▐▚▞▛▜▙▟█). Every sub-pixel is
 * a solid rectangular fill (no gaps like braille), giving both horizontal
 * AND vertical sub-pixel precision — diagonals render smoothly.
 *
 * Resolution: (W×2) × (H×2) sub-pixels, i.e. 4× the terminal cell count.
 *
 * Supports per-sub-pixel colour. When two colours share a cell, the
 * quadrant character separates them cleanly using fg/bg.
 */
export class QuadrantCanvas {
  readonly cols: number;
  readonly rows: number;
  /** Sub-pixel width  (cols × 2) */
  readonly subW: number;
  /** Sub-pixel height (rows × 2) */
  readonly subH: number;

  /** Per-sub-pixel colour hex or null. Indexed [sy * subW + sx]. */
  private pixels: (string | null)[];

  /**
   * Quadrant characters indexed by bitmask.
   * Bit layout: TL=1, TR=2, BL=4, BR=8
   */
  private static CHARS = [
    " ", "▘", "▝", "▀",  // 0000, 0001, 0010, 0011
    "▖", "▌", "▞", "▛",  // 0100, 0101, 0110, 0111
    "▗", "▚", "▐", "▜",  // 1000, 1001, 1010, 1011
    "▄", "▙", "▟", "█",  // 1100, 1101, 1110, 1111
  ];

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.subW = cols * 2;
    this.subH = rows * 2;
    this.pixels = new Array<string | null>(this.subW * this.subH).fill(null);
  }

  clear() { this.pixels.fill(null); }

  /** Set a sub-pixel at (sx, sy) in sub-pixel space */
  set(sx: number, sy: number, col: string) {
    if (sx < 0 || sx >= this.subW || sy < 0 || sy >= this.subH) return;
    this.pixels[sy * this.subW + sx] = col;
  }

  /** Draw a line in sub-pixel space using Bresenham */
  drawLine(x0: number, y0: number, x1: number, y1: number, col: string) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let cx = x0;
    let cy = y0;

    while (true) {
      this.set(cx, cy, col);
      if (cx === x1 && cy === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; cx += sx; }
      if (e2 < dx)  { err += dx; cy += sy; }
    }
  }

  /** Render to a FrameBuffer using quadrant block characters */
  render(fb: FB, offsetX: number, offsetY: number, bgColor: RGBA) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // Sub-pixel indices
        const tlHex = this.pixels[(r * 2)     * this.subW + (c * 2)];
        const trHex = this.pixels[(r * 2)     * this.subW + (c * 2 + 1)];
        const blHex = this.pixels[(r * 2 + 1) * this.subW + (c * 2)];
        const brHex = this.pixels[(r * 2 + 1) * this.subW + (c * 2 + 1)];

        // Collect set sub-pixels
        const set: string[] = [];
        if (tlHex) set.push(tlHex);
        if (trHex) set.push(trHex);
        if (blHex) set.push(blHex);
        if (brHex) set.push(brHex);

        if (set.length === 0) continue;

        // Find unique colours
        const unique = [...new Set(set)];

        if (unique.length === 1) {
          // Single colour — fg = line colour, bg = background
          const mask =
            (tlHex ? 1 : 0) | (trHex ? 2 : 0) |
            (blHex ? 4 : 0) | (brHex ? 8 : 0);
          fb.setCell(offsetX + c, offsetY + r,
            QuadrantCanvas.CHARS[mask], color(unique[0]), bgColor);
        } else {
          // Two (or more) colours — pick the two most frequent.
          // fg = primary colour's quadrants, bg = secondary colour.
          // Any transparent quadrants become bg, which is acceptable for
          // the rare case of two series crossing the same cell.
          const counts = new Map<string, number>();
          for (const s of set) counts.set(s, (counts.get(s) ?? 0) + 1);
          const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
          const primary = sorted[0][0];
          const secondary = sorted[1][0];

          const mask =
            (tlHex === primary ? 1 : 0) | (trHex === primary ? 2 : 0) |
            (blHex === primary ? 4 : 0) | (brHex === primary ? 8 : 0);
          fb.setCell(offsetX + c, offsetY + r,
            QuadrantCanvas.CHARS[mask], color(primary), color(secondary));
        }
      }
    }
  }
}
