# Pruebas automatizadas con Playwright – Swag Labs (Sauce Labs Sample App Web)

Examen final · Pruebas y Calidad de Software · Universidad ECCI Cali · 2026-II

**Integrantes:** Juan Esteban Hernández Mazo · Andrés Felipe Viveros · Andrés Felipe Giraldo

Este fork agrega una suite de pruebas end-to-end con **Playwright + TypeScript** sobre la
aplicación de ejemplo de Sauce Labs. Cubre tres funcionalidades (login, catálogo/carrito y
checkout) con 10 casos de prueba diseñados con técnicas de caja negra y caja blanca.

## Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | 24.9 o superior (lo exige `package.json` de la app) |
| npm | 10 o superior |
| Git | cualquiera reciente |

## Instalación

```bash
git clone https://github.com/Giral2/sample-app-web.git
cd sample-app-web
npm install
npx playwright install chromium     # descarga el navegador de Playwright
```

## Ejecución

```bash
# Corre toda la suite. Playwright levanta la app sola en http://localhost:3000
npm run test:e2e

# Modo visual (UI mode): permite ver cada paso y depurar
npm run test:e2e:ui

# Abre el reporte HTML de la última ejecución
npm run test:e2e:report
```

Otras formas útiles:

```bash
npx playwright test playwright-tests/specs/01-login.spec.ts   # solo una funcionalidad
npx playwright test -g "CP-09"                                 # solo un caso
npx playwright test --headed                                   # viendo el navegador
BASE_URL=https://www.saucedemo.com npx playwright test         # contra la versión publicada
PW_CHANNEL=chrome npx playwright test                          # con el Chrome instalado
```

En Windows (PowerShell) las variables se definen así: `$env:BASE_URL="https://www.saucedemo.com"; npx playwright test`.

## Estructura

```
playwright.config.ts              Configuración: baseURL, data-test como testId, reportes, servidor local
playwright-tests/
├── data/datos.ts                 Usuarios, mensajes esperados, productos y precios
├── pages/                        Page Objects (locators y acciones reutilizables)
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   └── CheckoutPage.ts
└── specs/                        Casos de prueba (assertions)
    ├── 01-login.spec.ts          F1 · CP-01, CP-02, CP-03
    ├── 02-catalogo-carrito.spec.ts  F2 · CP-04 a CP-07
    └── 03-checkout.spec.ts       F3 · CP-08 a CP-10
```

## Casos automatizados

| ID | Funcionalidad | Técnica | Resultado |
|---|---|---|---|
| CP-01 | Login | Partición de equivalencia (clase válida) | PASS |
| CP-02 | Login | Partición de equivalencia (clase inválida) | PASS |
| CP-03 | Login | **Caja blanca** – cobertura de caminos de `handleSubmit()` (6 caminos) | PASS |
| CP-04 | Catálogo | Partición de equivalencia (4 criterios de orden) | PASS |
| CP-05 | Carrito | Transición de estados | PASS |
| CP-06 | Carrito | Análisis de valores límite (0, 1, 5, 6, máx+1) | PASS |
| CP-07 | Carrito | Adivinación de errores (`problem_user`) | **FAIL – DEF-01** |
| CP-08 | Checkout | Tabla de decisión (4 reglas) | PASS |
| CP-09 | Checkout | Caso de uso (compra completa y totales) | PASS |
| CP-10 | Checkout | Adivinación de errores (`problem_user`) | **FAIL – DEF-02** |

Los casos parametrizados (CP-03, CP-04 y CP-08) generan una prueba por dato, por eso el
reporte muestra **21 pruebas: 19 PASS y 2 FAIL**. Los dos FAIL son defectos reales de la
aplicación, no errores del script; están documentados en el informe.

## Decisiones de diseño

- **Locators:** se usa `getByTestId` sobre el atributo `data-test` que la app trae para pruebas
  (configurado con `testIdAttribute: "data-test"`). Para botones se usa `getByRole` con nombre
  accesible, y `filter({ hasText })` para ubicar la tarjeta de un producto por su nombre.
- **Assertions:** solo web-first (`toHaveURL`, `toHaveText`, `toHaveCount`, `toHaveValue`), que
  esperan automáticamente. Cada una tiene un comentario `// RE-xx` que la conecta con el
  resultado esperado del caso en el informe.
- **Evidencia:** captura de pantalla en todos los casos, y traza y video cuando un caso falla.
  Todo queda en `playwright-report/` y `test-results/`.
- **Sin reintentos** (`retries: 0`): un defecto real tiene que aparecer como FAIL.
