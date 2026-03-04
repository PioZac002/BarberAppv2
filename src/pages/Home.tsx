import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Scissors, Clock, Star, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
    const { t } = useLanguage();

    const heroRef     = useRef<HTMLDivElement>(null);
    const heroTitle   = useRef<HTMLHeadingElement>(null);
    const heroDesc    = useRef<HTMLParagraphElement>(null);
    const heroBtns    = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);
    const ctaRef      = useRef<HTMLElement>(null);

    useEffect(() => {
        // Set initial hidden state via JS so elements are visible if GSAP fails
        if (heroTitle.current) gsap.set(heroTitle.current, { y: 60, opacity: 0 });
        if (heroDesc.current)  gsap.set(heroDesc.current,  { y: 40, opacity: 0 });
        if (heroBtns.current)  gsap.set(heroBtns.current,  { y: 30, opacity: 0 });

        const ctx = gsap.context(() => {
            // ── Hero entrance ──
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
            tl.to(heroTitle.current, { y: 0, opacity: 1, duration: 1 })
              .to(heroDesc.current,  { y: 0, opacity: 1, duration: 0.8 }, "-=0.5")
              .to(heroBtns.current,  { y: 0, opacity: 1, duration: 0.7 }, "-=0.4");

            // ── Feature cards scroll-triggered ──
            if (featuresRef.current) {
                const cards = featuresRef.current.querySelectorAll(".feature-card");
                gsap.fromTo(
                    cards,
                    { y: 60, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.7,
                        stagger: 0.15,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: featuresRef.current,
                            start: "top 80%",
                        },
                    }
                );
            }

            // ── CTA section ──
            if (ctaRef.current) {
                gsap.fromTo(
                    ctaRef.current.querySelectorAll(".cta-animate"),
                    { x: -50, opacity: 0 },
                    {
                        x: 0,
                        opacity: 1,
                        duration: 0.8,
                        stagger: 0.2,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: ctaRef.current,
                            start: "top 75%",
                        },
                    }
                );
            }
        });

        return () => ctx.revert();
    }, []);

    const features = [
        {
            icon: <Scissors className="text-white h-8 w-8" />,
            title: t("home.feature1Title"),
            desc: t("home.feature1Desc"),
        },
        {
            icon: <Clock className="text-white h-8 w-8" />,
            title: t("home.feature2Title"),
            desc: t("home.feature2Desc"),
        },
        {
            icon: <Star className="text-white h-8 w-8" />,
            title: t("home.feature3Title"),
            desc: t("home.feature3Desc"),
        },
        {
            icon: <Award className="text-white h-8 w-8" />,
            title: t("home.feature4Title"),
            desc: t("home.feature4Desc"),
        },
    ];

    return (
        <Layout>
            {/* ── Hero ── */}
            <section className="relative h-screen flex items-center" ref={heroRef}>
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.72)), url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80')",
                    }}
                />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-2xl">
                        <h1
                            ref={heroTitle}
                            className="text-4xl md:text-6xl font-bold text-white mb-6"
                        >
                            {t("home.heroTitle")}{" "}
                            <span className="text-barber-gold">{t("home.heroSubtitle")}</span>
                        </h1>
                        <p
                            ref={heroDesc}
                            className="text-lg md:text-xl text-gray-300 mb-8"
                        >
                            {t("home.heroDescription")}
                        </p>
                        <div ref={heroBtns} className="flex flex-wrap gap-4">
                            <Button
                                asChild
                                className="bg-barber hover:bg-barber-muted text-white text-lg px-8 py-6 btn-hover"
                            >
                                <Link to="/booking">{t("home.bookNow")}</Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="bg-white text-gray-900 border-2 border-white hover:bg-barber hover:text-white hover:border-barber text-lg px-8 py-6 transition-all duration-300 font-medium"
                            >
                                <Link to="/services">{t("home.ourServices")}</Link>
                            </Button>
                        </div>
                    </div>
                </div>
                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50">
                    <span className="text-xs tracking-widest uppercase">scroll</span>
                    <div className="w-px h-8 bg-white/30 animate-pulse" />
                </div>
            </section>

            {/* ── Features ── */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4" ref={featuresRef}>
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                            {t("home.whyChooseUs")}
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                            {t("home.whySubtitle")}
                        </p>
                        <div className="w-16 h-1 bg-barber mx-auto mt-5 rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className="feature-card bg-card border border-border p-8 rounded-xl shadow-sm hover:shadow-lg hover:border-barber/40 transition-all duration-300 group"
                            >
                                <div className="bg-barber group-hover:bg-barber-muted rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto transition-colors duration-300">
                                    {f.icon}
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-center text-foreground">
                                    {f.title}
                                </h3>
                                <p className="text-muted-foreground text-center text-sm leading-relaxed">
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section
                ref={ctaRef}
                className="py-20 bg-barber-dark dark:bg-barber-graphite"
            >
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="cta-animate lg:w-1/2">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                                {t("home.ctaTitle")}
                            </h2>
                            <p className="text-lg text-gray-300 mb-6">
                                {t("home.ctaDescription")}
                            </p>
                            <Button
                                asChild
                                className="bg-barber hover:bg-barber-muted text-white text-lg px-8 py-6 btn-hover animate-gold-pulse"
                            >
                                <Link to="/booking" className="flex items-center">
                                    {t("home.ctaButton")}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                        <div className="cta-animate lg:w-2/5">
                            <img
                                src="https://images.unsplash.com/photo-1517832606299-7ae9b720a186?ixlib=rb-4.0.3&auto=format&fit=crop&w=1169&q=80"
                                alt={t("home.ctaImageAlt")}
                                className="rounded-xl shadow-2xl w-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Home;
