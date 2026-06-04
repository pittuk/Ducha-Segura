# Diseño — Envío de cotización por WhatsApp y por email

**Fecha:** 2026-06-04
**Rama:** ajustes-varios-5
**Archivos:** `src/pages/cotizar.astro`, `src/scripts/cotizar.ts`

## Objetivo

En la página `/cotizar`, ofrecer al cliente **dos opciones explícitas** para enviar su
cotización: **por WhatsApp** y **por email**. Hoy el envío manda emails automáticamente
(backend PHP) y el WhatsApp es un botón opcional recién en la página de gracias.

## Comportamiento

Se reemplaza el botón único "Enviar cotización" por dos botones al pie del formulario:

| | Enviar por email | Enviar por WhatsApp |
|---|---|---|
| Estilo | `btn--secondary` (azul) | `btn--wa` (verde), más prominente |
| Valida formulario (incl. tipo de tina si hay rebaje) | ✅ | ✅ |
| Guarda lead en backend (MySQL + emails al cliente y gestor) | ✅ | ✅ |
| Acción final | Redirige a `/gracias-por-contactarnos?id=…` | Abre `wa.me` prellenado **en el gesto del click** y luego redirige a `/gracias` |

Ambos guardan el lead (decisión del usuario): el negocio nunca pierde el contacto,
elija el canal que elija.

## Detalle técnico

- **Popup blocker:** el botón WhatsApp abre `wa.me` **sincrónicamente** durante el
  click (no tras la respuesta del backend), para que el navegador no bloquee la
  apertura. Como aún no hay respuesta del servidor, el mensaje de WhatsApp **no incluye
  el N° de cotización**; el negocio cruza por nombre/teléfono.
- El POST al backend en el flujo WhatsApp se hace con `fetch(..., { keepalive: true })`
  para que sobreviva a la navegación de la página.
- Se refactoriza la lógica de envío de `cotizar.ts`: se extrae una función
  `buildPayload()` y una `submitLead(payload, { keepalive })`, reutilizadas por ambos
  botones. El armado del mensaje de WhatsApp reutiliza la lógica existente de
  `saveWhatsappQuote` (renombrada a `buildWhatsappUrl`, devolviendo la URL en vez de
  guardarla en sessionStorage).
- **Validación:** ambos botones disparan `form.reportValidity()` y la validación de
  tipo de tina. Si falla, no se envía ni se abre WhatsApp.

## Página de gracias

Sin cambios. Conserva su botón de WhatsApp como *fallback* por si el popup fue
bloqueado (sigue leyendo `ds_wa_quote` de sessionStorage si existe; el flujo email no
lo setea, así que solo aparece cuando aplica).

## Fuera de alcance

- Cambios en el backend PHP (ambos flujos usan el endpoint actual sin modificar).
- Envío que omita el email al cliente según canal (se descartó: ambos mandan email).
