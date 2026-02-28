/**
 * Gauge Chart - semicircular gauge / meter with braille sub-pixel rendering
 */

import { FrameBufferRenderable, type RenderContext } from "@opentui/core";
import type { GaugeChartProps } from "../types";
import { color, resolveMargins, type FB, formatNumber, BrailleCanvas } from "../utils";

export function renderGaugeChart(
  fb: FB,
  width: number,
  height: number,
  props: GaugeChartProps
) {
  const bg = color(props.backgroundColor ?? "#1A1A2E");
  const margins = resolveMargins(props.margins);

  fb.fillRect(0, 0, width, height, bg);

  let titleOffset = 0;
  if (props.title) {
    fb.drawText(props.title, margins.left, 0, color(props.titleColor ?? "#FFFFFF"), bg);
    titleOffset = 1;
  }

  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const value = Math.max(min, Math.min(max, props.value));
  const norm = (value - min) / (max - min);

  const chartW = width - margins.left - margins.right;
  const chartH = height - margins.top - margins.bottom - titleOffset;

  if (chartW < 4 || chartH < 3) return;

  // Reserve bottom rows for value/label text
  const textRows = (props.showValue !== false ? 1 : 0) + (props.label ? 1 : 0);
  const arcAreaH = chartH - textRows;
  if (arcAreaH < 2) return;

  // Sub-pixel dimensions
  const spW = chartW * 2;
  const spH = arcAreaH * 4;

  // Center at bottom-center of arc area in sub-pixel space
  const centerSX = spW / 2;
  const centerSY = spH; // bottom edge

  // Radius — the arc is a semicircle, so fit within width/2 horizontally and full height vertically
  const maxRadiusH = spW / 2 - 1;
  const maxRadiusV = spH - 1;
  const outerRadius = Math.min(maxRadiusH, maxRadiusV);
  // Arc thickness in sub-pixels (~15-20% of radius, at least 3)
  const thickness = Math.max(3, Math.floor(outerRadius * 0.18));
  const innerRadius = outerRadius - thickness;

  // Default thresholds
  const thresholds = props.thresholds ?? [
    { value: 0.33, color: "#4CAF50" },
    { value: 0.66, color: "#FFC107" },
    { value: 1.0, color: "#F44336" },
  ];

  function getColorForNorm(n: number): string {
    for (const t of thresholds) {
      if (n <= t.value) return t.color;
    }
    return thresholds[thresholds.length - 1]?.color ?? "#FFFFFF";
  }

  // We need separate canvases for each color used (filled segments + unfilled)
  // Collect unique colors: one per threshold range that's filled, plus one for unfilled
  const unfilledCanvas = new BrailleCanvas(chartW, arcAreaH);
  const colorCanvasMap = new Map<string, BrailleCanvas>();

  function getCanvas(hex: string): BrailleCanvas {
    let bc = colorCanvasMap.get(hex);
    if (!bc) {
      bc = new BrailleCanvas(chartW, arcAreaH);
      colorCanvasMap.set(hex, bc);
    }
    return bc;
  }

  // Scan sub-pixels for the upper semicircle
  for (let sy = 0; sy < spH; sy++) {
    for (let sx = 0; sx < spW; sx++) {
      const nx = sx - centerSX;
      const ny = sy - centerSY;
      const dist = Math.sqrt(nx * nx + ny * ny);

      if (dist > outerRadius || dist < innerRadius) continue;

      // Only upper semicircle (ny <= 0, i.e. angle PI to 0)
      if (ny > 0) continue;

      // Compute angle fraction: PI (left) = 0.0, 0 (right) = 1.0
      const angle = Math.atan2(-ny, nx); // flip Y so angle goes 0..PI from right to left
      const angleFrac = 1 - angle / Math.PI;

      if (angleFrac <= norm) {
        // Filled portion
        const segColor = getColorForNorm(angleFrac);
        getCanvas(segColor).set(sx, sy);
      } else {
        // Unfilled portion
        unfilledCanvas.set(sx, sy);
      }
    }
  }

  // Render unfilled first (background)
  const offsetX = margins.left;
  const offsetY = margins.top + titleOffset;
  unfilledCanvas.render(fb, offsetX, offsetY, color("#333333"), bg);

  // Render filled segments
  for (const [hex, bc] of colorCanvasMap) {
    bc.render(fb, offsetX, offsetY, color(hex), bg);
  }

  // Value display
  const centerTermX = margins.left + Math.floor(chartW / 2);
  let textY = margins.top + titleOffset + arcAreaH;

  if (props.showValue !== false) {
    const valStr = formatNumber(value);
    fb.drawText(
      valStr,
      centerTermX - Math.floor(valStr.length / 2),
      textY,
      color("#FFFFFF"),
      bg
    );
    textY++;
  }

  // Label
  if (props.label) {
    fb.drawText(
      props.label,
      centerTermX - Math.floor(props.label.length / 2),
      textY,
      color("#888888"),
      bg
    );
  }

  // Min/Max labels
  const minStr = formatNumber(min);
  const maxStr = formatNumber(max);
  const bottomY = margins.top + titleOffset + arcAreaH;
  fb.drawText(minStr, margins.left, bottomY, color("#666666"), bg);
  fb.drawText(maxStr, width - margins.right - maxStr.length, bottomY, color("#666666"), bg);
}

export function createGaugeChart(
  renderer: RenderContext,
  props: GaugeChartProps
): FrameBufferRenderable {
  const canvas = new FrameBufferRenderable(renderer, {
    id: props.id ?? "gauge-chart",
    width: props.width,
    height: props.height,
  });

  renderGaugeChart(canvas.frameBuffer, props.width, props.height, props);
  return canvas;
}

export function updateGaugeChart(
  canvas: FrameBufferRenderable,
  props: GaugeChartProps
) {
  renderGaugeChart(canvas.frameBuffer, props.width, props.height, props);
  canvas.requestRender();
}
