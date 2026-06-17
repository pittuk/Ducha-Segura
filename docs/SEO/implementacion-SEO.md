# CLAUDE.md — Implementación SEO/GEO/AEO Ducha Segura®

**Proyecto:** duchasegura.cl
**Stack:** Astro (SSG) sobre Hostinger / HCDN
**Línea base auditoría:** 17-jun-2026 — Score 78/100
**Canonical de host:** `https://www.duchasegura.cl/`

## Convenciones

- **Categorías de ejecución:**
  - `autónoma` — Claude Code puede ejecutar y commitear sin supervisión.
  - `staging` — probar en rama/preview antes de mergear a producción.
  - `pause` — requiere decisión humana (negocio/cliente) antes de avanzar.
- **Regla de oro:** todo JSON-LD generado se valida en validator.schema.org **y** Google Rich Results Test antes de deploy.
- En Astro, los datos estructurados viven típicamente en el layout base (`src/layouts/`) y en plantillas por tipo (`src/pages/producto/`, blog, etc.). Confirmar rutas antes de editar.

---

## FASE 1 — Higiene crítica y captura de activos (semana 1-2)

### TC-01 — Redirección 301 de no-www a www
- **Categoría:** staging
- **Bloque:** A (Fundamentos técnicos)
- **Problema:** `duchasegura.cl` y `www.duchasegura.cl` responden ambos 200 sin redirección.
- **Archivo(s):** `.htaccess` (Hostinger Apache) o configuración de dominio en hPanel.
- **Snippet (.htaccess):**
  ```apache
  RewriteEngine On
  RewriteCond %{HTTP_HOST} ^duchasegura\.cl$ [NC]
  RewriteRule ^(.*)$ https://www.duchasegura.cl/$1 [R=301,L]
  ```
- **Validación:** `curl -sI https://duchasegura.cl/` debe devolver `301` con `location: https://www.duchasegura.cl/`.
- **Rollback:** eliminar el bloque RewriteCond/RewriteRule.

### TC-02 — Consolidar sitemap único y declarado
- **Categoría:** autónoma
- **Bloque:** A
- **Problema:** `robots.txt` declara `/sitemap-index.xml`; `/sitemap.xml` devuelve 404 (confusión de entradas).
- **Archivo(s):** `robots.txt`, configuración de sitemap de Astro (`astro.config.mjs` con `@astrojs/sitemap`).
- **Acción:** dejar un solo sitemap canónico en `https://www.duchasegura.cl/sitemap-index.xml` y verificar que todas las `<loc>` usen www. Opcional: redirigir `/sitemap.xml` → `/sitemap-index.xml`.
- **Validación:** `curl -s https://www.duchasegura.cl/sitemap-index.xml` retorna XML válido; todas las URLs en www; sin 404/301 internos.
- **Rollback:** restaurar robots.txt previo.

### TC-03 — Unificar dirección (NAP) [DECISIÓN DE NEGOCIO]
- **Categoría:** pause
- **Bloque:** F (E-E-A-T) / G (Local)
- **Problema:** Schema = "Alonso de Córdova 5255, Las Condes"; blog/heredado = "Providencia 2237, Santiago".
- **Acción:** el cliente confirma LA dirección operativa real. Luego propagar idéntica en: JSON-LD (`PostalAddress`), footer, página de contacto, Google Business Profile y menciones en el blog.
- **Archivo(s):** layout base (JSON-LD), componente footer, contenido del blog.
- **Validación:** búsqueda global del string de dirección retorna un único formato consistente; GBP coincide carácter a carácter.
- **Rollback:** N/A (no revertir a estado inconsistente).

### TC-04 — Inyectar AggregateRating en Organization/LocalBusiness
- **Categoría:** staging
- **Bloque:** D (Schema) / F (E-E-A-T)
- **Problema:** 439 reseñas 5,0 visibles en el home pero ausentes del JSON-LD.
- **Archivo(s):** layout base donde vive el nodo `#organization`.
- **Snippet (añadir al nodo Organization/LocalBusiness):**
  ```json
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "reviewCount": "439",
    "bestRating": "5",
    "worstRating": "1"
  }
  ```
