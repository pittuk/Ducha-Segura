// seo.ts — Builders de datos estructurados (JSON-LD / schema.org).
// Se consumen SOLO desde .astro (frontmatter server-side): `asset()` usa node:fs.
// El BaseLayout arma un único bloque `@graph` con la Organization global + los
// nodos que cada página aporte vía la prop `schema`.
import type { Producto } from '../data/productos';
import { asset } from './asset';

export type JsonLdNode = Record<string, unknown>;

const NAME = 'Ducha Segura®';

// URL absoluta a partir de una ruta de /public (respeta el cache-busting de asset()).
const abs = (site: URL, path: string) => new URL(asset(path), site).href;

export const orgId = (site: URL) => new URL('/#organization', site).href;

// Organization (+ LocalBusiness, negocio de servicio sin dirección física) y WebSite.
// Va en TODAS las páginas como ancla de entidad para Google y motores de IA.
export function organizationGraph(site: URL): JsonLdNode[] {
  const id = orgId(site);
  return [
    {
      '@type': ['Organization', 'LocalBusiness'],
      '@id': id,
      name: NAME,
      url: new URL('/', site).href,
      logo: abs(site, '/images/Ducha segura logo azul.png'),
      image: abs(site, '/images/Ducha segura logo azul.png'),
      description:
        'Rebajes de tina para acceso seguro al baño. Producto nacional patentado, instalación a domicilio y garantía de 3 años.',
      email: 'contacto@duchasegura.cl',
      telephone: '+56 9 3404 4939',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Alonso de Córdova 5255',
        addressLocality: 'Las Condes',
        addressRegion: 'Región Metropolitana',
        postalCode: '7560873',
        addressCountry: 'CL',
      },
      areaServed: [
        'Región Metropolitana de Santiago',
        'Región de Valparaíso',
        'Región del Biobío',
      ],
      sameAs: [
        'https://instagram.com/duchasegura_',
        'https://facebook.com/Ducha-Segura-699654674213794',
        'https://linkedin.com/company/ducha-segura',
        'https://twitter.com/duchasegura_',
        'https://share.google/UcF7ymekPyhh1GFez',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+56 9 3404 4939',
        email: 'contacto@duchasegura.cl',
        contactType: 'customer service',
        areaServed: 'CL',
        availableLanguage: 'es',
      },
    },
    {
      '@type': 'WebSite',
      '@id': new URL('/#website', site).href,
      url: new URL('/', site).href,
      name: NAME,
      inLanguage: 'es-CL',
      publisher: { '@id': id },
    },
  ];
}

// Product (fichas /producto/<slug>/). Con Offer cuando hay precio fijo (CLP).
export function productNode(site: URL, p: Producto): JsonLdNode {
  const url = new URL(`/producto/${p.slug}/`, site).href;
  const node: JsonLdNode = {
    '@type': 'Product',
    '@id': `${url}#product`,
    name: p.name,
    description: p.shortDescription || p.name,
    image: abs(site, p.image),
    brand: { '@type': 'Brand', name: NAME },
    url,
  };
  if (p.price > 0) {
    node.offers = {
      '@type': 'Offer',
      price: p.price,
      priceCurrency: 'CLP',
      availability: 'https://schema.org/InStock',
      url,
      seller: { '@id': orgId(site) },
    };
  }
  return node;
}

// BreadcrumbList: Catálogo › Grupo › Producto.
export function breadcrumbNode(site: URL, trail: { name: string; path?: string }[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      ...(t.path ? { item: new URL(t.path, site).href } : {}),
    })),
  };
}

// BlogPosting (artículos servidos en la raíz /<slug>/). Sin autores nombrados:
// la Organization actúa como autor y publisher.
export function blogPostingNode(
  site: URL,
  data: { title: string; excerpt: string; seoDescription?: string; image?: string; pubdate?: string; modified?: string },
  slug: string,
): JsonLdNode {
  const url = new URL(`/${slug}/`, site).href;
  const node: JsonLdNode = {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: data.title,
    description: data.seoDescription || data.excerpt,
    inLanguage: 'es-CL',
    mainEntityOfPage: url,
    url,
    author: { '@id': orgId(site) },
    publisher: { '@id': orgId(site) },
  };
  if (data.image) node.image = abs(site, data.image);
  if (data.pubdate) {
    node.datePublished = data.pubdate;
    node.dateModified = data.modified || data.pubdate;
  }
  return node;
}

// FAQPage (página /preguntas-frecuentes/). Respuestas en texto plano.
export function faqNode(faq: { q: string; a: string }[]): JsonLdNode {
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}
