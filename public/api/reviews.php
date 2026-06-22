<?php
// reviews.php — Proxy cacheado a Google Places API (New): devuelve rating, total y
// hasta 5 reseñas del perfil de Ducha Segura para la sección de testimonios.
// La API key y el Place ID viven en config.php (no se exponen al cliente).
// La key de Google entrega como MÁXIMO 5 reseñas y no se pueden paginar/elegir.
require_once __DIR__ . '/db.php';

$cfg = ds_config();
header('Content-Type: application/json; charset=utf-8');

// CORS: refleja el Origin solo si está permitido (igual patrón que cotizacion.php).
$allowed = (array)($cfg['cors_origin'] ?? []);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array('*', $allowed, true)) {
  header('Access-Control-Allow-Origin: *');
} elseif ($origin !== '' && in_array($origin, $allowed, true)) {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$g = $cfg['google_places'] ?? [];
$apiKey  = $g['api_key']  ?? '';
$placeId = $g['place_id'] ?? '';
$ttl     = (int)($g['cache_ttl'] ?? 86400); // 24 h por defecto

// Cache en archivo. Si el dir de la API no es escribible, cae a temp del sistema.
// ponytail: caché en archivo; pasar a tabla solo si hace falta invalidar/compartir.
$cacheDir = is_writable(__DIR__) ? __DIR__ . '/cache' : sys_get_temp_dir();
@mkdir($cacheDir, 0775, true);
$cacheFile = $cacheDir . '/reviews.json';

function emit_cache(string $file): bool {
  if (is_file($file)) { readfile($file); return true; }
  return false;
}

// Caché fresca → servir y listo (cero llamadas a Google).
if (is_file($cacheFile) && (time() - filemtime($cacheFile)) < $ttl) {
  emit_cache($cacheFile); exit;
}

// Sin credenciales: que el front use su fallback estático.
if ($apiKey === '' || $placeId === '') {
  http_response_code(200);
  echo json_encode(['ok' => false, 'error' => 'not_configured']);
  exit;
}

// Llamada a Places API (New): place details con field mask acotado.
$url = "https://places.googleapis.com/v1/places/" . rawurlencode($placeId) . "?languageCode=es&regionCode=CL";
$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 8,
  // Forzar IPv4: el servidor egresa a Google por IPv6 por defecto, pero la API key está
  // restringida a la IPv4 estable (212.85.9.84). Sin esto, Google rechaza por IP.
  CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
  CURLOPT_HTTPHEADER => [
    'X-Goog-Api-Key: ' . $apiKey,
    'X-Goog-FieldMask: rating,userRatingCount,reviews',
  ],
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = $resp ? json_decode($resp, true) : null;
if ($code !== 200 || !is_array($data)) {
  error_log("reviews.php: Places API HTTP $code");
  // Degradar: servir caché vieja si existe; si no, dejar que el front use su fallback.
  if (!emit_cache($cacheFile)) { http_response_code(200); echo json_encode(['ok'=>false,'error'=>'upstream']); }
  exit;
}

// Normalizar al formato que consume Testimonios.astro.
$MESES = [1=>'Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
$reviews = [];
foreach (($data['reviews'] ?? []) as $r) {
  $text = trim($r['text']['text'] ?? ($r['originalText']['text'] ?? ''));
  if ($text === '') continue; // descartar reseñas solo-estrellas (quedan vacías como card)
  $ts = isset($r['publishTime']) ? strtotime($r['publishTime']) : false;
  $meta = $ts ? ($MESES[(int)date('n', $ts)] . ' ' . date('Y', $ts)) : '';
  $reviews[] = [
    'name'  => trim($r['authorAttribution']['displayName'] ?? 'Cliente de Google'),
    'meta'  => $meta,
    'text'  => $text,
    'stars' => (int)($r['rating'] ?? 5),
  ];
  if (count($reviews) >= 5) break;
}

$out = json_encode([
  'ok'      => true,
  'rating'  => round((float)($data['rating'] ?? 5), 1),
  'total'   => (int)($data['userRatingCount'] ?? 0),
  'reviews' => $reviews,
], JSON_UNESCAPED_UNICODE);

@file_put_contents($cacheFile, $out, LOCK_EX);
echo $out;
