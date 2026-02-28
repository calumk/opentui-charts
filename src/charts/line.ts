/**
 * Line Chart - draws line series on a FrameBuffer
 */

import { FrameBufferRenderable, Box, Text, type RenderContext } from "@opentui/core";
import type { LineChartProps } from "../types";
import { DEFAULT_COLORS } from "../types";
import {
  color,
  computeNiceScale,
  resolveMargins,
  drawAxes,
  drawLine,
  drawLegend,
  formatNumber,
  QuadrantCanvas,
  type FB,
  LINE_CHARS,
} from "../utils";

export function renderLineChart(
  fb: FB,
  width: number,
  height: number,
  props: LineChartProps
) {
  const bg = color(props.backgroundColor ?? "#1A1A2E");
  const axisColor = color(props.yAxis?.color ?? props.xAxis?.color ?? "#555555");
  const colors = props.colors ?? DEFAULT_COLORS;
  const margins = resolveMargins(props.margins);
  const showDots = props.showDots !== false;
  const dotChar = props.dotChar ?? LINE_CHARS.DOT;
  const lineStyle = props.lineStyle ?? "straight";

  // Clear
  fb.fillRect(0, 0, width, height, bg);

  // Title
  let titleOffset = 0;
  if (props.title) {
    const titleCol = color(props.titleColor ?? "#FFFFFF");
    fb.drawText(props.title, margins.left, 0, titleCol, bg);
    titleOffset = 1;
  }

  // Plot area
  const plotX = margins.left;
  const plotY = margins.top + titleOffset;
  const plotW = width - margins.left - margins.right;
  const plotH = height - margins.top - margins.bottom - titleOffset;

  if (plotW < 3 || plotH < 3) return;

  // Compute Y scale
  let allMin = Infinity;
  let allMax = -Infinity;
  for (const s of props.series) {
    for (const v of s.data) {
      if (v < allMin) allMin = v;
      if (v > allMax) allMax = v;
    }
  }

  if (props.yAxis?.min !== undefined) allMin = props.yAxis.min;
  if (props.yAxis?.max !== undefined) allMax = props.yAxis.max;

  const scale = computeNiceScale(allMin, allMax, props.yAxis?.tickCount ?? Math.min(plotH - 1, 12), plotH);

  // Find max data length for x axis
  const maxLen = Math.max(...props.series.map((s) => s.data.length));

  // Generate x labels
  const xLabels =
    props.xAxis?.show !== false
      ? Array.from({ length: maxLen }, (_, i) => String(i + 1))
      : undefined;

  // Draw axes
  drawAxes(fb, plotX, plotY, plotW, plotH, scale, xLabels, bg, axisColor, props.xAxis, props.yAxis, props.grid);

  // Use effective plot area for even Y spacing (matches drawAxes)
  const ePH = scale.effectivePlotH ?? plotH;
  const ePYoff = scale.plotYOffset ?? 0;
  const ePY = plotY + ePYoff;

  // Draw each series using braille sub-pixel rendering
  const innerW = plotW - 1; // usable terminal columns for data (right of Y axis line)
  const innerH = ePH;       // effective vertical range matching axis tick mapping

  for (let si = 0; si < props.series.length; si++) {
    const series = props.series[si];
    const seriesColor = color(series.color ?? colors[si % colors.length]);
    const data = series.data;
    if (data.length === 0) continue;

    // Compute data points in terminal-cell space (relative to effective area)
    // Uses the SAME formula as drawAxes for perfect tick alignment:
    //   axis: y = ePY + ePH - 1 - t * (ePH - 1)
    //   data: yRel = (ePH - 1) * (1 - yNorm)
    const termPoints: [number, number][] = [];
    for (let i = 0; i < data.length; i++) {
      const t = data.length === 1 ? 0.5 : i / (data.length - 1);
      const x = t * (innerW - 1);
      const yNorm = (data[i] - scale.min) / (scale.max - scale.min);
      const y = (1 - yNorm) * (ePH - 1);
      termPoints.push([x, y]);
    }

    if (lineStyle === "step") {
      // Step lines: use box-drawing chars (they look fine for steps)
      for (let i = 0; i < termPoints.length - 1; i++) {
        const [tx0, ty0] = termPoints[i];
        const [tx1, ty1] = termPoints[i + 1];
        const px0 = plotX + 1 + Math.round(tx0);
        const py0 = ePY + Math.round(ty0);
        const px1 = plotX + 1 + Math.round(tx1);
        const py1 = ePY + Math.round(ty1);
        drawLine(fb, px0, py0, px1, py0, seriesColor, bg, "─");
        drawLine(fb, px1, py0, px1, py1, seriesColor, bg, "│");
      }
      // Dots for step style
      if (showDots) {
        for (let i = 0; i < termPoints.length; i++) {
          const [tx, ty] = termPoints[i];
          const px = plotX + 1 + Math.round(tx);
          const py = ePY + Math.round(ty);
          fb.setCell(px, py, dotChar, seriesColor, bg);
        }
      }
    } else {
      // Smooth lines via quadrant-block sub-pixel rendering (▘▝▖▗▀▄▌▐ etc.)
      // Each terminal cell = 2×2 sub-pixels — solid fills, no dithering,
      // with both horizontal AND vertical sub-pixel precision.
      const qc = new QuadrantCanvas(innerW, innerH);
      const seriesHex = series.color ?? colors[si % colors.length];

      const subPoints: [number, number][] = [];
      for (let i = 0; i < termPoints.length; i++) {
        const [tx, ty] = termPoints[i];
        const sx = Math.round(tx * 2);   // 2× horizontal sub-pixel
        const sy = Math.round(ty * 2);   // 2× vertical sub-pixel
        subPoints.push([sx, sy]);
      }

      // Draw connecting lines in sub-pixel space
      for (let i = 0; i < subPoints.length - 1; i++) {
        const [sx0, sy0] = subPoints[i];
        const [sx1, sy1] = subPoints[i + 1];
        qc.drawLine(sx0, sy0, sx1, sy1, seriesHex);
      }

      // Draw dot markers at data points
      if (showDots) {
        for (const [sx, sy] of subPoints) {
          qc.set(sx, sy, seriesHex);
        }
      }

      qc.render(fb, plotX + 1, ePY, bg);
    }

    // Fill area under the line
    if (props.fillArea) {
      const baseY = ePY + ePH - 2;
      const fillColor = color(series.color ?? colors[si % colors.length]);
      const dimFill = dimmedRGBA(fillColor, 0.3);
      for (let i = 0; i < termPoints.length; i++) {
        const [tx, ty] = termPoints[i];
        const px = plotX + 1 + Math.round(tx);
        const py = ePY + Math.round(ty);
        for (let y = py + 1; y <= baseY; y++) {
          fb.setCell(px, y, "░", dimFill, bg);
        }
      }
    }

  }

  // Legend
  if (props.legend?.show !== false && props.series.length > 1) {
    const legendY = height - 1;
    const items = props.series.map((s, i) => ({
      name: s.name,
      color: s.color ?? colors[i % colors.length],
    }));
    drawLegend(fb, items, margins.left, legendY, plotW, bg);
  }
}

