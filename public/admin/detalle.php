<?php
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/_layout.php';
$u = ds_require_login();
$id = (int)($_GET['id'] ?? 0);
$estados = ['nueva','contactada','cotizada','cerrada'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  ds_csrf_check();
  $nuevo = $_POST['estado'] ?? '';
  if (in_array($nuevo, $estados, true)) {
    $up = ds_db()->prepare('UPDATE cotizaciones SET estado = ? WHERE id = ?');
    $up->execute([$nuevo, $id]);
  }
  header("Location: detalle.php?id=$id"); exit;
}

$stmt = ds_db()->prepare('SELECT * FROM cotizaciones WHERE id = ?');
$stmt->execute([$id]); $c = $stmt->fetch();
if (!$c) { ds_header($u,'list'); echo '<p>No encontrada. <a href="index.php">Volver</a></p>'; ds_footer(); exit; }
$istmt = ds_db()->prepare('SELECT * FROM cotizacion_items WHERE cotizacion_id = ?');
$istmt->execute([$id]); $items = $istmt->fetchAll();
$csrf = ds_csrf_token();

ds_header($u, 'list');
?>
<p><a href="index.php">&larr; Volver</a></p>
<div class="card">
  <h2>Cotización #<?= (int)$c['id'] ?> · <span class="badge b-<?= ds_e($c['estado']) ?>"><?= ds_e($c['estado']) ?></span></h2>
  <dl class="kv">
    <dt>Fecha</dt><dd><?= ds_e($c['creado_en']) ?></dd>
    <dt>Nombre</dt><dd><?= ds_e($c['nombre']) ?></dd>
    <dt>Teléfono</dt><dd><?= ds_e($c['telefono']) ?></dd>
    <dt>Email</dt><dd><?= ds_e($c['email']) ?></dd>
    <dt>Dirección</dt><dd><?= ds_e($c['direccion']) ?><?= $c['depto'] ? ', '.ds_e($c['depto']) : '' ?> · <?= ds_e($c['comuna']) ?>, <?= ds_e($c['region']) ?></dd>
    <?php if ($c['referencia']): ?><dt>Referencia</dt><dd><?= ds_e($c['referencia']) ?></dd><?php endif; ?>
    <?php if ($c['tipo_tina']): ?><dt>Tipo de tina</dt><dd><?= ds_e($c['tipo_tina']) ?></dd><?php endif; ?>
    <?php if ($c['notas']): ?><dt>Notas</dt><dd><?= nl2br(ds_e($c['notas'])) ?></dd><?php endif; ?>
  </dl>
</div>
<div class="card">
  <h2>Productos</h2>
  <table class="list">
    <tr><th>Producto</th><th>Grupo</th><th>Cant</th><th>Precio</th></tr>
    <?php foreach ($items as $it): ?>
    <tr><td><?= ds_e($it['nombre']) ?> <small><?= ds_e($it['variante']) ?></small></td>
        <td><?= ds_e($it['grupo']) ?></td><td><?= (int)$it['cantidad'] ?></td>
        <td>$<?= number_format((int)$it['precio_unitario']*(int)$it['cantidad'],0,',','.') ?></td></tr>
    <?php endforeach; ?>
    <tr><td colspan="3" style="text-align:right;font-weight:bold">Total estimado</td>
        <td style="font-weight:bold">$<?= number_format((int)$c['total_estimado'],0,',','.') ?></td></tr>
  </table>
</div>
<div class="card">
  <h2>Cambiar estado</h2>
  <form method="post">
    <input type="hidden" name="csrf" value="<?= ds_e($csrf) ?>">
    <select name="estado">
      <?php foreach ($estados as $e): ?><option value="<?= $e ?>"<?= $c['estado']===$e?' selected':'' ?>><?= ucfirst($e) ?></option><?php endforeach; ?>
    </select>
    <button type="submit">Guardar</button>
  </form>
</div>
<?php ds_footer();