- **Nota:** usar la cifra real y verificable de Google Business Profile al momento del deploy. No inflar.
- **Validación:** Google Rich Results Test detecta AggregateRating sin errores; sin warnings de "review without item".
- **Rollback:** remover el bloque `aggregateRating`.

### TC-05 — Completar LocalBusiness (geo, horarios, priceRange)
- **Categoría:** staging
- **Bloque:** G (Local SEO)
- **Problema:** `LocalBusiness` sin coordenadas, horarios ni rango de precio.
- **Snippet (añadir al nodo Organization/LocalBusiness):**
  ```json
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "-33.4000",
    "longitude": "-70.5800"
  },
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
    "opens": "09:00",
    "closes": "18:00"
  }],
  "priceRange": "$$"
  ```
- **Nota:** coordenadas y horarios son placeholders — reemplazar con datos reales tras TC-03.
- **Validación:** validator.schema.org sin errores; coordenadas apuntan a la dirección real.
- **Rollback:** remover los campos añadidos.

---

## FASE 2 — Entidad de autor y E-E-A-T (semana 2-5)

### TC-06 — Crear entidad de autor con Person schema [DECISIÓN DE NEGOCIO]
- **Categoría:** pause
- **Bloque:** E (GEO) / F (E-E-A-T)
- **Problema:** artículos firmados por la organización, sin persona verificable.
- **Acción:** el cliente define autor(es) real(es) (fundador, especialista técnico, o terapeuta ocupacional aliado). Crear página de autor con bio, foto y credenciales.
- **Snippet (Person schema en página de autor):**
  ```json
  {
    "@type": "Person",
    "@id": "https://www.duchasegura.cl/equipo/[slug]/#person",
    "name": "[Nombre real]",
    "jobTitle": "[Cargo]",
    "worksFor": { "@id": "https://www.duchasegura.cl/#organization" },
    "knowsAbout": ["accesibilidad del hogar","rebaje de tina","seguridad adulto mayor"],
    "sameAs": ["https://www.linkedin.com/in/[perfil]"]
  }
  ```
- **Validación:** Rich Results Test reconoce Person; `sameAs` resuelve a perfil LinkedIn activo.
- **Rollback:** N/A.

### TC-07 — Vincular autor en BlogPosting
- **Categoría:** staging
- **Bloque:** D (Schema) / E (GEO)
- **Problema:** `author` del BlogPosting apunta a `#organization`.
- **Archivo(s):** plantilla de artículo de blog.
- **Acción:** cambiar `author` del `BlogPosting` para referenciar el `@id` del `Person` (TC-06). Mantener `publisher` = organización.
- **Validación:** JSON-LD del artículo muestra `author` tipo Person; Rich Results Test sin errores.
- **Rollback:** restaurar `author` a `#organization`.

---

## FASE 3 — Contenido y GEO (semana 4-9)

### TC-08 — Refresco real de artículos top + dateModified
- **Categoría:** pause
- **Bloque:** C (On-page) / E (GEO)
- **Problema:** `dateModified` congelado en 2022; sin cambios reales de contenido.
- **Acción:** seleccionar 8-10 artículos de mayor tráfico/intención comercial; actualizar datos (precios, normativa 2026, subsidios, cifras), agregar párrafo de respuesta directa al inicio y solo entonces actualizar `dateModified`.
- **Regla:** NO cambiar la fecha sin cambiar el contenido (Google penaliza el "date spoofing").
- **Validación:** `dateModified` refleja la fecha real del cambio; el contenido difiere materialmente del anterior.
- **Rollback:** revertir vía control de versiones.

### TC-09 — Enriquecer descripciones de producto
- **Categoría:** staging
- **Bloque:** C (On-page) / D (Schema)
- **Problema:** descripciones mínimas (ej.: "Cotización válida junto a Rebaje de Tina").
- **Archivo(s):** datos de producto (colección/markdown/JSON que alimenta `/producto/`).
- **Acción:** por producto, agregar 60-120 palabras: material, medidas, compatibilidad de tina, instalación, garantía. Reflejar en `Product.description`.
- **Validación:** cada ficha tiene descripción única >50 palabras; `Product` schema actualizado sin errores.
- **Rollback:** revertir contenido por producto.

