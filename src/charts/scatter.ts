/**
 * Scatter Chart - scatter plot with individual points
 */

import { FrameBufferRenderable, type RenderContext } from "@opentui/core";
import type { ScatterChartProps } from "../types";
import { DEFAULT_COLORS } from "../types";
import {
  color,
  computeNiceScale,
  resolveMargins,
  drawAxes,
  type FB,
  LINE_CHARS,
} from "../utils";

export function renderScatterChart(
  fb: FB,
  width: number,
  height: number,
  props: ScatterChartProps
) {
  const bg = color(props.backgroundColor ?? "#1A1A2E");
  const axisColor = color(props.yAxis?.color ?? "#555555");
  const defaultPointColor = color(props.defaultColor ?? DEFAULT_COLORS[0]);
  const margins = resolveMargins(props.margins);
  const dotChar = props.dotChar ?? LINE_CHARS.DOT;

  fb.fillRect(0, 0, width, height, bg);

  let titleOffset = 0;
  if (props.title) {
    fb.drawText(props.title, margins.left, 0, color(props.titleColor ?? "#FFFFFF"), bg);
    titleOffset = 1;
  }

  const plotX = margins.left;
  const plotY = margins.top + titleOffset;
  const plotW = width - margins.left - margins.right;
  const plotH = height - margins.top - margins.bottom - titleOffset;

  if (plotW < 3 || plotH < 3 || props.points.length === 0) return;

  // Compute scales
  let xMin = Infinity, xMax = -Infinity;
  let yMin = Infinity, yMax = -Infinity;
  for (const p of props.points) {
    if (p.x < xMin) xMin = p.x;
    if (p.x > xMax) xMax = p.x;
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }

  if (props.xAxis?.min !== undefined) xMin = props.xAxis.min;
  if (props.xAxis?.max !== undefined) xMax = props.xAxis.max;
  if (props.yAxis?.min !== undefined) yMin = props.yAxis.min;
  if (props.yAxis?.max !== undefined) yMax = props.yAxis.max;

  const yScale = computeNiceScale(yMin, yMax, props.yAxis?.tickCount ?? Math.min(plotH - 1, 10), plotH);
  const xScale = computeNiceScale(xMin, xMax, props.xAxis?.tickCount ?? Math.min(Math.floor(plotW / 8), 10));

  // Draw axes
  const xLabels = xScale.ticks.map(v => props.xAxis?.formatTick?.(v) ?? String(Math.round(v)));
  drawAxes(fb, plotX, plotY, plotW, plotH, yScale, xLabels, bg, axisColor, props.xAxis, props.yAxis, props.grid);

  // Use effective plot area for even Y spacing
  const ePH = yScale.effectivePlotH ?? plotH;
  const ePY = plotY + (yScale.plotYOffset ?? 0);

  // Plot points
  for (const point of props.points) {
    const xNorm = (point.x - xScale.min) / (xScale.max - xScale.min);
    const yNorm = (point.y - yScale.min) / (yScale.max - yScale.min);

    const px = Math.round(plotX + 1 + xNorm * (plotW - 3));
    const py = Math.round(ePY + ePH - 2 - yNorm * (ePH - 3));

    if (px > plotX && px < plotX + plotW - 1 && py >= plotY && py < plotY + plotH - 1) {
      const pointColor = point.color ? color(point.color) : defaultPointColor;
      fb.setCell(px, py, dotChar, pointColor, bg);
    }
  }
}

export function createScatterChart(
  renderer: RenderContext,
  props: ScatterChartProps
): FrameBufferRenderable {
  const canvas = new FrameBufferRenderable(renderer, {
    id: props.id ?? "scatter-chart",
    width: props.width,
    height: props.height,
  });

  renderScatterChart(canvas.frameBuffer, props.width, props.height, props);
  return canvas;
}

export function updateScatterChart(
  canvas: FrameBufferRenderable,
  props: ScatterChartProps
) {
  renderScatterChart(canvas.frameBuffer, props.width, props.height, props);
  canvas.requestRender();
}
