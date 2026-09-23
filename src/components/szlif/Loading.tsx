import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Jar } from "./Bits";
import { Mark } from "@/components/brand/Szlif";

/**
 * The demo backend sleeps on Render's free tier and takes 30–60 seconds to
 * wake. Rather than apologise for it with a spinner, the wait is the shop's
 * signature gesture: the jar fills while the back room comes up, and after
 * a few seconds it says plainly what is happening.
 */
type JarLoaderProps = {
    label?: string;
    className?: string;
    /** seconds before the cold-start explanation appears */
    explainAfter?: number;
};

export const JarLoader = ({ label, className, explainAfter = 4 }: JarLoaderProps) => {
    const { t } = useLanguage();
    const [level, setLevel] = useState(8);
    const [slow, setSlow] = useState(false);

    useEffect(() => {
        // the liquid climbs towards the line but never quite reaches it
        // while we are still waiting — arriving is what finishing looks like
        const tick = setInterval(() => {
            setLevel(prev => (prev >= 88 ? 88 : prev + (88 - prev) * 0.18));
        }, 700);
        const slowTimer = setTimeout(() => setSlow(true), explainAfter * 1000);
        return () => { clearInterval(tick); clearTimeout(slowTimer); };
    }, [explainAfter]);

    return (
        <div
            className={cn("flex flex-col items-center justify-center gap-5 py-16 text-center", className)}
            role="status"
            aria-live="polite"
        >
            <Jar level={level} className="h-24 w-16" />
            <div className="max-w-sm">
                <p className="label-caps text-sm">{label ?? t("common.loading")}</p>
                {slow && (
                    <p className="plate-enter mt-2 text-sm leading-relaxed text-muted-foreground">
                        <span className="block font-medium text-foreground">{t("plate.waking")}</span>
                        {t("plate.wakingHint")}
                    </p>
                )}
            </div>
        </div>
    );
};

/** The empty shelf: a blank label with nothing filed against it. */
export const EmptyShelf = ({
    title,
    hint,
    action,
    className,
}: {
    title?: string;
    hint?: string;
    action?: React.ReactNode;
    className?: string;
}) => {
    const { t } = useLanguage();
    return (
        <div className={cn("plate flex flex-col items-center gap-4 px-6 py-14 text-center", className)}>
            <Mark className="h-14 text-muted-foreground/30" />
            <div>
                <p className="label-caps text-sm">{title ?? t("plate.empty")}</p>
                <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {hint ?? t("plate.emptyHint")}
                </p>
            </div>
            {action}
        </div>
    );
};
