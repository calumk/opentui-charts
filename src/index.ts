/**
 * @opentui-chart
 * A chart plugin for OpenTUI - terminal UI charting library
 *
 * Provides Line, Bar, Pie, Scatter, Area, Stacked Bar, Heatmap, Gauge, and Sparkline charts.
 *
 * Usage:
 *   import { createLineChart, createBarChart } from "@opentui-chart"
 *
 *   const chart = createLineChart(renderer, {
 *     width: 60, height: 20,
 *     series: [{ name: "Sales", data: [10, 20, 30, 40] }],
 *   });
 *   renderer.root.add(chart);
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type {
  DataPoint,
  DataSeries,
  PieSlice,
  ScatterPoint,
  HeatmapCell,
  ChartMargins,
  AxisOptions,
  GridOptions,
  LegendOptions,
  TooltipOptions,
  BaseChartProps,
  LineChartProps,
  BarChartProps,
  PieChartProps,
  ScatterChartProps,
  SparklineProps,
  GaugeChartProps,
  HeatmapChartProps,
  AreaChartProps,
  StackedBarChartProps,
} from "./types";

export { DEFAULT_COLORS, DEFAULT_MARGINS, BLOCK, LINE_CHARS, BRAILLE, PIE_CHARS } from "./types";

// ─── Chart Creators (Imperative API) ────────────────────────────────────────

export {
  createLineChart,
  updateLineChart,
  renderLineChart,
} from "./charts/line";

export {
  createBarChart,
  updateBarChart,
  renderBarChart,
} from "./charts/bar";

export {
  createPieChart,
  updatePieChart,
  renderPieChart,
} from "./charts/pie";

export {
  createScatterChart,
  updateScatterChart,
  renderScatterChart,
} from "./charts/scatter";

export {
  createSparkline,
  updateSparkline,
  renderSparkline,
} from "./charts/sparkline";

export {
  createGaugeChart,
  updateGaugeChart,
  renderGaugeChart,
} from "./charts/gauge";

export {
  createHeatmapChart,
  updateHeatmapChart,
  renderHeatmapChart,
} from "./charts/heatmap";

export {
  createAreaChart,
  updateAreaChart,
  renderAreaChart,
} from "./charts/area";

export {
  createStackedBarChart,
  updateStackedBarChart,
  renderStackedBarChart,
} from "./charts/stacked-bar";

// ─── Utilities ──────────────────────────────────────────────────────────────

export { color, dimColor, lerpColor, computeNiceScale, formatNumber } from "./utils";

// ─── Time Series Buffer ─────────────────────────────────────────────────────

export { TimeSeriesBuffer, MultiSeriesBuffer } from "./time-series";
export type { TimeSeriesBufferOptions } from "./time-series";
