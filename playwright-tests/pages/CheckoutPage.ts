import { Page, Locator } from "@playwright/test";

/** Page Object del carrito y de los tres pasos del checkout. */
export class CheckoutPage {
  readonly page: Page;
  // Carrito
  readonly itemsCarrito: Locator;
  readonly botonCheckout: Locator;
  // Paso 1: información del comprador
  readonly nombre: Locator;
  readonly apellido: Locator;
  readonly codigoPostal: Locator;
  readonly botonContinuar: Locator;
  readonly mensajeError: Locator;
  // Paso 2: resumen
  readonly subtotal: Locator;
  readonly impuesto: Locator;
  readonly total: Locator;
  readonly botonFinalizar: Locator;
  // Paso 3: confirmación
  readonly encabezadoConfirmacion: Locator;
  readonly titulo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.itemsCarrito = page.getByTestId("inventory-item");
    this.botonCheckout = page.getByTestId("checkout");
    this.nombre = page.getByTestId("firstName");
    this.apellido = page.getByTestId("lastName");
    this.codigoPostal = page.getByTestId("postalCode");
    this.botonContinuar = page.getByTestId("continue");
    this.mensajeError = page.getByTestId("error");
    this.subtotal = page.getByTestId("subtotal-label");
    this.impuesto = page.getByTestId("tax-label");
    this.total = page.getByTestId("total-label");
    this.botonFinalizar = page.getByTestId("finish");
    this.encabezadoConfirmacion = page.getByTestId("complete-header");
    this.titulo = page.getByTestId("title");
  }

  async iniciarCheckout() {
    await this.botonCheckout.click();
  }

  /** Llena solo los campos con valor (permite probar campos vacíos). */
  async llenarInformacion(nombre: string, apellido: string, zip: string) {
    if (nombre) await this.nombre.fill(nombre);
    if (apellido) await this.apellido.fill(apellido);
    if (zip) await this.codigoPostal.fill(zip);
    await this.botonContinuar.click();
  }

  /** Extrae el número de un texto como "Item total: $39.98". */
  static monto(texto: string | null): number {
    const coincidencia = (texto ?? "").match(/\$([\d.]+)/);
    return coincidencia ? Number(coincidencia[1]) : NaN;
  }
}