function dimmedRGBA(c: { r: number; g: number; b: number; a: number }, factor: number) {
  return {
    r: c.r * factor,
    g: c.g * factor,
    b: c.b * factor,
    a: c.a,
  } as any;
}

/**
 * Construct API: creates a Box with a FrameBuffer inside
 */
export function LineChart(props: LineChartProps) {
  const fb = FrameBufferRenderable as any;

  return Box(
    {
      id: props.id ?? "line-chart",
      width: props.width,
      height: props.height + (props.title ? 1 : 0),
      borderStyle: props.borderStyle,
      borderColor: props.borderColor,
    },
    // We return a marker; the actual rendering is done via createLineChart
  );
}

/**
 * Imperative API: creates a FrameBufferRenderable with the chart drawn on it
 */
export function createLineChart(
  renderer: RenderContext,
  props: LineChartProps
): FrameBufferRenderable {
  const canvas = new FrameBufferRenderable(renderer, {
    id: props.id ?? "line-chart",
    width: props.width,
    height: props.height,
  });

  renderLineChart(canvas.frameBuffer, props.width, props.height, props);

  return canvas;
}

/**
 * Update an existing line chart with new data
 */
export function updateLineChart(
  canvas: FrameBufferRenderable,
  props: LineChartProps
) {
  renderLineChart(canvas.frameBuffer, props.width, props.height, props);
  canvas.requestRender();
}
