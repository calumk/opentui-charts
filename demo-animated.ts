/**
 * @opentui-chart — Animated demo (paginated)
 * Run: bun run demo-animated.ts
 *
 * Page 0: All 9 charts in a 3×3 grid (updating live)
 * Pages 1–9: Each chart full-screen (updating live)
 *
 * Press → / SPACE to go forward, ← to go back.
 */

import { createCliRenderer, Text, type Renderable } from "@opentui/core";
import {
  createLineChart,
  updateLineChart,
  createBarChart,
  updateBarChart,
  createPieChart,
  updatePieChart,
  createScatterChart,
  updateScatterChart,
  createGaugeChart,
  updateGaugeChart,
  createSparkline,
  updateSparkline,
  createAreaChart,
  updateAreaChart,
  createHeatmapChart,
  updateHeatmapChart,
  createStackedBarChart,
  updateStackedBarChart,
  TimeSeriesBuffer,
  MultiSeriesBuffer,
} from "./src/index";

const renderer = await createCliRenderer({ exitOnCtrlC: true });

const BG = "#0D1117";
const WINDOW_MS = 60_000;
const UPDATE_MS = 100;
const TOTAL_PAGES = 10; // 0 = grid, 1-9 = individual

// ─── Layout helpers ─────────────────────────────────────────────────────────

const gridCols = 3;
const gridRows = 3;
const pad = 1;

function gridCellW() {
  return Math.floor((renderer.width - pad * (gridCols + 1)) / gridCols);
}
function gridCellH() {
  return Math.floor((renderer.height - pad * (gridRows + 1) - 1) / gridRows);
}
function gridPos(col: number, row: number) {
  const cw = gridCellW();
  const ch = gridCellH();
  return { left: pad + col * (cw + pad), top: pad + row * (ch + pad) };
}

function fullW() { return renderer.width - 4; }
function fullH() { return renderer.height - 4; }

// ─── Chart names ────────────────────────────────────────────────────────────

const CHART_NAMES = [
  "All Charts", "Line", "Bar", "Pie", "Scatter",
  "Area", "Gauge", "Heatmap", "Stacked Bar", "Sparkline",
];

// ─── Simulation Data (shared across pages) ──────────────────────────────────

const lineData = new MultiSeriesBuffer({ windowMs: WINDOW_MS });
let barValues = [90, 120, 75, 140, 110, 95, 130];
const barLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let pieValues = { TS: 45, Zig: 30, MDX: 10, Other: 15 };
let scatterPoints: { x: number; y: number; color: string }[] = [];
const areaData = new MultiSeriesBuffer({ windowMs: WINDOW_MS });
let gaugeValue = 50;
let gaugeDir = 1;
let heatGrid = Array.from({ length: 5 }, () =>
  Array.from({ length: 7 }, () => Math.random() * 10)
);
let stackedValues = {
  Bugs: [15, 22, 18, 10, 8],
  Features: [30, 25, 35, 40, 45],
  Chores: [10, 8, 12, 15, 10],
};
const sparkBuf = new TimeSeriesBuffer({ windowMs: WINDOW_MS });

let cpuBase = 40, memBase = 55, rxBase = 30, txBase = 20, sparkBase = 50;
let tick = 0;
const scatterColors = ["#4FC3F7", "#81C784", "#FFB74D", "#E57373"];

function jitter(base: number, amount: number): number {
  return Math.max(0, base + (Math.random() - 0.5) * amount);
}

// ─── Data update (runs every tick regardless of page) ───────────────────────

