<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';

$cfg = ds_config();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . $cfg['cors_origin']);
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'method']); exit; }

$raw = file_get_contents('php://input');
$d = json_decode($raw, true);
if (!is_array($d)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'bad_json']); exit; }

// Helpers
function s($v, $max = 255) { return mb_substr(trim((string)($v ?? '')), 0, $max); }
function bad($msg) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>$msg]); exit; }

$nombre = s($d['nombre'] ?? '', 120);
$telefono = s($d['telefono'] ?? '', 40);
$email = s($d['email'] ?? '', 180);
$direccion = s($d['direccion'] ?? '', 200);
$depto = s($d['depto'] ?? '', 80);
$region = s($d['region'] ?? '', 60);
$comuna = s($d['comuna'] ?? '', 80);
$referencia = s($d['referencia'] ?? '', 200);
$notas = s($d['notas'] ?? '', 2000);
$tipoTina = isset($d['tipoTina']) && $d['tipoTina'] !== null ? s($d['tipoTina'], 40) : null;
// total lo calcula el front (sitio estático sin lógica de precios en servidor); valor informativo.
$total = (int)($d['total'] ?? 0);
$instalacion = !empty($d['instalacion']) ? 1 : 0;
$items = is_array($d['items'] ?? null) ? $d['items'] : [];

if ($nombre === '' || $telefono === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) bad('contacto');
// La dirección de instalación ya NO se pide en la cotización (se coordina después).
if (count($items) === 0) bad('items');
if (count($items) > 50) bad('too_many_items');

$tieneRebaje = false;
foreach ($items as $it) { if (($it['grupo'] ?? '') === 'rebaje') { $tieneRebaje = true; break; } }
if ($tieneRebaje && !$tipoTina) bad('tipo_tina');
$tinasValidas = ['acero-acrilica','hidromasaje','fierro-fundido','especial-1','especial-2','especial-3','no-se'];
if ($tipoTina !== null && !in_array($tipoTina, $tinasValidas, true)) bad('tipo_tina_invalida');

$pdo = ds_db();
$pdo->beginTransaction();
try {
  $stmt = $pdo->prepare('INSERT INTO cotizaciones
    (nombre,telefono,email,direccion,depto,region,comuna,referencia,tipo_tina,instalacion,notas,total_estimado)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  $stmt->execute([$nombre,$telefono,$email,$direccion,$depto ?: null,$region,$comuna,$referencia ?: null,$tipoTina,$instalacion,$notas ?: null,$total]);
  $id = (int)$pdo->lastInsertId();

  $istmt = $pdo->prepare('INSERT INTO cotizacion_items
    (cotizacion_id,producto_id,nombre,variante,grupo,cantidad,precio_unitario) VALUES (?,?,?,?,?,?,?)');
  foreach ($items as $it) {
    $istmt->execute([
      $id, s($it['id'] ?? '', 120), s($it['name'] ?? '', 200), s($it['variant'] ?? '', 200),
      s($it['grupo'] ?? '', 20), max(1,(int)($it['qty'] ?? 1)), max(0,(int)($it['unitPrice'] ?? 0)),
    ]);
  }
  $pdo->commit();
} catch (Throwable $e) {
  $pdo->rollBack();
  error_log('cotizacion insert error: ' . $e->getMessage());
  http_response_code(500); echo json_encode(['ok'=>false,'error'=>'db']); exit;
}

// Emails (no bloquean el éxito si fallan: la cotización ya quedó guardada)
$rows = '';
foreach ($items as $it) {
  $rows .= '<tr><td style="padding:4px 8px;border-bottom:1px solid #eee">' . htmlspecialchars($it['name'] ?? '')
    . ' <span style="color:#888">' . htmlspecialchars($it['variant'] ?? '') . '</span></td>'
    . '<td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center">' . (int)($it['qty'] ?? 1) . '</td>'
    . '<td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">$' . number_format((int)($it['unitPrice'] ?? 0) * (int)($it['qty'] ?? 1), 0, ',', '.') . '</td></tr>';
}
$tabla = '<table style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0">' . $rows
  . '<tr><td colspan="2" style="padding:8px;text-align:right;font-weight:bold">Total estimado</td>'
  . '<td style="padding:8px;text-align:right;font-weight:bold">$' . number_format($total, 0, ',', '.') . '</td></tr></table>';

// Cliente
ds_send_mail($email, $nombre, 'Recibimos tu cotización — Ducha Segura', ds_email_layout(
  "¡Gracias, $nombre!",
  "<p>Recibimos tu solicitud de cotización (N° <b>$id</b>). Un asesor te contactará a la brevedad.</p>"
  . "<p><b>Resumen:</b></p>$tabla"
  . "<p style='color:#888;font-size:12px'>Precios referenciales, sujetos a confirmación final.</p>"
));

// Gestor
$dirLinea = '';
if ($direccion !== '') {
  $dir = htmlspecialchars("$direccion" . ($depto ? ", $depto" : "") . ($comuna || $region ? " · $comuna, $region" : "") . ($referencia ? " ($referencia)" : ""));
  $dirLinea = "<p><b>Dirección:</b> $dir</p>";
}
ds_send_mail($cfg['manager_email'], 'Gestor Ducha Segura', "Nueva cotización #$id — " . preg_replace('/[\r\n]+/', ' ', $nombre), ds_email_layout(
  "Nueva cotización #$id",
  "<p><b>Contacto:</b> " . htmlspecialchars($nombre) . " · " . htmlspecialchars($telefono) . " · " . htmlspecialchars($email) . "</p>"
  . $dirLinea
  . "<p><b>Instalación solicitada:</b> " . ($instalacion ? 'Sí (+$30.000)' : 'No') . "</p>"
  . ($tipoTina ? "<p><b>Tipo de tina:</b> " . htmlspecialchars($tipoTina) . "</p>" : "")
  . ($notas ? "<p><b>Notas:</b> " . htmlspecialchars($notas) . "</p>" : "")
  . "$tabla"
));

echo json_encode(['ok'=>true, 'id'=>$id]);
