import React from "react";
import useEmblaCarousel, { EmblaOptions, EmblaCarouselType } from "embla-carousel-react";

type CarouselProps = {
    options?: EmblaOptions;
    children: React.ReactNode;
};

export function Carousel({ options, children }: CarouselProps) {
    const [emblaRef, api] = useEmblaCarousel(options);
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const onSelect = React.useCallback(() => {
        if (!api) return;
        setCanScrollPrev(api.canScrollPrev()); // Fixed: Added parentheses
        setCanScrollNext(api.canScrollNext()); // Fixed: Added parentheses
    }, [api]);

    React.useEffect(() => {
        if (!api) return;
        api.on("reInit", onSelect);
        api.on("select", onSelect);
        onSelect();
        return () => {
            api.off("select", onSelect);
        };
    }, [api, onSelect]);

    return (
        <div ref={emblaRef}>
            {children}
        </div>
    );
}