function tickData() {
  tick++;

  cpuBase += (Math.random() - 0.5) * 3;
  cpuBase = Math.max(5, Math.min(95, cpuBase));
  memBase += (Math.random() - 0.48) * 2;
  memBase = Math.max(20, Math.min(90, memBase));
  lineData.push("CPU", jitter(cpuBase, 10));
  lineData.push("Mem", jitter(memBase, 8));

  barValues = barValues.map((v) =>
    Math.max(10, Math.min(200, v + Math.round((Math.random() - 0.5) * 15)))
  );

  pieValues.TS = Math.max(5, pieValues.TS + Math.round((Math.random() - 0.5) * 4));
  pieValues.Zig = Math.max(5, pieValues.Zig + Math.round((Math.random() - 0.5) * 3));
  pieValues.MDX = Math.max(2, pieValues.MDX + Math.round((Math.random() - 0.5) * 2));
  pieValues.Other = Math.max(2, pieValues.Other + Math.round((Math.random() - 0.5) * 2));

  scatterPoints.push({
    x: Math.random() * 100,
    y: Math.random() * 100,
    color: scatterColors[Math.floor(Math.random() * scatterColors.length)],
  });
  if (scatterPoints.length > 60) scatterPoints.shift();

  rxBase += (Math.random() - 0.5) * 4;
  rxBase = Math.max(5, Math.min(60, rxBase));
  txBase += (Math.random() - 0.5) * 3;
  txBase = Math.max(3, Math.min(40, txBase));
  areaData.push("RX", jitter(rxBase, 8));
  areaData.push("TX", jitter(txBase, 6));

  gaugeValue += gaugeDir * (0.5 + Math.random() * 1.5);
  if (gaugeValue >= 95) gaugeDir = -1;
  if (gaugeValue <= 5) gaugeDir = 1;
  gaugeValue = Math.max(0, Math.min(100, gaugeValue));

  if (tick % 5 === 0) {
    for (const row of heatGrid) { row.shift(); row.push(Math.random() * 10); }
  }

  if (tick % 3 === 0) {
    stackedValues.Bugs = stackedValues.Bugs.map((v) => Math.max(1, v + Math.round((Math.random() - 0.5) * 4)));
    stackedValues.Features = stackedValues.Features.map((v) => Math.max(5, v + Math.round((Math.random() - 0.5) * 5)));
    stackedValues.Chores = stackedValues.Chores.map((v) => Math.max(1, v + Math.round((Math.random() - 0.5) * 3)));
  }

  sparkBase += (Math.random() - 0.5) * 5;
  sparkBase = Math.max(0, Math.min(100, sparkBase));
  sparkBuf.push(jitter(sparkBase, 8));
}

// ─── Chart props builders (parameterised by size) ───────────────────────────

function lineProps(w: number, h: number) {
  return {
    width: w, height: h, title: "Line (live)",
    series: lineData.toDataSeries({ CPU: "#4FC3F7", Mem: "#E57373" }),
    showDots: false, grid: { show: true }, backgroundColor: BG,
  };
}
function barProps(w: number, h: number) {
  return {
    width: w, height: h, title: "Bar (live)",
    series: [{ name: "Sales", data: barValues, color: "#81C784" }],
    labels: barLabels, grid: { show: true }, backgroundColor: BG,
  };
}
function pieProps(w: number, h: number) {
  return {
    width: w, height: h, title: "Pie (live)",
    slices: [
      { label: "TS", value: pieValues.TS, color: "#3178C6" },
      { label: "Zig", value: pieValues.Zig, color: "#F7A41D" },
      { label: "MDX", value: pieValues.MDX, color: "#FCB32C" },
      { label: "Other", value: pieValues.Other, color: "#888888" },
    ],
    showPercentages: true, backgroundColor: BG,
  };
}
function scatterProps(w: number, h: number) {
  return {
    width: w, height: h, title: "Scatter (live)",
    points: scatterPoints, grid: { show: true }, backgroundColor: BG,
  };
}
function areaProps(w: number, h: number) {
  return {
    width: w, height: h, title: "Area (live)",
    series: areaData.toDataSeries({ RX: "#4FC3F7", TX: "#81C784" }),
    stacked: true, grid: { show: true }, backgroundColor: BG,
  };
}
function gaugeProps(w: number, h: number) {
  return {
    width: w, height: h, title: "Gauge (live)",
    value: Math.round(gaugeValue), label: "Score", showValue: true, backgroundColor: BG,
  };
}
function heatmapProps(w: number, h: number) {
  return {
    width: w, height: h, title: "Heatmap (live)",
    data: heatGrid,
    xLabels: ["M", "T", "W", "T", "F", "S", "S"],
    yLabels: ["W1", "W2", "W3", "W4", "W5"],
    showValues: false, backgroundColor: BG,
  };
}
function stackedProps(w: number, h: number) {
  return {
    width: w, height: h, title: "Stacked Bar (live)",
    series: [
      { name: "Bugs", data: stackedValues.Bugs, color: "#E57373" },
      { name: "Feat", data: stackedValues.Features, color: "#81C784" },
      { name: "Chore", data: stackedValues.Chores, color: "#FFB74D" },
    ],
    labels: ["S1", "S2", "S3", "S4", "S5"],
    grid: { show: true }, backgroundColor: BG,
  };
}
function sparkProps(w: number, h: number) {
  return {
    width: w, height: h, title: "Sparkline (live)",
    data: sparkBuf.getData(), color: "#4FC3F7", style: "line" as const,
    showMinMax: true, backgroundColor: BG,
  };
}

// ─── Page management ────────────────────────────────────────────────────────

type ChartRef = Renderable;

let currentPage = 0;
let activeCharts: { ref: ChartRef; kind: number }[] = [];

