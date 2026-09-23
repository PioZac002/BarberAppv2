import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

/** Nothing is filed under this number. The page says so in the shop's own words. */
const NotFound = () => {
    const location = useLocation();
    const { t } = useLanguage();

    useEffect(() => {
        console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }, [location.pathname]);

    return (
        <Layout>
            <section className="tile-wall flex min-h-[calc(100svh-4rem)] flex-col justify-center">
                <div className="mx-auto w-full max-w-[1440px] px-5 py-16 md:px-8">
                    <h1 className="lockup text-wall text-[clamp(5rem,24vw,18rem)]">404</h1>
                    <div className="shelf mt-8" aria-hidden />
                    <p className="directions mt-6 text-wall/70">
                        {t("plate.lot")} —— · {location.pathname}
                    </p>
                    <div className="mt-8 max-w-md">
                        <p className="label-caps text-wall text-xl">{t("notFound.title")}</p>
                        <p className="mt-3 text-sm leading-relaxed text-wall/80">{t("notFound.body")}</p>
                        <Button asChild size="lg" className="mt-7 bg-wall text-wall-deep hover:bg-wall">
                            <Link to="/">{t("notFound.back")}</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default NotFound;
