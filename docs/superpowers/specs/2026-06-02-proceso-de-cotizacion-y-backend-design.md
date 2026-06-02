# Diseño — Proceso de cotización + backend (Ducha Segura®)

> **Fecha:** 2026-06-02
> **Rama:** `ajustes-varios-4`
> **Estado:** aprobado (diseño). Pendiente: plan de implementación.

## 1. Resumen

El sitio gana un **proceso de cotización completo** (en una página dedicada, no en el drawer) y la base para **comprar** a futuro. La cotización funciona para cualquier producto; cuando hay un **rebaje** en el carrito, pide datos adicionales (tipo de tina + dirección de instalación). Se agrega un **backend PHP + MySQL en Hostinger** que guarda las cotizaciones, notifica por email al cliente y al gestor, y expone un **panel admin** con cuentas de usuario para gestionarlas.

Esto reemplaza el formulario inline del drawer que enviaba directo a WhatsApp.

## 2. Objetivos y no-objetivos

**Objetivos**
- Drawer con dos acciones: **Continuar con la cotización** y **Comprar**.
- Página `/cotizar` que completa el proceso (resumen + datos + tipo de tina condicional).
- Backend PHP que persiste en MySQL y envía 2 emails (cliente + gestor).
- Panel admin con cuentas de usuario para listar/ver/cambiar estado de cotizaciones.

**No-objetivos (esta entrega)**
- Pago online real (Webpay/Flow/Mercado Pago). "Comprar" queda como placeholder "Próximamente" con el andamiaje reservado.
- Imágenes reales de los 5 tipos de tina (se usan placeholders, renombrables/reemplazables).
- Reportería/analytics avanzada en el admin (más allá de listado + export CSV).

## 3. Decisiones tomadas (brainstorming)

| Tema | Decisión |
|---|---|
| Acción "Comprar" | Placeholder "Próximamente" con andamiaje. Habilitado solo si carrito = kits/accesorios y **sin** rebaje. |
| Imágenes de tinas | Placeholders por ahora (5 tipos tentativos). |
| Envío de la cotización | Backend propio (no solo WhatsApp): guarda en DB + email a cliente y gestor. |
| Plataforma backend | **PHP + MySQL en Hostinger** (stack nativo, cualquier plan). Front sigue estático. |
| Gestión | Email + DB + **panel admin**. |
| Login admin | **Cuentas de usuario** (tabla `admin_users`, roles). |
| Email/SMTP | Buzón del dominio vía SMTP de Hostinger; credenciales configurables al desplegar. |
| Convivencia front/back | **Enfoque A**: PHP en `public/api/` y `public/admin/` → se despliega junto con `dist/`. |

## 4. Arquitectura

```
Front (Astro estático, sin cambios de deploy)
  Drawer (QuoteDrawer.astro)
    ├─ [Continuar con la cotización] → /cotizar
    └─ [Comprar] → "Próximamente" (habilitado solo si canBuy(cart))

  /cotizar (src/pages/cotizar.astro)
    Resumen carrito · [Tipo de tina si hasRebaje] · Contacto · Dirección · Notas
       │ fetch POST JSON
       ▼
Backend (PHP + MySQL, en public/ → dist/)
  public/api/cotizacion.php   → valida, inserta, envía 2 emails, responde {ok,id}
  public/api/comprar.php      → stub "próximamente" (reservado pagos)
  public/admin/               → login (cuentas) + listado/detalle/estado/export
  config.php (gitignored)     → credenciales DB + SMTP
  schema.sql                  → tablas
```

### Flujo de datos de la cotización
1. Cliente arma carrito (persistido en `localStorage` `ds_cart`).
2. En el drawer elige **Continuar con la cotización** → navega a `/cotizar`.
3. `/cotizar` lee el carrito de `localStorage`, muestra resumen y formulario.
4. Si `hasRebaje(cart)` → muestra el selector "¿Cuál es tu tipo de tina?" (obligatorio).
5. Al enviar: `fetch('/api/cotizacion.php', {method:'POST', body: JSON})` con `{ contacto, direccion, tipoTina|null, notas, items[], total }`.
6. PHP valida → inserta en `cotizaciones` + `cotizacion_items` → envía email al cliente (confirmación) y al gestor (detalle) → responde `{ ok:true, id }`.
7. Front: limpia el carrito y redirige a `/gracias-por-contactarnos` con resumen; ante error muestra mensaje y mantiene los datos.

