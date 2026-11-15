import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { InventoryPage } from "../pages/InventoryPage";
import { CONTRASENA_VALIDA, MENSAJES, USUARIOS } from "../data/datos";

/**
 * FUNCIONALIDAD 1 – AUTENTICACIÓN (LOGIN)
 * Código bajo prueba: src/pages/Login.jsx (handleSubmit) y src/utils/Credentials.js
 *
 * Convención: cada assertion lleva el comentario // RE-xx que la enlaza con el
 * resultado esperado del caso en el informe.
 */

test.describe("F1 · Autenticación", () => {
  let login: LoginPage;

  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    await login.abrir();
  });

  // ---------------------------------------------------------------------------
  test("CP-01 · Login exitoso con usuario válido [Partición de equivalencia – clase válida]", async ({
    page,
  }) => {
    const inventario = new InventoryPage(page);

    await login.iniciarSesion(USUARIOS.estandar, CONTRASENA_VALIDA);

    // RE-01.1: el sistema redirige al catálogo
    await expect(page).toHaveURL(/\/inventory\.html$/);
    // RE-01.2: se muestra el título "Products"
    await expect(inventario.titulo).toHaveText("Products");
    // RE-01.3: el catálogo lista los 6 productos
    await expect(inventario.items).toHaveCount(6);
    // RE-01.4: no se muestra ningún mensaje de error
    await expect(login.mensajeError).toHaveCount(0);
  });

  // ---------------------------------------------------------------------------
  test("CP-02 · Login rechazado con contraseña incorrecta [Partición de equivalencia – clase inválida]", async ({
    page,
  }) => {
    await login.iniciarSesion(USUARIOS.estandar, "clave_incorrecta");

    // RE-02.1: aparece el mensaje de credenciales no válidas
    await expect(login.mensajeError).toHaveText(MENSAJES.noCoinciden);
    // RE-02.2: el usuario permanece en la pantalla de login
    await expect(page).toHaveURL(/\/$/);
    // RE-02.3: el campo usuario queda marcado con error (clase CSS input_error error)
    await expect(login.usuario).toHaveClass(/error/);
  });

  // ---------------------------------------------------------------------------
  /**
   * CP-03 · CAJA BLANCA – Cobertura de caminos básicos de handleSubmit()
   *
   * Decisiones en Login.jsx/handleSubmit:      Decisiones en verifyCredentials():
   *   D1: !username                              D4a: password !== VALID_PASSWORD
   *   D2: !password                              D4b: VALID_USERNAMES.includes(username)
   *   D3: verifyCredentials(username, password)
   *   D5: isLockedOutUser()
   * Complejidad ciclomática de handleSubmit V(G) = 4 decisiones + 1 = 5.
   * Se agrega C4 para cubrir la segunda rama de verifyCredentials (100 % ramas).
   */
  const caminos = [
    {
      id: "C1",
      ruta: "D1=V → error usuario requerido",
      usuario: "",
      clave: CONTRASENA_VALIDA,
      error: MENSAJES.usuarioRequerido,
    },
    {
      id: "C2",
      ruta: "D1=F, D2=V → error contraseña requerida",
      usuario: USUARIOS.estandar,
      clave: "",
      error: MENSAJES.contrasenaRequerida,
    },
    {
      id: "C3",
      ruta: "D1=F, D2=F, D3=F (D4a=V) → credenciales no coinciden",
      usuario: USUARIOS.estandar,
      clave: "otra",
      error: MENSAJES.noCoinciden,
    },
    {
      id: "C4",
      ruta: "D1=F, D2=F, D3=F (D4a=F, D4b=F) → credenciales no coinciden",
      usuario: "usuario_inexistente",
      clave: CONTRASENA_VALIDA,
      error: MENSAJES.noCoinciden,
    },
    {
      id: "C5",
      ruta: "D1=F, D2=F, D3=V, D5=V → usuario bloqueado",
      usuario: USUARIOS.bloqueado,
      clave: CONTRASENA_VALIDA,
      error: MENSAJES.bloqueado,
    },
    {
      id: "C6",
      ruta: "D1=F, D2=F, D3=V, D5=F → acceso al catálogo",
      usuario: USUARIOS.estandar,
      clave: CONTRASENA_VALIDA,
      error: null,
    },
  ];

  for (const c of caminos) {
    test(`CP-03 · ${c.id} ${c.ruta} [Caja blanca – cobertura de caminos]`, async ({
      page,
    }) => {
      await login.iniciarSesion(c.usuario, c.clave);

      if (c.error) {
        // RE-03 (C1–C5): se muestra exactamente el mensaje del camino y no hay navegación
        await expect(login.mensajeError).toHaveText(c.error);
        await expect(page).toHaveURL(/\/$/);
      } else {
        // RE-03 (C6): se llega al catálogo sin mensaje de error
        await expect(page).toHaveURL(/\/inventory\.html$/);
        await expect(login.mensajeError).toHaveCount(0);
      }
    });
  }
});
