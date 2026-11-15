import { Page, Locator } from "@playwright/test";

/** Page Object del catálogo de productos ("/inventory.html"). */
export class InventoryPage {
  readonly page: Page;
  readonly titulo: Locator;
  readonly ordenamiento: Locator;
  readonly items: Locator;
  readonly nombres: Locator;
  readonly precios: Locator;
  readonly badgeCarrito: Locator;
  readonly enlaceCarrito: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titulo = page.getByTestId("title");
    this.ordenamiento = page.getByTestId("product-sort-container");
    this.items = page.getByTestId("inventory-item");
    this.nombres = page.getByTestId("inventory-item-name");
    this.precios = page.getByTestId("inventory-item-price");
    this.badgeCarrito = page.getByTestId("shopping-cart-badge");
    this.enlaceCarrito = page.getByTestId("shopping-cart-link");
  }

  /** Tarjeta de un producto, ubicada por su nombre visible. */
  tarjeta(nombreProducto: string): Locator {
    return this.items.filter({ hasText: nombreProducto });
  }

  /**
   * Botón principal de la tarjeta ("Add to cart" o "Remove").
   * Nota: la imagen y el título también tienen role="button", por eso se
   * filtra por el nombre accesible; sin el filtro Playwright lanza
   * "strict mode violation" (3 elementos).
   */
  botonDe(nombreProducto: string): Locator {
    return this.tarjeta(nombreProducto).getByRole("button", {
      name: /^(Add to cart|Remove)$/,
    });
  }

  async agregar(nombreProducto: string) {
    await this.tarjeta(nombreProducto)
      .getByRole("button", { name: "Add to cart" })
      .click();
  }

  async quitar(nombreProducto: string) {
    await this.tarjeta(nombreProducto)
      .getByRole("button", { name: "Remove" })
      .click();
  }

  async ordenarPor(valor: "az" | "za" | "lohi" | "hilo") {
    await this.ordenamiento.selectOption(valor);
  }

  /** Devuelve los precios visibles como números, en el orden mostrado. */
  async preciosComoNumeros(): Promise<number[]> {
    const textos = await this.precios.allTextContents();
    return textos.map((t) => Number(t.replace("$", "")));
  }

  async irAlCarrito() {
    await this.enlaceCarrito.click();
  }
}
