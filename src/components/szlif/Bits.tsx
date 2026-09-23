import * as React from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mark } from "@/components/brand/Szlif";

/**
 * The shop's own parts. One motion material runs through all of them:
 * liquid rising to an exact line, with a 1px meniscus on top.
 *
 * The gesture is the point, not the level: every vessel mounts empty and
 * fills once it is on screen, so the reading is something arriving at its
 * mark rather than a bar that was always that long.
 */

/** Holds a vessel at zero until it is in view, then lets it fill. */
function useFilled(target: number) {
    const ref = React.useRef<HTMLDivElement>(null);
    const [filled, setFilled] = React.useState(false);

    React.useEffect(() => {
        const node = ref.current;
        if (!node) return;

        // no observer, or motion turned down: arrive at the mark immediately
        const reduced =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

        if (reduced || typeof IntersectionObserver === "undefined") {
            setFilled(true);
            return;
        }

        const io = new IntersectionObserver(
            entries => {
                if (entries.some(e => e.isIntersecting)) {
                    // one frame at zero, so the transition has somewhere to start
                    requestAnimationFrame(() => setFilled(true));
                    io.disconnect();
                }
            },
            { threshold: 0.2 }
        );
        io.observe(node);
        return () => io.disconnect();
    }, []);

    return { ref, level: filled ? clamp(target) : 0 };
}

/* ── the steriliser jar ────────────────────────────────────────── */
type JarProps = {
    /** 0–100; the line the liquid settles at */
    level: number;
    className?: string;
    children?: React.ReactNode;
    /**
     * Standing on the glazed wall the liquid cannot also be the glaze, or the
     * jar disappears into the tile. On the wall it is drawn in label ink, the
     * same inversion the mark uses.
     */
    onWall?: boolean;
};

export const Jar = ({ level, className, children, onWall = false }: JarProps) => {
    const { ref, level: shown } = useFilled(level);
    return (
        <div
            ref={ref}
            className={cn("jar fill", onWall && "jar--wall", className)}
            style={{ ["--level" as string]: `${shown}%` }}
        >
            <div className="fill__liquid" aria-hidden />
            <div className="fill__meniscus" aria-hidden />
            {children && (
                <div className="relative z-10 flex h-full w-full items-end justify-center p-2">
                    {children}
                </div>
            )}
        </div>
    );
};

/* ── a level read straight off the glass ───────────────────────── */
type LevelProps = {
    level: number;
    label?: string;
    value?: string;
    className?: string;
};

/** A horizontal read of the same liquid: used for occupancy and load. */
export const Level = ({ level, label, value, className }: LevelProps) => {
    const { ref, level: pct } = useFilled(level);
    return (
        <div ref={ref} className={cn("w-full", className)}>
            {(label || value) && (
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    {label && <span className="directions">{label}</span>}
                    {value && <span className="net-line text-micro text-foreground">{value}</span>}
                </div>
            )}
            <div
                className="relative h-2 w-full overflow-hidden rounded-[1px] border border-foreground/25 bg-secondary"
                role="meter"
                aria-valuenow={Math.round(clamp(level))}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={label}
            >
                <div
                    className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-700 ease-out-liquid after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-tile/90"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

/* ── a portrait that survives whatever lands in it ─────────────── */
type PortraitProps = {
    src?: string | null;
    alt: string;
    className?: string;
    /** drawn when there is no usable image: a blank station plate */
    fallback?: React.ReactNode;
};

/**
 * Profile and portfolio images are supplied by users and can be missing,
 * broken, or a dead placeholder host. The frame stays the same size and
 * falls back to the drawn mark rather than to a grey hole.
 */
export const Portrait = ({ src, alt, className, fallback }: PortraitProps) => {
    const [failed, setFailed] = React.useState(false);
    const usable = !!src && !failed && !/via\.placeholder\.com/.test(src);

    return (
        <div className={cn("photo-frame", className)}>
            {usable ? (
                <img src={src!} alt={alt} loading="lazy" onError={() => setFailed(true)} />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary">
                    {fallback ?? <Mark className="h-16 text-muted-foreground/25" />}
                </div>
            )}
        </div>
    );
};

/* ── the demonstration-data notice ─────────────────────────────── */
/**
 * The shop is fictional and the records on these pages are seeded. Saying so
 * plainly, on the pages where the content would otherwise read as proof, is
 * part of the product: nothing here claims to be a verified customer.
 */
export const DemoNotice = ({ className }: { className?: string }) => {
    const { t } = useLanguage();
    return (
        <aside className={cn("plate flex items-start gap-3 p-4", className)}>
            <span className="stamp stamp--alert mt-0.5 shrink-0">{t("plate.demoNotice")}</span>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                {t("plate.demoNoticeBody")}
            </p>
        </aside>
    );
};

/* ── an initials plate, for people with no portrait on file ────── */
/**
 * Demo reviewers have no photograph, and an external avatar service is a
 * dependency that can only break. Initials set in the label cut on a framed
 * tile are authored here, need no network, and claim nothing.
 */
export const Initials = ({
    name,
    className,
}: {
    name: string;
    className?: string;
}) => {
    const letters = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() ?? "")
        .join("");

    return (
        <span
            className={cn(
                "label-caps flex shrink-0 items-center justify-center rounded-[2px]",
                "border border-foreground/35 bg-secondary text-[0.8125rem] text-foreground/80",
                className
            )}
            aria-hidden
        >
            {letters || "—"}
        </span>
    );
};

/* ── the printed net-content line ──────────────────────────────── */
type NetLineProps = {
    items: Array<{ label: string; value: string }>;
    className?: string;
};

export const NetLine = ({ items, className }: NetLineProps) => (
    <dl className={cn("flex flex-wrap items-baseline gap-x-5 gap-y-1", className)}>
        {items.map(item => (
            <div key={item.label} className="flex items-baseline gap-1.5">
                <dt className="directions">{item.label}</dt>
                <dd className="net-line text-sm font-medium">{item.value}</dd>
            </div>
        ))}
    </dl>
);

/* ── the lot mark that files a record ──────────────────────────── */
export const Lot = ({ value, className }: { value: string | number; className?: string }) => {
    const { t } = useLanguage();
    return (
        <span className={cn("directions whitespace-nowrap", className)}>
            {t("plate.lot")} {String(value).padStart(4, "0")}
        </span>
    );
};

/* ── the provenance strip every record carries ─────────────────── */
type ProvenanceProps = {
    who?: string | null;
    when?: string | null;
    rev?: string | number | null;
    className?: string;
};

export const Provenance = ({ who, when, rev, className }: ProvenanceProps) => {
    const { t } = useLanguage();
    const parts = [
        who ? who : null,
        when ? when : null,
        rev !== undefined && rev !== null ? `${t("plate.rev")} ${rev}` : null,
    ].filter(Boolean) as string[];

    if (!parts.length) return null;

    return (
        <p className={cn("directions border-t border-border pt-2", className)}>
            {t("plate.filed")} · {parts.join(" · ")}
        </p>
    );
};

function clamp(n: number) {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
}