const factories = [
  { create: (w: number, h: number) => createLineChart(renderer, lineProps(w, h)),
    update: (r: any, w: number, h: number) => updateLineChart(r, lineProps(w, h)) },
  { create: (w: number, h: number) => createBarChart(renderer, barProps(w, h)),
    update: (r: any, w: number, h: number) => updateBarChart(r, barProps(w, h)) },
  { create: (w: number, h: number) => createPieChart(renderer, pieProps(w, h)),
    update: (r: any, w: number, h: number) => updatePieChart(r, pieProps(w, h)) },
  { create: (w: number, h: number) => createScatterChart(renderer, scatterProps(w, h)),
    update: (r: any, w: number, h: number) => updateScatterChart(r, scatterProps(w, h)) },
  { create: (w: number, h: number) => createAreaChart(renderer, areaProps(w, h)),
    update: (r: any, w: number, h: number) => updateAreaChart(r, areaProps(w, h)) },
  { create: (w: number, h: number) => createGaugeChart(renderer, gaugeProps(w, h)),
    update: (r: any, w: number, h: number) => updateGaugeChart(r, gaugeProps(w, h)) },
  { create: (w: number, h: number) => createHeatmapChart(renderer, heatmapProps(w, h)),
    update: (r: any, w: number, h: number) => updateHeatmapChart(r, heatmapProps(w, h)) },
  { create: (w: number, h: number) => createStackedBarChart(renderer, stackedProps(w, h)),
    update: (r: any, w: number, h: number) => updateStackedBarChart(r, stackedProps(w, h)) },
  { create: (w: number, h: number) => createSparkline(renderer, sparkProps(w, h)),
    update: (r: any, w: number, h: number) => updateSparkline(r, sparkProps(w, h)) },
];

const gridSlots: [number, number][] = [
  [0, 0], [1, 0], [2, 0],
  [0, 1], [1, 1], [2, 1],
  [0, 2], [1, 2], [2, 2],
];

function teardown() {
  for (const c of activeCharts) {
    renderer.root.remove(c.ref as any);
    (c.ref as any).destroy?.();
  }
  activeCharts = [];
}

function showPage(page: number) {
  teardown();
  currentPage = page;

  if (page === 0) {
    const cw = gridCellW();
    const ch = gridCellH();
    for (let i = 0; i < 9; i++) {
      const [col, row] = gridSlots[i];
      const pos = gridPos(col, row);
      const chart = factories[i].create(cw, ch);
      chart.position = "absolute";
      chart.left = pos.left;
      chart.top = pos.top;
      renderer.root.add(chart);
      activeCharts.push({ ref: chart, kind: i });
    }
  } else {
    const idx = page - 1;
    const w = fullW();
    const h = fullH();
    const chart = factories[idx].create(w, h);
    chart.position = "absolute";
    chart.left = 2;
    chart.top = 1;
    renderer.root.add(chart);
    activeCharts.push({ ref: chart, kind: idx });
  }

  (statusText as any).content = `[${page}/${TOTAL_PAGES - 1}] ${CHART_NAMES[page]}  |  ←/→ navigate  |  ${UPDATE_MS}ms  |  Ctrl+C exit`;
}

function updateCharts() {
  // Guard: charts may have been destroyed (e.g. Ctrl+C teardown)
  try {
    if (currentPage === 0) {
      const cw = gridCellW();
      const ch = gridCellH();
      for (const c of activeCharts) {
        factories[c.kind].update(c.ref, cw, ch);
      }
    } else {
      const w = fullW();
      const h = fullH();
      for (const c of activeCharts) {
        factories[c.kind].update(c.ref, w, h);
      }
    }
  } catch {
    // Renderer already torn down — stop updates
    if (timer) clearInterval(timer);
  }
}

// ─── Status bar ─────────────────────────────────────────────────────────────

const statusText = Text({
  content: "",
  fg: "#555555",
  position: "absolute",
  left: pad,
  bottom: 0,
});
renderer.root.add(statusText);

// ─── Start ──────────────────────────────────────────────────────────────────

showPage(0);

let timer: ReturnType<typeof setInterval> | null = setInterval(() => {
  tickData();
  updateCharts();
}, UPDATE_MS);

process.on("SIGINT", () => {
  if (timer) { clearInterval(timer); timer = null; }
});

renderer.keyInput.on("keypress", (key: any) => {
  if (key.name === "right" || key.name === "space" || key.name === "return") {
    showPage((currentPage + 1) % TOTAL_PAGES);
  } else if (key.name === "left") {
    showPage((currentPage - 1 + TOTAL_PAGES) % TOTAL_PAGES);
  }
});
