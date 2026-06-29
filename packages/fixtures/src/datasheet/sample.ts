export interface SpecRow {
  key: string;
  value: string;
}

export interface DatasheetData {
  product: string;
  model: string;
  tagline: string;
  illustration: string;
  features: string[];
  specs: SpecRow[];
  footnote: string;
}

const illustration = `<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <rect x="40" y="20" width="120" height="120" rx="16" fill="#0ea5e9"/>
  <rect x="40" y="20" width="120" height="120" rx="16" fill="#0284c7" opacity="0.25"/>
  <circle cx="100" cy="72" r="34" fill="#e0f2fe"/>
  <circle cx="100" cy="72" r="20" fill="#0369a1"/>
  <rect x="70" y="118" width="60" height="8" rx="4" fill="#bae6fd"/>
</svg>`;

export const datasheetSample: DatasheetData = {
  product: 'Aurora One',
  model: 'AUR-100',
  tagline: 'Wireless studio monitor with adaptive room tuning',
  illustration,
  features: [
    'Self-calibrating DSP that maps your room acoustics in 12 seconds',
    'Dual-driver coaxial array for a precise, unified soundstage',
    'Lossless 24-bit / 96 kHz wireless streaming over the 5 GHz band',
    'USB-C, optical, and balanced TRS inputs on every unit',
    'Machined aluminium enclosure with internal bracing',
    'Firmware updates delivered silently over the air',
  ],
  specs: [
    { key: 'Frequency response', value: '38 Hz - 24 kHz (±2 dB)' },
    { key: 'Amplifier power', value: '120 W RMS (80 W LF / 40 W HF)' },
    { key: 'Max SPL', value: '108 dB @ 1 m' },
    { key: 'Drivers', value: '6.5" woofer, 1" silk dome tweeter' },
    { key: 'Connectivity', value: 'Wi-Fi 6, Bluetooth 5.3, USB-C' },
    { key: 'Latency', value: '< 9 ms wireless, < 2 ms wired' },
    { key: 'Dimensions', value: '210 × 320 × 240 mm' },
    { key: 'Weight', value: '5.8 kg per unit' },
    { key: 'Power', value: '100-240 V, 50/60 Hz' },
  ],
  footnote:
    'Specifications subject to change. All measurements taken in a calibrated anechoic chamber.',
};
