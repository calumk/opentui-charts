/**
 * Sparkline - compact inline chart, minimal decoration
 */

import { FrameBufferRenderable, type RenderContext } from "@opentui/core";
import type { SparklineProps } from "../types";
import { BLOCK } from "../types";
import { color, QuadrantCanvas, type FB, LINE_CHARS, formatNumber } from "../utils";

// Unicode block elements for sub-character resolution (8 levels)
const SPARK_BLOCKS = [" ", "▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

export function renderSparkline(
  fb: FB,
  width: number,
  height: number,
  props: SparklineProps
) {
  const bg = color(props.backgroundColor ?? "#000000");
  const fg = color(props.color ?? "#4FC3F7");
  const data = props.data;
  const style = props.style ?? "line";

  if (data.length === 0) return;

  fb.fillRect(0, 0, width, height, bg);

  // Title
  let titleOffset = 0;
  if (props.title) {
    fb.drawText(props.title, 1, 0, color(props.titleColor ?? "#FFFFFF"), bg);
    titleOffset = 1;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Effective drawing area accounts for title
  const drawH = height - titleOffset;
  const drawY = titleOffset;

  if (style === "line" || style === "dot") {
    if (drawH === 1) {
      // Single-row sparkline using block chars
      for (let i = 0; i < Math.min(data.length, width); i++) {
        const norm = (data[i] - min) / range;
        const level = Math.round(norm * 8);
        fb.setCell(i, drawY, SPARK_BLOCKS[level], fg, bg);
      }
    } else {
      // Multi-row sparkline using quadrant-block sub-pixel rendering (2×2 per cell)
      const colorHex = props.color ?? "#4FC3F7";
      const qc = new QuadrantCanvas(width, drawH);
      const subW = width * 2;  // sub-pixel cols
      const subH = drawH * 2;  // sub-pixel rows

      // Map data to sub-pixel coordinates
      const points: [number, number][] = [];
      for (let col = 0; col < subW; col++) {
        const t = data.length === 1 ? 0 : col / (subW - 1);
        const rawIdx = t * (data.length - 1);
        const idx = Math.min(Math.round(rawIdx), data.length - 1);
        const val = data[idx];
        const norm = (val - min) / range;
        const sy = Math.round((1 - norm) * (subH - 1));
        points.push([col, sy]);
      }

      if (style === "dot") {
        for (const [px, py] of points) {
          qc.set(px, py, colorHex);
        }
      } else {
        // Draw connected line segments in sub-pixel space
        for (let i = 0; i < points.length - 1; i++) {
          const [x0, y0] = points[i];
          const [x1, y1] = points[i + 1];
          qc.drawLine(x0, y0, x1, y1, colorHex);
        }
        if (points.length === 1) {
          qc.set(points[0][0], points[0][1], colorHex);
        }
      }

      qc.render(fb, 0, drawY, bg);
    }
  } else if (style === "bar") {
    // Bar sparkline
    const barW = Math.max(1, Math.floor(width / data.length));
    for (let i = 0; i < data.length; i++) {
      const norm = (data[i] - min) / range;
      const barH = Math.max(1, Math.round(norm * drawH));
      const x = i * barW;

      for (let row = 0; row < barH; row++) {
        for (let bx = 0; bx < barW && x + bx < width; bx++) {
          fb.setCell(x + bx, drawY + drawH - 1 - row, BLOCK.FULL, fg, bg);
        }
      }
    }
  }

  // Min/Max indicators
  if (props.showMinMax) {
    const minStr = formatNumber(min);
    const maxStr = formatNumber(max);
    fb.drawText(minStr, width - minStr.length, drawY + drawH - 1, color("#666666"), bg);
    fb.drawText(maxStr, width - maxStr.length, drawY, color("#666666"), bg);
  }
}

export function createSparkline(
  renderer: RenderContext,
  props: SparklineProps
): FrameBufferRenderable {
  const h = props.height ?? 1;
  const canvas = new FrameBufferRenderable(renderer, {
    id: props.id ?? "sparkline",
    width: props.width,
    height: h,
  });

  renderSparkline(canvas.frameBuffer, props.width, h, props);
  return canvas;
}

export function updateSparkline(
  canvas: FrameBufferRenderable,
  props: SparklineProps
) {
  const h = props.height ?? 1;
  renderSparkline(canvas.frameBuffer, props.width, h, props);
  canvas.requestRender();
}
