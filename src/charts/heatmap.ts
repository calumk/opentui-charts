/**
 * Heatmap Chart - 2D grid colored by value intensity
 */

import { FrameBufferRenderable, type RenderContext } from "@opentui/core";
import type { HeatmapChartProps } from "../types";
import { BLOCK } from "../types";
import { color, lerpColor, resolveMargins, type FB, formatNumber } from "../utils";

export function renderHeatmapChart(
  fb: FB,
  width: number,
  height: number,
  props: HeatmapChartProps
) {
  const bg = color(props.backgroundColor ?? "#1A1A2E");
  const axisColor = color(props.yAxis?.color ?? "#555555");
  const margins = resolveMargins(props.margins);
  const showValues = props.showValues ?? false;
  const colorScale = props.colorScale ?? ["#1A237E", "#1565C0", "#4FC3F7", "#FFD54F", "#FF6F00", "#D50000"];

  fb.fillRect(0, 0, width, height, bg);

  let titleOffset = 0;
  if (props.title) {
    fb.drawText(props.title, margins.left, 0, color(props.titleColor ?? "#FFFFFF"), bg);
    titleOffset = 1;
  }

  const data = props.data;
  if (data.length === 0) return;

  const rows = data.length;
  const cols = Math.max(...data.map((r) => r.length));

  // Find min/max
  let vMin = Infinity, vMax = -Infinity;
  for (const row of data) {
    for (const v of row) {
      if (v < vMin) vMin = v;
      if (v > vMax) vMax = v;
    }
  }

  const plotX = margins.left;
  const plotY = margins.top + titleOffset;
  const plotW = width - margins.left - margins.right;
  const plotH = height - margins.top - margins.bottom - titleOffset;

  if (plotW < 3 || plotH < 3) return;

  // Cell sizes
  const cellW = Math.max(1, Math.floor(plotW / cols));
  const cellH = Math.max(1, Math.floor(plotH / rows));

  function getHeatColor(value: number): ReturnType<typeof lerpColor> {
    const norm = vMax === vMin ? 0.5 : (value - vMin) / (vMax - vMin);
    const scaleLen = colorScale.length - 1;
    const idx = norm * scaleLen;
    const lower = Math.floor(idx);
    const upper = Math.min(lower + 1, scaleLen);
    const t = idx - lower;
    return lerpColor(colorScale[lower], colorScale[upper], t);
  }

  // Draw cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = data[r]?.[c] ?? 0;
      const cellColor = getHeatColor(val);

      const cx = plotX + c * cellW;
      const cy = plotY + r * cellH;

      for (let dy = 0; dy < cellH && cy + dy < plotY + plotH; dy++) {
        for (let dx = 0; dx < cellW && cx + dx < plotX + plotW; dx++) {
          fb.setCell(cx + dx, cy + dy, BLOCK.FULL, cellColor, bg);
        }
      }

      // Show value text in cell
      if (showValues && cellW >= 3 && cellH >= 1) {
        const valStr = formatNumber(val).slice(0, cellW);
        const textX = cx + Math.floor((cellW - valStr.length) / 2);
        const textY = cy + Math.floor(cellH / 2);
        if (textX >= 0 && textY >= 0 && textX + valStr.length <= width) {
          fb.drawText(valStr, textX, textY, color("#FFFFFF"), cellColor);
        }
      }
    }
  }

  // Y labels
  if (props.yLabels) {
    for (let r = 0; r < rows && r < props.yLabels.length; r++) {
      const y = plotY + r * cellH + Math.floor(cellH / 2);
      const label = props.yLabels[r].slice(0, margins.left - 1);
      fb.drawText(label.padStart(margins.left - 1), 0, y, axisColor, bg);
    }
  }

  // X labels
  if (props.xLabels) {
    const labelY = plotY + plotH;
    for (let c = 0; c < cols && c < props.xLabels.length; c++) {
      const x = plotX + c * cellW;
      const label = props.xLabels[c].slice(0, cellW);
      if (labelY < height) {
        fb.drawText(label, x, labelY, axisColor, bg);
      }
    }
  }
}

export function createHeatmapChart(
  renderer: RenderContext,
  props: HeatmapChartProps
): FrameBufferRenderable {
  const canvas = new FrameBufferRenderable(renderer, {
    id: props.id ?? "heatmap-chart",
    width: props.width,
    height: props.height,
  });

  renderHeatmapChart(canvas.frameBuffer, props.width, props.height, props);
  return canvas;
}

export function updateHeatmapChart(
  canvas: FrameBufferRenderable,
  props: HeatmapChartProps
) {
  renderHeatmapChart(canvas.frameBuffer, props.width, props.height, props);
  canvas.requestRender();
}
