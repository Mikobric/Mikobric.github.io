export interface Spec {
  key: string;
  value: string;
}

export type Status = 'LIVE' | 'FIELD-TESTED' | 'ARCHIVED' | 'ONGOING';

export interface Project {
  id: string;
  index: string;
  partNo: string;
  title: string;
  subtitle: string;
  year: string;
  role: string;
  status: Status;
  blurb: string;
  tags: string[];
  specs: Spec[];
  chain: string[];
  palette: [string, string];
}

export const statusColor: Record<Status, string> = {
  LIVE: '#33ff66',
  'FIELD-TESTED': '#ffb000',
  ONGOING: '#33d9ff',
  ARCHIVED: '#7a8a7a',
};

export const projects: Project[] = [
  {
    id: 'zephyr',
    index: '01',
    partNo: 'MIKO-ZPH-01',
    title: 'ZEPHYR',
    subtitle: 'SOLAR WEATHER STATION',
    year: '2025—26',
    role: 'HARDWARE / FIRMWARE / APP',
    status: 'LIVE',
    blurb:
      'A fully solar-powered weather station built around the ESP32. BME680 environmental sensing, a hall-effect anemometer, LoRa uplink to an indoor base with a TFT display — plus a web dashboard and an iOS companion app. It survives Polish winters and reports wind, temperature, humidity, pressure and air quality around the clock.',
    tags: ['ESP32', 'LORA', 'BME680', 'SOLAR', 'SWIFTUI', 'TFT'],
    specs: [
      { key: 'RADIO', value: 'LORA 433 MHZ' },
      { key: 'SENSORS', value: 'BME680 + HALL' },
      { key: 'POWER', value: 'SOLAR + 18650' },
      { key: 'DISPLAY', value: 'TFT BASE STATION' },
      { key: 'CLIENTS', value: 'IOS + WEB' },
    ],
    chain: ['BME680 + HALL', 'ESP32', 'LORA 433 MHZ', 'BASE STATION', 'IOS / WEB'],
    palette: ['#4d7bff', '#33d9ff'],
  },
  {
    id: 'pager',
    index: '02',
    partNo: 'MIKO-PGR-02',
    title: 'PAGER',
    subtitle: 'OFFLINE ESP-NOW PAGING',
    year: '2026',
    role: 'PROTOCOL / FIRMWARE',
    status: 'FIELD-TESTED',
    blurb:
      'A cashier-to-customer pager system that needs zero infrastructure: no Wi-Fi router, no cloud, no SIM. A station broadcasts over ESP-NOW to a fleet of pocket pagers with buzzer and vibration feedback. Built for a real shop floor — instant, resilient and completely offline.',
    tags: ['ESP-NOW', 'C++', 'RF', 'PCB', '3D PRINT'],
    specs: [
      { key: 'PROTOCOL', value: 'ESP-NOW' },
      { key: 'INFRASTRUCTURE', value: 'NONE / OFFLINE' },
      { key: 'FEEDBACK', value: 'BUZZER + VIBRA' },
      { key: 'LATENCY', value: 'INSTANT' },
    ],
    chain: ['STATION', 'ESP-NOW', 'PAGER FLEET', 'BUZZ + VIBRA'],
    palette: ['#ff6b35', '#ff3355'],
  },
  {
    id: 'longwave',
    index: '03',
    partNo: 'MIKO-LNG-03',
    title: 'LONGWAVE',
    subtitle: 'LORA RANGE LAB',
    year: '2025',
    role: 'RF EXPERIMENTS',
    status: 'ARCHIVED',
    blurb:
      'A series of transmitter/receiver experiments pushing LoRa as far as it goes — antenna tweaks, spreading factors, urban vs. open-field runs. The findings shaped the radio link used in Zephyr.',
    tags: ['LORA', 'SX127X', 'ANTENNAS', 'FIELD TESTS'],
    specs: [
      { key: 'RADIO', value: 'SX127X' },
      { key: 'SPREADING FACTORS', value: 'SF7 — SF12' },
      { key: 'TERRAIN', value: 'URBAN + OPEN FIELD' },
      { key: 'OUTCOME', value: 'ZEPHYR RADIO LINK' },
    ],
    chain: ['TX SX127X', 'ANTENNA LAB', '1.8 KM AIR GAP', 'RX SX127X'],
    palette: ['#9b5cff', '#ff4dd2'],
  },
  {
    id: 'sensorlab',
    index: '04',
    partNo: 'MIKO-SNS-04',
    title: 'SENSOR LAB',
    subtitle: 'THE I2C MENAGERIE',
    year: '2025',
    role: 'PROTOTYPING',
    status: 'ONGOING',
    blurb:
      'A growing collection of sensor bring-ups and breakout experiments: BME280/680, DS18B20, INA219 power monitoring, hall-effect sensing, battery monitors and more. Every big build starts here.',
    tags: ['I2C', 'SENSORS', 'INA219', 'DS18B20'],
    specs: [
      { key: 'BUSES', value: 'I2C / 1-WIRE / SPI' },
      { key: 'ENVIRONMENT', value: 'BME280 / BME680' },
      { key: 'POWER MONITORING', value: 'INA219' },
      { key: 'TEMPERATURE', value: 'DS18B20' },
    ],
    chain: ['SENSOR', 'I2C / 1-WIRE', 'ESP32', 'SERIAL LOG'],
    palette: ['#33ff66', '#1addb3'],
  },
  {
    id: 'meta',
    index: '05',
    partNo: 'MIKO-WEB-05',
    title: 'MIKO WORKS',
    subtitle: 'THIS VERY TRANSMISSION',
    year: '2026',
    role: 'DESIGN / WEB',
    status: 'LIVE',
    blurb:
      'The site you are looking at — a dark-terminal rebuild. Astro static build, Lenis smooth scroll, a hand-rolled text decoder effect and zero framework JavaScript. Its predecessor was a Swiss-print datasheet; its sibling is an iOS app with Metal shaders.',
    tags: ['ASTRO', 'TYPESCRIPT', 'LENIS', 'CSS', 'ZERO-FRAMEWORK'],
    specs: [
      { key: 'WEB', value: 'ASTRO + VANILLA TS' },
      { key: 'SCROLL', value: 'LENIS' },
      { key: 'TYPE', value: 'MARTIAN + JETBRAINS MONO' },
      { key: 'HOSTING', value: 'GITHUB PAGES' },
    ],
    chain: ['CLAUDE CODE', 'ASTRO', 'GITHUB PAGES', 'YOUR EYES'],
    palette: ['#e6f2e6', '#6991ff'],
  },
];