## 5. Componentes / unidades

### 5.1 Lógica pura — `src/lib/cart.ts` (testeada)
Añadir:
- `hasRebaje(cart: CartItem[]): boolean` — `cart.some(i => i.grupo === 'rebaje')`.
- `canBuy(cart: CartItem[]): boolean` — `cart.length > 0 && !hasRebaje(cart) && cart.every(i => i.grupo === 'kit' || i.grupo === 'accesorio')`.
- `deriveGrupo(id: string): Grupo` — fallback para items viejos de `localStorage` sin `grupo`: prefijo `reb`/`cfg`/`calc` → `rebaje`, `kit` → `kit`, `acc` → `accesorio` (default `accesorio`).

### 5.2 Modelo `CartItem` / `NewItem`
- Agregar campo **`grupo: Grupo`** (`'rebaje' | 'kit' | 'accesorio'`), importando `Grupo` desde `src/data/productos.ts` (o duplicando el tipo en `lib/cart.ts` para no acoplar lib→data; se decide en el plan, preferencia: tipo local en `lib/cart.ts`).
- `load()` en `src/scripts/cart.ts`: al parsear, si un item no trae `grupo`, completarlo con `deriveGrupo(id)`.
- Productores de items que pasan a incluir `grupo`:
  - `src/scripts/cart.ts` `[data-add-producto]` → `grupo: p.grupo`.
  - `src/scripts/calculator.ts` (item `calc-…`) → `grupo: 'rebaje'`.
  - QuickView "Agregar" reusa `[data-add-producto]` (sin cambios).

### 5.3 Drawer — `src/components/QuoteDrawer.astro` + `src/scripts/cart.ts`
- **Quitar** el `<form id="quoteForm">` inline y el botón "Enviar cotización por WhatsApp".
- **Quitar** `bindQuoteForm()` (lógica WhatsApp del drawer) de `src/scripts/cart.ts`.
- Footer del drawer pasa a tener dos botones:
  - **Continuar con la cotización** (primario, full): `<a href="/cotizar">` (siempre que el carrito no esté vacío).
  - **Comprar** (secundario): habilitado solo si `canBuy(items)`. Si hay rebaje o el carrito mezcla rebaje → deshabilitado con nota "No disponible junto a un rebaje". En todos los casos, al hacer clic hoy muestra estado **"Próximamente"** (placeholder de pagos) — el botón existe y su habilitación es real, pero la acción aún no procesa pago.
- `renderCart()` actualiza el estado habilitado/deshabilitado de **Comprar** según `Cart.canBuy(items)`.

### 5.4 Página `/cotizar` — `src/pages/cotizar.astro` (+ `src/scripts/cotizar.ts`)
Renderiza estático; el contenido dinámico (resumen + visibilidad del bloque tina) se hidrata en cliente leyendo `localStorage`.
- **Resumen del carrito**: items (thumbnail, nombre, variante, cantidad, precio) + total estimado. Si el carrito está vacío → mensaje + CTA al catálogo.
- **Bloque "¿Cuál es tu tipo de tina?"**: visible solo si `hasRebaje`. 5 tarjetas con imagen (radio buttons accesibles). Obligatorio cuando es visible.
- **Contacto**: nombre*, teléfono*, email*.
- **Dirección de instalación**: calle y número*, depto/casa (opcional), **región** (select RM/Valparaíso/Bío Bío) → **comuna** (select dependiente, de `src/data/comunas.ts`), referencia (opcional).
- **Notas** (opcional): medidas del baño, etc.
- **Enviar**: valida (HTML5 + JS), arma JSON, `fetch` al endpoint, maneja loading/error/success. Éxito → limpiar carrito + redirigir a `/gracias-por-contactarnos`.
- **Honeypot** oculto anti-spam.
- Endpoint configurable: en dev apunta a `http://localhost:8080/api/cotizacion.php` (php built-in server); en prod a `/api/cotizacion.php`. Resuelto por `import.meta.env.DEV` u origen.

