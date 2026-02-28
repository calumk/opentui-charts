/**
 * Bar Chart - vertical and horizontal bar charts
 */

import { FrameBufferRenderable, Box, type RenderContext } from "@opentui/core";
import type { BarChartProps } from "../types";
import { DEFAULT_COLORS, BLOCK } from "../types";
import {
  color,
  dimColor,
  computeNiceScale,
  resolveMargins,
  drawAxes,
  drawLegend,
  formatNumber,
  type FB,
} from "../utils";

export function renderBarChart(
  fb: FB,
  width: number,
  height: number,
  props: BarChartProps
) {
  const bg = color(props.backgroundColor ?? "#1A1A2E");
  const axisColor = color(props.yAxis?.color ?? props.xAxis?.color ?? "#555555");
  const colors = props.colors ?? DEFAULT_COLORS;
  const margins = resolveMargins(props.margins);
  const barChar = props.barChar ?? BLOCK.FULL;
  const orientation = props.orientation ?? "vertical";
  const grouped = props.grouped !== false;

  // Clear
  fb.fillRect(0, 0, width, height, bg);

  // Title
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

  // Find max value across all series
  let allMax = -Infinity;
  let allMin = 0; // bars start at 0
  for (const s of props.series) {
    for (const v of s.data) {
      if (v > allMax) allMax = v;
      if (v < allMin) allMin = v;
    }
  }

  if (props.yAxis?.min !== undefined) allMin = props.yAxis.min;
  if (props.yAxis?.max !== undefined) allMax = props.yAxis.max;

  const scale = computeNiceScale(
    Math.min(0, allMin),
    allMax,
    props.yAxis?.tickCount ?? Math.min(plotH - 1, 12),
    plotH
  );

  const dataLen = Math.max(...props.series.map((s) => s.data.length));
  const labels = props.labels ?? Array.from({ length: dataLen }, (_, i) => String(i + 1));

  if (orientation === "vertical") {
    // Draw axes
    drawAxes(fb, plotX, plotY, plotW, plotH, scale, labels, bg, axisColor, props.xAxis, props.yAxis, props.grid);

    // Use effective plot area for even Y spacing
    const ePH = scale.effectivePlotH ?? plotH;
    const ePYoff = scale.plotYOffset ?? 0;
    const ePY = plotY + ePYoff;

    const numSeries = props.series.length;
    const totalGroups = dataLen;
    const groupWidth = Math.floor((plotW - 2) / totalGroups);
    const gap = props.gap ?? 1;
    const barWidth =
      props.barWidth ??
      (grouped
        ? Math.max(1, Math.floor((groupWidth - gap) / numSeries))
        : Math.max(1, groupWidth - gap));

    for (let gi = 0; gi < totalGroups; gi++) {
      const groupStartX = plotX + 1 + gi * groupWidth;

      for (let si = 0; si < numSeries; si++) {
        const series = props.series[si];
        const val = series.data[gi] ?? 0;
        const seriesColor = color(series.color ?? colors[si % colors.length]);

        const yNorm = (val - scale.min) / (scale.max - scale.min);
        const barH = Math.round(yNorm * (ePH - 2));
        const baseY = ePY + ePH - 2;

        const bx = grouped
          ? groupStartX + si * barWidth + Math.floor(gap / 2)
          : groupStartX + Math.floor(gap / 2);

        for (let row = 0; row < barH; row++) {
          for (let col = 0; col < barWidth; col++) {
            const px = bx + col;
            const py = baseY - row;
            if (px >= plotX + 1 && px < plotX + plotW - 1 && py >= plotY && py < plotY + plotH) {
              fb.setCell(px, py, barChar, seriesColor, bg);
            }
          }
        }
      }
    }
  } else {
    // Horizontal bars
    // Swap axes logic
    const numSeries = props.series.length;
    const totalGroups = dataLen;
    const groupHeight = Math.floor((plotH - 2) / totalGroups);
    const gap = props.gap ?? 1;
    const barHeight =
      grouped
        ? Math.max(1, Math.floor((groupHeight - gap) / numSeries))
        : Math.max(1, groupHeight - gap);

    // Draw Y axis with labels
    for (let gi = 0; gi < totalGroups; gi++) {
      const y = plotY + 1 + gi * groupHeight + Math.floor(groupHeight / 2);
      const label = labels[gi]?.slice(0, margins.left - 1) ?? "";
      fb.drawText(label.padStart(margins.left - 1), 0, y, axisColor, bg);
    }

    // Draw horizontal bars
    for (let gi = 0; gi < totalGroups; gi++) {
      const groupStartY = plotY + 1 + gi * groupHeight;

      for (let si = 0; si < numSeries; si++) {
        const series = props.series[si];
        const val = series.data[gi] ?? 0;
        const seriesColor = color(series.color ?? colors[si % colors.length]);

        const xNorm = (val - scale.min) / (scale.max - scale.min);
        const barW = Math.round(xNorm * (plotW - 2));

        const by = grouped
          ? groupStartY + si * barHeight + Math.floor(gap / 2)
          : groupStartY + Math.floor(gap / 2);

        for (let row = 0; row < barHeight; row++) {
          for (let col = 0; col < barW; col++) {
            const px = plotX + 1 + col;
            const py = by + row;
            if (px < plotX + plotW && py < plotY + plotH) {
              fb.setCell(px, py, barChar, seriesColor, bg);
            }
          }
        }

        // Value label at end
        const valStr = formatNumber(val);
        fb.drawText(valStr, plotX + 1 + Math.round(xNorm * (plotW - 2)) + 1, by, axisColor, bg);
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

export function createBarChart(
  renderer: RenderContext,
  props: BarChartProps
): FrameBufferRenderable {
  const canvas = new FrameBufferRenderable(renderer, {
    id: props.id ?? "bar-chart",
    width: props.width,
    height: props.height,
  });

  renderBarChart(canvas.frameBuffer, props.width, props.height, props);
  return canvas;
}

export function updateBarChart(
  canvas: FrameBufferRenderable,
  props: BarChartProps
) {
  renderBarChart(canvas.frameBuffer, props.width, props.height, props);
  canvas.requestRender();
}
