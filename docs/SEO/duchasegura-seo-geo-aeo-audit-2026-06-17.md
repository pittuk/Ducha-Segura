# Auditoría SEO + GEO + AEO — Ducha Segura®

**Cliente:** Ducha Segura® (duchasegura.cl)
**Preparado por:** Agenciados
**Fecha:** 17 de junio de 2026
**Tipo de cliente:** Activo (primera línea base SEO/GEO/AEO post-rebuild)
**Alcance:** Auditoría completa — fundamentos técnicos, Core Web Vitals, on-page, Schema, GEO/AEO (visibilidad en IAs), E-E-A-T y Local SEO.

---

## 1. Resumen ejecutivo

> **Score global: 78 / 100 — Bueno con gaps.**
> Plan de mejora trimestral con foco en E-E-A-T, datos estructurados de reseñas y consistencia de entidad.

El sitio acaba de migrar desde WordPress/Elementor a un build estático en **Astro** (última modificación: 15-jun-2026, dos días antes de esta auditoría). La migración resolvió de raíz los problemas estructurales que arrastraba la versión WordPress: el sitio ahora es rápido, sirve datos estructurados limpios y bien organizados, expone catálogo con `Product` schema y precios, y mantiene un blog amplio con autoridad temática real sobre seguridad en el baño para adultos mayores.

El score de 78 es alto para un sitio recién reconstruido. Los puntos pendientes no son fallas del rebuild, sino oportunidades de capitalizar activos que el negocio **ya tiene** pero que aún no están reflejados en el código.

**Tres hallazgos críticos**

1. **439 reseñas con 5,0 en Google que no están en el Schema.** El home muestra "5,0 de 5 en 439 reseñas de Google", pero no existe `AggregateRating` en el JSON-LD. Es el activo de confianza más fuerte del negocio y hoy es invisible para Google y los motores generativos.
2. **Inconsistencia de dirección (NAP).** El Schema declara "Alonso de Córdova 5255, Las Condes", mientras el contenido del blog y páginas antiguas indican "Providencia 2237, Santiago". Una entidad con dirección ambigua pierde fuerza en Local SEO y en el Knowledge Graph.
3. **Contenido del blog sin autor humano ni frescura.** Todos los artículos figuran con autor = la organización (no una persona) y con `dateModified` congelado en 2022. En 2026, la verificación de entidad de autor es un factor duro para ser citado en AI Overviews y Perplexity.

**Tres quick wins (sin developer, 0-14 días)**

- Inyectar `AggregateRating` (4,9-5,0 / 439 reseñas) en el nodo Organization del JSON-LD.
- Unificar la dirección en una sola (Schema + footer + Google Business Profile + blog).
- Agregar `geo` (coordenadas), `openingHoursSpecification` y `priceRange` al `LocalBusiness`.

---

## 2. Contexto del análisis

| Atributo | Detalle |
|----------|---------|
| URL auditada | https://duchasegura.cl/ (canonical en www) |
| Plataforma | Astro (static site generation) sobre hosting Hostinger / HCDN |
| Migración | Recién migrado desde WordPress + WooCommerce + Elementor (tema Anno) |
| Idioma / mercado | es-CL — Chile (RM, Valparaíso, Biobío) |
| Modelo comercial | Cotización (no checkout directo): producto físico + instalación a domicilio |
| URLs en sitemap | ~95 (catálogo, blog, prensa, páginas institucionales) |
| Método | curl + extracción JSON-LD con Python, citation testing en motores reales |

> **Nota sobre Core Web Vitals.** El rebuild tiene dos días, por lo que CrUX (datos de campo p75) aún no ha acumulado la ventana de 28 días necesaria para reportar. El score de performance de esta auditoría es **provisional**, basado en señales de laboratorio (Astro estático, TTFB medido en 0,31-0,52 s, imágenes WebP, JavaScript mínimo). Recomendamos re-medir con CrUX a partir de mediados de julio para confirmar.

---

## 3. Score por bloque

| Bloque | Puntaje | Comentario |
|--------|---------|------------|
| A. Fundamentos técnicos | 14 / 15 | Sólido. Pendiente: www y no-www ambos responden 200 sin redirección 301. |
| B. Core Web Vitals + Performance | 12 / 15 | Señales de laboratorio buenas; CrUX pendiente por antigüedad del rebuild. |
| C. On-page y arquitectura | 13 / 15 | Buena profundidad temática; descripciones de producto muy breves y blog sin frescura. |
| D. Schema / Structured Data | 12 / 15 | Excelente base; falta Person en autores y AggregateRating de reseñas. |
| E. GEO / AEO / Citación en IAs | 15 / 20 | Citado de forma consistente en el rubro; falta verificación de autor y llms.txt. |
| F. E-E-A-T y entidad de marca | 9 / 15 | Prensa y reseñas fuertes, pero NAP inconsistente y sin bios de autor. |
| G. Local SEO | 3 / 5 | GBP activo, pero LocalBusiness sin geo-coordenadas y citaciones inconsistentes. |
| **Total** | **78 / 100** | **Bueno con gaps — plan trimestral.** |