### TC-10 — Párrafos de respuesta directa en páginas pilares
- **Categoría:** staging
- **Bloque:** E (GEO/AEO)
- **Acción:** en home, /catalogo, /rebaje-de-tina y pilares de blog, asegurar que las primeras 2-4 oraciones respondan directamente la consulta (qué es, para quién, cuánto demora, cobertura) antes de promociones o navegación visual.
- **Validación:** las primeras ~100 palabras de cada pilar contienen la definición y los hechos citables.
- **Rollback:** revertir copy.

### TC-11 — Consolidar clusters temáticos (internal linking)
- **Categoría:** autónoma
- **Bloque:** C / E
- **Acción:** establecer hub-and-spoke: páginas hub (rebaje de tina, accesibilidad, cuidado adulto mayor) enlazando a artículos spoke con anchors descriptivos; cada spoke enlaza de vuelta al hub y al producto/cotización relevante.
- **Validación:** cada artículo enlaza al menos a 1 hub y 1 página de conversión con anchor con keyword real.
- **Rollback:** revertir enlaces.

---

## FASE 4 — Local, llms.txt y confirmación de performance (semana 6-12)

### TC-12 — Publicar llms.txt (bajo prioridad)
- **Categoría:** autónoma
- **Bloque:** E (GEO)
- **Problema:** `/llms.txt` devuelve 404.
- **Archivo(s):** `public/llms.txt`.
- **Snippet:**
  ```markdown
  # Ducha Segura

  > Rebaje de tina e instalación de productos de seguridad para baño de adultos mayores y personas con movilidad reducida. Producto nacional patentado. Cobertura RM, Valparaíso y Biobío.

  ## Páginas principales
  - [Catálogo](https://www.duchasegura.cl/catalogo/)
  - [Rebaje de tina](https://www.duchasegura.cl/rebaje-de-tina/)
  - [Cotizar](https://www.duchasegura.cl/cotizar/)
  - [Preguntas frecuentes](https://www.duchasegura.cl/preguntas-frecuentes/)
  - [Convenios](https://www.duchasegura.cl/convenios/)
  ```
- **Validación:** `curl -s https://www.duchasegura.cl/llms.txt` retorna 200 con Markdown.
- **Rollback:** eliminar el archivo. **Nota:** ningún proveedor mayor de IA lo lee en producción a mediados de 2026; es bajo costo / baja prioridad, no sustituye robots ni sitemap.

### TC-13 — Citaciones locales consistentes
- **Categoría:** pause
- **Bloque:** G (Local)
- **Acción:** tras unificar NAP (TC-03), publicar/corregir fichas en directorios chilenos (Páginas Amarillas, Hotfrog, EmpresasChile, Yellow.cl) con NAP idéntico al sitio y al GBP.
- **Validación:** los directorios principales muestran el mismo NAP que el sitio.
- **Rollback:** N/A.

### TC-14 — Re-medición Core Web Vitals con CrUX
- **Categoría:** autónoma
- **Bloque:** B (Performance)
- **Cuándo:** desde mediados de julio 2026 (≥28 días de datos de campo post-rebuild).
- **Acción:** consultar CrUX (PageSpeed Insights / BigQuery) para LCP, INP, CLS en p75 mobile. Confirmar el score provisional de esta auditoría.
- **Validación:** LCP <2,5 s, INP <200 ms, CLS <0,1 en datos de campo.
- **Rollback:** N/A.

### TC-15 — Decisión de acceso de crawlers AI [DECISIÓN DE NEGOCIO]
- **Categoría:** pause
- **Bloque:** E (GEO)
- **Estado actual:** `robots.txt` permite a todos los crawlers (incluidos GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended). Esto favorece visibilidad en respuestas generativas.
- **Acción:** confirmar con el cliente que desea mantener el acceso abierto (recomendado para este negocio, dado que ya es citado en el rubro). No bloquear por defecto.
- **Validación:** robots.txt refleja la decisión consciente del cliente.
- **Rollback:** ajustar robots.txt según decisión.

---

## Changelog de implementación

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2026-06-17 | 1.0.0 | Línea base post-rebuild Astro. Score 78/100. 15 tareas en 4 fases. |
