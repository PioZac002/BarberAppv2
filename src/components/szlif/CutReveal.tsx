import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * The cut.
 *
 * One sitter, one chair, one light — the only thing that changes is the work.
 * The chrome line is the same edge the shelf and the fill bars use, and
 * dragging it is the fill gesture read horizontally, so this adds a control
 * to the product rather than a second motion language.
 *
 * At rest the frame shows "before". The line follows the pointer, is
 * draggable on touch, and answers arrow keys as a slider. The first time it
 * comes into view it sweeps once, so nobody has to guess that it moves.
 */
type CutRevealProps = {
    beforeSrc: string;
    afterSrc: string;
    beforeAlt: string;
    afterAlt: string;
    className?: string;
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** Rest position: essentially all "before", but far enough in that the
 *  chrome line and its grip are on the frame rather than clipped by it. */
const REST = 7;

export const CutReveal = ({
    beforeSrc,
    afterSrc,
    beforeAlt,
    afterAlt,
    className,
}: CutRevealProps) => {
    const { t } = useLanguage();
    const frameRef = useRef<HTMLDivElement>(null);
    const [cut, setCut] = useState(REST);
    const [eased, setEased] = useState(true);
    const [taught, setTaught] = useState(false);

    const setFromClientX = useCallback((clientX: number) => {
        const box = frameRef.current?.getBoundingClientRect();
        if (!box || box.width === 0) return;
        setEased(false);
        setCut(clamp(((clientX - box.left) / box.width) * 100));
    }, []);

    // teach the affordance once, on the way in
    useEffect(() => {
        const node = frameRef.current;
        if (!node || taught) return;

        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        if (reduced) { setTaught(true); return; }

        const io = new IntersectionObserver(entries => {
            if (!entries.some(e => e.isIntersecting)) return;
            io.disconnect();
            setTaught(true);
            setEased(true);
            const show = window.setTimeout(() => setCut(72), 420);
            const rest = window.setTimeout(() => setCut(REST), 1850);
            node.dataset.timers = `${show},${rest}`;
        }, { threshold: 0.45 });

        io.observe(node);
        return () => {
            io.disconnect();
            node.dataset.timers?.split(",").forEach(id => window.clearTimeout(Number(id)));
        };
    }, [taught]);

    const onKeyDown = (e: React.KeyboardEvent) => {
        const step = e.shiftKey ? 10 : 4;
        if (e.key === "ArrowLeft")  { setEased(false); setCut(c => clamp(c - step)); e.preventDefault(); }
        if (e.key === "ArrowRight") { setEased(false); setCut(c => clamp(c + step)); e.preventDefault(); }
        if (e.key === "Home")       { setEased(true);  setCut(REST); e.preventDefault(); }
        if (e.key === "End")        { setEased(true);  setCut(100); e.preventDefault(); }
    };

    return (
        <figure className={cn("m-0", className)}>
            <div
                ref={frameRef}
                className={cn(
                    "photo-frame cut aspect-[3/2] w-full select-none",
                    eased && "cut--eased"
                )}
                style={{ ["--cut" as string]: `${cut}%` }}
                role="slider"
                tabIndex={0}
                aria-label={t("cut.label")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(cut)}
                aria-valuetext={cut < 50 ? t("cut.before") : t("cut.after")}
                onPointerMove={e => setFromClientX(e.clientX)}
                onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setFromClientX(e.clientX); }}
                onPointerLeave={() => { setEased(true); setCut(REST); }}
                onKeyDown={onKeyDown}
            >
                <img
                    src={beforeSrc}
                    alt={beforeAlt}
                    width={1536}
                    height={1024}
                    draggable={false}
                    className="h-full w-full object-cover"
                />

                <div className="cut__after">
                    <img
                        src={afterSrc}
                        alt={afterAlt}
                        width={1536}
                        height={1024}
                        draggable={false}
                        className="h-full w-full object-cover"
                    />
                </div>

                <div className="cut__line" aria-hidden>
                    <span className="cut__grip">
                        {/* solid arrows: thin chevrons disappear at this size */}
                        <svg viewBox="0 0 20 16" className="h-4 w-5" aria-hidden>
                            <path d="M7.5 2 1 8l6.5 6z" fill="currentColor" />
                            <path d="M12.5 2 19 8l-6.5 6z" fill="currentColor" />
                        </svg>
                    </span>
                </div>

                {/* the two states, named on the stock they sit on */}
                <span className="label-caps pointer-events-none absolute bottom-3 left-3 rounded-[2px] bg-ink/70 px-2 py-1 text-[0.625rem] text-wall">
                    {t("cut.before")}
                </span>
                <span
                    className="label-caps pointer-events-none absolute bottom-3 right-3 rounded-[2px] bg-primary px-2 py-1 text-[0.625rem] text-primary-foreground transition-opacity duration-300"
                    style={{ opacity: cut > 12 ? 1 : 0 }}
                >
                    {t("cut.after")}
                </span>
            </div>

            <figcaption className="directions mt-3">{t("cut.caption")}</figcaption>
        </figure>
    );
};
