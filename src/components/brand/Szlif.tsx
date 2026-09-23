import { cn } from "@/lib/utils";

/**
 * SZLIF — the shop's mark.
 *
 * The artwork is the one supplied for this build: a head in profile, faded
 * and bearded. It ships as an alpha mask (see `.brand-mark` in index.css),
 * so it takes the ink of whatever it is printed on instead of shipping a
 * light copy and a dark copy. The soft blue halo the file arrived with was
 * removed, not covered: a glow around a mark is the first thing that reads
 * as generated, and white artwork on the shop's glaze needs none.
 *
 * It is an illustration, not an icon: it holds from roughly 32px up, which
 * is why the favicon ships at 64 and the small PWA sizes are padded.
 */

type MarkProps = {
    className?: string;
};

export const Mark = ({ className }: MarkProps) => (
    <span
        className={cn("brand-mark h-8 w-auto shrink-0", className)}
        role="img"
        aria-label="Szlif"
    />
);

/**
 * The full lockup: mark, wordmark, trade line and the shop's own line.
 * Used where the logo has room to be a logo — never beside the typographic
 * wordmark, so one SZLIF lettering is on screen at a time.
 */
export const Lockup = ({ className }: { className?: string }) => (
    <span
        className={cn("brand-lockup w-44", className)}
        role="img"
        aria-label="Szlif — barbershop"
    />
);

type WordmarkProps = {
    className?: string;
    /** the trade line under the name; omitted in tight places */
    sub?: boolean;
    subLabel?: string;
};

/** The mark beside the name set in the interface face. */
export const MarkWithName = ({ className, sub = false, subLabel }: WordmarkProps) => (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
        <Mark className="h-8" />
        <span className="inline-flex flex-col leading-none">
            <span className="lockup text-[1.35rem]">Szlif</span>
            {sub && (
                <span className="directions mt-1 text-[0.5625rem] tracking-[0.22em] text-current opacity-70">
                    {subLabel}
                </span>
            )}
        </span>
    </span>
);
