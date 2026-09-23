import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./app/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}",
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: { DEFAULT: '1.25rem', md: '2rem' },
            screens: { '2xl': '1440px' }
        },
        extend: {
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                /* ── SZLIF: back bar materials ── */
                glaze:  'hsl(var(--glaze))',    /* barbicide blue, the drenched field */
                grout:  'hsl(var(--grout))',    /* the line between tiles */
                tile:   'hsl(var(--tile))',     /* glazed white */
                label:  'hsl(var(--label))',    /* label stock */
                chrome: 'hsl(var(--chrome))',   /* metal edge */
                ink:    'hsl(var(--ink))',      /* first ink */
                ink2:   'hsl(var(--ink2))',     /* second ink: stamps, alerts */
                wall:   'hsl(var(--wall-ink))', /* type on the glazed wall, both hours */
                'wall-deep': 'hsl(var(--wall-deep))',
                /* the other bottles on the shelf, for charts and record types */
                series: {
                    1: 'hsl(var(--series-1))',
                    2: 'hsl(var(--series-2))',
                    3: 'hsl(var(--series-3))',
                    4: 'hsl(var(--series-4))',
                    5: 'hsl(var(--series-5))',
                    6: 'hsl(var(--series-6))',
                    7: 'hsl(var(--series-7))',
                    8: 'hsl(var(--series-8))',
                },
                sidebar: {
                    DEFAULT: 'hsl(var(--sidebar-background))',
                    foreground: 'hsl(var(--sidebar-foreground))',
                    primary: 'hsl(var(--sidebar-primary))',
                    'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
                    accent: 'hsl(var(--sidebar-accent))',
                    'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
                    border: 'hsl(var(--sidebar-border))',
                    ring: 'hsl(var(--sidebar-ring))'
                }
            },
            fontFamily: {
                sans: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                mono: ['"Spline Sans Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
            },
            fontSize: {
                /* the label's small print: never below 11px, always tracked */
                micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
            },
            transitionTimingFunction: {
                /* the liquid's curve: fast out of the gate, long settle */
                'out-liquid': 'cubic-bezier(0.16, 1, 0.3, 1)',
                'in-liquid': 'cubic-bezier(0.64, 0, 0.78, 0)',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 1px)',
                sm: '1px'
            },
            boxShadow: {
                /* a shelf and a plate cast real shadows: offset plus blur, never a halo */
                plate: '0 1px 2px hsl(var(--shadow) / 0.10), 0 8px 20px -10px hsl(var(--shadow) / 0.28)',
                'plate-lift': '0 2px 4px hsl(var(--shadow) / 0.12), 0 18px 36px -14px hsl(var(--shadow) / 0.36)',
                shelf: '0 6px 14px -6px hsl(var(--shadow) / 0.45)',
                jar: 'inset 0 1px 0 hsl(0 0% 100% / 0.22), 0 2px 4px hsl(var(--shadow) / 0.18)',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to:   { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to:   { height: '0' }
                },
                'plate-in': {
                    from: { opacity: '0', transform: 'translateY(10px)' },
                    to:   { opacity: '1', transform: 'translateY(0)' }
                },
                'stamp-in': {
                    from: { opacity: '0', transform: 'scale(1.18)' },
                    to:   { opacity: '1', transform: 'scale(1)' }
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
                'accordion-up':   'accordion-up 0.18s cubic-bezier(0.64, 0, 0.78, 0)',
                'plate-in':       'plate-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'stamp-in':       'stamp-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config;
