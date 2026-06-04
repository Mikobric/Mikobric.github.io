# 🧵 Stitch — redesign weba: "Datasheet / Swiss print"

## Workflow (ten sam co przy apce)

1. [stitch.withgoogle.com](https://stitch.withgoogle.com) → **New project** → tryb **WEB** (nie App!)
2. Wklej **master prompt** (niżej) jako pierwszą wiadomość
3. Potem prompty sekcji — po jednym, czekając aż skończy
4. Eksport: zaznacz ekran → **Export → .zip** → wrzuć plik do czatu z Claude

Koncept: strona wygląda jak **pięknie złożona karta katalogowa komponentu**
(datasheet) skrzyżowana ze szwajcarską typografią. Sekcje nazwane jak w prawdziwym
datasheecie. Zero zdjęć, zero gradientów — papier, typografia, linie, tabele.

## Master prompt

```
Swiss print / technical datasheet portfolio website for a hardware maker named MIKO.
Paper off-white background (#F7F5EF), near-black ink (#101010), industrial burnt-orange
accent (#FF4D00). Massive condensed grotesk headlines, monospaced technical labels and
data tables with thin black hairline rules. Document chrome everywhere: a "DOC NO /
REV / DATE" header strip, numbered sections (1.0, 2.0, 3.0), "FIG. 01" captions,
stamp-style status badges (LIVE, FIELD-TESTED), small registration marks. Generous
whitespace, strict grid, zero photography, zero gradients — pure typography, rules
and tables. Looks like a beautifully designed component datasheet / Swiss editorial
print. Fully responsive: wide grid on desktop, single column on mobile.
```

## PROMPT 1 — strona główna / hero

```
Landing page: top header strip with "MIKO®" left and monospaced document meta right
("DOC NO. MIKO-2026 / REV. A / SHEET 1 OF 5"). Below: an enormous condensed black
headline "HARDWARE MAKER" filling the width, a one-line subtitle ("Solar weather
stations, RF pager networks, sensor experiments — and the software around them."),
and an orange rubber-stamp style badge "OPEN FOR WORK". Underneath: a table of
contents like a datasheet (1.0 GENERAL DESCRIPTION, 2.0 SELECTED WORKS, 3.0
ELECTRICAL CHARACTERISTICS, 4.0 ORDERING INFORMATION) with dotted leader lines and
page numbers.
```

## PROMPT 2 — lista projektów

```
"2.0 SELECTED WORKS" section: a full-width data table where each row is a project —
columns: index (01–05), huge condensed project name (ZEPHYR, PAGER, LONGWAVE, SENSOR
LAB, MIKO WORKS), monospaced subtitle (SOLAR WEATHER STATION...), year, stamp-style
status badge (LIVE in orange, FIELD-TESTED / ARCHIVED / ONGOING outlined), and an
arrow. Rows separated by thin hairlines; on hover a row inverts to black with paper
text. Below the table a small "FIG. 01 — PROJECT INDEX" caption.
```

## PROMPT 3 — detal projektu (ZEPHYR)

```
Project detail page styled as a component datasheet for "ZEPHYR — SOLAR WEATHER
STATION": title block with huge name, part-number style code ("MIKO-ZPH-01"), orange
LIVE stamp. Sections: "FEATURES" as a two-column bullet list (solar powered, LoRa
433 MHz uplink, BME680 sensing, iOS + web clients); "ABSOLUTE MAXIMUM RATINGS" as a
bordered specs table with monospaced key/value rows (RADIO — LORA 433 MHZ, SENSORS —
BME680 + HALL, POWER — SOLAR + 18650); "APPLICATIONS" paragraph; footer row "NEXT
DOCUMENT → PAGER (MIKO-PGR-02)".
```

## PROMPT 4 — about / statystyki

```
"1.0 GENERAL DESCRIPTION" section: a serious datasheet-style paragraph describing the
maker ("Self-taught maker from Poland..."), then "ELECTRICAL CHARACTERISTICS" — a
bordered table with columns PARAMETER / MIN / TYP / MAX / UNIT containing playful
real stats (PROTOTYPES BUILT — 24+, SENSORS TAMED — 9, LORA RANGE — 1800 M, SOLDER
JOINTS — 9999+). Then "CAPABILITIES" as numbered rows (01 HARDWARE DESIGN, 02
FIRMWARE / C++, 03 RF & PROTOCOLS, 04 APPS / SWIFTUI, 05 RAPID PROTOTYPING).
```

## PROMPT 5 — kontakt / stopka

```
"4.0 ORDERING INFORMATION" footer section: a bordered contact table with monospaced
rows (COMMS LINK — BYNIUTEK@GMAIL.COM, SOURCE — GITHUB.COM/MIKOBRIC, STATUS — OPEN
FOR WORK) and a full-width burnt-orange "TRANSMIT ↗" button. At the very bottom a
datasheet legal line: "© 2026 MIKO — INFORMATION FURNISHED IS BELIEVED TO BE ACCURATE
AND RELIABLE. MADE IN PL." plus tiny registration marks in the corners.
```

## Prompty dopracowujące (przykłady)

- `More whitespace, bigger headline, stricter grid`
- `Make the tables look more like a real component datasheet`
- `Add dotted leader lines to the table of contents`
- `The stamp should look like a real rubber stamp, slightly rotated`