---

## 4. Top 5 hallazgos críticos

### 4.1 Reseñas de Google sin datos estructurados

- **Problema:** El sitio comunica "5,0 de 5 en 439 reseñas de Google" en el home, pero no existe ningún nodo `AggregateRating` ni `Review` en el JSON-LD. El activo de mayor peso comercial es invisible para los buscadores.
- **Impacto en negocio:** Sin `AggregateRating`, Google no puede mostrar estrellas en resultados, y los motores generativos (AI Overviews, Perplexity, ChatGPT) no tienen una señal extractable de prueba social. La diferencia de CTR entre un resultado con estrellas y uno sin estrellas es material.
- **Recomendación:** Agregar `AggregateRating` al nodo Organization/LocalBusiness con `ratingValue`, `reviewCount` y `bestRating`. Idealmente incorporar 3-5 `Review` reales con autor y fecha.
- **Esfuerzo:** Bajo (1-2 horas, sin developer si el JSON-LD es editable en plantilla).

### 4.2 Inconsistencia de dirección (NAP)

- **Problema:** Dos direcciones distintas conviven: Schema → "Alonso de Córdova 5255, Las Condes"; blog/páginas heredadas → "Providencia 2237, Santiago".
- **Impacto en negocio:** Google consolida la entidad de marca cruzando NAP entre sitio, Google Business Profile y directorios. Direcciones contradictorias diluyen la entidad, debilitan el Local SEO y dificultan construir o mantener un Knowledge Panel.
- **Recomendación:** Definir UNA dirección operativa real y propagarla idénticamente en Schema, footer, página de contacto, Google Business Profile y todo el blog.
- **Esfuerzo:** Bajo-medio (decisión de negocio + propagación; búsqueda y reemplazo).

### 4.3 Ausencia de entidad de autor verificable

- **Problema:** Los ~50 artículos del blog figuran con `author` = la organización, no una persona. No hay bios, ni `Person` schema, ni `sameAs` a LinkedIn.
- **Impacto en negocio:** En 2026 Google verifica autores contra grafos externos (LinkedIn, registros profesionales). El contenido anónimo pierde citas en AI Overviews frente a contenido firmado por personas verificables. Para un rubro adyacente a salud y seguridad del adulto mayor, la autoría experta es especialmente valiosa.
- **Recomendación:** Crear un autor real (fundador, especialista técnico o terapeuta ocupacional aliado) con bio, foto, `Person` schema y `sameAs` a LinkedIn. Firmar al menos los artículos de mayor tráfico.
- **Esfuerzo:** Medio (definición editorial + implementación de schema).

### 4.4 Blog sin frescura ni profundidad de producto

- **Problema:** `datePublished` y `dateModified` son idénticos y datan de 2022 en los artículos revisados. Las descripciones de producto son mínimas (ej.: "Cotización válida junto a Rebaje de Tina").
- **Impacto en negocio:** Google detecta cambios reales de contenido, no solo el campo de fecha. Un blog con autoridad temática que no se actualiza pierde terreno frente a competidores activos. Las fichas de producto sin descripción no aportan material citable para IAs ni contexto para conversión.
- **Recomendación:** Refrescar (con cambios reales) los 8-10 artículos top y actualizar `dateModified`. Enriquecer descripciones de producto con materiales, medidas, compatibilidad de tina y garantía.
- **Esfuerzo:** Medio-alto (trabajo editorial continuo).

### 4.5 Higiene de dominio y Local Schema

- **Problema:** `www.duchasegura.cl` y `duchasegura.cl` responden ambos con HTTP 200 sin redirección 301; el `LocalBusiness` no tiene coordenadas `geo`, ni `openingHoursSpecification`, ni `priceRange`. Adicionalmente, `robots.txt` apunta a `/sitemap-index.xml` en www mientras `/sitemap.xml` devuelve 404.
- **Impacto en negocio:** El canonical en www mitiga el riesgo de duplicación, pero la ausencia de 301 deja una señal sucia. La falta de geo-datos limita la elegibilidad en resultados de mapas y respuestas locales.
- **Recomendación:** 301 de no-www a www a nivel servidor; completar el `LocalBusiness` con geo, horarios y rango de precios; declarar un único sitemap consistente.
- **Esfuerzo:** Bajo (configuración + edición de schema).

---

## 5. Quick wins (0-14 días, sin developer)

