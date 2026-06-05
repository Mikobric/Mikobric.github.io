import type { Status } from './projects';

export interface LogEntry {
  date: string;
  message: string;
  status?: Status;
}

export interface LogYear {
  year: string;
  entries: LogEntry[];
}

export const log: LogYear[] = [
  {
    year: '2026',
    entries: [
      { date: '2026.06', message: 'MIKO WORKS V2 — DARK TERMINAL REBUILD ON AIR', status: 'LIVE' },
      { date: '2026.05', message: 'MIKOPORTFOLIO IOS — METAL SHADERS SHIPPED' },
      { date: '2026.04', message: 'PAGER — ACTIVE-LOW BUZZER MODULES SUPPORTED' },
      { date: '2026.03', message: 'PAGER FLEET DEPLOYED — SHOP FLOOR, ZERO INFRA', status: 'FIELD-TESTED' },
      { date: '2026.02', message: 'ZEPHYR — HISTORY API + IOS WIDGET LANDED' },
    ],
  },
  {
    year: '2025',
    entries: [
      { date: '2025.11', message: 'ZEPHYR ON AIR — SOLAR STATION SURVIVES FIRST FROST', status: 'LIVE' },
      { date: '2025.09', message: 'ANEMOMETER CALIBRATED AGAINST DATASHEET CURVE' },
      { date: '2025.07', message: 'LONGWAVE — 1.8 KM AIR GAP, SF12, URBAN CLUTTER', status: 'ARCHIVED' },
      { date: '2025.05', message: 'SENSOR LAB OPEN — THE I2C MENAGERIE GROWS', status: 'ONGOING' },
      { date: '2025.03', message: 'FIRST LORA PACKET RECEIVED — IT BEGINS' },
    ],
  },
];
