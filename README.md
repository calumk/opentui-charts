# @opentui-chart/core

A chart plugin for [OpenTUI](https://opentui.com) — render beautiful, high-resolution charts in the terminal.

Provides **9 chart types** with sub-pixel rendering (Unicode quadrant blocks & braille), automatic axis scaling, legends, and built-in time-series buffers for live dashboards.

---

## Chart Types

| Chart | Factory | Description |
|-------|---------|-------------|
| **Line** | `createLineChart()` | Multi-series lines with sub-pixel quadrant rendering, dots, step mode |
| **Bar** | `createBarChart()` | Vertical/horizontal bars, single or grouped |
| **Pie** | `createPieChart()` | Pie and donut charts with labels & percentages (braille fill) |
| **Scatter** | `createScatterChart()` | Scatter plots with per-point colors |
| **Area** | `createAreaChart()` | Filled area charts with quadrant sub-pixel lines, stacking support |
| **Stacked Bar** | `createStackedBarChart()` | Bars stacked per category |
| **Heatmap** | `createHeatmapChart()` | 2D color-intensity grid with optional value labels |
| **Gauge** | `createGaugeChart()` | Semicircular gauge with configurable thresholds (braille arc) |
| **Sparkline** | `createSparkline()` | Compact inline mini-charts (line/bar/dot styles) |

---

## Install

```bash
bun add @opentui/core @opentui-chart/core
```

> **Peer dependency:** `@opentui/core >= 0.1.0`

---

## Quick Start

```typescript
import { createCliRenderer } from "@opentui/core";
import { createLineChart } from "@opentui-chart/core";

const renderer = await createCliRenderer({ exitOnCtrlC: true });

const chart = createLineChart(renderer, {
  width: 60,
  height: 20,
  title: "Revenue",
  series: [
    { name: "2025", data: [10, 25, 35, 42, 55, 63], color: "#4FC3F7" },
    { name: "2026", data: [15, 30, 40, 50, 60, 75], color: "#81C784" },
  ],
  showDots: true,
  grid: { show: true },
});

renderer.root.add(chart);
```

---

## API

Every chart type exports three functions:

| Function | Purpose |
|----------|---------|
| `create*Chart(renderer, props)` | Creates a `FrameBufferRenderable` with the chart drawn |
| `update*Chart(canvas, props)` | Re-renders onto an existing canvas and calls `requestRender()` |
| `render*Chart(fb, w, h, props)` | Low-level: draws directly onto any FrameBuffer |

### Shared Props (`BaseChartProps`)

```typescript
{
  width: number;
  height: number;
  title?: string;
  titleColor?: string;
  backgroundColor?: string;
  margins?: { top, right, bottom, left };
  xAxis?: { show, label, color, tickCount, min, max, formatTick };
  yAxis?: { show, label, color, tickCount, min, max, formatTick };
  grid?: { show, color, style: "solid" | "dotted" | "dashed" };
  legend?: { show, position: "top" | "bottom" | "right" };
  colors?: string[];    // fallback palette
}
```

### Chart-Specific Props

| Chart | Key Props |
|-------|-----------|
| `LineChartProps` | `series`, `showDots`, `lineStyle: "straight" \| "step"`, `fillArea`, `maxPoints` |
| `BarChartProps` | `series`, `labels`, `orientation`, `grouped`, `barWidth`, `gap` |
| `PieChartProps` | `slices`, `showPercentages`, `showLabels`, `donut`, `donutInnerRadius` |
| `ScatterChartProps` | `points`, `dotChar`, `defaultColor` |
| `AreaChartProps` | `series`, `stacked`, `showDots` |
| `StackedBarChartProps` | `series`, `labels`, `orientation` |
| `HeatmapChartProps` | `data: number[][]`, `xLabels`, `yLabels`, `showValues`, `colorScale` |
| `GaugeChartProps` | `value`, `min`, `max`, `label`, `thresholds: { value, color }[]` |
| `SparklineProps` | `data`, `color`, `style: "line" \| "bar" \| "dot"`, `title`, `showMinMax` |

---

## Live Updates

Use `update*Chart()` to re-render a chart in place — ideal for dashboards and real-time data:

```typescript
import { createLineChart, updateLineChart } from "@opentui-chart/core";

const chart = createLineChart(renderer, props);
renderer.root.add(chart);

setInterval(() => {
  props.series[0].data.push(Math.random() * 100);
  updateLineChart(chart, props);   // re-renders + calls requestRender()
}, 200);
```

---

## Time-Series Buffers

Built-in sliding-window buffers keep the last N milliseconds of data and auto-trim old entries.

### `TimeSeriesBuffer`

```typescript
import { TimeSeriesBuffer } from "@opentui-chart/core";

const buf = new TimeSeriesBuffer({ windowMs: 60_000, maxPoints: 200 });

setInterval(() => buf.push(cpuUsage()), 100);

// In your render loop:
updateLineChart(chart, {
  ...props,
  series: [{ name: "CPU", data: buf.getData() }],
});
```

**Methods:** `push(value)`, `pushMany(values)`, `getData()`, `getEntries()`, `last()`, `stats()`, `clear()`

### `MultiSeriesBuffer`

Manages multiple named buffers with a shared time window:

```typescript
import { MultiSeriesBuffer } from "@opentui-chart/core";

const multi = new MultiSeriesBuffer({ windowMs: 30_000 });

setInterval(() => {
  multi.push("cpu", cpuUsage());
  multi.push("mem", memUsage());
}, 100);

updateLineChart(chart, {
  ...props,
  series: multi.toDataSeries({ cpu: "#4FC3F7", mem: "#81C784" }),
});
```

---

## Demos

### Individual Charts

Each chart has a standalone minimal demo in the `demos/` folder:

```bash
bun run demos/line.ts
bun run demos/bar.ts
bun run demos/pie.ts
bun run demos/scatter.ts
bun run demos/area.ts
bun run demos/stacked-bar.ts
bun run demos/heatmap.ts
bun run demos/gauge.ts
bun run demos/sparkline.ts
```

### Multi-Chart Demos

```bash
bun run demo            # Dashboard with 4 charts
bun run demo:all        # All 9 charts — overview grid + individual pages (arrow keys / space)
bun run demo:animated   # All 9 charts live-updating at 100ms — paginated (arrow keys / space)
```

---

## Rendering

- **Line, Area, Sparkline** use a **QuadrantCanvas** (2×2 sub-pixel grid per cell with Unicode quadrant block characters ▘▝▖▗▀▄▌▐█) for smooth, high-resolution curves.
- **Pie, Gauge** use a **BrailleCanvas** (2×4 sub-pixel grid) for detailed arc and area fills.
- **Bar, Stacked Bar, Scatter, Heatmap** render with direct `setCell()` for crisp block output.
- All charts use `computeNiceScale()` for even Y-axis spacing with smart tick values.

---

## Exports

```typescript
// Chart creators, updaters & renderers
import {
  createLineChart,   updateLineChart,   renderLineChart,
  createBarChart,    updateBarChart,    renderBarChart,
  createPieChart,    updatePieChart,    renderPieChart,
  createScatterChart, updateScatterChart, renderScatterChart,
  createAreaChart,   updateAreaChart,   renderAreaChart,
  createStackedBarChart, updateStackedBarChart, renderStackedBarChart,
  createHeatmapChart, updateHeatmapChart, renderHeatmapChart,
  createGaugeChart,  updateGaugeChart,  renderGaugeChart,
  createSparkline,   updateSparkline,   renderSparkline,
} from "@opentui-chart/core";

// Time-series buffers
import { TimeSeriesBuffer, MultiSeriesBuffer } from "@opentui-chart/core";

// Utilities & constants
import { color, dimColor, lerpColor, computeNiceScale, formatNumber } from "@opentui-chart/core";
import { DEFAULT_COLORS, DEFAULT_MARGINS } from "@opentui-chart/core";
```

---

## License

MIT
