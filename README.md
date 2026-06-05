# MIKO WORKS V2 — "ON AIR"

Druga wersja portfolio — ciemny, filmowy redesign inspirowany [siberia.es](https://siberia.es/)
(podobne DNA, inna metafora: u nich podróż/ekspedycja, u nas **radio i telemetria**).

## Koncept

- **Typografia:** `Departure Mono` (pixel-terminal — nagłówki, etykiety, HUD,
  tabele; self-hosted w `public/fonts/`) + `Space Mono` (dłuższe akapity body).
  Hierarchia budowana rozmiarem, jak na siberia.es. Scramble/decode w pixel
  foncie wygląda jak prawdziwy zrywający się teletekst.
- **Paleta:** prawie-czerń `#0B0D0B`, fosforyczna zieleń `#33FF66`, bursztyn, cyjan.
  Statusy projektów jako **statyczne** kropki (żadnych pulsujących diod ani glow —
  świadoma decyzja, zero efektów "wygenerowane przez AI").
- **Metafora radiowa:** "ON AIR", "TRANSMISSION LOG", "ESTABLISH LINK", "QTH: PL",
  "QSL card on request".

## Silnik filmowy (scroll jak film)

Strona to **9 pełnoekranowych scen**; koncepcja cięć: **każdy swipe = przestrajanie
odbiornika na inny kanał**. Każda scena ma własną (prawdziwą!) częstotliwość w HUD,
a każde cięcie to inny sposób utraty sygnału — analogowe rozdarcia obrazu robi
SVG `feTurbulence` + `feDisplacementMap` sterowane per-klatkę, do tego burst
szumu na canvasie (blend `screen`):

| # | Scena | Kanał | Cięcie |
|---|---|---|---|
| 1 | OPENING | 433.920 MHZ | title card + dekodowanie |
| 2 | BRIEF | 144.300 MHZ | `vroll` — ślizg synchronizacji pionowej |
| 3 | ZEPHYR | 433.920 MHZ | `swap` — twarde przestrojenie, czyste rozdarcie analogowe |
| 4 | PAGER | 2.412 GHZ | `sweep` — wiązka skanująca maluje kadr (beam w palecie projektu) |
| 5 | LONGWAVE | 434.540 MHZ | `collapse` — cykl zasilania CRT: zapad do linii i rozkwit |
| 6 | SENSOR LAB | 400.00 KHZ | `tear` — grube blokowe rozdarcie z chybotem synchronizacji |
| 7 | MIKO WORKS | 98.800 MHZ | `ghost` — echo wielodrogowe, kadr osiada tłumioną oscylacją |
| 8 | LOG | 77.500 KHZ (DCF77) | `roll` — przesuw kliszy z rozmyciem ruchu |
| 9 | CONTACT | 1.420 GHZ (linia wodoru) | `carrier` — utrata nośnej: czerń + śnieg, sygnał wraca |

HUD w lewym dolnym rogu to **tuner radiowy**: przesuwająca się skala z podziałką
i etykietami kanałów (igła zawsze na środku), odczyt częstotliwości, 5 słupków
RSSI i status `TUNED`/`SEEK`. Podczas cięcia skala jedzie do nowego kanału
z drżeniem, cyfry szumią, RSSI spada i migocze, status przechodzi w bursztynowy
`SEEK`; po dostrojeniu wszystko „łapie". Na touch/mobile tryb lite (bez
displacement/szumu/blura; skala ukryta, zostaje odczyt + RSSI).

**3D — wektorowy glob:** ręcznie pisana projekcja sferyczna na canvasie (zero
zależności, ~150 linii; wersja fotorealistyczna z three.js została odrzucona —
gryzła się z identyfikacją). Siatka południków/równoleżników jak na ekranie
wektorowym, beacon `QTH` na Polsce, **mały satelita (korpus + panele słoneczne)**
na szerokiej orbicie 55° z delikatnym torem i kreskowanym uplinkiem, pochylanie
za myszą. Glob **wędruje przez film**: każda scena ma wyreżyserowaną pozę
(`POSES` w `main.ts`), między scenami szybuje z lerpem, a każde cięcie dokręca
obrót (kierunkowy, wygasający „kick"). Podczas `SEEK` wszystko przechodzi
w bursztyn i drży. Na mobile ukryty.

**Model sterowania (fullpage):** w trybie filmu nie ma natywnego scrolla —
gest (wheel/touch/klawiatura) tylko *wyzwala* cięcie, a animacja gra własną,
wyreżyserowaną oś czasu (rAF + easing, stała długość per cięcie). Jeden flick
touchpada = dokładnie jedno pełne cięcie; ogon inercji jest połykany do momentu
ciszy (~240 ms). Scroll w górę gra cięcie od tyłu (rozstrajanie). Bez Lenisa
i bez GSAP — zero zależności animacyjnych. Turbulencja filtrów odświeża się
co ~90 ms (per-klatkowa regeneracja zabijała FPS), animowana jest tylko skala
displacementu.

Implementacja: sceny `position: fixed`, niewidzialny `.film-track` nadaje wysokość
dokumentu, scroll mapowany na `scena + postęp (0–1)` w `src/scripts/main.ts`
(~100 linii, bez GSAP). Scena ustępująca lekko się cofa i przygasa (głębia).
Do tego: scramble/decode tekstu ("hacker" z siberia.es), stagger treści po
aktywacji sceny, licznik klatek `03 / 09` w HUD, zegar w headerze.

Elementy z drugiej referencji ([sondaven.com](https://sondaven.com/en) — GSAP/Lenis):

- **title card** na otwarcie (`MIKO® — SIG/2026`), raz na sesję, pomijalna
  pierwszym scrollem/klikiem,
- **maskowane odsłonięcia tytułów** (efekt à la SplitText) zsynchronizowane z cięciem,
- **parallaksa wewnątrz sceny** — tytuł wchodzącej sceny dryfuje wolniej niż samo
  cięcie (czysty CSS na zmiennej `--f` ustawianej przez silnik).

**Fallbacki:** `prefers-reduced-motion` albo brak JS → zwykła, statyczna strona
(sceny jako sekcje min-100svh). Mobile działa w trybie filmowym.

## Stack

Astro 5 (statyczny build), Lenis + lenis/snap, vanilla TS/CSS,
fonty self-hosted przez Fontsource.

## Komendy

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
```

## Treść

- Projekty: `src/data/projects.ts` (przeniesione ze starej strony, zaktualizowany wpis "meta")
- Transmission log: `src/data/log.ts` — **edytuj śmiało, wpisy są do przejrzenia**

## Deploy

Docelowo zastąpi `mikobric.github.io` (repo `miko-works`). Workflow GitHub Actions
do przeniesienia ze starego repo po akceptacji designu.
