# MIKO® WORKS — portfolio web

Portfolio jako **karta katalogowa komponentu** (datasheet / Swiss print):
papier `#fbf9f3`, tusz, industrialny pomarańcz `#d43f00`, Archivo Narrow +
JetBrains Mono. Sekcje nazwane jak w prawdziwym datasheecie (GENERAL
DESCRIPTION, ELECTRICAL CHARACTERISTICS, ORDERING INFORMATION), projekty z
part-numbers (`MIKO-ZPH-01`), pieczątki statusów, watermark CONFIDENTIAL,
znaczniki registracyjne. Design wyiterowany w Google Stitch (eksporty w
`stitch/`, prompty w `STITCH-WEB.md`). Zbudowane na Astro, hostowane na
GitHub Pages. Apka iOS (`miko/MikoPortfolio`) to ciemny, brutalistyczny
bliźniak tej strony.

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
├── data/projects.ts      # treść projektów (part no, specs, features, chain) ← TU podmieniasz copy
├── styles/global.css     # design tokens + wspólne klocki (stamp, dtable, watermark...)
├── layouts/Base.astro    # doc-strip, masthead, stopka, skrypty reveal/counter
├── components/           # Hero, Description, Works, Characteristics, Ordering
└── pages/
    ├── index.astro       # one-pager (datasheet makera)
    └── works/[id].astro  # detale projektów jako osobne "dokumenty"
```

## Co podmienić pod siebie

- **Copy i liczby**: `src/data/projects.ts` + tabela w `src/components/Characteristics.astro`
- **E-mail / linki**: `src/components/Ordering.astro` i przycisk ORDER.SYS w `Base.astro`
