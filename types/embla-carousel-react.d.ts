declare module 'embla-carousel-react' {
    import * as React from 'react';

    export interface EmblaOptions {
        loop?: boolean;
        align?: 'start' | 'center' | 'end';
        axis?: 'x' | 'y';
    }

    export interface EmblaCarouselType {
        reInit: () => void;
        scrollPrev: () => void;
        scrollNext: () => void;
        canScrollPrev: () => boolean; // Define as a method
        canScrollNext: () => boolean; // Define as a method
        on: (event: string, callback: () => void) => void;
        off: (event: string, callback: () => void) => void;
    }

    export default function useEmblaCarousel(
        options?: EmblaOptions
    ): [React.RefCallback<HTMLElement>, EmblaCarouselType];
}