1. **AggregateRating en JSON-LD** — capitaliza las 439 reseñas 5,0 (ver TC-04).
2. **Unificar dirección NAP** — una sola dirección en Schema, footer, GBP y blog (TC-03).
3. **Completar LocalBusiness** — geo-coordenadas, horarios, priceRange (TC-05).
4. **301 no-www → www** — cerrar la duplicación de host (TC-01).
5. **llms.txt mínimo** — Markdown curado con links a páginas top; bajo costo (TC-12).
6. **Refrescar fechas + contenido de 8 artículos top** — recuperar señal de frescura (TC-08).

---

## 6. Plan a 30 / 60 / 90 días

**Fase 1 — Higiene y captura de activos (semana 1-2)**
Redirección 301, unificación NAP, AggregateRating, completar LocalBusiness, sitemap único. Son cambios de bajo esfuerzo con retorno inmediato en confianza y elegibilidad de rich results.

**Fase 2 — Entidad de autor y E-E-A-T (semana 2-5)**
Crear autor(es) real(es) con Person schema y LinkedIn, firmar artículos clave, página "Quiénes somos" con equipo y propósito, y consolidar las menciones de prensa existentes como prueba de autoridad.

**Fase 3 — Contenido y GEO (semana 4-9)**
Refresco real de los artículos de mayor tráfico, enriquecimiento de fichas de producto, párrafos de respuesta directa en páginas pilares, y consolidación de clusters temáticos (rebaje de tina, accesibilidad, cuidado del adulto mayor) para cubrir el fan-out de AI Mode.

**Fase 4 — Local y confirmación de performance (semana 6-12)**
Citaciones locales consistentes en directorios chilenos, optimización del Google Business Profile, y re-medición de Core Web Vitals con CrUX una vez acumulada la ventana de campo.

---

## 7. Benchmark competitivo

| Dimensión | Ducha Segura® | tinasegura.cl | cleansolutionchile.cl | tinasegurasur.com |
|-----------|---------------|---------------|-----------------------|-------------------|
| Plataforma | Astro estático (rápido) | WordPress | WordPress | WordPress |
| Product schema + precio | Sí | No | No | No |
| BreadcrumbList | Sí | No | No | No |
| Reseñas visibles | 439 (5,0 Google) | Limitadas | Testimonios sin schema | Limitadas |
| Prensa / autoridad | Amplia (medios, Expo Inclusión, Sodimac) | Mínima | Mínima | Mínima |
| Profundidad de blog | Alta (~50 artículos) | Baja | Baja | Baja |
| Citación en IAs (rubro) | Consistente | Ocasional | Ocasional | Ocasional |

> Ducha Segura es claramente el actor más profesionalizado del rubro a nivel técnico y de contenido. La ventaja competitiva ya existe; el trabajo pendiente es **traducir esa ventaja a código** (schema de reseñas, autoría verificable, consistencia de entidad) para que también domine en respuestas generativas.

---

## 8. Anexos

### 8.1 Queries probadas (citation testing)

| Query | ¿Aparece Ducha Segura? | Contexto |
|-------|------------------------|----------|
| rebaje de tina adulto mayor baño seguro Chile | Sí, múltiples veces | Home, blog, kit, tinas tercera edad |
| (rubro general accesibilidad baño) | Sí | Compite con tinasegura, cleansolution, municipal Providencia |

### 8.2 Datos estructurados sugeridos

- `AggregateRating` y `Review` (Organization/LocalBusiness).
- `Person` con `sameAs` a LinkedIn en autores del blog.
- `geo`, `openingHoursSpecification`, `priceRange` en `LocalBusiness`.
- Mantener `Product`, `BreadcrumbList` y `FAQPage` actuales (correctos).

### 8.3 Estado técnico verificado

- HTTPS válido (HTTP/2, CSP upgrade-insecure-requests). TTFB 0,31-0,52 s.
- robots.txt abierto a todos los crawlers, incluidos GPTBot, ClaudeBot, PerplexityBot (sin bloqueos). Decisión consciente recomendada con el cliente.
- 404 limpios (sin soft 404). Canonical consistente en www.
- og:image presente y servida (200, image/png).

### 8.4 Glosario

- **GEO** — Generative Engine Optimization: ser citado en respuestas de IAs multi-fuente.
- **AEO** — Answer Engine Optimization: ser la fuente única de una respuesta directa.
- **CrUX** — Chrome User Experience Report: datos de campo reales de Core Web Vitals.
- **NAP** — Name, Address, Phone: consistencia de datos de contacto de la entidad.
- **E-E-A-T** — Experience, Expertise, Authoritativeness, Trust.
- **Core Web Vitals** — LCP, INP, CLS: métricas de experiencia de Google.

---

*Documento de Agenciados. Confidencial — uso interno del cliente.*
