import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base URL para GitHub Pages. Debe coincidir con el nombre del repositorio.
  // Ejemplo: https://github.com/usuario/ParkingCore → base: '/ParkingCore/'
  base: '/ParkingCore/',
});