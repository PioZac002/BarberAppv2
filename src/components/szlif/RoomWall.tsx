import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * The room, hung on the wall.
 *
 * An authored arrangement, not a uniform grid: two photographs carry the
 * whole room, two are details, one is the pole whose red and blue are the
 * page's two inks. Sizes are unequal on purpose, but the rows close level so
 * the wall reads hung rather than dropped.
 *
 * Two source files are small (401px and 524px wide), so those two only ever
 * fill a small frame. Nothing here is upscaled.
 */
type Print = {
    src: string;
    srcSet?: string;
    sizes: string;
    width: number;
    height: number;
    alt: string;
    tag: string;
    note?: string;
    ratio: string;
};

const Frame = ({ print }: { print: Print }) => (
    <figure className="m-0 flex h-full flex-col">
        <div className={cn("photo-frame w-full", print.ratio)}>
            <img
                src={print.src}
                srcSet={print.srcSet}
                sizes={print.sizes}
                alt={print.alt}
                width={print.width}
                height={print.height}
                loading="lazy"
                decoding="async"
            />
        </div>
        <figcaption className="directions mt-2.5 flex items-baseline gap-3">
            <span className="shrink-0">{print.tag}</span>
            {print.note && (
                <span className="min-w-0 normal-case tracking-normal opacity-80">
                    {print.note}
                </span>
            )}
        </figcaption>
    </figure>
);

export const RoomWall = ({ className }: { className?: string }) => {
    const { t } = useLanguage();

    const floor: Print = {
        src: "/media/room-floor.jpg",
        srcSet: "/media/room-floor@sm.jpg 720w, /media/room-floor.jpg 1080w",
        sizes: "(min-width: 1024px) 58vw, 100vw",
        width: 1080, height: 1080,
        alt: t("room.floor"), tag: t("room.tagFloor"), ratio: "aspect-[4/3]",
    };
    // nearly square at source, so a square frame crops almost nothing and the
    // top row closes level against the floor shot
    const pole: Print = {
        src: "/media/room-pole.jpg",
        srcSet: "/media/room-pole@sm.jpg 500w, /media/room-pole.jpg 736w",
        sizes: "(min-width: 1024px) 40vw, 100vw",
        width: 736, height: 785,
        alt: t("room.pole"), tag: t("room.tagPole"), note: t("room.poleNote"),
        ratio: "aspect-square",
    };
    const work: Print = {
        src: "/media/room-work.jpg",
        srcSet: "/media/room-work@sm.jpg 500w, /media/room-work.jpg 736w",
        sizes: "(min-width: 1024px) 32vw, 100vw",
        width: 736, height: 981,
        alt: t("room.work"), tag: t("room.tagWork"), ratio: "aspect-[3/4]",
    };
    const backBar: Print = {
        src: "/media/back-bar.jpg",
        srcSet: "/media/back-bar@0.66.jpg 600w, /media/back-bar.jpg 900w",
        sizes: "(min-width: 1024px) 32vw, 100vw",
        width: 900, height: 1350,
        alt: t("room.backBar"), tag: t("room.tagBackBar"), ratio: "aspect-[3/4]",
    };
    const tools: Print = {
        src: "/media/room-tools.jpg",
        sizes: "(min-width: 1024px) 30vw, 50vw",
        width: 524, height: 640,
        alt: t("room.tools"), tag: t("room.tagTools"), ratio: "aspect-[4/3]",
    };
    const towels: Print = {
        src: "/media/room-towels.jpg",
        sizes: "(min-width: 1024px) 30vw, 50vw",
        width: 401, height: 604,
        alt: t("room.towels"), tag: t("room.tagTowels"), ratio: "aspect-[4/3]",
    };

    return (
        <ul className={cn("grid grid-cols-1 gap-x-4 gap-y-8 lg:grid-cols-12", className)}>
            <li className="lg:col-span-7"><Frame print={floor} /></li>
            <li className="lg:col-span-5"><Frame print={pole} /></li>

            <li className="lg:col-span-4"><Frame print={work} /></li>
            <li className="lg:col-span-4"><Frame print={backBar} /></li>

            {/* the two small originals stack, so the row closes level with the
                tall prints instead of leaving a hole under them */}
            <li className="grid grid-cols-2 gap-x-4 gap-y-8 lg:col-span-4 lg:grid-cols-1">
                <Frame print={tools} />
                <Frame print={towels} />
            </li>
        </ul>
    );
};
