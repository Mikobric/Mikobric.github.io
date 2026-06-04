# MIKO® WORKS — portfolio web

Webowy bliźniak apki iOS `miko/MikoPortfolio`: ciemne, brutalistyczne portfolio
z wielką typografią (Anton), chrome/glitch efektami w czystym CSS, marquee,
film grain i custom cursorem. Zbudowane na Astro, hostowane na GitHub Pages.

## Dev

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # statyczny build do dist/
```

## Deploy

Automatyczny — każdy push na `main` odpala GitHub Actions (`.github/workflows/deploy.yml`),
który buduje Astro i publikuje na GitHub Pages.

Jednorazowa konfiguracja repo: Settings → Pages → Source: **GitHub Actions**.

## Struktura

```
src/
├── data/projects.ts      # treść projektów ← TU podmieniasz copy
├── styles/global.css     # design tokens + efekty (chrome, glitch, grain, marquee)
├── layouts/Base.astro    # head, fonty, header, grain, cursor, skrypty reveal/counter
├── components/           # Hero, MarqueeBand, Works, About, Footer
└── pages/
    ├── index.astro       # one-pager
    └── works/[id].astro  # strony detali projektów
```

## Co podmienić pod siebie

- **Copy i liczby**: `src/data/projects.ts` + statystyki w `src/components/About.astro`
- **E-mail / linki**: `src/components/Footer.astro`
