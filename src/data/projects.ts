export interface Spec {
  key: string;
  value: string;
}

export interface Project {
  id: string;
  index: string;
  partNo: string;
  title: string;
  subtitle: string;
  year: string;
  role: string;
  status: string;
  blurb: string;
  tags: string[];
  specs: Spec[];
  features: string[];
  chain: string[];
  palette: [string, string];
}

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
    features: [
      'Solar powered continuous operation',
      'LoRa 433 MHz uplink telemetry',
      'BME680 precision environmental sensing',
      'Hall-effect anemometer wind sensing',
      'TFT base station with forecast display',
      'Native iOS + web client integration',
    ],
    chain: ['BME680 + HALL', 'ESP32', 'LORA 433 MHZ', 'BASE STATION', 'IOS / WEB'],
    palette: ['#1a47f2', '#00a6d9'],
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
    features: [
      'Zero-infrastructure ESP-NOW broadcast',
      'Fleet of pocket pagers, instant paging',
      'Buzzer + vibration feedback',
      'Fully offline — no router, no cloud, no SIM',
      '3D-printed enclosures',
      'Shop-floor field tested',
    ],
    chain: ['STATION', 'ESP-NOW', 'PAGER FLEET', 'BUZZ + VIBRA'],
    palette: ['#ff4d00', '#d90d26'],
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
    features: [
      'SX127X transmitter / receiver pairs',
      'Spreading factor sweeps SF7–SF12',
      'Antenna comparisons in the field',
      'Urban vs. open-field range runs',
    ],
    chain: ['TX SX127X', 'ANTENNA LAB', '1.8 KM AIR GAP', 'RX SX127X'],
    palette: ['#7326e6', '#e633bf'],
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
    features: [
      'BME280 / BME680 environmental bring-ups',
      'INA219 power & current profiling',
      'DS18B20 1-wire temperature chains',
      'Hall-effect and battery monitoring rigs',
    ],
    chain: ['SENSOR', 'I2C / 1-WIRE', 'ESP32', 'SERIAL LOG'],
    palette: ['#00994d', '#1ad9b3'],
  },
  {
    id: 'meta',
    index: '05',
    partNo: 'MIKO-WEB-05',
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
    features: [
      'Astro static build, zero framework JS',
      'Datasheet design system from Google Stitch',
      'SwiftUI + Metal shader iOS twin',
      'Auto-deploy via GitHub Actions',
    ],
    chain: ['STITCH', 'CLAUDE CODE', 'ASTRO', 'GITHUB PAGES'],
    palette: ['#bfc7d9', '#334de6'],
  },
];

export function nextProject(id: string): Project {
  const index = projects.findIndex((p) => p.id === id);
  return projects[(index + 1) % projects.length]!;
}
