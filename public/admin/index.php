<?php
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/_layout.php';
$u = ds_require_login();

$estados = ['nueva','contactada','cotizada','cerrada'];
$estado = in_array($_GET['estado'] ?? '', $estados, true) ? $_GET['estado'] : '';
$q = trim($_GET['q'] ?? '');
$page = max(1, (int)($_GET['p'] ?? 1));
$per = 20; $off = ($page - 1) * $per;

$where = []; $args = [];
if ($estado) { $where[] = 'estado = ?'; $args[] = $estado; }
if ($q) { $where[] = '(nombre LIKE ? OR email LIKE ? OR comuna LIKE ?)'; array_push($args, "%$q%","%$q%","%$q%"); }
$wsql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$cnt = ds_db()->prepare("SELECT COUNT(*) FROM cotizaciones $wsql");
$cnt->execute($args); $total = (int)$cnt->fetchColumn();
$pages = max(1, (int)ceil($total / $per));

$sql = "SELECT id,nombre,email,comuna,region,total_estimado,estado,creado_en FROM cotizaciones $wsql ORDER BY creado_en DESC LIMIT $per OFFSET $off";
$stmt = ds_db()->prepare($sql); $stmt->execute($args); $rows = $stmt->fetchAll();

ds_header($u, 'list');
?>
<form class="filters" method="get">
  <select name="estado" onchange="this.form.submit()">
    <option value="">Todos los estados</option>
    <?php foreach ($estados as $e): ?><option value="<?= $e ?>"<?= $estado===$e?' selected':'' ?>><?= ucfirst($e) ?></option><?php endforeach; ?>
  </select>
  <input type="search" name="q" placeholder="Buscar nombre/email/comuna" value="<?= ds_e($q) ?>">
  <button type="submit">Filtrar</button>
  <a href="export.php?estado=<?= ds_e($estado) ?>&q=<?= urlencode($q) ?>" style="margin-left:auto"><button type="button">Exportar CSV</button></a>
</form>
<p><?= $total ?> cotizaciones</p>
<table class="list">
  <tr><th>#</th><th>Fecha</th><th>Nombre</th><th>Comuna</th><th>Total</th><th>Estado</th><th></th></tr>
  <?php foreach ($rows as $r): ?>
  <tr>
    <td><?= (int)$r['id'] ?></td>
    <td><?= ds_e(substr($r['creado_en'],0,16)) ?></td>
    <td><?= ds_e($r['nombre']) ?><br><small><?= ds_e($r['email']) ?></small></td>
    <td><?= ds_e($r['comuna']) ?>, <?= ds_e($r['region']) ?></td>
    <td>$<?= number_format((int)$r['total_estimado'],0,',','.') ?></td>
    <td><span class="badge b-<?= ds_e($r['estado']) ?>"><?= ds_e($r['estado']) ?></span></td>
    <td><a href="detalle.php?id=<?= (int)$r['id'] ?>">Ver</a></td>
  </tr>
  <?php endforeach; ?>
  <?php if (!$rows): ?><tr><td colspan="7">Sin resultados.</td></tr><?php endif; ?>
</table>
<?php if ($pages > 1): ?>
<p>
  <?php for ($i=1;$i<=$pages;$i++): ?>
    <?php if ($i===$page): ?><b><?= $i ?></b><?php else: ?><a href="?estado=<?= ds_e($estado) ?>&q=<?= urlencode($q) ?>&p=<?= $i ?>"><?= $i ?></a><?php endif; ?>
  <?php endfor; ?>
</p>
<?php endif; ?>
<?php ds_footer();
