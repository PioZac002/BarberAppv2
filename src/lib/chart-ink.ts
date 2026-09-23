/**
 * Chart inks for SZLIF.
 *
 * Series colours resolve through CSS custom properties, so a chart drawn
 * once is correct under work light and after close without the component
 * knowing which hour it is. Recharts writes these straight onto SVG
 * attributes, where custom properties inherit normally.
 */
export const SERIES = [
    "hsl(var(--series-1))",
    "hsl(var(--series-2))",
    "hsl(var(--series-3))",
    "hsl(var(--series-4))",
    "hsl(var(--series-5))",
    "hsl(var(--series-6))",
    "hsl(var(--series-7))",
    "hsl(var(--series-8))",
] as const;

/** Named roles, for charts where a series means something specific. */
export const INK = {
    primary: "hsl(var(--series-1))",
    alert: "hsl(var(--series-2))",
    neutral: "hsl(var(--series-3))",
    grid: "hsl(var(--border))",
    axis: "hsl(var(--muted-foreground))",
    surface: "hsl(var(--card))",
    text: "hsl(var(--foreground))",
} as const;

/** Deal a colour to the n-th series, wrapping the shelf. */
export const seriesInk = (index: number): string => SERIES[index % SERIES.length];
