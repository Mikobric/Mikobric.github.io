---
name: MIKO Technical Document System
colors:
  surface: '#fbf9f3'
  surface-dim: '#dcdad4'
  surface-bright: '#fbf9f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ed'
  surface-container: '#f0eee8'
  surface-container-high: '#eae8e2'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c18'
  on-surface-variant: '#444748'
  inverse-surface: '#30312d'
  inverse-on-surface: '#f3f1eb'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#aa3000'
  on-secondary: '#ffffff'
  secondary-container: '#d43f00'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1d1b1a'
  on-tertiary-container: '#868381'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59e'
  on-secondary-fixed: '#3a0b00'
  on-secondary-fixed-variant: '#852400'
  tertiary-fixed: '#e6e1df'
  tertiary-fixed-dim: '#cac6c3'
  on-tertiary-fixed: '#1d1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#fbf9f3'
  on-background: '#1b1c18'
  surface-variant: '#e4e2dd'
typography:
  display-lg:
    fontFamily: Archivo Narrow
    fontSize: 84px
    fontWeight: '700'
    lineHeight: 80px
    letterSpacing: -0.04em
  headline-xl:
    fontFamily: Archivo Narrow
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Archivo Narrow
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 36px
  section-num:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
  body-md:
    fontFamily: Archivo Narrow
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-table:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.08em
  caption:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 14px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 40px
  hairline: 1px
---

## Brand & Style
The design system is rooted in the Swiss International Typographic Style, specifically adapted for industrial hardware documentation. It prioritizes information density, functional clarity, and a "printed-matter" aesthetic. The target audience includes engineers, procurement officers, and hardware enthusiasts who value precision and utility over ornamentation.

The style is **Minimalist-Technical**. It utilizes a strict hierarchy, heavy use of whitespace as a structural tool, and a total absence of gradients, shadows, or organic textures. The UI should feel like a high-fidelity scan of a physical datasheet, evoking feelings of reliability, engineering excellence, and permanence.

## Colors
This design system operates on a high-contrast, paper-and-ink palette. 

- **Background (#F7F5EF):** An off-white, warm-toned neutral that mimics unbleached technical paper. It reduces eye strain and provides a premium, archival feel.
- **Ink (#101010):** A near-black utilized for all primary text, borders, and iconography.
- **International Orange (#FF4D00):** Reserved strictly for "live" status indicators, critical alerts, and high-priority call-to-actions. It functions as the "industrial safety" color.

Color should never be used for decoration. It is a functional tool for highlighting status or defining boundaries.

## Typography
Typography is the primary visual driver. We utilize two contrasting families:

1.  **Archivo Narrow:** A condensed Grotesque used for impactful headlines and general body copy. Its narrow profile allows for high-density information display and a modern, architectural look.
2.  **JetBrains Mono:** A technical monospaced font used for all metadata, labels, code, numerical data, and section numbering. It communicates precision and the "raw data" nature of the hardware.

**Key Rule:** Headings should be set with tight tracking and leading. Labels should have increased tracking (+8%) for legibility at small sizes.

## Layout & Spacing
The layout follows a rigid **12-column grid** on desktop and a **4-column grid** on mobile.

- **The Header Strip:** Every page or view must begin with a "Document Chrome" strip containing technical metadata: `DOC NO.`, `REV`, and `DATE`, separated by vertical 1px rules.
- **Section Numbering:** All major content blocks must be prefixed with decimal numbering (e.g., 1.0, 1.1, 2.0) set in JetBrains Mono.
- **Hairlines:** Use 1px black lines (`#101010`) to separate sections, define table rows, and frame the header/footer. 
- **Registration Marks:** Use small "L" shaped brackets in the four corners of the main viewport to reinforce the "printed document" aesthetic.

## Elevation & Depth
This design system is **completely flat**. 

- **No Shadows:** Do not use shadows to indicate depth.
- **Tonal Stacking:** Use thin rules or simple #101010 fills to create separation.
- **Z-Index Strategy:** Modals or overlays do not "float" with shadows; they are bordered with thick (2px) black lines and may use a semi-transparent #F7F5EF backdrop blur to maintain the material feel while obscuring underlying content.
- **Borders:** Depth is communicated through line weight. Secondary containers use 1px lines, while primary focal points or "stamps" may use 2px lines.

## Shapes
All UI elements must have **0px border-radius**. There are no exceptions. Buttons, input fields, cards, and badges are all strictly rectangular. This reinforces the industrial, machined nature of the MIKO brand.

## Components
- **Buttons:** Rectangular with a 1px or 2px black border. Hover state: Invert colors (Background #101010, Text #F7F5EF). Primary "Action" buttons use a #FF4D00 fill with black text.
- **Technical Badges:** Small rectangular boxes (e.g., "LIVE", "FIELD-TESTED"). Use #FF4D00 for "LIVE" or "ACTIVE" status. Text must be JetBrains Mono, all caps.
- **Data Tables:** No vertical rules, only horizontal 1px rules between rows. The header row should be #101010 with #F7F5EF text.
- **Input Fields:** A 1px bottom-border only (like a physical form) or a full 1px box. Labels sit above the field in JetBrains Mono Caps.
- **FIG. Captions:** Any diagram or technical drawing must be labeled as `FIG. X` followed by a description in the `caption` type style, placed immediately below the element.
- **Document Status Stamps:** Large, slightly rotated, outlined text (e.g., "DRAFT", "APPROVED") can be used as a background watermark for specific document states.