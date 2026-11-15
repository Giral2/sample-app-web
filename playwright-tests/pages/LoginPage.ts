import { Page, Locator, expect } from "@playwright/test";

/** Page Object de la pantalla de inicio de sesión ("/"). */
export class LoginPage {
  readonly page: Page;
  readonly usuario: Locator;
  readonly contrasena: Locator;
  readonly botonLogin: Locator;
  readonly mensajeError: Locator;

  constructor(page: Page) {
    this.page = page;
    // Locators por atributo data-test: estables y pensados para pruebas
    this.usuario = page.getByTestId("username");
    this.contrasena = page.getByTestId("password");
    this.botonLogin = page.getByTestId("login-button");
    this.mensajeError = page.getByTestId("error");
  }

  async abrir() {
    await this.page.goto("/");
    await expect(this.botonLogin).toBeVisible();
  }

  /** Llena solo los campos que traen valor y envía el formulario. */
  async iniciarSesion(usuario: string, contrasena: string) {
    if (usuario) await this.usuario.fill(usuario);
    if (contrasena) await this.contrasena.fill(contrasena);
    await this.botonLogin.click();
  }
}
