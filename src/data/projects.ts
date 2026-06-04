export interface Spec {
  key: string;
  value: string;
}

export interface Project {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  year: string;
  role: string;
  status: string;
  blurb: string;
  tags: string[];
  specs: Spec[];
  palette: [string, string];
}

export const projects: Project[] = [
  {
    id: 'zephyr',
    index: '01',
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
    palette: ['#1a47f2', '#00a6d9'],
  },
  {
    id: 'pager',
    index: '02',
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
    palette: ['#ff4d00', '#d90d26'],
  },
  {
    id: 'longwave',
    index: '03',
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
    palette: ['#7326e6', '#e633bf'],
  },
  {
    id: 'sensorlab',
    index: '04',
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
    palette: ['#00994d', '#1ad9b3'],
  },
  {
    id: 'meta',
    index: '05',
    title: 'MIKO WORKS',
    subtitle: 'THIS VERY SITE',
    year: '2026',
    role: 'DESIGN / WEB',
    status: 'LIVE',
    blurb:
      'The site you are looking at — and its iOS twin. Astro on the web, SwiftUI with custom Metal shaders on iPhone: liquid chrome typography, film grain, RGB-split glitch, mesh gradients. Designed with Google Stitch in the loop, built in code.',
    tags: ['ASTRO', 'CSS', 'SWIFTUI', 'METAL', 'STITCH'],
    specs: [
      { key: 'WEB', value: 'ASTRO + VANILLA CSS' },
      { key: 'IOS', value: 'SWIFTUI + METAL' },
      { key: 'DESIGN LOOP', value: 'GOOGLE STITCH' },
      { key: 'HOSTING', value: 'GITHUB PAGES' },
    ],
    palette: ['#bfc7d9', '#334de6'],
  },
];

export function nextProject(id: string): Project {
  const index = projects.findIndex((p) => p.id === id);
  return projects[(index + 1) % projects.length]!;
}
