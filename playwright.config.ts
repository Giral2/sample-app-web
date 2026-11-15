import { defineConfig, devices } from "@playwright/test";

/**
 * Configuración de Playwright – Examen final Pruebas y Calidad de Software (ECCI Cali)
 *
 * - Levanta la app localmente con Vite (puerto 3000) antes de correr las pruebas.
 * - Si se define BASE_URL (por ejemplo https://www.saucedemo.com) se prueba contra
 *   esa URL y no se levanta el servidor local.
 * - PW_CHANNEL permite usar el Chrome instalado en el equipo (PW_CHANNEL=chrome).
 */
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const usarServidorLocal = !process.env.BASE_URL;

export default defineConfig({
  testDir: "./playwright-tests/specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // sin reintentos: un FAIL debe verse como FAIL en la evidencia
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/resultados.json" }],
  ],

  use: {
    baseURL: BASE_URL,
    testIdAttribute: "data-test", // la app usa data-test en lugar de data-testid
    screenshot: "on", // evidencia de cada caso, pase o falle
    trace: "retain-on-failure",
    video: process.env.PW_VIDEO === "off" ? "off" : "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.PW_CHANNEL || undefined,
      },
    },
  ],

  webServer: usarServidorLocal
    ? {
        command: "npm run start -- --open=false --strictPort",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
