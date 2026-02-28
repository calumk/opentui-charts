/**
 * Area Chart - filled area under lines, supports stacking
 */

import { FrameBufferRenderable, type RenderContext } from "@opentui/core";
import type { AreaChartProps } from "../types";
import { DEFAULT_COLORS, BLOCK } from "../types";
import {
  color,
  dimColor,
  computeNiceScale,
  resolveMargins,
  drawAxes,
  drawLine,
  drawLegend,
  QuadrantCanvas,
  type FB,
  LINE_CHARS,
} from "../utils";

export function renderAreaChart(
  fb: FB,
  width: number,
  height: number,
  props: AreaChartProps
) {
  const bg = color(props.backgroundColor ?? "#1A1A2E");
  const axisColor = color(props.yAxis?.color ?? "#555555");
  const colors = props.colors ?? DEFAULT_COLORS;
  const margins = resolveMargins(props.margins);
  const stacked = props.stacked ?? false;
  const fillChar = props.fillChar ?? BLOCK.SHADE_MEDIUM;
  const showDots = props.showDots ?? false;

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

  if (plotW < 3 || plotH < 3) return;

  const maxLen = Math.max(...props.series.map((s) => s.data.length));

  // Compute stacked data if needed
  let processedSeries: number[][] = props.series.map((s) => [...s.data]);
  if (stacked && processedSeries.length > 1) {
    for (let si = 1; si < processedSeries.length; si++) {
      for (let i = 0; i < processedSeries[si].length; i++) {
        processedSeries[si][i] += processedSeries[si - 1][i] ?? 0;
      }
    }
  }

  // Find scale
  let allMin = 0;
  let allMax = -Infinity;
  for (const s of processedSeries) {
    for (const v of s) {
      if (v > allMax) allMax = v;
    }
  }

  if (props.yAxis?.min !== undefined) allMin = props.yAxis.min;
  if (props.yAxis?.max !== undefined) allMax = props.yAxis.max;

  const scale = computeNiceScale(allMin, allMax, props.yAxis?.tickCount ?? Math.min(plotH - 1, 10), plotH);
  const xLabels = Array.from({ length: maxLen }, (_, i) => String(i + 1));

  drawAxes(fb, plotX, plotY, plotW, plotH, scale, xLabels, bg, axisColor, props.xAxis, props.yAxis, props.grid);

  // Use effective plot area for even Y spacing
  const ePH = scale.effectivePlotH ?? plotH;
  const ePY = plotY + (scale.plotYOffset ?? 0);
  const baseY = ePY + ePH - 2;

  // Draw series in reverse order (bottom series first for stacking)
  const drawOrder = stacked
    ? [...processedSeries.keys()].reverse()
    : [...processedSeries.keys()];

  for (const si of drawOrder) {
    const data = processedSeries[si];
    const seriesColor = color(props.series[si].color ?? colors[si % colors.length]);
    const fillColor = dimColor(props.series[si].color ?? colors[si % colors.length], 0.5);

    if (data.length === 0) continue;

    const points: [number, number][] = [];
    for (let i = 0; i < data.length; i++) {
      const t = data.length === 1 ? 0.5 : i / (data.length - 1);
      const x = Math.round(plotX + 1 + t * (plotW - 2));
      const yNorm = (data[i] - scale.min) / (scale.max - scale.min);
      const y = Math.round(ePY + ePH - 2 - yNorm * (ePH - 3));
      points.push([x, y]);
    }

    // Determine baseline for fill
    let baseline: number[] | undefined;
    if (stacked && si > 0) {
      const prevData = processedSeries[si - 1];
      baseline = [];
      for (let i = 0; i < prevData.length; i++) {
        const t = prevData.length === 1 ? 0.5 : i / (prevData.length - 1);
        const yNorm = (prevData[i] - scale.min) / (scale.max - scale.min);
        baseline.push(Math.round(ePY + ePH - 2 - yNorm * (ePH - 3)));
      }
    }

    // Fill area
    for (let i = 0; i < points.length; i++) {
      const [px, py] = points[i];
      const bottom = baseline ? baseline[i] ?? baseY : baseY;
      for (let y = py; y <= bottom; y++) {
        if (y > plotY && y < plotY + plotH - 1 && px > plotX && px < plotX + plotW - 1) {
          fb.setCell(px, y, fillChar, fillColor, bg);
        }
      }
    }

    // Draw top line using quadrant-block sub-pixel rendering for smooth edges
    const innerW = plotW - 2;
    const innerH = ePH - 2;
    const seriesHex = props.series[si].color ?? colors[si % colors.length];
    const qc = new QuadrantCanvas(innerW, innerH);
    const termPts: [number, number][] = [];
    for (let i = 0; i < data.length; i++) {
      const tVal = data.length === 1 ? 0.5 : i / (data.length - 1);
      const xf = tVal * (innerW - 1);
      const yNormF = (data[i] - scale.min) / (scale.max - scale.min);
      const yf = (1 - yNormF) * (innerH - 1);
      termPts.push([xf, yf]);
    }
    for (let i = 0; i < termPts.length - 1; i++) {
      const [ax, ay] = termPts[i];
      const [bxp, byp] = termPts[i + 1];
      qc.drawLine(Math.round(ax * 2), Math.round(ay * 2), Math.round(bxp * 2), Math.round(byp * 2), seriesHex);
    }
    qc.render(fb, plotX + 1, ePY, bg);

    // Dots
    if (showDots) {
      for (const [px, py] of points) {
        fb.setCell(px, py, LINE_CHARS.DOT, seriesColor, bg);
      }
    }
  }

  // Legend
  if (props.legend?.show !== false && props.series.length > 1) {
    const items = props.series.map((s, i) => ({
      name: s.name,
      color: s.color ?? colors[i % colors.length],
    }));
    drawLegend(fb, items, margins.left, height - 1, plotW, bg);
  }
}

export function createAreaChart(
  renderer: RenderContext,
  props: AreaChartProps
): FrameBufferRenderable {
  const canvas = new FrameBufferRenderable(renderer, {
    id: props.id ?? "area-chart",
    width: props.width,
    height: props.height,
  });

  renderAreaChart(canvas.frameBuffer, props.width, props.height, props);
  return canvas;
}

export function updateAreaChart(
  canvas: FrameBufferRenderable,
  props: AreaChartProps
) {
  renderAreaChart(canvas.frameBuffer, props.width, props.height, props);
  canvas.requestRender();
}
