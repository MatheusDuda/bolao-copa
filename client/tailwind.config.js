import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    join(__dirname, 'index.html'),
    join(__dirname, 'src/**/*.{js,jsx}')
  ],
  theme: {
    extend: {
      colors: {
        copa: {
          green: '#009C3B',
          red: '#DC2626',
          blue: '#002776',
          gold: '#ca8a04',
        }
      }
    }
  },
  plugins: []
};
