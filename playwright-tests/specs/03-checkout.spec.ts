import { test, expect, Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { InventoryPage } from "../pages/InventoryPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import {
  CONTRASENA_VALIDA,
  MENSAJES,
  PRODUCTOS,
  TASA_IMPUESTO,
  USUARIOS,
} from "../data/datos";

/**
 * FUNCIONALIDAD 3 – CHECKOUT (información, resumen y confirmación)
 * Código bajo prueba: src/pages/CheckOutStepOne.jsx, CheckOutStepTwo.jsx,
 * Finish.jsx y src/utils/orderCalculations.js
 */

/** Precondición común: sesión iniciada, productos en el carrito y paso 1 abierto. */
async function llegarAlPaso1(page: Page, usuario: string, productos: string[]) {
  const login = new LoginPage(page);
  await login.abrir();
  await login.iniciarSesion(usuario, CONTRASENA_VALIDA);
  const inventario = new InventoryPage(page);
  for (const p of productos) await inventario.agregar(p);
  await inventario.irAlCarrito();
  await new CheckoutPage(page).iniciarCheckout();
  await expect(page).toHaveURL(/checkout-step-one\.html$/);
}

test.describe("F3 · Checkout", () => {
  // ---------------------------------------------------------------------------
  /**
   * CP-08 · Tabla de decisión del formulario "Your Information".
   * Condiciones: C1 nombre diligenciado, C2 apellido diligenciado, C3 código postal diligenciado.
   * La validación evalúa en orden C1 → C2 → C3, por eso las 8 combinaciones se
   * reducen a 4 reglas (las demás quedan cubiertas por la condición "no importa").
   */
  const reglas = [
    { id: "R1", etiqueta: "nombre vacío", c1: "", c2: "-", c3: "-", accion: MENSAJES.nombreRequerido },
    { id: "R2", etiqueta: "apellido vacío", c1: "Juan", c2: "", c3: "-", accion: MENSAJES.apellidoRequerido },
    { id: "R3", etiqueta: "código postal vacío", c1: "Juan", c2: "Hernández", c3: "", accion: MENSAJES.postalRequerido },
    { id: "R4", etiqueta: "todos diligenciados", c1: "Juan", c2: "Hernández", c3: "760001", accion: "PASO_2" },
  ];

  for (const r of reglas) {
    test(`CP-08 · ${r.id} ${r.etiqueta} [Tabla de decisión]`, async ({
      page,
    }) => {
      await llegarAlPaso1(page, USUARIOS.estandar, [PRODUCTOS.mochila.nombre]);
      const checkout = new CheckoutPage(page);

      // "-" = condición indiferente: se deja vacía porque la regla se dispara antes
      const valor = (v: string) => (v === "-" ? "" : v);
      await checkout.llenarInformacion(valor(r.c1), valor(r.c2), valor(r.c3));

      if (r.accion === "PASO_2") {
        // RE-08 (R4): avanza al resumen "Checkout: Overview"
        await expect(page).toHaveURL(/checkout-step-two\.html$/);
        await expect(checkout.titulo).toHaveText("Checkout: Overview");
      } else {
        // RE-08 (R1–R3): muestra el mensaje de la regla y no avanza
        await expect(checkout.mensajeError).toHaveText(r.accion);
        await expect(page).toHaveURL(/checkout-step-one\.html$/);
      }
    });
  }

  // ---------------------------------------------------------------------------
  /**
   * CP-09 · Caso de uso "Comprar productos" – escenario principal.
   * Verifica el cálculo de subtotal, impuesto (8 %) y total, y la confirmación final.
   */
  test("CP-09 · Compra completa de dos productos con cálculo de totales [Caso de uso]", async ({
    page,
  }) => {
    const productos = [PRODUCTOS.mochila, PRODUCTOS.luz];
    await llegarAlPaso1(page, USUARIOS.estandar, productos.map((p) => p.nombre));
    const checkout = new CheckoutPage(page);

    await checkout.llenarInformacion("Juan", "Hernández", "760001");

    const subtotalEsperado = Number(productos.reduce((s, p) => s + p.precio, 0).toFixed(2)); // 39.98
    const impuestoEsperado = Number((subtotalEsperado * TASA_IMPUESTO).toFixed(2)); // 3.20
    const totalEsperado = Number((subtotalEsperado + impuestoEsperado).toFixed(2)); // 43.18

    // RE-09.1: el resumen lista los dos productos
    await expect(checkout.itemsCarrito).toHaveCount(2);
    // RE-09.2: subtotal = suma de precios
    expect(CheckoutPage.monto(await checkout.subtotal.textContent())).toBe(subtotalEsperado);
    // RE-09.3: impuesto = 8 % del subtotal
    expect(CheckoutPage.monto(await checkout.impuesto.textContent())).toBe(impuestoEsperado);
    // RE-09.4: total = subtotal + impuesto
    expect(CheckoutPage.monto(await checkout.total.textContent())).toBe(totalEsperado);

    await checkout.botonFinalizar.click();

    // RE-09.5: confirmación de la orden y carrito vacío
    await expect(page).toHaveURL(/checkout-complete\.html$/);
    await expect(checkout.encabezadoConfirmacion).toHaveText("Thank you for your order!");
    await expect(new InventoryPage(page).badgeCarrito).toHaveCount(0);
  });

  // ---------------------------------------------------------------------------
  /**
   * CP-10 · Adivinación de errores en el formulario con problem_user.
   * Hipótesis: los campos del formulario podrían no guardar su propio valor.
   */
  test("CP-10 · problem_user diligencia la información de envío [Adivinación de errores]", async ({
    page,
  }) => {
    await llegarAlPaso1(page, USUARIOS.problema, [PRODUCTOS.mochila.nombre]);
    const checkout = new CheckoutPage(page);

    await checkout.nombre.fill("Juan");
    await checkout.apellido.fill("Hernández");
    await checkout.codigoPostal.fill("760001");

    // RE-10.1: cada campo conserva el valor digitado
    await expect(checkout.nombre).toHaveValue("Juan");
    await expect(checkout.apellido).toHaveValue("Hernández");

    await checkout.botonContinuar.click();
    // RE-10.2: el sistema avanza al resumen de la orden
    await expect(page).toHaveURL(/checkout-step-two\.html$/);
  });
});