### 5.5 Datos — `src/data/tinas.ts`
```ts
export interface TipoTina { id: string; name: string; image: string; }
export const TIPOS_TINA: TipoTina[] = [
  { id: 'tradicional', name: 'Tradicional',          image: '/images/tinas/tradicional.png' },
  { id: 'jacuzzi',     name: 'Jacuzzi / Hidromasaje', image: '/images/tinas/jacuzzi.png' },
  { id: 'esquinera',   name: 'Esquinera',             image: '/images/tinas/esquinera.png' },
  { id: 'empotrada',   name: 'Empotrada en mueble',   image: '/images/tinas/empotrada.png' },
  { id: 'exenta',      name: 'Exenta / pedestal',     image: '/images/tinas/exenta.png' },
];
```
Placeholders en `public/images/tinas/` (renombrables/reemplazables por el cliente).

### 5.6 Página de gracias — `/gracias-por-contactarnos`
`src/pages/gracias-por-contactarnos.astro`. Confirmación con el lineamiento del sitio + número de cotización si llega por query param. (Slug pendiente del WP original.)

### 5.7 Backend PHP — `public/api/`
- **`config.example.php`** (commiteado) y **`config.php`** (gitignored): `DB_HOST/DB_NAME/DB_USER/DB_PASS`, `SMTP_HOST/PORT/USER/PASS/FROM`, `MANAGER_EMAIL`, `SITE_URL`.
- **`db.php`**: conexión PDO (utf8mb4, errores como excepciones).
- **`mailer.php`**: wrapper PHPMailer (SMTP del dominio). PHPMailer vía `vendor/` (composer) o copia mínima; el plan decide. Plantillas HTML inline simples con branding.
- **`cotizacion.php`** (POST JSON):
  1. Verifica método + Content-Type + honeypot.
  2. Valida campos: contacto (nombre/tel/email), dirección (calle, región, comuna), `tipo_tina` requerido **solo si** algún item es rebaje, items no vacíos.
  3. Inserta `cotizaciones` (con `estado='nueva'`, timestamp) y `cotizacion_items` en transacción.
  4. Envía email al **cliente** (confirmación) y al **gestor** (`MANAGER_EMAIL`, detalle).
  5. Responde `{ ok:true, id }` o `{ ok:false, error }` con código HTTP adecuado.
  6. Sanitiza salidas en emails (evita inyección de cabeceras / HTML).
- **`comprar.php`**: stub que responde `{ ok:false, reason:'coming_soon' }` (reservado pagos).
- **`.htaccess`**: bloquea acceso directo a `config.php`, `db.php`, `mailer.php`, `vendor/`, `schema.sql`.

### 5.8 Base de datos — `public/api/schema.sql`
- **`cotizaciones`**: `id` PK, `nombre`, `telefono`, `email`, `direccion`, `depto`, `region`, `comuna`, `referencia`, `tipo_tina` (nullable), `notas`, `total_estimado`, `estado` ENUM('nueva','contactada','cotizada','cerrada') default 'nueva', `creado_en`, `actualizado_en`.
- **`cotizacion_items`**: `id` PK, `cotizacion_id` FK, `producto_id`, `nombre`, `variante`, `grupo`, `cantidad`, `precio_unitario`.
- **`admin_users`**: `id` PK, `email` único, `nombre`, `password_hash`, `rol` ENUM('admin','gestor'), `creado_en`. Seed inicial vía script CLI (`crear-admin.php`) que pide datos y hashea con `password_hash` (no se commitea ninguna contraseña).
- (Opcional) **`admin_sessions`** si no se usa sesión PHP nativa. Preferencia: sesión PHP nativa → no se necesita la tabla.

