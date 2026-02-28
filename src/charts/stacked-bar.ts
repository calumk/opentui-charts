/**
 * Stacked Bar Chart - bars stacked on top of each other
 */

import { FrameBufferRenderable, type RenderContext } from "@opentui/core";
import type { StackedBarChartProps } from "../types";
import { DEFAULT_COLORS, BLOCK } from "../types";
import {
  color,
  computeNiceScale,
  resolveMargins,
  drawAxes,
  drawLegend,
  formatNumber,
  type FB,
} from "../utils";

export function renderStackedBarChart(
  fb: FB,
  width: number,
  height: number,
  props: StackedBarChartProps
) {
  const bg = color(props.backgroundColor ?? "#1A1A2E");
  const axisColor = color(props.yAxis?.color ?? "#555555");
  const colors = props.colors ?? DEFAULT_COLORS;
  const margins = resolveMargins(props.margins);
  const barChar = props.barChar ?? BLOCK.FULL;
  const orientation = props.orientation ?? "vertical";

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

  const dataLen = Math.max(...props.series.map((s) => s.data.length));
  const labels = props.labels ?? Array.from({ length: dataLen }, (_, i) => String(i + 1));

  // Compute stacked totals per data point
  const stackedTotals: number[] = [];
  for (let i = 0; i < dataLen; i++) {
    let total = 0;
    for (const s of props.series) {
      total += s.data[i] ?? 0;
    }
    stackedTotals.push(total);
  }

  const allMax = Math.max(...stackedTotals);
  const scale = computeNiceScale(0, allMax, props.yAxis?.tickCount ?? Math.min(plotH - 1, 12), plotH);

  if (orientation === "vertical") {
    drawAxes(fb, plotX, plotY, plotW, plotH, scale, labels, bg, axisColor, props.xAxis, props.yAxis, props.grid);

    // Use effective plot area for even Y spacing
    const ePH = scale.effectivePlotH ?? plotH;
    const ePY = plotY + (scale.plotYOffset ?? 0);

    const groupWidth = Math.floor((plotW - 2) / dataLen);
    const barWidth = Math.max(1, groupWidth - 2);
    const gap = Math.floor((groupWidth - barWidth) / 2);
    const baseY = ePY + ePH - 2;

    for (let gi = 0; gi < dataLen; gi++) {
      const barX = plotX + 1 + gi * groupWidth + gap;
      let currentBase = baseY;

      for (let si = 0; si < props.series.length; si++) {
        const val = props.series[si].data[gi] ?? 0;
        const seriesColor = color(props.series[si].color ?? colors[si % colors.length]);

        const yNorm = val / (scale.max - scale.min);
        const barH = Math.round(yNorm * (ePH - 2));

        for (let row = 0; row < barH; row++) {
          for (let col = 0; col < barWidth; col++) {
            const px = barX + col;
            const py = currentBase - row;
            if (px > plotX && px < plotX + plotW - 1 && py >= plotY && py < plotY + plotH) {
              fb.setCell(px, py, barChar, seriesColor, bg);
            }
          }
        }

        currentBase -= barH;
      }
    }
  } else {
    // Horizontal stacked bars
    const groupHeight = Math.floor((plotH - 2) / dataLen);
    const barHeight = Math.max(1, groupHeight - 2);
    const gap = Math.floor((groupHeight - barHeight) / 2);

    for (let gi = 0; gi < dataLen; gi++) {
      const y = plotY + 1 + gi * groupHeight + gap;
      const label = labels[gi]?.slice(0, margins.left - 1) ?? "";
      fb.drawText(label.padStart(margins.left - 1), 0, y, axisColor, bg);

      let currentX = plotX + 1;

      for (let si = 0; si < props.series.length; si++) {
        const val = props.series[si].data[gi] ?? 0;
        const seriesColor = color(props.series[si].color ?? colors[si % colors.length]);

        const xNorm = val / (scale.max - scale.min);
        const barW = Math.round(xNorm * (plotW - 2));

        for (let row = 0; row < barHeight; row++) {
          for (let col = 0; col < barW; col++) {
            const px = currentX + col;
            const py = y + row;
            if (px < plotX + plotW && py < plotY + plotH) {
              fb.setCell(px, py, barChar, seriesColor, bg);
            }
          }
        }

        currentX += barW;
      }
    }
  }

  // Legend
  if (props.legend?.show !== false) {
    const items = props.series.map((s, i) => ({
      name: s.name,
      color: s.color ?? colors[i % colors.length],
    }));
    drawLegend(fb, items, margins.left, height - 1, plotW, bg);
  }
}

export function createStackedBarChart(
  renderer: RenderContext,
  props: StackedBarChartProps
): FrameBufferRenderable {
  const canvas = new FrameBufferRenderable(renderer, {
    id: props.id ?? "stacked-bar-chart",
    width: props.width,
    height: props.height,
  });

  renderStackedBarChart(canvas.frameBuffer, props.width, props.height, props);
  return canvas;
}

export function updateStackedBarChart(
  canvas: FrameBufferRenderable,
  props: StackedBarChartProps
) {
  renderStackedBarChart(canvas.frameBuffer, props.width, props.height, props);
  canvas.requestRender();
}
