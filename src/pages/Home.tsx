import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Lockup } from "@/components/brand/Szlif";
import { CutReveal } from "@/components/szlif/CutReveal";
import { RoomWall } from "@/components/szlif/RoomWall";
import { catalogName } from "@/lib/catalog-names";

interface Service {
    id: number;
    name: string;
    duration: number;
    price: number;
}

const Home = () => {
    const { t, lang } = useLanguage();
    const [shelf, setShelf] = useState<Service[]>([]);

    // the shelf carries the real tariff, not a hand-typed echo of it, so the
    // first screen and the price list can never disagree
    useEffect(() => {
        let alive = true;
        fetch(`${import.meta.env.VITE_API_URL}/api/public/services`)
            .then(r => (r.ok ? r.json() : []))
            .then((data: Service[]) => {
                if (alive && Array.isArray(data)) setShelf(data.slice(0, 4));
            })
            .catch(() => { /* the shelf simply stands empty; the jar still books */ });
        return () => { alive = false; };
    }, []);

    const reasons = [
        { title: t("home.feature1Title"), desc: t("home.feature1Desc") },
        { title: t("home.feature2Title"), desc: t("home.feature2Desc") },
        { title: t("home.feature3Title"), desc: t("home.feature3Desc") },
        { title: t("home.feature4Title"), desc: t("home.feature4Desc") },
    ];

    return (
        <Layout>
            {/* ══ THE CLAIM, DEMONSTRATED ═══════════════════════════════
                The first viewport does not assert the work, it shows it:
                one sitter, one chair, one light, and a cut line you drag. */}
            <section className="tile-wall relative">
                <div className="flex min-h-[calc(100svh-4rem)] flex-col">
                    <div className="mx-auto flex w-full max-w-[1440px] flex-1 items-center px-5 py-10 md:px-8">
                        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] lg:gap-14">
                            <div className="min-w-0">
                                <h1 className="label-caps text-balance text-wall text-[clamp(1.75rem,3.6vw,3rem)] leading-[1.08]">
                                    {t("home.heroTitle")} {t("home.heroSubtitle")}
                                </h1>
                                <p className="mt-6 max-w-md text-[0.9375rem] leading-relaxed text-wall/85">
                                    {t("home.heroDescription")}
                                </p>
                            </div>

                            <CutReveal
                                className="min-w-0"
                                beforeSrc="/media/cut-before.jpg"
                                afterSrc="/media/cut-after.jpg"
                                beforeAlt={t("cut.before")}
                                afterAlt={t("cut.after")}
                            />
                        </div>
                    </div>

                    {/* the chrome lip everything stands on */}
                    <div className="shelf" aria-hidden />

                    <div className="pb-8 pt-5">
                        <div className="mx-auto flex w-full max-w-[1440px] snap-x gap-3 overflow-x-auto px-5 pb-2 md:px-8">
                            {/* the jar: the shop's one blue object, and the action */}
                            <Link
                                to="/booking"
                                className="plate plate--wall plate-interactive group flex min-h-[8.5rem] w-[15rem] shrink-0 snap-start flex-col justify-between overflow-hidden p-4"
                            >
                                <span className="absolute bottom-1 left-1 right-1 top-1/3 bg-primary" aria-hidden />
                                <span className="absolute left-1 right-1 top-1/3 h-px bg-wall/85" aria-hidden />
                                <span className="relative label-caps text-base">
                                    {t("nav.bookAppointment")}
                                </span>
                                <span className="relative flex items-end justify-between text-primary-foreground">
                                    <span className="net-line text-2xl font-semibold">24/7</span>
                                    <ArrowRight className="mb-1 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                                </span>
                            </Link>

                            {shelf.map(service => (
                                <Link
                                    key={service.id}
                                    to={`/booking?serviceId=${service.id}`}
                                    className="plate plate--wall plate-interactive flex min-h-[8.5rem] w-[14rem] shrink-0 snap-start flex-col justify-between p-4"
                                >
                                    <span className="label-caps text-[0.9375rem] leading-tight">
                                        {catalogName(service.name, lang)}
                                    </span>
                                    <span>
                                        <span className="net-line block text-xl font-semibold">
                                            {Number(service.price).toFixed(2)}
                                            <span className="ml-1 text-micro opacity-60">PLN</span>
                                        </span>
                                        <span className="directions mt-1.5 flex items-baseline justify-between gap-2">
                                            <span>{service.duration} {t("services.duration")}</span>
                                            <span>{t("plate.lot")} {String(service.id).padStart(4, "0")}</span>
                                        </span>
                                    </span>
                                </Link>
                            ))}

                            <Link
                                to="/services"
                                className="plate plate--wall plate-interactive flex min-h-[8.5rem] w-[13rem] shrink-0 snap-start flex-col justify-between border-dashed p-4"
                            >
                                <span className="label-caps text-[0.9375rem] leading-tight">
                                    {t("home.ourServices")}
                                </span>
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ THE ROOM ══════════════════════════════════════════════ */}
            <section className="bg-background py-16 md:py-24">
                <div className="container">
                    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
                        <h2 className="section-head max-w-xl">{t("room.heading")}</h2>
                        <p className="max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
                            {t("room.body")}
                        </p>
                    </div>

                    <RoomWall className="mt-10" />
                </div>
            </section>

            {/* ══ DIRECTIONS FOR USE ════════════════════════════════════ */}
            <section className="bg-background pb-20 md:pb-28">
                <div className="container grid gap-12 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-20">
                    <div>
                        <h2 className="section-head">{t("home.whyChooseUs")}</h2>
                        <p className="mt-5 max-w-prose text-[0.9375rem] leading-relaxed text-muted-foreground">
                            {t("home.whySubtitle")}
                        </p>
                    </div>

                    <ul className="rule-double">
                        {reasons.map(reason => (
                            <li
                                key={reason.title}
                                className="grid gap-x-8 gap-y-2 border-b border-border py-6 md:grid-cols-[minmax(0,16rem)_1fr]"
                            >
                                <h3 className="label-caps text-base leading-snug">{reason.title}</h3>
                                <p className="max-w-prose text-[0.9375rem] leading-relaxed text-muted-foreground">
                                    {reason.desc}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ══ BACK BAR ══════════════════════════════════════════════ */}
            <section className="tile-wall py-20 md:py-28">
                <div className="container flex flex-col items-center text-center">
                    {/* the page closes on the shop's own mark, at the one size
                        where it has room to be a logo rather than a UI element */}
                    <Lockup className="w-[min(22rem,70%)] text-wall" />

                    <h2 className="label-caps mt-12 max-w-3xl text-[clamp(1.75rem,4.5vw,3.25rem)] leading-[1.1] text-wall">
                        {t("home.ctaTitle")}
                    </h2>
                    <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-wall/85">
                        {t("home.ctaDescription")}
                    </p>
                    <Link
                        to="/booking"
                        className="label-caps mt-8 inline-flex h-12 items-center gap-2.5 rounded-[2px] bg-wall px-7 text-[0.9375rem] text-wall-deep shadow-plate transition-transform duration-200 hover:-translate-y-0.5"
                    >
                        {t("home.ctaButton")}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>
        </Layout>
    );
};

export default Home;
