# Supplied masters

The original files provided for this build. Kept at full resolution here; the
web-ready derivatives live in `public/`.

| File | Derived into |
|---|---|
| `logo_barber.png` | `public/brand/mark.png`, `public/brand/lockup.png`, `public/icons/*`, `public/favicon.png` |
| `before_barber.png` | `public/media/cut-before.jpg` (+ `@0.5`) |
| `after_barber.png` | `public/media/cut-after.jpg` (+ `@0.5`) |
| `barber_chair_rotating.gif` | not shipped — removed from the build at the owner's request |
| `barbers1.jpg` … `barbers5.jpg` | `public/media/room-floor|work|towels|tools|pole.jpg` |
| `products_view.jpg` | `public/media/back-bar.jpg` (+ `@0.66`) |

The logo's alpha was rebuilt from per-pixel whiteness to drop the soft blue
halo, leaving white artwork on true transparency so CSS can ink it. The photos
were resized and re-encoded only.

The chair GIF is kept here but no longer ships; the scroll-scrubbed sprite
sheet built from it was removed when the owner judged the footage weaker than
the before/after pair. See `public/media/PROVENANCE.md`.

`.impeccable/review/` holds generated review screenshots and is gitignored.
