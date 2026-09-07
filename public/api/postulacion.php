<?php
// postulacion.php — Postulaciones a la Red de Partners (instaladores independientes).
// POST JSON desde /instaladores → guarda en `postulaciones` y notifica al gestor.
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';

$cfg = ds_config();
header('Content-Type: application/json; charset=utf-8');
ds_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'method']); exit; }

$d = json_decode(file_get_contents('php://input'), true);
if (!is_array($d)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'bad_json']); exit; }

function p_s($v, $max = 255) { return mb_substr(trim((string)($v ?? '')), 0, $max); }
function p_bad($msg) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>$msg]); exit; }

$nombre      = p_s($d['nombre'] ?? '', 120);
$telefono    = p_s($d['telefono'] ?? '', 40);
$zona        = p_s($d['zona'] ?? '', 160);
$experiencia = p_s($d['experiencia'] ?? '', 2000);
$herramientas = (($d['herramientas'] ?? '') === 'si') ? 1 : 0;
// Honeypot: si un bot lo llena, respondemos ok sin guardar nada.
if (p_s($d['website'] ?? '') !== '') { echo json_encode(['ok'=>true,'id'=>0]); exit; }

if ($nombre === '' || $telefono === '' || $zona === '') p_bad('campos');
if (!in_array($d['herramientas'] ?? '', ['si','no'], true)) p_bad('herramientas');

try {
  $stmt = ds_db()->prepare('INSERT INTO postulaciones (nombre,telefono,zona,herramientas,experiencia) VALUES (?,?,?,?,?)');
  $stmt->execute([$nombre, $telefono, $zona, $herramientas, $experiencia ?: null]);
  $id = (int)ds_db()->lastInsertId();
} catch (Throwable $e) {
  error_log('postulacion insert error: ' . $e->getMessage());
  http_response_code(500); echo json_encode(['ok'=>false,'error'=>'db']); exit;
}

// Aviso al gestor (no bloquea el éxito: la postulación ya quedó guardada).
ds_send_mail($cfg['manager_email'], 'Gestor Ducha Segura', "Nueva postulación de instalador #$id — " . preg_replace('/[\r\n]+/', ' ', $nombre), ds_email_layout(
  "Nueva postulación de instalador #$id",
  '<p><b>Nombre:</b> ' . htmlspecialchars($nombre) . '</p>'
  . '<p><b>Teléfono / WhatsApp:</b> ' . htmlspecialchars($telefono) . '</p>'
  . '<p><b>Ciudad / Región:</b> ' . htmlspecialchars($zona) . '</p>'
  . '<p><b>Herramientas y transporte propios:</b> ' . ($herramientas ? 'Sí' : 'No') . '</p>'
  . ($experiencia ? '<p><b>Experiencia:</b> ' . nl2br(htmlspecialchars($experiencia)) . '</p>' : '')
));

echo json_encode(['ok'=>true, 'id'=>$id]);
