import { test, expect, Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { InventoryPage } from "../pages/InventoryPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { CONTRASENA_VALIDA, PRODUCTOS, USUARIOS } from "../data/datos";

/**
 * FUNCIONALIDAD 2 – CATÁLOGO Y CARRITO DE COMPRAS
 * Código bajo prueba: src/pages/Inventory.jsx, src/components/InventoryListItem.jsx,
 * src/utils/shopping-cart.js, src/utils/Sorting.js
 */

async function entrarComo(page: Page, usuario: string) {
  const login = new LoginPage(page);
  await login.abrir();
  await login.iniciarSesion(usuario, CONTRASENA_VALIDA);
  await expect(page).toHaveURL(/\/inventory\.html$/);
}

test.describe("F2 · Catálogo y carrito", () => {
  // ---------------------------------------------------------------------------
  /**
   * CP-04 · Partición de equivalencia sobre el criterio de ordenamiento.
   * El dominio del <select> tiene 4 clases válidas (az, za, lohi, hilo);
   * se toma un representante de cada una y se compara el orden mostrado
   * contra el orden esperado calculado de forma independiente.
   */
  const nombres = Object.values(PRODUCTOS).map((p) => p.nombre);
  const precios = Object.values(PRODUCTOS).map((p) => p.precio);
  const clases = [
    { valor: "az" as const, etiqueta: "Name (A to Z)", campo: "nombre", esperado: [...nombres].sort((a, b) => a.localeCompare(b)) },
    { valor: "za" as const, etiqueta: "Name (Z to A)", campo: "nombre", esperado: [...nombres].sort((a, b) => b.localeCompare(a)) },
    { valor: "lohi" as const, etiqueta: "Price (low to high)", campo: "precio", esperado: [...precios].sort((a, b) => a - b) },
    { valor: "hilo" as const, etiqueta: "Price (high to low)", campo: "precio", esperado: [...precios].sort((a, b) => b - a) },
  ];

  for (const clase of clases) {
    test(`CP-04 · Ordenar por "${clase.etiqueta}" [Partición de equivalencia]`, async ({
      page,
    }) => {
      await entrarComo(page, USUARIOS.estandar);
      const inventario = new InventoryPage(page);

      await inventario.ordenarPor(clase.valor);

      // RE-04.1: el selector muestra la opción elegida como activa
      await expect(page.getByTestId("active-option")).toHaveText(clase.etiqueta);
      // RE-04.2: los productos quedan en el orden correspondiente a la clase
      if (clase.campo === "nombre") {
        await expect(inventario.nombres).toHaveText(clase.esperado as string[]);
      } else {
        expect(await inventario.preciosComoNumeros()).toEqual(clase.esperado);
      }
    });
  }

  // ---------------------------------------------------------------------------
  /**
   * CP-05 · Transición de estados de un producto respecto al carrito.
   * Estados: E0 = "Fuera del carrito"  |  E1 = "En el carrito"
   * Transiciones: E0 --agregar--> E1 --ver carrito/volver--> E1 --quitar--> E0
   */
  test("CP-05 · Ciclo agregar → navegar → quitar de un producto [Transición de estados]", async ({
    page,
  }) => {
    await entrarComo(page, USUARIOS.estandar);
    const inventario = new InventoryPage(page);
    const carrito = new CheckoutPage(page);
    const mochila = PRODUCTOS.mochila.nombre;

    await test.step("Estado inicial E0", async () => {
      // RE-05.1: botón "Add to cart" y carrito sin contador
      await expect(inventario.botonDe(mochila)).toHaveText("Add to cart");
      await expect(inventario.badgeCarrito).toHaveCount(0);
    });

    await test.step("Transición E0 → E1 (agregar)", async () => {
      await inventario.agregar(mochila);
      // RE-05.2: el botón cambia a "Remove" y el contador muestra 1
      await expect(inventario.botonDe(mochila)).toHaveText("Remove");
      await expect(inventario.badgeCarrito).toHaveText("1");
    });

    await test.step("E1 se conserva al navegar al carrito y volver", async () => {
      await inventario.irAlCarrito();
      // RE-05.3: el producto aparece en el carrito
      await expect(carrito.itemsCarrito).toHaveCount(1);
      await expect(carrito.itemsCarrito).toContainText(mochila);
      await page.getByTestId("continue-shopping").click();
      // RE-05.4: al volver al catálogo el producto sigue en estado "Remove"
      await expect(inventario.botonDe(mochila)).toHaveText("Remove");
    });

    await test.step("Transición E1 → E0 (quitar)", async () => {
      await inventario.quitar(mochila);
      // RE-05.5: vuelve a "Add to cart" y el contador desaparece
      await expect(inventario.botonDe(mochila)).toHaveText("Add to cart");
      await expect(inventario.badgeCarrito).toHaveCount(0);
    });
  });

  // ---------------------------------------------------------------------------
  /**
   * CP-06 · Valores límite sobre la cantidad de productos en el carrito.
   * Dominio: [0, 6] (el catálogo tiene 6 productos y cada uno se agrega una sola vez).
   * Valores probados: 0 (mín), 1 (mín+1), 5 (máx−1), 6 (máx) y el intento de máx+1.
   */
  test("CP-06 · Contador del carrito en 0, 1, 5, 6 y máx+1 [Valores límite]", async ({
    page,
  }) => {
    await entrarComo(page, USUARIOS.estandar);
    const inventario = new InventoryPage(page);
    const lista = Object.values(PRODUCTOS).map((p) => p.nombre);

    // RE-06.1 (valor 0): sin productos no se muestra contador
    await expect(inventario.badgeCarrito).toHaveCount(0);

    for (let i = 0; i < lista.length; i++) {
      await inventario.agregar(lista[i]);
      const cantidad = i + 1;
      if (cantidad === 1 || cantidad === 5 || cantidad === 6) {
        // RE-06.2 / RE-06.3 / RE-06.4: el contador refleja exactamente 1, 5 y 6
        await expect(inventario.badgeCarrito).toHaveText(String(cantidad));
      }
    }

    // RE-06.5 (máx+1): ya no quedan botones "Add to cart", no se puede superar 6
    await expect(page.getByRole("button", { name: "Add to cart" })).toHaveCount(0);
    await inventario.irAlCarrito();
    await expect(new CheckoutPage(page).itemsCarrito).toHaveCount(6);
  });

  // ---------------------------------------------------------------------------
  /**
   * CP-07 · Adivinación de errores con el perfil problem_user.
   * Hipótesis de error: el agregado al carrito depende del identificador del
   * producto. Se agrega "Sauce Labs Bolt T-Shirt" (id 1, impar).
   */
  test("CP-07 · problem_user agrega un producto al carrito [Adivinación de errores]", async ({
    page,
  }) => {
    await entrarComo(page, USUARIOS.problema);
    const inventario = new InventoryPage(page);
    const camiseta = PRODUCTOS.camiseta.nombre;

    await inventario.agregar(camiseta);

    // RE-07.1: el botón cambia a "Remove"
    await expect(inventario.botonDe(camiseta)).toHaveText("Remove");
    // RE-07.2: el contador del carrito muestra 1
    await expect(inventario.badgeCarrito).toHaveText("1");
  });
});
