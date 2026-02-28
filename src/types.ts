/**
 * @opentui-chart - Chart plugin for OpenTUI
 * Core type definitions
 */

import type { RGBA } from "@opentui/core";

// ─── Data Types ──────────────────────────────────────────────────────────────

export interface DataPoint {
  label?: string;
  value: number;
}

export interface DataSeries {
  name: string;
  data: number[];
  color?: string;
}

export interface PieSlice {
  label: string;
  value: number;
  color?: string;
}

export interface ScatterPoint {
  x: number;
  y: number;
  label?: string;
  color?: string;
}

export interface HeatmapCell {
  x: number;
  y: number;
  value: number;
}

// ─── Chart Options ──────────────────────────────────────────────────────────

export interface ChartMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface AxisOptions {
  show?: boolean;
  label?: string;
  color?: string;
  tickCount?: number;
  min?: number;
  max?: number;
  formatTick?: (value: number) => string;
}

export interface GridOptions {
  show?: boolean;
  color?: string;
  style?: "solid" | "dotted" | "dashed";
}

export interface LegendOptions {
  show?: boolean;
  position?: "top" | "bottom" | "right";
}

export interface TooltipOptions {
  show?: boolean;
}

export interface BaseChartProps {
  id?: string;
  width: number;
  height: number;
  title?: string;
  titleColor?: string;
  backgroundColor?: string;
  borderStyle?: "single" | "double" | "rounded" | "heavy";
  borderColor?: string;
  margins?: Partial<ChartMargins>;
  xAxis?: AxisOptions;
  yAxis?: AxisOptions;
  grid?: GridOptions;
  legend?: LegendOptions;
  colors?: string[];
}

// ─── Specific Chart Props ────────────────────────────────────────────────────

export interface LineChartProps extends BaseChartProps {
  series: DataSeries[];
  showDots?: boolean;
  dotChar?: string;
  lineStyle?: "straight" | "step";
  fillArea?: boolean;
  /** Maximum number of data points to display (sliding window by count) */
  maxPoints?: number;
}

export interface BarChartProps extends BaseChartProps {
  series: DataSeries[];
  labels?: string[];
  barChar?: string;
  orientation?: "vertical" | "horizontal";
  grouped?: boolean;
  barWidth?: number;
  gap?: number;
}

export interface PieChartProps extends Omit<BaseChartProps, "xAxis" | "yAxis" | "grid"> {
  slices: PieSlice[];
  radius?: number;
  showPercentages?: boolean;
  showLabels?: boolean;
  donut?: boolean;
  donutInnerRadius?: number;
}

export interface ScatterChartProps extends BaseChartProps {
  points: ScatterPoint[];
  dotChar?: string;
  defaultColor?: string;
}

export interface SparklineProps {
  id?: string;
  data: number[];
  width: number;
  height?: number;
  color?: string;
  showMinMax?: boolean;
  style?: "line" | "bar" | "dot";
  title?: string;
  titleColor?: string;
  backgroundColor?: string;
}

export interface GaugeChartProps extends Omit<BaseChartProps, "xAxis" | "yAxis" | "grid"> {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  thresholds?: { value: number; color: string }[];
  showValue?: boolean;
  arcChar?: string;
}

export interface HeatmapChartProps extends BaseChartProps {
  data: number[][];
  xLabels?: string[];
  yLabels?: string[];
  colorScale?: string[];
  showValues?: boolean;
}

export interface AreaChartProps extends BaseChartProps {
  series: DataSeries[];
  stacked?: boolean;
  fillChar?: string;
  showDots?: boolean;
}

export interface StackedBarChartProps extends BaseChartProps {
  series: DataSeries[];
  labels?: string[];
  barChar?: string;
  orientation?: "vertical" | "horizontal";
}

// ─── Default Palette ─────────────────────────────────────────────────────────

export const DEFAULT_COLORS = [
  "#4FC3F7", // light blue
  "#81C784", // green
  "#FFB74D", // orange
  "#E57373", // red
  "#BA68C8", // purple
  "#4DD0E1", // cyan
  "#FFD54F", // amber
  "#F06292", // pink
  "#AED581", // light green
  "#90A4AE", // blue grey
];

export const DEFAULT_MARGINS: ChartMargins = {
  top: 2,
  right: 2,
  bottom: 2,
  left: 8,
};

// ─── Block Characters for Drawing ───────────────────────────────────────────

export const BLOCK = {
  FULL: "█",
  SEVEN_EIGHTHS: "▉",
  THREE_QUARTERS: "▊",
  FIVE_EIGHTHS: "▋",
  HALF: "▌",
  THREE_EIGHTHS: "▍",
  QUARTER: "▎",
  EIGHTH: "▏",
  UPPER_HALF: "▀",
  LOWER_HALF: "▄",
  SHADE_LIGHT: "░",
  SHADE_MEDIUM: "▒",
  SHADE_DARK: "▓",
} as const;

export const BRAILLE = {
  BASE: 0x2800,
  // Dot positions (col, row) -> bit offset
  // Col 0: (0,0)=0, (0,1)=1, (0,2)=2, (0,3)=6
  // Col 1: (1,0)=3, (1,1)=4, (1,2)=5, (1,3)=7
  DOTS: [
    [0x01, 0x02, 0x04, 0x40], // Left column
    [0x08, 0x10, 0x20, 0x80], // Right column
  ],
} as const;

export const LINE_CHARS = {
  HORIZONTAL: "─",
  VERTICAL: "│",
  CORNER_TL: "┌",
  CORNER_TR: "┐",
  CORNER_BL: "└",
  CORNER_BR: "┘",
  TEE_LEFT: "├",
  TEE_RIGHT: "┤",
  TEE_TOP: "┬",
  TEE_BOTTOM: "┴",
  CROSS: "┼",
  DOT: "●",
  SMALL_DOT: "·",
  DIAMOND: "◆",
  TRIANGLE_UP: "▲",
  TRIANGLE_DOWN: "▼",
  ARROW_RIGHT: "→",
  ARROW_UP: "↑",
} as const;

export const PIE_CHARS = [
  "█", "▓", "▒", "░", "▚", "▞", "◆", "●", "○", "◇",
] as const;
