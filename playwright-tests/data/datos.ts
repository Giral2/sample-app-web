/** Datos de prueba compartidos por los casos CP-01 a CP-10. */

export const CONTRASENA_VALIDA = "secret_sauce";

export const USUARIOS = {
  estandar: "standard_user",
  bloqueado: "locked_out_user",
  problema: "problem_user",
} as const;

export const MENSAJES = {
  usuarioRequerido: "Epic sadface: Username is required",
  contrasenaRequerida: "Epic sadface: Password is required",
  noCoinciden:
    "Epic sadface: Username and password do not match any user in this service",
  bloqueado: "Epic sadface: Sorry, this user has been locked out.",
  nombreRequerido: "Error: First Name is required",
  apellidoRequerido: "Error: Last Name is required",
  postalRequerido: "Error: Postal Code is required",
} as const;

/** Catálogo completo (6 productos) con sus precios, tomado de src/utils/InventoryData.js */
export const PRODUCTOS = {
  mochila: { nombre: "Sauce Labs Backpack", precio: 29.99 },
  luz: { nombre: "Sauce Labs Bike Light", precio: 9.99 },
  camiseta: { nombre: "Sauce Labs Bolt T-Shirt", precio: 15.99 },
  chaqueta: { nombre: "Sauce Labs Fleece Jacket", precio: 49.99 },
  body: { nombre: "Sauce Labs Onesie", precio: 7.99 },
  camisetaRoja: { nombre: "Test.allTheThings() T-Shirt (Red)", precio: 15.99 },
} as const;

export const TASA_IMPUESTO = 0.08;
