/**
 * Pie Chart - circular pie and donut charts with braille sub-pixel rendering
 */

import { FrameBufferRenderable, type RenderContext } from "@opentui/core";
import type { PieChartProps } from "../types";
import { DEFAULT_COLORS, BLOCK } from "../types";
import { color, resolveMargins, type FB, formatNumber, BrailleCanvas } from "../utils";

export function renderPieChart(
  fb: FB,
  width: number,
  height: number,
  props: PieChartProps
) {
  const bg = color(props.backgroundColor ?? "#1A1A2E");
  const colors = props.colors ?? DEFAULT_COLORS;
  const margins = resolveMargins(props.margins);
  const showPercentages = props.showPercentages !== false;
  const showLabels = props.showLabels !== false;
  const isDonut = props.donut === true;

  fb.fillRect(0, 0, width, height, bg);

  // Title
  let titleOffset = 0;
  if (props.title) {
    fb.drawText(props.title, margins.left, 0, color(props.titleColor ?? "#FFFFFF"), bg);
    titleOffset = 1;
  }

  const total = props.slices.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return;

  // Determine chart area - leave right side for legend
  const legendWidth = showLabels ? Math.min(25, Math.max(15, Math.max(...props.slices.map(s => s.label.length)) + 10)) : 0;
  const chartAreaW = width - margins.left - margins.right - legendWidth;
  const chartAreaH = height - margins.top - margins.bottom - titleOffset;

  if (chartAreaW < 4 || chartAreaH < 4) return;

  // Braille sub-pixel dimensions
  const spW = chartAreaW * 2;
  const spH = chartAreaH * 4;

  // Center in sub-pixel space
  const centerSX = spW / 2;
  const centerSY = spH / 2;

  // Radius in sub-pixels — sub-pixels are ~square so use min dimension
  const maxRadius = Math.min(centerSX, centerSY) - 1;
  const radiusSP = props.radius
    ? props.radius * 4  // convert terminal-cell radius to sub-pixel
    : maxRadius;
  const innerRadiusSP = isDonut
    ? (props.donutInnerRadius
      ? props.donutInnerRadius * 4
      : Math.floor(radiusSP * 0.4))
    : 0;

  // Build angle ranges for each slice
  const sliceAngles: { start: number; end: number }[] = [];
  let currentAngle = -Math.PI / 2; // Start from top

  for (const slice of props.slices) {
    const angle = (slice.value / total) * 2 * Math.PI;
    sliceAngles.push({ start: currentAngle, end: currentAngle + angle });
    currentAngle += angle;
  }

  // Create one BrailleCanvas per slice
  const canvases = props.slices.map(() => new BrailleCanvas(chartAreaW, chartAreaH));

  // Scan all sub-pixels and assign to slices
  for (let sy = 0; sy < spH; sy++) {
    for (let sx = 0; sx < spW; sx++) {
      const nx = sx - centerSX;
      const ny = sy - centerSY;
      const dist = Math.sqrt(nx * nx + ny * ny);

      if (dist > radiusSP || dist < innerRadiusSP) continue;

      const angle = Math.atan2(ny, nx);

      for (let si = 0; si < props.slices.length; si++) {
        const { start, end } = sliceAngles[si];
        let a = angle;
        if (a < start) a += 2 * Math.PI;
        if (a >= start && a < end) {
          canvases[si].set(sx, sy);
          break;
        }
        a = angle + 2 * Math.PI;
        if (a >= start && a < end) {
          canvases[si].set(sx, sy);
          break;
        }
      }
    }
  }

  // Render each slice with its color
  const offsetX = margins.left;
  const offsetY = margins.top + titleOffset;
  for (let si = 0; si < props.slices.length; si++) {
    const sliceColor = color(props.slices[si].color ?? colors[si % colors.length]);
    canvases[si].render(fb, offsetX, offsetY, sliceColor, bg);
  }

  // Draw legend / labels on the right
  if (showLabels) {
    const legendX = margins.left + chartAreaW + 2;
    let legendY = margins.top + titleOffset;

    for (let i = 0; i < props.slices.length; i++) {
      const slice = props.slices[i];
      const pct = ((slice.value / total) * 100).toFixed(1);
      const sliceColor = color(slice.color ?? colors[i % colors.length]);

      if (legendY >= height - margins.bottom) break;

      fb.setCell(legendX, legendY, BLOCK.FULL, sliceColor, bg);
      const label = showPercentages
        ? ` ${slice.label} (${pct}%)`
        : ` ${slice.label}`;
      fb.drawText(label.slice(0, legendWidth - 2), legendX + 1, legendY, color("#AAAAAA"), bg);
      legendY++;
    }
  }

  // Center label for donut
  if (isDonut) {
    const centerTermX = margins.left + Math.floor(chartAreaW / 2);
    const centerTermY = margins.top + titleOffset + Math.floor(chartAreaH / 2);
    const totalStr = formatNumber(total);
    fb.drawText(totalStr, centerTermX - Math.floor(totalStr.length / 2), centerTermY, color("#FFFFFF"), bg);
  }
}

export function createPieChart(
  renderer: RenderContext,
  props: PieChartProps
): FrameBufferRenderable {
  const canvas = new FrameBufferRenderable(renderer, {
    id: props.id ?? "pie-chart",
    width: props.width,
    height: props.height,
  });

  renderPieChart(canvas.frameBuffer, props.width, props.height, props);
  return canvas;
}

export function updatePieChart(
  canvas: FrameBufferRenderable,
  props: PieChartProps
) {
  renderPieChart(canvas.frameBuffer, props.width, props.height, props);
  canvas.requestRender();
}
