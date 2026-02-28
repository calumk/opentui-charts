/**
 * TimeSeriesBuffer — a sliding-window data buffer for real-time charts.
 *
 * Stores timestamped values and automatically trims entries outside
 * the configured time window. Designed for use with any chart type
 * that accepts a `number[]` data array.
 *
 * Usage:
 *   const buf = new TimeSeriesBuffer({ windowMs: 60_000 }); // last 60s
 *   setInterval(() => buf.push(Math.random() * 100), 100);
 *   // In render loop:
 *   updateLineChart(canvas, { series: [{ name: "live", data: buf.getData() }], ... });
 */

export interface TimeSeriesBufferOptions {
  /** Duration of the sliding window in milliseconds (default: 60_000 = 1 minute) */
  windowMs?: number;
  /** Maximum number of data points to keep regardless of time (default: unlimited) */
  maxPoints?: number;
}

interface TimestampedValue {
  t: number; // Date.now()
  v: number;
}

export class TimeSeriesBuffer {
  private entries: TimestampedValue[] = [];
  private _windowMs: number;
  private _maxPoints: number;

  constructor(opts: TimeSeriesBufferOptions = {}) {
    this._windowMs = opts.windowMs ?? 60_000;
    this._maxPoints = opts.maxPoints ?? Infinity;
  }

  /** Current window duration in ms */
  get windowMs(): number {
    return this._windowMs;
  }
  set windowMs(ms: number) {
    this._windowMs = ms;
    this.trim();
  }

  /** Maximum number of points */
  get maxPoints(): number {
    return this._maxPoints;
  }
  set maxPoints(n: number) {
    this._maxPoints = n;
    this.trim();
  }

  /** Number of entries currently stored */
  get length(): number {
    return this.entries.length;
  }

  /** Push a value with the current timestamp */
  push(value: number, timestamp?: number) {
    this.entries.push({ t: timestamp ?? Date.now(), v: value });
    this.trim();
  }

  /** Push multiple values at once (each gets the current timestamp) */
  pushMany(values: number[]) {
    const now = Date.now();
    for (const v of values) {
      this.entries.push({ t: now, v });
    }
    this.trim();
  }

  /** Get the raw values within the current window as a plain number array */
  getData(): number[] {
    this.trim();
    return this.entries.map((e) => e.v);
  }

  /** Get entries with timestamps */
  getEntries(): { time: number; value: number }[] {
    this.trim();
    return this.entries.map((e) => ({ time: e.t, value: e.v }));
  }

  /** Get the most recent value, or undefined if empty */
  last(): number | undefined {
    return this.entries.length > 0
      ? this.entries[this.entries.length - 1].v
      : undefined;
  }

  /** Get min/max/avg of current window */
  stats(): { min: number; max: number; avg: number; count: number } {
    this.trim();
    if (this.entries.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0 };
    }
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    for (const e of this.entries) {
      if (e.v < min) min = e.v;
      if (e.v > max) max = e.v;
      sum += e.v;
    }
    return { min, max, avg: sum / this.entries.length, count: this.entries.length };
  }

  /** Clear all data */
  clear() {
    this.entries.length = 0;
  }

  /** Remove entries outside the window */
  private trim() {
    const cutoff = Date.now() - this._windowMs;
    // Remove old entries from front
    while (this.entries.length > 0 && this.entries[0].t < cutoff) {
      this.entries.shift();
    }
    // Enforce max points
    while (this.entries.length > this._maxPoints) {
      this.entries.shift();
    }
  }
}

/**
 * MultiSeriesBuffer — manages multiple named TimeSeriesBuffers
 * with synchronized time windows.
 */
export class MultiSeriesBuffer {
  private buffers: Map<string, TimeSeriesBuffer> = new Map();
  private _windowMs: number;
  private _maxPoints: number;

  constructor(opts: TimeSeriesBufferOptions = {}) {
    this._windowMs = opts.windowMs ?? 60_000;
    this._maxPoints = opts.maxPoints ?? Infinity;
  }

  /** Get or create a buffer for a named series */
  series(name: string): TimeSeriesBuffer {
    let buf = this.buffers.get(name);
    if (!buf) {
      buf = new TimeSeriesBuffer({
        windowMs: this._windowMs,
        maxPoints: this._maxPoints,
      });
      this.buffers.set(name, buf);
    }
    return buf;
  }

  /** Push a value to a named series */
  push(name: string, value: number, timestamp?: number) {
    this.series(name).push(value, timestamp);
  }

  /** Get DataSeries[] suitable for LineChartProps / AreaChartProps */
  toDataSeries(colorMap?: Record<string, string>): { name: string; data: number[]; color?: string }[] {
    return Array.from(this.buffers.entries()).map(([name, buf]) => ({
      name,
      data: buf.getData(),
      color: colorMap?.[name],
    }));
  }

  /** Update all buffers' window */
  set windowMs(ms: number) {
    this._windowMs = ms;
    for (const buf of this.buffers.values()) {
      buf.windowMs = ms;
    }
  }

  get windowMs(): number {
    return this._windowMs;
  }

  /** Clear all series */
  clear() {
    for (const buf of this.buffers.values()) {
      buf.clear();
    }
  }

  /** List series names */
  get names(): string[] {
    return Array.from(this.buffers.keys());
  }
}
