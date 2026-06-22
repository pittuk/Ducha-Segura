<?php
// Copia este archivo a config.php y completa con credenciales reales (NO commitear config.php).
//
// UBICACIÓN RECOMENDADA (producción): coloca config.php FUERA del web root, un nivel
// sobre public_html (ej.: ~/domains/duchasegura.cl/config.php). db.php lo busca ahí
// automáticamente. Como fallback (dev) también funciona junto a este archivo, en /api,
// donde el .htaccess ya lo bloquea por HTTP. Alternativa: define la variable de entorno
// DS_CONFIG_PATH con la ruta absoluta al config.php.
return [
  'db' => [
    'host' => 'localhost',
    'name' => 'ducha_cotizaciones',
    'user' => 'CAMBIAR',
    'pass' => 'CAMBIAR',
  ],
  'smtp' => [
    'host' => 'smtp.hostinger.com',
    'port' => 465,
    'secure' => 'ssl',          // 'ssl' (465) o 'tls' (587)
    'user' => 'cotizaciones@duchasegura.cl',
    'pass' => 'CAMBIAR',
    'from_email' => 'cotizaciones@duchasegura.cl',
    'from_name' => 'Ducha Segura',
  ],
  // Destinatario(s) de la notificación al gestor. Acepta string o array (notifica a todos).
  'manager_email' => ['contacto@duchasegura.cl', 'luis@agenciados.cl'],
  'site_url' => 'https://www.duchasegura.cl',
  // Google Places API (New) para las reseñas auto-actualizables (reviews.php).
  // api_key: key de Google Cloud con "Places API (New)" habilitada y facturación activa.
  //          Restringir por IP del servidor (es server-side, no la expongas como key web).
  // place_id: ID del perfil de Ducha Segura (ej. "ChIJ..."). Ver Place ID Finder de Google.
  // Google devuelve como máximo 5 reseñas; cache_ttl en segundos (24h por defecto).
  'google_places' => [
    'api_key'   => 'CAMBIAR',
    'place_id'  => 'CAMBIAR',
    'cache_ttl' => 86400,
  ],
  // Orígenes permitidos para CORS. Acepta string o array. Solo se refleja el Origin de
  // la petición si está en esta lista. En dev agrega 'http://localhost:4321'. Evita '*'.
  'cors_origin' => ['https://www.duchasegura.cl', 'https://duchasegura.cl'],
];
