# Brand assets

The master is `brand-mark.svg`: warm bronze (#C59868) outlined Latin cross on navy (#172536), with a 64-unit corner radius on a 256-unit square.

Run `npm run brand:generate` after editing the SVG. Sharp is a development-only dependency; generated PNGs are checked in, so native/web runtime rendering does not require an SVG library.

- `brand-mark.png`: 192px, displayed at 48px in the existing brand row; decorative because the adjacent wordmark supplies the accessible name.
- `favicon.png`: 48px, also wrapped as an ICO by the existing SEO preparation script.
- `apple-touch-icon.png`: 180px, rounded-square home-screen mark; also used by the password-reset email.
- `icon.png`: 1024px, opaque navy to the edges; native launchers supply the final corner mask. The existing web manifest also uses this file.
- `adaptive-icon.png`: 1024px transparent foreground, scaled inside Android's safe zone; `app.json` supplies its navy background.

`npm run seo:prepare` copies the public assets and rebuilds the ICO; `npm run web:export` invokes that automatically. Existing URLs remain compatible. Previously installed icons may be cached by browsers/operating systems. No service worker or deployment behavior was added.