### 5.9 Panel admin — `public/admin/`
- **`login.php`**: form → valida contra `admin_users` (`password_verify`) → sesión PHP. CSRF token en formularios.
- **`index.php`** (protegido): listado de cotizaciones con filtro por estado y rango de fecha, orden por fecha desc, paginación.
- **`detalle.php?id=`**: datos completos + items + cambio de **estado** (POST con CSRF).
- **`export.php`**: CSV del listado filtrado.
- **`usuarios.php`** (solo rol `admin`): alta/baja de cuentas.
- **`logout.php`**.
- Layout PHP mínimo con CSS propio acorde al branding (no depende del bundle de Astro).

## 6. Manejo de errores
- **Front**: validación HTML5 + JS antes de enviar; estado de loading en el botón; si el `fetch` falla o responde `ok:false`, muestra mensaje y conserva los datos del formulario y el carrito.
- **Backend**: validación estricta server-side (no confía en el front); transacción para insertar cotización+items (rollback ante error); si la inserción funciona pero el email falla, se registra el fallo pero la cotización **igual queda guardada** y se responde `ok:true` (el gestor la verá en el panel). Códigos HTTP: 400 (validación), 405 (método), 500 (DB).
- **Seguridad**: prepared statements (PDO), `password_hash`/`password_verify`, escape de HTML en emails y panel, CSRF en formularios admin, honeypot anti-spam, `.htaccess` para includes/credenciales.

## 7. Testing
- **Vitest** (lib pura): `hasRebaje`, `canBuy` (carrito vacío, solo accesorios, solo kits, mixto kits+accesorios, con rebaje, con item `calc-`/`cfg-`), `deriveGrupo`.
- **PHP**: verificación manual con `php -S localhost:8080 -t public` + requests de prueba (curl/REST) para `cotizacion.php` (caso con rebaje, sin rebaje, validación fallida) y flujo de login admin. No se agrega runner PHP al repo.
- **Build/check**: `npx astro check` y `npm run build` en verde.

## 8. Dev local
- Front: `npm run dev` (`http://localhost:4321`).
- Backend: `php -S localhost:8080 -t public` (sirve `public/api/*.php` y `public/admin/*`). Requiere PHP local + MySQL local (o credenciales de una DB de prueba en `config.php`).
- `/cotizar` apunta el `fetch` a `localhost:8080` en dev y a ruta relativa en prod.
- Documentar en `README.md` / `docs/ESTADO.md`.

## 9. Despliegue (Hostinger)
- `npm run build` → `dist/` incluye `api/` y `admin/` (vienen de `public/`).
- Subir `dist/` a `public_html`.
- Crear DB MySQL en hPanel + importar `schema.sql`.
- Crear `config.php` en el servidor con credenciales reales (DB + SMTP del buzón del dominio) — **no** se sube desde el repo.
- Ejecutar `crear-admin.php` (o insertar el primer usuario) para el primer login.
- Verificar envío de email y `.htaccess`.

## 10. Plan en 2 fases (un solo spec)
- **Fase 1 — Front**: modelo `grupo` + `hasRebaje`/`canBuy` + tests; drawer con 2 botones; `/cotizar` + `src/scripts/cotizar.ts`; `src/data/tinas.ts` + placeholders; `/gracias-por-contactarnos`. (Verificable en el navegador; el envío puede mockearse hasta tener el backend.)
- **Fase 2 — Backend**: `config`, `db`, `mailer`, `cotizacion.php`, `comprar.php`, `schema.sql`, panel admin, `crear-admin.php`, `.htaccess`; conectar el `fetch` de `/cotizar`; docs de deploy.

## 11. Requisitos a proveer por el cliente (al desplegar)
- Credenciales MySQL de Hostinger (host/db/user/pass).
- Buzón del dominio + credenciales SMTP (host/puerto/usuario/clave) y dirección "From".
- Email del gestor para la copia.
- (Después) Imágenes reales de los 5 tipos de tina y sus nombres definitivos.
