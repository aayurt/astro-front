import type { Config } from 'tailwindcss';
// @ts-ignore
import konstaConfig from 'konsta/config';

const config: Config = konstaConfig({
  content: ['./index.html', './src/**/*.{ts,tsx}'],
});

export default config;
