<?php
require_once __DIR__ . '/auth.php';
$u = ds_require_login();
$estados = ['nueva','contactada','cotizada','cerrada'];
$estado = in_array($_GET['estado'] ?? '', $estados, true) ? $_GET['estado'] : '';
$q = trim($_GET['q'] ?? '');
$where = []; $args = [];
if ($estado) { $where[] = 'estado = ?'; $args[] = $estado; }
if ($q) { $where[] = '(nombre LIKE ? OR email LIKE ? OR comuna LIKE ?)'; array_push($args,"%$q%","%$q%","%$q%"); }
$wsql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
$stmt = ds_db()->prepare("SELECT id,creado_en,nombre,telefono,email,direccion,depto,comuna,region,referencia,tipo_tina,total_estimado,estado FROM cotizaciones $wsql ORDER BY creado_en DESC");
$stmt->execute($args);

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="cotizaciones.csv"');

// Anti CSV-injection: prefija con ' los valores que empiezan con =,+,-,@ (los datos
// vienen de un formulario público y el gestor abre el CSV en Excel/LibreOffice).
function ds_csv_safe($v): string {
  $s = (string)$v;
  return ($s !== '' && strpbrk($s[0], "=+-@\t\r") !== false) ? "'" . $s : $s;
}

$out = fopen('php://output', 'w');
fprintf($out, "\xEF\xBB\xBF"); // BOM para Excel
fputcsv($out, ['ID','Fecha','Nombre','Teléfono','Email','Dirección','Depto','Comuna','Región','Referencia','Tipo tina','Total','Estado']);
while ($r = $stmt->fetch()) { fputcsv($out, array_map('ds_csv_safe', $r)); }
fclose($out);
